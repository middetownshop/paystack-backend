import { Router } from "express";
import crypto from "crypto";
import { db, auth } from "../firebaseAdmin";

const paystackRouter = Router();

const PAYSTACK_BASE_URL = "https://api.paystack.co";

//
// ─────────────────────────────────────────────
// INITIALIZE PAYMENT
// ─────────────────────────────────────────────
//
paystackRouter.post("/paystack/initialize", async (req, res) => {
  try {
    const { email, amount, callback_url, metadata = {} } = req.body;

    if (!email || !amount) {
      return res.status(400).json({
        success: false,
        message: "email and amount required",
      });
    }

    const businessAmount = Number(amount);

    if (isNaN(businessAmount) || businessAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "invalid amount",
      });
    }

    const percentageFee = 0.0195;
    const fixedFee = 0.1;

    const customerPays = (businessAmount + fixedFee) / (1 - percentageFee);

    const amountInPesewas = Math.ceil(customerPays * 100);

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInPesewas,
        currency: "GHS",
        callback_url,
        metadata: {
          ...metadata,
          businessAmount,
        },
      }),
    });

    const data: any = await response.json();

    if (!data.status) {
      return res.status(400).json({
        success: false,
        message: data.message,
      });
    }

    return res.json({
      success: true,
      data: data.data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "initialize error",
    });
  }
});

//
// ─────────────────────────────────────────────
// VERIFY PAYMENT
// ─────────────────────────────────────────────
//
paystackRouter.get("/paystack/verify/:reference", async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data: any = await response.json();

    if (!data.status) {
      return res.status(400).json({
        success: false,
        message: data.message,
      });
    }

    return res.json({
      success: true,
      data: data.data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "verify error",
    });
  }
});

//
// ─────────────────────────────────────────────
// WEBHOOK (REAL MONEY LOGIC)
// ─────────────────────────────────────────────
//
paystackRouter.post("/paystack/webhook", async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      return res.sendStatus(500);
    }

    // IMPORTANT: raw body must be used in Express middleware
    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.body) // MUST be raw buffer/string
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.sendStatus(400);
    }

    const event = req.body;

    if (event.event === "charge.success") {
      const reference = event.data.reference;
      const uid = event.data.metadata?.uid;
      const businessAmount = Number(event.data.metadata?.businessAmount || 0);

      if (!uid || !reference) {
        return res.sendStatus(200);
      }

      // idempotency check
      const existing = await db.collection("transactions").doc(reference).get();

      if (existing.exists) {
        return res.sendStatus(200);
      }

      // save transaction
      await db.collection("transactions").doc(reference).set({
        uid,
        reference,
        businessAmount,
        status: "success",
        createdAt: Date.now(),
      });

      // credit wallet
      const walletRef = db.collection("wallets").doc(uid);

      await walletRef.set(
        {
          balance: (await walletRef.get()).exists
            ? undefined
            : 0,
        },
        { merge: true }
      );

      await walletRef.update({
        balance: (require("firebase-admin").firestore.FieldValue.increment(
          businessAmount
        ) as any),
      });

      console.log("Wallet credited:", uid, businessAmount);
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    return res.sendStatus(500);
  }
});

export default paystackRouter;