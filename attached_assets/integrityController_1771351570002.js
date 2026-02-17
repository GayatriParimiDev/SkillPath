import { checkIntegrity } from "../services/integrityAgent.js";

export const evaluateIntegrity = async (req, res) => {
  try {
    const { content } = req.body;

    const result = await checkIntegrity(content);

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
