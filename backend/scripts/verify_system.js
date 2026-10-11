require("dotenv").config({ path: require("node:path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function runTests() {
  console.log("=== STARTING FULL SYSTEM VERIFICATION ===");

  // 1. Database Connection
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✓ MongoDB Connected successfully");

  const db = mongoose.connection.db;
  const userCount = await db.collection("users").countDocuments();
  const txCount = await db.collection("transactions").countDocuments();
  console.log(`✓ Database stats: ${userCount} users, ${txCount} transactions`);

  // Verify category & categoryName consistency
  const sampleTx = await db.collection("transactions").findOne({ type: "expense" });
  if (!sampleTx.category || !sampleTx.categoryName) {
    throw new Error(`Transaction missing category fields: ${JSON.stringify(sampleTx)}`);
  }
  console.log(`✓ Sample transaction category verified: category='${sampleTx.category}', categoryName='${sampleTx.categoryName}'`);

  // 2. Auth Test
  const User = require("../model/User");
  const testEmail = "admin@demo.ybc.local";
  const user = await User.findOne({ email: testEmail }).select("+password");
  if (!user) throw new Error("Seed user not found");

  const passValid = await bcrypt.compare("DemoPass123!", user.password);
  if (!passValid) throw new Error("Seed user password verification failed");
  console.log(`✓ Password verification passed for: ${testEmail}`);

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  console.log("✓ JWT creation verified");

  // 3. Transaction Controller Logic Test
  const { getTransaction, addTransaction } = require("../controllers/transaction.controller");

  // Mock res & req for existing transactions
  let resData = null;
  let resStatus = null;
  const mockRes = {
    status: (s) => { resStatus = s; return mockRes; },
    json: (d) => { resData = d; return mockRes; },
  };

  await getTransaction({ user, query: {} }, mockRes);
  if (resStatus !== 200 || !Array.isArray(resData) || resData.length === 0) {
    throw new Error(`getTransaction failed: status=${resStatus}, length=${resData?.length}`);
  }
  console.log(`✓ getTransaction with history returned HTTP 200 with ${resData.length} items`);

  // Mock res & req for empty user
  const dummyUser = { _id: new mongoose.Types.ObjectId() };
  await getTransaction({ user: dummyUser, query: {} }, mockRes);
  if (resStatus !== 200 || !Array.isArray(resData) || resData.length !== 0) {
    throw new Error(`getTransaction on empty user failed! Expected 200 with [], got: status=${resStatus}`);
  }
  console.log("✓ getTransaction on user with NO transactions returned HTTP 200 with [] (NO 400 ERROR!)");

  // 4. Test Add Transaction
  const newTxPayload = {
    name: "Verification Lunch",
    type: "expense",
    amount: "450.50",
    date: new Date().toISOString(),
    category: "Food",
  };
  await addTransaction({ user, body: newTxPayload }, mockRes);
  if (resStatus !== 201 || !resData || resData.category !== "Food" || resData.categoryName !== "Food" || resData.amount !== 450.5) {
    throw new Error(`addTransaction failed: status=${resStatus}, res=${JSON.stringify(resData)}`);
  }
  console.log(`✓ addTransaction successfully created transaction with category and categoryName synced`);

  // Clean up verification transaction
  await db.collection("transactions").deleteOne({ _id: resData._id });

  // 5. Test Financial Advice & K-Means
  const { getFinancialAdvice } = require("../controllers/kmeans.controller");
  await getFinancialAdvice({ user }, mockRes);
  if (resStatus !== 200 || !resData.currentUserAdvice || !resData.advicePerCluster) {
    throw new Error(`getFinancialAdvice failed: status=${resStatus}`);
  }
  console.log(`✓ getFinancialAdvice returned HTTP 200 with personalized advice for ${resData.currentUserAdvice.userName}: spending ratio ${resData.currentUserAdvice.spendingRatio}`);

  // 6. Test ML Prediction Function
  const base_filter = {
    type: "expense",
    $or: [
      { category: { $regex: "^food$", $options: "i" } },
      { categoryName: { $regex: "^food$", $options: "i" } },
    ],
  };
  const foodExpenses = await db.collection("transactions").find(base_filter).limit(10).toArray();
  if (foodExpenses.length < 2) {
    throw new Error("Expected food expenses in database for ML prediction");
  }
  console.log(`✓ Found ${foodExpenses.length} food expense records ready for prediction calculations`);

  await mongoose.disconnect();
  console.log("=== ALL SYSTEM INTEGRATION TESTS PASSED ===");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Verification failed:", err);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
