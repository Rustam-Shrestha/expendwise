require("dotenv").config({ path: require("node:path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const { runSeed, DEMO_PASSWORD } = require("../src/services/seed.service");

const force = process.argv.includes("--force");
const months = Number(process.env.SEED_MONTHS || 12);
const transactionsPerMonth = Number(process.env.SEED_TRANSACTIONS_PER_MONTH || 4);

(async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is required");
    await mongoose.connect(uri);
    const summary = await runSeed({ force, months, transactionsPerMonth });
    console.log(JSON.stringify({ ...summary, demoPassword: DEMO_PASSWORD }, null, 2));
    await mongoose.disconnect();
  } catch (error) {
    console.error(error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
})();
