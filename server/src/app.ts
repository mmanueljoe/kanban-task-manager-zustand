import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "@/config/env.js";
import { authRoutes } from "@/routes/authRoutes.js";
import { boardRoutes } from "@/routes/boardRoutes.js";
import { columnRoutes } from "@/routes/columnRoutes.js";
import { taskRoutes } from "@/routes/taskRoutes.js";
import { errorHandler } from "@/middlewares/errorHandler.js";
import { httpLogger } from "@/config/logger.js";

export const app = express();

app.use(httpLogger);

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "success", data: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/columns", columnRoutes);
app.use("/api/tasks", taskRoutes);

app.use(errorHandler);
