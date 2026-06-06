import { Router } from "express";
import axios from "axios";
import admin from "firebase-admin";
import { db } from "../firebaseAdmin";
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * REAL TELECOM SAAS CORE ENGINE
 */
router.post("/", authMiddleware, async (req: any, res) => {
  const { bundleId, phone } = req.body;
  const uid = req.user.uid;

  try {
    const userRef = db.collection("users").doc(uid);
    const bundleRef = db.collection("bundles").doc(bundleId);

    const [userSnap, bundleSnap] = await Promise.all([
      userRef.get(),
      bundleRef.get(),
    ]);

    if (!userSnap.exists || !bundleSnap.exists) {
      return res.status(404).json({ message: "Invalid request" });
    }

    const user = userSnap.data();
    const bundle = bundleSnap.data();

    if (user.walletBalance < bundle.price) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const orderRef = db.collection("orders").doc();

    // 🔐 Atomic transaction (CRITICAL)
    await db.runTransaction(async (tx) => {
      const freshUser = await tx.get(userRef);

      const balance = freshUser.data()?.walletBalance || 0;

      if (balance < bundle.price) {
        throw new Error("Insufficient balance");
      }

      tx.update(userRef, {
        walletBalance: admin.firestore.FieldValue.increment(-bundle.price),
      });

      tx.set(orderRef, {
        uid,
        bundleId,
        phone,
        network: bundle.network,
        size: bundle.size,
        price: bundle.price,
        status: "processing",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // 🔌 SIMULATED TELECOM PROVIDER (replace with MTN/Hubtel/Reloadly)
    const providerResponse = await fakeTelecomAPI({
      phone,
      network: bundle.network,
      size: bundle.size,
    });

    await orderRef.update({
      status: providerResponse.success ? "success" : "failed",
      providerResponse,
    });

    return res.json({
      success: true,
      message: "Transaction completed",
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

async function fakeTelecomAPI(data: any) {
  // simulate API delay
  await new Promise((r) => setTimeout(r, 1000));

  return {
    success: true,
    provider: "mock-telecom",
    reference: "TX-" + Date.now(),
    data,
  };
}

export default router;