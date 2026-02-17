import { supabase } from "../config/supabase.js";
import { generateRoadmap } from "../services/aiAgent.js";

// CREATE STUDENT
export const createStudent = async (req, res) => {
  try {
    const { name, education, skills, careerGoal, availableHours } = req.body;

    const { data, error } = await supabase
      .from("students")
      .insert([
        {
          name,
          education,
          skills,
          career_goal: careerGoal,
          available_hours: availableHours,
        },
      ]);

    if (error) {
      throw error;
    }

    res.status(201).json({
      message: "Student created successfully",
      data,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET AI ROADMAP
export const getRoadmap = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: student, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const roadmap = await generateRoadmap(student);

    res.json({ roadmap });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
