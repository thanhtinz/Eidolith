import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { pool } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { playerRouter } from "./routes/player.js";
import { errorHandler } from "./middleware.js";
const app = express();
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: "256kb" }));
app.get("/health", async (_req, res) => {
  try { await pool.query("SELECT 1"); res.json({ status: "ok", db: "up" }); }
  catch { res.status(503).json({ status: "degraded", db: "down" }); }
});
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/player", playerRouter);
app.use(errorHandler);
app.listen(config.port, () => console.log(`Eidolith game server listening on :${config.port}`));
