import { generateConceptGuide } from "../services/conceptCoachAgent.js";

export const getConceptGuide = async (req, res) => {
  try {
    const { topic, level, language } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const guide = await generateConceptGuide(topic, level, language);

    res.json(guide);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
