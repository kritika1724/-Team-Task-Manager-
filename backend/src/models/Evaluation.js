const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    response: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIResponse",
      required: true,
    },
    responseSnapshot: {
      prompt: {
        type: String,
        required: true,
      },
      responseText: {
        type: String,
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
      sourceModel: {
        type: String,
        required: true,
      },
    },
    reaction: {
      type: String,
      enum: ["like", "dislike"],
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    feedback: {
      type: String,
      required: true,
      trim: true,
    },
    confidence: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    errorTag: {
      type: String,
      enum: ["factually_incorrect", "irrelevant", "incomplete", "correct"],
      required: true,
    },
    improvedResponse: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

evaluationSchema.index({ user: 1, response: 1 }, { unique: true });

module.exports = mongoose.model("Evaluation", evaluationSchema);
