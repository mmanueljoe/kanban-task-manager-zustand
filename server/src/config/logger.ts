import { pino } from "pino";
import { pinoHttp } from "pino-http";
import { env } from "@/config/env.js";

export const logger = pino(
  env.isProduction
    ? { level: "info" }
    : {
        level: "debug",
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        },
      }
);

export const httpLogger = pinoHttp({ logger });
