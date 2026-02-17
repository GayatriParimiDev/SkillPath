import { generateFeedback } from "../services/feedbackAgent.js";

export const getFeedback = async (req, res) => {
  try {
    const { content, rubric } = req.body;

    if (!content || !rubric) {
      return res.status(400).json({ error: "Content and rubric required" });
    }

    const feedback = await generateFeedback(content, rubric);

    res.json(feedback);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
