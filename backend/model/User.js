const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email : {
        type : String,
        required : true,
        unique : true,
    },
    userName : {
        type : String,
        unique : true,
    },
    password : {
        type : String,
        required: true,
        select: false,
    },
    fullName: { type: String, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    monthlyIncome: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "NPR" },
    riskProfile: { type: String, enum: ["conservative", "moderate", "aggressive"], default: "moderate" },
    onboardingComplete: { type: Boolean, default: true },
    lastRiskScore: { type: Number },
    lastRiskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH"] },
    lastRiskComputedAt: Date
},{timestamps : true});

const User = mongoose.model("User", UserSchema);
module.exports = User;

