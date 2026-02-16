import adminRoutes from "./routes/admin.routes.js";
import express from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import vehiculesRoutes from "./routes/vehicules.routes.js";

// routes
import authRoutes from "./routes/auth.routes.js";
import utilisateursRoutes from "./routes/utilisateurs.routes.js";
import trajetsRoutes from "./routes/trajets.routes.js";
import reservationsRoutes from "./routes/reservations.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";


const app = express();

// Middlewares globaux
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Brancher les routes
app.use("/auth", authRoutes);
app.use("/utilisateurs", utilisateursRoutes);
app.use("/trajets", trajetsRoutes);
app.use("/vehicules", vehiculesRoutes);
app.use("/reservations", reservationsRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/admin", adminRoutes);

export default app;
