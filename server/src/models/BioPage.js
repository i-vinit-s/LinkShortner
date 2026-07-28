const mongoose = require("mongoose");

const bioLinkSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    platform: { type: String, default: "website" },
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const bioThemeSchema = new mongoose.Schema(
  {
    preset: { type: String, default: "signal" }, // 'signal' | 'ocean' | 'sunset' | 'forest' | 'mono' | 'custom'
    custom: {
      bg: { type: String, default: "#12141C" },
      surface: { type: String, default: "#1B1F2A" },
      accent: { type: String, default: "#F5A623" },
      text: { type: String, default: "#EDEFF4" },
    },
    buttonStyle: {
      type: String,
      enum: ["rounded", "pill", "square"],
      default: "rounded",
    },
  },
  { _id: false },
);

const bioPageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    displayName: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "", maxlength: 200 },
    avatarUrl: { type: String, trim: true, default: "" },
    links: { type: [bioLinkSchema], default: [] },
    theme: {
      type: bioThemeSchema,
      default: function () {
        return {};
      },
    },
    isPublished: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BioPage", bioPageSchema);
