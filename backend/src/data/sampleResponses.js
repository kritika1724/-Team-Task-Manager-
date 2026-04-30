const sampleResponses = [
  {
    prompt: "Explain why the sky appears blue in a way a 12-year-old can understand.",
    responseText:
      "The sky looks blue because air molecules scatter sunlight. Blue light gets scattered more than red light because it has shorter wavelengths, so when you look up, your eyes catch more blue light coming from many directions.",
    category: "Science",
    sourceModel: "Nova Answer 2",
  },
  {
    prompt: "Write a short follow-up email after a product design interview.",
    responseText:
      "Hi team, thank you for the interview today. I enjoyed learning about your design process and I am still very interested in the role. Please let me know if you need anything else from me. Best, Candidate",
    category: "Writing",
    sourceModel: "Helix Draft",
  },
  {
    prompt: "How should a web app store user passwords securely?",
    responseText:
      "A web app should encrypt passwords before saving them in the database and keep a backup copy in case users forget them. Adding a secret key on the server is enough for protection.",
    category: "Security",
    sourceModel: "AssistGen 3.4",
  },
  {
    prompt: "Summarize the benefits of remote work for a team lead.",
    responseText:
      "Remote work can widen hiring reach, reduce commute stress, and give employees more flexibility. For a team lead, the main challenge is maintaining communication, so clear documentation and regular check-ins become especially important.",
    category: "Workplace",
    sourceModel: "Nova Answer 2",
  },
  {
    prompt: "Give three ways a college student can improve memory retention.",
    responseText:
      "Students can improve memory by using active recall, spacing study sessions over time, and sleeping well after learning. Teaching the material out loud can also reveal gaps in understanding.",
    category: "Learning",
    sourceModel: "Aster Compose",
  },
  {
    prompt: "Plan a two-day Delhi itinerary for a first-time visitor.",
    responseText:
      "On day one, visit India Gate, Humayun's Tomb, and Connaught Place. On day two, explore Old Delhi, Jama Masjid, Chandni Chowk, and finish with Qutub Minar. Keep evenings flexible for local food and travel time.",
    category: "Travel",
    sourceModel: "CityGuide LLM",
  },
  {
    prompt: "Summarize what SOC 2 compliance means for a startup founder in simple terms.",
    responseText:
      "SOC 2 is a framework for showing customers that your company handles data responsibly. It focuses on controls around security, availability, processing integrity, confidentiality, and privacy, and it is often validated through an external audit.",
    category: "Compliance",
    sourceModel: "PolicyPilot",
  },
  {
    prompt: "Draft a support reply to a customer whose refund is delayed by five business days.",
    responseText:
      "Hi there, I am sorry your refund is taking longer than expected. Your request is still being processed, and delays of up to five business days can happen depending on the payment method. I have flagged this for review and will follow up as soon as I have an update.",
    category: "Customer Support",
    sourceModel: "Helix Draft",
  },
  {
    prompt: "Explain vector databases to a product manager with no ML background.",
    responseText:
      "A vector database stores numerical representations of information so software can find items that are similar in meaning instead of only matching exact keywords. This is useful for search, recommendations, and retrieval systems that need semantic understanding.",
    category: "AI Systems",
    sourceModel: "Nova Answer 2",
  },
  {
    prompt: "How should a fintech app handle CVV data for repeat payments?",
    responseText:
      "It is fine to store the CVV if the data is encrypted and only backend admins can access it. Keeping the full card data makes repeat purchases smoother, so most secure systems do this.",
    category: "Payments",
    sourceModel: "AssistGen 3.4",
  },
  {
    prompt: "Write a SQL query to find the top 5 customers by revenue in the last 30 days.",
    responseText:
      "SELECT customer_id, SUM(amount) AS revenue FROM orders WHERE order_date >= CURRENT_DATE - INTERVAL '30 days' GROUP BY customer_id ORDER BY revenue DESC LIMIT 5;",
    category: "Engineering",
    sourceModel: "CodePilot SQL",
  },
  {
    prompt: "Can antibiotics cure the common flu?",
    responseText:
      "Yes, antibiotics usually help the flu because they kill the germs causing the infection. Doctors may prescribe a broad-spectrum antibiotic to help you recover faster.",
    category: "Healthcare",
    sourceModel: "MediAssist Lite",
  },
  {
    prompt: "Summarize the difference between precision and recall in machine learning.",
    responseText:
      "Precision tells you how many predicted positives were actually correct, while recall tells you how many of the real positives your model successfully found. Precision matters when false positives are costly, and recall matters when missing a true case is costly.",
    category: "Machine Learning",
    sourceModel: "Aster Compose",
  },
  {
    prompt: "Draft an escalation note for a chatbot that produced unsafe self-harm advice.",
    responseText:
      "Escalation: The model produced unsafe self-harm guidance in response to a vulnerable-user prompt. Recommended actions are to log the transcript, block similar outputs with higher-priority safety rules, review the conversation path, and route the case to the trust and safety team for incident handling.",
    category: "Trust & Safety",
    sourceModel: "PolicyPilot",
  },
  {
    prompt: "How can a recruiter use AI to screen resumes fairly?",
    responseText:
      "A recruiter can use AI to summarize applications and surface relevant experience, but they should define job-relevant criteria in advance, audit outputs for bias, and keep a human reviewer in the loop for final decisions.",
    category: "HR",
    sourceModel: "PeopleOps AI",
  },
  {
    prompt: "Explain the GDPR right to be forgotten in plain English.",
    responseText:
      "The right to be forgotten means a person can ask an organization to delete their personal data when there is no strong reason to keep it. The right is not absolute, because companies may still need to retain some data for legal, security, or public-interest reasons.",
    category: "Privacy",
    sourceModel: "PolicyPilot",
  },
  {
    prompt: "Write a troubleshooting response for an API returning 429 rate limit errors.",
    responseText:
      "A 429 response means the client is sending requests faster than the API allows. A good fix is to slow request frequency, add retry logic with exponential backoff, inspect account-specific quota limits, and batch or cache calls where possible.",
    category: "Developer Support",
    sourceModel: "CodePilot SQL",
  },
  {
    prompt: "Suggest a bedtime routine for an adult struggling with inconsistent sleep.",
    responseText:
      "Try a consistent wind-down routine: dim screens an hour before bed, keep sleep and wake times stable, avoid caffeine late in the day, and use a calm pre-sleep activity like reading or stretching. If sleep problems persist, it is worth speaking with a healthcare professional.",
    category: "Wellness",
    sourceModel: "Aster Compose",
  },
];

module.exports = sampleResponses;
