const mongoose = require("mongoose");

const aiResponseSchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    responseText: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    sourceModel: {
      type: String,
      default: "EvalBot v1",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AIResponse", aiResponseSchema);
