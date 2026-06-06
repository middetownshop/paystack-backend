import { Router } from "express";
import healthRouter from "./health";
import paystackRouter from "./paystack";

const router = Router();

router.use(healthRouter);
router.use(paystackRouter);

export default router;
