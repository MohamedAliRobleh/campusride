import express from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.routes.js";
import utilisateursRoutes from "./routes/utilisateurs.routes.js";
import trajetsRoutes from "./routes/trajets.routes.js";
import vehiculesRoutes from "./routes/vehicules.routes.js";
import reservationsRoutes from "./routes/reservations.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import evaluationsRoutes from "./routes/evaluations.routes.js";
import messagesRoutes from "./routes/messages.routes.js";
import signalementsRoutes from "./routes/signalements.routes.js";
import pushRoutes from "./routes/push.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));


const app = express();

// Middlewares globaux
app.use(compression());
app.use(helmet());
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.ALLOWED_ORIGIN,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check public (pour maintenir le serveur Render actif)
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Brancher les routes
app.use("/auth", authRoutes);
app.use("/utilisateurs", utilisateursRoutes);
app.use("/trajets", trajetsRoutes);
app.use("/vehicules", vehiculesRoutes);
app.use("/reservations", reservationsRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/admin", adminRoutes);
app.use("/evaluations", evaluationsRoutes);
app.use("/messages", messagesRoutes);
app.use("/signalements", signalementsRoutes);
app.use("/push", pushRoutes);

export default app;
