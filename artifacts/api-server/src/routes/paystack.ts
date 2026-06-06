import { Router } from "express";
import crypto from "crypto";

// import your db + firebase tools
import { db, admin } from "../lib/firebase"; // adjust if needed

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

    // Paystack fee logic
    const percentageFee = 0.0195;
    const fixedFee = 0.1;

    const customerPays =
      (businessAmount + fixedFee) / (1 - percentageFee);

    const amountInPesewas = Math.ceil(customerPays * 100);

    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
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
      }
    );

    const data = await response.json();

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
// VERIFY PAYMENT (DEBUG ONLY - NOT FOR WALLET CREDIT)
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

    const data = await response.json();

    if (!data.status) {
      return res.status(400).json({
        success: false,
        message: data.message,
      });
    }

    const tx = data.data;

    return res.json({
      success: true,
      data: tx,
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
// WEBHOOK (REAL MONEY LOGIC HERE)
// ─────────────────────────────────────────────
//
paystackRouter.post("/paystack/webhook", async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    // IMPORTANT: raw body must be used (see app.ts fix)
    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.rawBody)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.sendStatus(400);
    }

    const event = req.body;

    if (event.event === "charge.success") {
      const reference = event.data.reference;
      const uid = event.data.metadata?.uid;
      const businessAmount = Number(
        event.data.metadata?.businessAmount || 0
      );

      if (!uid || !reference) {
        return res.sendStatus(200);
      }

      // ───── IDEMPOTENCY CHECK (VERY IMPORTANT)
      const existing = await db
        .collection("transactions")
        .doc(reference)
        .get();

      if (existing.exists) {
        return res.sendStatus(200);
      }

      // ───── SAVE TRANSACTION
      await db.collection("transactions").doc(reference).set({
        uid,
        reference,
        businessAmount,
        status: "success",
        createdAt: Date.now(),
      });

      // ───── CREDIT WALLET
      await db.collection("wallets").doc(uid).set(
        {
          balance: admin.firestore.FieldValue.increment(
            businessAmount
          ),
        },
        { merge: true }
      );

      console.log("✅ Wallet credited:", uid, businessAmount);
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    return res.sendStatus(500);
  }
});

export default paystackRouter;