import express from "express";
import { requireAuth, requireAdmin } from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.get("/dashboard", requireAuth, requireAdmin, (req, res) => {
  res.json({ message: "Bienvenue admin" });
});

export default router;
