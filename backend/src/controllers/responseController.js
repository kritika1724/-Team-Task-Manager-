const AIResponse = require("../models/AIResponse");
const Evaluation = require("../models/Evaluation");

const parseSkipIds = (skipIds = "") =>
  skipIds
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

const getNextResponse = async (req, res, next) => {
  try {
    const evaluatedIds = (
      await Evaluation.find({ user: req.user._id }).distinct("response")
    ).map((value) => value.toString());
    const skipIds = parseSkipIds(req.query.skipIds);

    const totalResponses = await AIResponse.countDocuments();
    const evaluatedCount = evaluatedIds.length;
    const pendingIds = [...new Set([...evaluatedIds, ...skipIds])];

    let response = await AIResponse.findOne(
      pendingIds.length > 0 ? { _id: { $nin: pendingIds } } : {}
    ).sort({ createdAt: 1 });
    let recycledSkipped = false;

    if (!response) {
      recycledSkipped = skipIds.length > 0;
      response = await AIResponse.findOne(
        evaluatedIds.length > 0 ? { _id: { $nin: evaluatedIds } } : {}
      ).sort({ createdAt: 1 });
    }

    if (!response) {
      return res.json({
        completed: true,
        response: null,
        progress: {
          totalResponses,
          evaluatedCount,
          pendingCount: 0,
        },
      });
    }

    return res.json({
      completed: false,
      recycledSkipped,
      progress: {
        totalResponses,
        evaluatedCount,
        pendingCount: Math.max(totalResponses - evaluatedCount, 0),
      },
      response: {
        id: response._id,
        prompt: response.prompt,
        responseText: response.responseText,
        category: response.category,
        sourceModel: response.sourceModel,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNextResponse,
};
