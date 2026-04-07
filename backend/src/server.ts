import "./config/env"; // validate env first
import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/db";

async function start(): Promise<void> {
  await prisma.$connect();
  console.log("Connected to MongoDB");

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
