import { supabase } from "../config/supabase.js";

export const updateProgress = async (req, res) => {
  try {
    const { student_id, topic, status, mastery_level } = req.body;

    if (!student_id || !topic || mastery_level == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Confidence calculation
    const confidence_score = Math.min(1, mastery_level / 100);

    // Spaced repetition logic
    const today = new Date();
    let nextRevision = new Date(today);

    if (mastery_level < 40) nextRevision.setDate(today.getDate() + 2);
    else if (mastery_level < 70) nextRevision.setDate(today.getDate() + 5);
    else nextRevision.setDate(today.getDate() + 10);

    const { data, error } = await supabase
      .from("learning_progress")
      .insert([{
        student_id,
        topic,
        status,
        mastery_level,
        last_studied: today,
        next_revision: nextRevision,
        confidence_score
      }]);

    if (error) throw error;

    res.json({
      message: "Progress updated successfully",
      confidence_score,
      next_revision: nextRevision
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};