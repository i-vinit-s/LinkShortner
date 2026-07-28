const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const linkSchema = new mongoose.Schema(
  {
    shortCode: { type: String, required: true, unique: true, index: true },
    longUrl: { type: String, required: true },
    customAlias: { type: Boolean, default: false },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    passwordHash: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    clickCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
    source: { type: String, enum: ["dashboard", "qr"], default: "dashboard" },
  },
  { timestamps: true },
);

linkSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

linkSchema.index({ userId: 1, tags: 1 });

module.exports = mongoose.model("Link", linkSchema);
