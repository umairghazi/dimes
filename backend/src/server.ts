import "./config/env"; // validate env first
import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";

async function start(): Promise<void> {
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "Server started");
  });
}

start().catch((err) => {
  logger.fatal({ err }, "Failed to start server");
  process.exit(1);
});
