import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { env } from "@/config/env.js";
import { openApiSpec } from "@/docs/openapi.js";
import { authRoutes } from "@/routes/authRoutes.js";
import { boardRoutes } from "@/routes/boardRoutes.js";
import { columnRoutes } from "@/routes/columnRoutes.js";
import { taskRoutes } from "@/routes/taskRoutes.js";
import { commentRoutes } from "@/routes/commentRoutes.js";
import { errorHandler } from "@/middlewares/errorHandler.js";
import { httpLogger } from "@/config/logger.js";

export const app = express();
app.disable("x-powered-by");

app.use(httpLogger);

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "success", data: "ok" });
});

// Interactive API docs (Swagger UI) plus the raw spec as a portable artifact.
app.get("/api/docs.json", (_req, res) => {
  res.json(openApiSpec);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/columns", columnRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);

app.use(errorHandler);
