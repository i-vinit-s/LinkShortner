const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const destinationChangeSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

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
    // Who switched the link off: "user" (own deactivate), "admin" (moderation), null (legacy / expired)
    deactivatedBy: {
      type: String,
      enum: ["user", "admin", null],
      default: null,
    },
    // Previous destinations (oldest first, capped at 10) — useful for tracing abuse
    destinationHistory: { type: [destinationChangeSchema], default: [] },
  },
  { timestamps: true },
);

linkSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

// Never send the password hash to any client — expose only whether one is set.
// (Server code that reads link.passwordHash on a document is unaffected.)
linkSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.hasPassword = !!ret.passwordHash;
    delete ret.passwordHash;
    return ret;
  },
});

linkSchema.index({ userId: 1, tags: 1 });

module.exports = mongoose.model("Link", linkSchema);
