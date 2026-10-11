require("dotenv").config({ path: require("node:path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");

(async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is required");
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    // Set category = categoryName where category is missing or null
    const res1 = await db.collection("transactions").updateMany(
      { $or: [{ category: { $exists: false } }, { category: null }, { category: "" }] },
      [{ $set: { category: { $ifNull: ["$categoryName", "General"] } } }]
    );
    
    // Set categoryName = category where categoryName is missing or null
    const res2 = await db.collection("transactions").updateMany(
      { $or: [{ categoryName: { $exists: false } }, { categoryName: null }, { categoryName: "" }] },
      [{ $set: { categoryName: { $ifNull: ["$category", "General"] } } }]
    );

    console.log(`Updated transactions: ${res1.modifiedCount} categories set, ${res2.modifiedCount} categoryNames set.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
})();
