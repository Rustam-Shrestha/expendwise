const User = require("../model/User");
const kmeans = require("../utils/kmeans");
const Transaction = require("../model/Transaction");

const getUserIncomeExpenses = async () => {
  try {
    const users = await User.find().select("_id userName email");
    const transactions = await Transaction.find().select("userId type amount");

    const userSpending = {};

    users.forEach((user) => {
      userSpending[user._id.toString()] = {
        userName: user.userName,
        income: 0,
        expenses: 0,
      };
    });

    transactions.forEach((txn) => {
      if (!txn.userId) return;
      const userId = txn.userId.toString();
      if (!userSpending[userId]) {
        userSpending[userId] = { userName: "User", income: 0, expenses: 0 };
      }
      const amt = Number(txn.amount) || 0;
      if (txn.type === "income") {
        userSpending[userId].income += amt;
      } else if (txn.type === "expense") {
        userSpending[userId].expenses += amt;
      }
    });

    return Object.entries(userSpending).map(([userId, data]) => ({
      userId,
      userName: data.userName,
      income: data.income,
      expenses: data.expenses,
    }));
  } catch (error) {
    console.error("Error fetching users and transactions:", error.message);
    throw new Error("Internal server error while fetching data");
  }
};

const normalizeData = (data) => {
  if (!data || data.length === 0) return [];
  const incomeValues = data.map((point) => point[0]);
  const expenseValues = data.map((point) => point[1]);

  const minIncome = Math.min(...incomeValues);
  const maxIncome = Math.max(...incomeValues);
  const minExpense = Math.min(...expenseValues);
  const maxExpense = Math.max(...expenseValues);

  const incomeRange = maxIncome - minIncome;
  const expenseRange = maxExpense - minExpense;

  return data.map((point) => [
    incomeRange === 0 ? 0.5 : (point[0] - minIncome) / incomeRange,
    expenseRange === 0 ? 0.5 : (point[1] - minExpense) / expenseRange,
  ]);
};

const clusterUsers = async (req, res) => {
  try {
    const usersData = await getUserIncomeExpenses();

    if (usersData.length === 0) {
      return res.status(200).json({
        optimalK: 1,
        clusters: [],
        centroids: [],
        silhouetteScore: 1,
      });
    }

    if (usersData.length < 3) {
      // Small sample size fallback
      usersData.forEach((u, idx) => {
        u.cluster = idx;
      });
      return res.status(200).json({
        optimalK: usersData.length,
        clusters: usersData,
        centroids: usersData.map((u) => [u.income, u.expenses]),
        silhouetteScore: 1,
      });
    }

    const spendingData = usersData.map((user) => [user.income, user.expenses]);
    const normalizedData = normalizeData(spendingData);

    const optimalK = Math.min(3, usersData.length);
    const { clusters, centroids, silhouetteScore } = kmeans(normalizedData, optimalK);

    usersData.forEach((user, index) => {
      user.cluster = clusters[index] !== undefined ? clusters[index] : 0;
    });

    return res.status(200).json({
      optimalK,
      clusters: usersData,
      centroids,
      silhouetteScore,
    });
  } catch (error) {
    console.error("Error clustering users:", error.message);
    return res.status(500).json({ error: "Internal server error while clustering" });
  }
};

const findOptimalK = (data, maxK = 5) => {
  if (!data || data.length < 3) {
    return { optimalK: Math.max(1, data.length || 1), distortions: [] };
  }

  const distortions = [];
  const limit = Math.min(maxK, data.length - 1);
  for (let k = 1; k <= limit; k++) {
    distortions.push(kmeans(data, k).distortion);
  }

  let elbowPoint = 2;
  let maxDrop = 0;
  for (let i = 1; i < distortions.length - 1; i++) {
    const drop = distortions[i - 1] - distortions[i];
    const percentageDrop = distortions[i - 1] !== 0 ? drop / distortions[i - 1] : 0;
    if (percentageDrop > maxDrop && percentageDrop > 0.1) {
      maxDrop = percentageDrop;
      elbowPoint = i + 1;
    }
  }

  return { optimalK: Math.max(2, Math.min(elbowPoint, data.length)), distortions };
};

const getFinancialAdvice = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user._id.toString() : null;
    const usersData = await getUserIncomeExpenses();

    // Generate personalized advice rule
    const getAdviceText = (ratio, income, expenses) => {
      if (expenses === 0 && income === 0) {
        return "No activity recorded yet. Start by logging your regular income and monthly expenses.";
      }
      if (expenses === 0) {
        return "Great job generating income! Remember to record your expenses to accurately monitor your budget.";
      }
      if (income === 0) {
        return "Expenses logged with zero income. Ensure all income sources are recorded to balance your budget.";
      }
      if (ratio > 0.8) {
        return "High spending detected! You are spending over 80% of your earnings. Prioritize cutting non-essential expenses and building an emergency cushion.";
      }
      if (ratio > 0.5) {
        return "Moderate spending detected. Your cash flow is positive, but tracking discretionary expenses closely can unlock higher savings.";
      }
      return "Excellent financial discipline! Your spending is well below half your income. Consider allocating surplus to long-term investments.";
    };

    let optimalK = 3;
    let clusters = [];

    if (usersData.length >= 2) {
      const spendingData = usersData.map((u) => [u.income, u.expenses]);
      const normalizedData = normalizeData(spendingData);
      const kResult = findOptimalK(normalizedData);
      optimalK = Math.min(kResult.optimalK || 2, usersData.length);
      const clusterResult = kmeans(normalizedData, optimalK);
      clusters = clusterResult.clusters;
    }

    const advicePerCluster = {};
    let currentUserAdvice = null;

    usersData.forEach((user, index) => {
      user.cluster = clusters[index] !== undefined ? clusters[index] : 0;
      if (!advicePerCluster[user.cluster]) {
        advicePerCluster[user.cluster] = [];
      }

      const spendingRatio = user.income > 0 ? user.expenses / user.income : user.expenses > 0 ? 1.0 : 0.0;
      const advice = getAdviceText(spendingRatio, user.income, user.expenses);

      const entry = {
        userId: user.userId,
        userName: user.userName,
        income: user.income,
        expenses: user.expenses,
        spendingRatio: spendingRatio.toFixed(2),
        advice,
      };

      advicePerCluster[user.cluster].push(entry);

      if (currentUserId && user.userId === currentUserId) {
        currentUserAdvice = entry;
      }
    });

    // If current user had no transactions yet, provide standard benchmark
    if (!currentUserAdvice && req.user) {
      currentUserAdvice = {
        userId: currentUserId,
        userName: req.user.userName,
        income: 0,
        expenses: 0,
        spendingRatio: "0.00",
        advice: getAdviceText(0, 0, 0),
      };
    }

    return res.status(200).json({
      advicePerCluster,
      currentUserAdvice,
      totalUsersAnalyzed: usersData.length,
      optimalK,
    });
  } catch (error) {
    console.error("Error generating financial advice:", error.message);
    return res.status(500).json({ error: "Internal server error while generating financial advice" });
  }
};

module.exports = {
  clusterUsers,
  getFinancialAdvice,
};
