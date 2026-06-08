import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ─────────────────────────────────────────────
// PAYSTACK KEY VALIDATION
// ─────────────────────────────────────────────
const paystackKey = process.env.PAYSTACK_SECRET_KEY ?? "";
const keyPrefix = paystackKey.slice(0, 7);

if (!paystackKey) {
  logger.error("PAYSTACK_SECRET_KEY is not set — payments will fail");
} else if (keyPrefix === "sk_test") {
  logger.warn(
    "PAYSTACK_SECRET_KEY is a TEST key (sk_test_...) — checkout is in test mode"
  );
} else if (keyPrefix === "sk_live") {
  logger.info(
    "PAYSTACK_SECRET_KEY is LIVE ✅ — real money mode enabled"
  );
} else {
  logger.warn(
    { keyPrefix },
    "PAYSTACK_SECRET_KEY format looks invalid"
  );
}

// ─────────────────────────────────────────────
// LOGGING
// ─────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────
app.use(cors());

// ─────────────────────────────────────────────
// BODY PARSING (PAYSTACK WEBHOOK SAFE)
// ─────────────────────────────────────────────
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
// ROOT ROUTE (FIX FOR "Cannot GET /")
// ─────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    status: "running",
    service: "paystack-api",
    message: "API is live and working",
  });
});

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "paystack-api",
  });
});

// ─────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────
app.use("/api", router);

export default app;