import fs from "node:fs";
import http from "node:http";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env, uploadsPath } from "./config/env";
import { errorHandler, notFoundHandler } from "./lib/http";
import { authRouter } from "./routes/auth";
import { gamesRouter } from "./routes/games";
import { profileRouter } from "./routes/profile";
import { setupSocket } from "./socket/index";

fs.mkdirSync(uploadsPath, { recursive: true });

const app = express();
const server = http.createServer(app);
setupSocket(server);

app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(
  cors({
    origin: env.APP_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/uploads", express.static(uploadsPath));
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/games", gamesRouter);
app.use(notFoundHandler);
app.use(errorHandler);

server.listen(env.PORT, () => {
  console.log(`XO Arena API listening on http://localhost:${env.PORT}`);
});
