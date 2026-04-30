const AIResponse = require("../models/AIResponse");
const sampleResponses = require("../data/sampleResponses");

const seedResponses = async () => {
  const existingResponses = await AIResponse.find({}, "prompt").lean();
  const existingPromptSet = new Set(
    existingResponses.map((response) => response.prompt.trim().toLowerCase())
  );
  const missingResponses = sampleResponses.filter(
    (response) => !existingPromptSet.has(response.prompt.trim().toLowerCase())
  );

  if (missingResponses.length === 0) {
    return;
  }

  await AIResponse.insertMany(missingResponses);
  console.log(`Seeded ${missingResponses.length} AI responses`);
};

module.exports = seedResponses;
