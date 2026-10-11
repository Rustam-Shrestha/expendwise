const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const TransactionSchema = new Schema(
  {
    userId: {
      type: ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["income", "expense"],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    categoryName: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    paymentMethod: {
      type: String,
      default: "cash",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrenceRule: {
      type: String,
    },
    source: {
      type: String,
      default: "web",
    },
  },
  { timestamps: true }
);

TransactionSchema.pre("save", function (next) {
  if (!this.categoryName && this.category) {
    this.categoryName = this.category;
  }
  if (!this.category && this.categoryName) {
    this.category = this.categoryName;
  }
  next();
});

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1 });
TransactionSchema.index({ userId: 1, categoryName: 1 });
TransactionSchema.index({ userId: 1, type: 1, date: -1 });

const Transaction = mongoose.model("Transaction", TransactionSchema);
module.exports = Transaction;
