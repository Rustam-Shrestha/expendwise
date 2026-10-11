const mongoose = require("mongoose");

const connectDb = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("connected to DB");
}

module.exports = {connectDb};