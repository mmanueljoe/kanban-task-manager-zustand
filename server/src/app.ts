import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "@/config/env.js";
import { authRoutes } from "@/routes/authRoutes.js";
import { errorHandler } from "@/middlewares/errorHandler.js";
import { httpLogger } from "@/config/logger.js";

export const app = express();

// One log line per request, first so it captures everything below it.
app.use(httpLogger);
// credentials:true lets the browser send the auth cookie; origin must be the
// exact client URL (not "*") for that to be allowed.
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "success", data: "ok" });
});

app.use("/api/auth", authRoutes);

// Must be registered last — it only catches errors from the routes above it.
app.use(errorHandler);
