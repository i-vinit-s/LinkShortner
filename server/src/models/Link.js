const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const linkSchema = new mongoose.Schema(
  {
    shortCode: { type: String, required: true, unique: true, index: true },
    longUrl: { type: String, required: true },
    customAlias: { type: Boolean, default: false }, // true if user picked shortCode manually
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    }, // null = anonymous
    passwordHash: { type: String, default: null },
    expiresAt: { type: Date, default: null }, // null = never expires
    clickCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

linkSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

module.exports = mongoose.model("Link", linkSchema);
