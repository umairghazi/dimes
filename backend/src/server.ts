import "./config/env"; // validate env first
import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/db";
import { logger } from "./config/logger";

async function start(): Promise<void> {
  await prisma.$connect();
  logger.info("Connected to MongoDB");

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "Server started");
  });
}

start().catch((err) => {
  logger.fatal({ err }, "Failed to start server");
  process.exit(1);
});
