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

const __dirname = path.dirname(fileURLToPath(import.meta.url));


const app = express();

// Middlewares globaux
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

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

export default app;
