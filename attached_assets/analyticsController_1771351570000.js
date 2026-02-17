import { supabase } from "../config/supabase.js";

export const getAnalytics = async (req, res) => {
  try {
    const { student_id } = req.params;

    const { data, error } = await supabase
      .from("learning_progress")
      .select("*")
      .eq("student_id", student_id);

    if (error) throw error;

    if (!data.length) {
      return res.json({ message: "No progress data found" });
    }

    const totalTopics = data.length;

    const avgMastery =
      data.reduce((sum, item) => sum + item.mastery_level, 0) /
      totalTopics;

    const avgConfidence =
      data.reduce((sum, item) => sum + item.confidence_score, 0) /
      totalTopics;

    const examReadiness = Math.round((avgMastery + avgConfidence * 100) / 2);

    res.json({
      total_topics: totalTopics,
      average_mastery: avgMastery,
      average_confidence: avgConfidence,
      exam_readiness_score: examReadiness
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
