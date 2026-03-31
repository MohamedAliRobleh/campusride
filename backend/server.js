// import "dotenv/config";
// import app from "./src/app.js";
// // import { runMigrations } from "./src/DB/db.js";
// import { startCronJobs } from "./src/utils/cron.js";

// runMigrations().then(() => {
//   startCronJobs();
//   app.listen(process.env.PORT, () => {
//     console.log(`Server running under port ${process.env.PORT}`);
//   });
// });
import "dotenv/config";
import app from "./src/app.js";
import { startCronJobs } from "./src/utils/cron.js";

startCronJobs();

console.log(`[config] ZOHO_EMAIL: ${process.env.ZOHO_EMAIL ? process.env.ZOHO_EMAIL : "MANQUANT ⚠️"}`);
console.log(`[config] ZOHO_PASSWORD: ${process.env.ZOHO_PASSWORD ? "défini ✅" : "MANQUANT ⚠️"}`);
console.log(`[config] APP_URL: ${process.env.APP_URL || "MANQUANT ⚠️"}`);

app.listen(process.env.PORT, () => {
  console.log(`Server running under port ${process.env.PORT}`);
});