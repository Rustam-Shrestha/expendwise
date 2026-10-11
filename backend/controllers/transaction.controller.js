const Transaction = require("../model/Transaction");

const addTransaction = async (req, res) => {
  try {
    const { name, type, amount, date, category } = req.body;
    const userId = req.user._id;

    if (!name || !type || amount === undefined || amount === null || !date || !category) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ error: "Amount must be a positive number" });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ error: "Type must be income or expense" });
    }

    const cleanCategory = String(category).trim();

    const newTransaction = new Transaction({
      userId,
      name: String(name).trim(),
      type,
      amount: parsedAmount,
      date: new Date(date),
      category: cleanCategory,
      categoryName: cleanCategory,
    });

    await newTransaction.save();
    return res.status(201).json(newTransaction);
  } catch (err) {
    console.error("Error in addTransaction controller:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getTransaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category, type } = req.query;

    const query = { userId };

    if (type && ["income", "expense"].includes(type)) {
      query.type = type;
    }

    if (category) {
      query.$or = [
        { category: { $regex: `^${category}$`, $options: "i" } },
        { categoryName: { $regex: `^${category}$`, $options: "i" } },
      ];
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });

    // Always return 200 with list (empty list if no transactions found)
    return res.status(200).json(transactions || []);
  } catch (err) {
    console.error("Error in getTransaction controller:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  addTransaction,
  getTransaction,
};