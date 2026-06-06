import { Router } from "express";
import { doc, increment, updateDoc } from "firebase/firestore";
import { db } from "../firebaseAdmin"; // or your admin SDK

const walletRouter = Router();

/**
 * CALL AFTER PAYSTACK SUCCESS
 */
walletRouter.post("/wallet/topup", async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing userId or amount",
      });
    }

    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      walletBalance: increment(Number(amount)),
    });

    return res.json({
      success: true,
      message: "Wallet credited",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Wallet update failed",
    });
  }
});

export default walletRouter;