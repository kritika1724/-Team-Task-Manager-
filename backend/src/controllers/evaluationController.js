const AIResponse = require("../models/AIResponse");
const Evaluation = require("../models/Evaluation");

const buildAnalytics = (evaluations) => {
  const initial = {
    totalEvaluations: evaluations.length,
    averageRating: 0,
    correctPercentage: 0,
    likes: 0,
    confidenceBreakdown: {
      low: 0,
      medium: 0,
      high: 0,
    },
    errorBreakdown: {
      correct: 0,
      incomplete: 0,
      irrelevant: 0,
      factually_incorrect: 0,
    },
  };

  if (evaluations.length === 0) {
    return initial;
  }

  const totals = evaluations.reduce(
    (accumulator, evaluation) => {
      accumulator.ratingSum += evaluation.rating;
      accumulator.likes += evaluation.reaction === "like" ? 1 : 0;
      accumulator.correct += evaluation.errorTag === "correct" ? 1 : 0;
      accumulator.confidenceBreakdown[evaluation.confidence] += 1;
      accumulator.errorBreakdown[evaluation.errorTag] += 1;
      return accumulator;
    },
    {
      ratingSum: 0,
      likes: 0,
      correct: 0,
      confidenceBreakdown: { ...initial.confidenceBreakdown },
      errorBreakdown: { ...initial.errorBreakdown },
    }
  );

  return {
    totalEvaluations: evaluations.length,
    averageRating: Number((totals.ratingSum / evaluations.length).toFixed(1)),
    correctPercentage: Math.round((totals.correct / evaluations.length) * 100),
    likes: totals.likes,
    confidenceBreakdown: totals.confidenceBreakdown,
    errorBreakdown: totals.errorBreakdown,
  };
};

const saveEvaluation = async (req, res, next) => {
  try {
    const {
      responseId,
      reaction,
      rating,
      feedback,
      confidence,
      errorTag,
      improvedResponse = "",
    } = req.body;
    const normalizedFeedback = typeof feedback === "string" ? feedback.trim() : "";
    const normalizedImprovedResponse =
      typeof improvedResponse === "string" ? improvedResponse.trim() : "";

    if (!responseId || !reaction || !rating || !normalizedFeedback || !confidence || !errorTag) {
      res.status(400);
      throw new Error("Please complete the full evaluation before saving.");
    }

    if (!["like", "dislike"].includes(reaction)) {
      res.status(400);
      throw new Error("Reaction must be like or dislike.");
    }

    if (!["low", "medium", "high"].includes(confidence)) {
      res.status(400);
      throw new Error("Confidence must be low, medium, or high.");
    }

    if (!["factually_incorrect", "irrelevant", "incomplete", "correct"].includes(errorTag)) {
      res.status(400);
      throw new Error("Error type is invalid.");
    }

    const numericRating = Number(rating);

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      res.status(400);
      throw new Error("Rating must be a whole number between 1 and 5.");
    }

    if (normalizedFeedback.length < 10) {
      res.status(400);
      throw new Error("Feedback should be at least 10 characters long.");
    }

    const aiResponse = await AIResponse.findById(responseId);

    if (!aiResponse) {
      res.status(404);
      throw new Error("The selected AI response was not found.");
    }

    const evaluation = await Evaluation.create({
      user: req.user._id,
      response: aiResponse._id,
      responseSnapshot: {
        prompt: aiResponse.prompt,
        responseText: aiResponse.responseText,
        category: aiResponse.category,
        sourceModel: aiResponse.sourceModel,
      },
      reaction,
      rating: numericRating,
      feedback: normalizedFeedback,
      confidence,
      errorTag,
      improvedResponse: normalizedImprovedResponse,
    });

    res.status(201).json({
      message: "Evaluation saved successfully.",
      evaluation: {
        id: evaluation._id,
        rating: evaluation.rating,
        feedback: evaluation.feedback,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already evaluated this response.",
      });
    }

    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const evaluations = await Evaluation.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      analytics: buildAnalytics(evaluations),
      evaluations: evaluations.map((evaluation) => ({
        id: evaluation._id,
        prompt: evaluation.responseSnapshot.prompt,
        responseText: evaluation.responseSnapshot.responseText,
        category: evaluation.responseSnapshot.category,
        sourceModel: evaluation.responseSnapshot.sourceModel,
        reaction: evaluation.reaction,
        rating: evaluation.rating,
        confidence: evaluation.confidence,
        errorTag: evaluation.errorTag,
        feedback: evaluation.feedback,
        improvedResponse: evaluation.improvedResponse,
        createdAt: evaluation.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveEvaluation,
  getDashboard,
};
