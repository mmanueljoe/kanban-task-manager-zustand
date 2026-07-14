import { createServer } from "node:http";
import { app } from "@/app.js";
import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";
import { registerEventSubscribers } from "@/events/subscribers.js";
import { createSocketServer } from "@/realtime/socketServer.js";

registerEventSubscribers();

const httpServer = createServer(app);
createSocketServer(httpServer);

httpServer.listen(env.port, () => {
  logger.info(`Server listening on http://localhost:${env.port}`);
});
