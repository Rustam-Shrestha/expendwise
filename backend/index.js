const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");





const app = express();
require("dotenv").config({ path: require("node:path").resolve(__dirname, "../.env") });

app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000", // React frontend
    credentials: true // Allow cookies in requests
}));
app.use(cookieParser());


app.use("/api/", require("./routes/auth.route"));
app.use("/api/",require("./routes/transaction.route"))
app.use("/api",require("./routes/tips.route"))


app.get("/healthz", (_req, res) => res.json({ status: "ok" }));

const port = Number(process.env.PORT || 5000);
const connectDb = require("./db/connectDb").connectDb;
connectDb()
  .then(() => app.listen(port, () => console.log(`Listening to port ${port}`)))
  .catch((error) => {
    console.error("Database connection failed", error);
    process.exit(1);
  });