const fs = require("node:fs/promises");
const path = require("node:path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const FIXTURE_DIR = path.join(__dirname, "fixtures");
const DEMO_PASSWORD = "DemoPass123!";

const schemas = {
  User: new mongoose.Schema({ email: String, userName: String, password: String, fullName: String, role: String, monthlyIncome: Number, currency: String, riskProfile: String, onboardingComplete: Boolean }, { timestamps: true }),
  Category: new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, default: null }, name: String, slug: String, icon: String, color: String, kind: String, isSystem: Boolean, budgetDefault: Number }, { timestamps: true }),
  Transaction: new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, type: String, amount: Number, currency: String, categoryId: mongoose.Schema.Types.ObjectId, categoryName: String, name: String, date: Date, note: String, tags: [String], paymentMethod: String, isRecurring: Boolean, recurrenceRule: String, source: String }, { timestamps: true }),
  Budget: new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, categoryId: mongoose.Schema.Types.ObjectId, period: String, amount: Number, spent: Number, periodStart: Date, periodEnd: Date, alertThresholdPct: Number, status: String }, { timestamps: true }),
  Goal: new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, title: String, targetAmount: Number, savedAmount: Number, deadline: Date, category: String, status: String, contributions: [{ amount: Number, date: Date, note: String }] }, { timestamps: true }),
  RiskSnapshot: new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, computedAt: Date, score: Number, level: String, features: mongoose.Schema.Types.Mixed, reasons: [String], recommendations: [String], modelVersion: String }, { timestamps: true }),
  Alert: new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, type: String, severity: String, title: String, message: String, payload: mongoose.Schema.Types.Mixed, read: Boolean, dismissedAt: Date }, { timestamps: true }),
  AuditLog: new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, action: String, resource: String, resourceId: mongoose.Schema.Types.ObjectId, ip: String, userAgent: String, meta: mongoose.Schema.Types.Mixed }, { timestamps: true }),
};

const models = Object.fromEntries(Object.entries(schemas).map(([name, schema]) => [name, mongoose.models[name] || mongoose.model(name, schema)]));
const categories = [
  ["Salary", "salary", "income", "#16A34A", 50000],
  ["Freelance", "freelance", "income", "#0284C7", 15000],
  ["Gift", "gift", "income", "#D97706", 5000],
  ["Investment", "investment", "income", "#7C3AED", 10000],
  ["Food", "food", "expense", "#16A34A", 18000],
  ["Housing", "housing", "expense", "#334155", 30000],
  ["Transport", "transport", "expense", "#0284C7", 8000],
  ["Utilities", "utilities", "expense", "#D97706", 7000],
  ["Healthcare", "healthcare", "expense", "#DC2626", 5000],
  ["Education", "education", "expense", "#2563EB", 6000],
  ["Shopping", "shopping", "expense", "#DB2777", 10000],
  ["Entertainment", "entertainment", "expense", "#9333EA", 6000],
  ["Other", "other", "expense", "#64748B", 5000],
];

function csvEscape(value) {
  const text = value instanceof Date ? value.toISOString() : String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
function writeCsv(file, rows) {
  if (!rows.length) return fs.writeFile(path.join(FIXTURE_DIR, file), "");
  const headers = Object.keys(rows[0]);
  return fs.writeFile(path.join(FIXTURE_DIR, file), [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n") + "\n");
}
function monthStart(date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)); }
function seededNumber(index, min, max) { return min + ((index * 1103515245 + 12345) % (max - min + 1)); }

async function runSeed({ force = false, months = 12, transactionsPerMonth = 4 } = {}) {
  if (!force) throw new Error("Refusing to reset existing data. Run with --force explicitly.");
  await fs.mkdir(FIXTURE_DIR, { recursive: true });
  for (const name of Object.keys(models)) await models[name].deleteMany({});
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date();
  const end = monthStart(now);
  const categoryRows = categories.map(([name, slug, kind, color, budgetDefault], index) => ({ _id: new mongoose.Types.ObjectId(), userId: null, name, slug, icon: slug, color, kind, isSystem: true, budgetDefault, fixtureId: `category-${index}` }));
  const categoryBySlug = new Map(categoryRows.map((row) => [row.slug, row]));
  const userRows = [];
  const transactionRows = [];
  const budgetRows = [];
  const goalRows = [];
  const riskRows = [];
  const alertRows = [];
  const auditRows = [];
  for (let userIndex = 0; userIndex <= 200; userIndex += 1) {
    const isAdmin = userIndex === 0;
    const id = new mongoose.Types.ObjectId();
    const profile = ["conservative", "moderate", "aggressive"][userIndex % 3];
    const income = 45000 + (userIndex % 10) * 8500;
    userRows.push({ _id: id, email: isAdmin ? "admin@demo.ybc.local" : `user${String(userIndex).padStart(3, "0")}@demo.ybc.local`, userName: isAdmin ? "admin" : `user${String(userIndex).padStart(3, "0")}`, password, fullName: isAdmin ? "Demo Administrator" : `Demo User ${userIndex}`, role: isAdmin ? "admin" : "user", monthlyIncome: income, currency: "NPR", riskProfile: profile, onboardingComplete: true, fixtureId: `user-${userIndex}` });
    for (let month = months - 1; month >= 0; month -= 1) {
      const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - month, 1));
      const day = (month * 3 + userIndex) % 24 + 1;
      const salary = income + (userIndex % 4) * 1000;
      transactionRows.push({ _id: new mongoose.Types.ObjectId(), userId: id, type: "income", amount: salary, currency: "NPR", categoryId: categoryBySlug.get("salary")._id, category: "Salary", categoryName: "Salary", name: "Monthly salary", date: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)), note: "Recurring income", tags: ["income", "monthly"], paymentMethod: "bank", isRecurring: true, recurrenceRule: "monthly", source: "seed", fixtureId: `${userIndex}-${month}-income` });
      for (let n = 1; n <= transactionsPerMonth - 1; n += 1) {
        const category = categories[4 + ((userIndex + month + n) % (categories.length - 4))];
        const base = category[4];
        const spike = (userIndex + month + n) % 19 === 0 ? 1.8 : 1;
        transactionRows.push({ _id: new mongoose.Types.ObjectId(), userId: id, type: "expense", amount: Math.max(500, Math.round(base * (0.55 + ((userIndex + n) % 7) / 20) * spike)), currency: "NPR", categoryId: categoryBySlug.get(category[1])._id, category: category[0], categoryName: category[0], name: `${category[0]} expense`, date: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), Math.min(28, day + n * 3))), note: "Fabricated demo transaction", tags: ["expense", "history"], paymentMethod: ["cash", "card", "bank", "wallet"][(userIndex + n) % 4], isRecurring: category[0] === "Housing" || category[0] === "Utilities", recurrenceRule: category[0] === "Housing" ? "monthly" : undefined, source: "seed", fixtureId: `${userIndex}-${month}-${n}` });
      }
    }
    for (const slug of ["food", "transport", "shopping", "entertainment"]) budgetRows.push({ _id: new mongoose.Types.ObjectId(), userId: id, categoryId: categoryBySlug.get(slug)._id, period: "monthly", amount: categoryBySlug.get(slug).budgetDefault, spent: categoryBySlug.get(slug).budgetDefault * (0.55 + (userIndex % 5) / 10), periodStart: new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - months + 1, 1)), periodEnd: new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)), alertThresholdPct: 80, status: "active", fixtureId: `budget-${userIndex}-${slug}` });
    goalRows.push({ _id: new mongoose.Types.ObjectId(), userId: id, title: "Emergency fund", targetAmount: 150000, savedAmount: userIndex % 4 === 0 ? 150000 : 40000 + (userIndex % 10) * 5000, deadline: new Date(Date.UTC(end.getUTCFullYear() + 1, 5, 30)), category: "emergency", status: userIndex % 4 === 0 ? "achieved" : "active", contributions: [{ amount: 40000, date: end, note: "Initial contribution" }], fixtureId: `goal-emergency-${userIndex}` });
    goalRows.push({ _id: new mongoose.Types.ObjectId(), userId: id, title: "Travel purchase", targetAmount: 80000, savedAmount: 10000 + (userIndex % 8) * 5000, deadline: new Date(Date.UTC(end.getUTCFullYear() + 2, 0, 31)), category: "purchase", status: "active", contributions: [{ amount: 10000, date: end, note: "Initial contribution" }], fixtureId: `goal-travel-${userIndex}` });
    const score = 20 + ((userIndex * 7) % 75);
    const level = score < 40 ? "LOW" : score < 70 ? "MEDIUM" : "HIGH";
    const features = { income, expense: Math.round(income * 0.55), savingsRatio: (score > 70 ? 0.06 : 0.2), expenseGrowth: 0.03, foodPct: 0.24, transportPct: 0.12, entertainmentPct: 0.1, txCount: months * transactionsPerMonth, txVariance: 0.15 };
    riskRows.push({ _id: new mongoose.Types.ObjectId(), userId: id, computedAt: now, score, level, features, reasons: [level === "LOW" ? "Savings ratio is healthy" : "Spending exceeds recommended levels"], recommendations: ["Review discretionary spending"], modelVersion: "risk_rf_v1", fixtureId: `risk-${userIndex}` });
    if (userIndex % 3 === 0) alertRows.push({ _id: new mongoose.Types.ObjectId(), userId: id, type: "budget_exceeded", severity: level === "HIGH" ? "critical" : "warning", title: "Budget threshold reached", message: "A category exceeded its configured threshold.", payload: { threshold: 80 }, read: false, dismissedAt: null, fixtureId: `alert-${userIndex}` });
    auditRows.push({ _id: new mongoose.Types.ObjectId(), userId: id, action: "seed.created", resource: "dataset", resourceId: id, ip: "127.0.0.1", userAgent: "ybc-seed", meta: { fabricated: true }, fixtureId: `audit-${userIndex}` });
  }
  const serializable = (rows) => rows.map(({ _id, ...row }) => ({ ...row, id: String(_id) }));
  await Promise.all([writeCsv("users.csv", serializable(userRows)), writeCsv("categories.csv", serializable(categoryRows)), writeCsv("transactions.csv", serializable(transactionRows)), writeCsv("budgets.csv", serializable(budgetRows)), writeCsv("goals.csv", serializable(goalRows)), writeCsv("risk_snapshots.csv", serializable(riskRows)), writeCsv("alerts.csv", serializable(alertRows)), writeCsv("audit_logs.csv", serializable(auditRows))]);
  await models.User.insertMany(userRows); await models.Category.insertMany(categoryRows); await models.Transaction.insertMany(transactionRows); await models.Budget.insertMany(budgetRows); await models.Goal.insertMany(goalRows); await models.RiskSnapshot.insertMany(riskRows); await models.Alert.insertMany(alertRows); await models.AuditLog.insertMany(auditRows);
  return { users: userRows.length, transactions: transactionRows.length, categories: categoryRows.length, budgets: budgetRows.length, goals: goalRows.length, riskSnapshots: riskRows.length, alerts: alertRows.length, auditLogs: auditRows.length, password: DEMO_PASSWORD };
}

module.exports = { runSeed, DEMO_PASSWORD };
