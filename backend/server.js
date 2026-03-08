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

app.listen(process.env.PORT, () => {
  console.log(`Server running under port ${process.env.PORT}`);
});