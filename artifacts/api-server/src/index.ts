import app from "./app";
import { logger } from "./lib/logger";

const port = Number(process.env.PORT || 3000);

if (Number.isNaN(port) || port <= 0) {
  logger.warn(
    { port: process.env.PORT },
    "Invalid PORT value supplied, falling back to 3000"
  );
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});