import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const groqApiKey = process.env.GROQ_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function callGroq(prompt: string): Promise<string> {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
      }),
    }
  );
  const data = await response.json();
  if (!data.choices || !data.choices.length) {
    throw new Error(data.error?.message || "AI did not return a valid response");
  }
  return data.choices[0].message.content;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/student", async (req: Request, res: Response) => {
    try {
      const { name, education, skills, careerGoal, availableHours } = req.body;
      const { data, error } = await supabase
        .from("students")
        .insert([{ name, education, skills, career_goal: careerGoal, available_hours: availableHours }])
        .select();
      if (error) throw error;
      res.status(201).json({ message: "Student created successfully", data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/roadmap/:id", async (req: Request, res: Response) => {
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
      const prompt = `You are an AI career mentor.\n\nStudent details:\n- Skills: ${student.skills?.join(", ") || "Not specified"}\n- Career Goal: ${student.career_goal || "General learning"}\n- Available hours per day: ${student.available_hours || 2}\n\nTasks:\n1. List missing skills\n2. Create a simple 4-week learning roadmap\nReturn in bullet points.`;
      const roadmap = await callGroq(prompt);
      res.json({ roadmap });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/concept", async (req: Request, res: Response) => {
    try {
      const { topic, level = "beginner", language = "English" } = req.body;
      if (!topic) return res.status(400).json({ error: "Topic is required" });
      const prompt = `You are an AI concept coach.\n\nTopic: ${topic}\nStudent Level: ${level}\nLanguage: ${language}\n\nProvide:\n1. Step-by-step explanation\n2. One analogy\n3. One hint-based question\n4. One mastery check question\n\nRespond ONLY in JSON format:\n\n{\n  "topic": "",\n  "steps": [],\n  "analogy": "",\n  "hint_question": "",\n  "mastery_question": ""\n}`;
      const result = await callGroq(prompt);
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : result);
        res.json(parsed);
      } catch {
        res.json({ topic, steps: [result], analogy: "", hint_question: "", mastery_question: "" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/feedback", async (req: Request, res: Response) => {
    try {
      const { content, rubric } = req.body;
      if (!content || !rubric) return res.status(400).json({ error: "Content and rubric required" });
      const prompt = `You are an academic evaluator.\n\nSubmission:\n${content}\n\nRubric Criteria:\n${rubric}\n\nEvaluate strictly based on rubric.\n\nRespond ONLY in JSON:\n\n{\n  "criteria_scores": {},\n  "strengths": [],\n  "improvements": [],\n  "overall_score": 0\n}`;
      const result = await callGroq(prompt);
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : result);
        res.json(parsed);
      } catch {
        res.json({ criteria_scores: {}, strengths: [], improvements: [result], overall_score: 0 });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/integrity", async (req: Request, res: Response) => {
    try {
      const { content } = req.body;
      if (!content) return res.status(400).json({ error: "Content is required" });
      const prompt = `You are an academic integrity evaluator.\n\nAnalyze this submission:\n\n${content}\n\nRespond ONLY in JSON:\n\n{\n  "originality_risk": "Low",\n  "citation_needed": false,\n  "recommendation": ""\n}`;
      const result = await callGroq(prompt);
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : result);
        res.json(parsed);
      } catch {
        res.json({ originality_risk: "Unknown", citation_needed: false, recommendation: result });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/progress", async (req: Request, res: Response) => {
    try {
      const { student_id, topic, status, mastery_level } = req.body;
      if (!student_id || !topic || mastery_level == null) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const confidence_score = Math.min(1, mastery_level / 100);
      const today = new Date();
      let nextRevision = new Date(today);
      if (mastery_level < 40) nextRevision.setDate(today.getDate() + 2);
      else if (mastery_level < 70) nextRevision.setDate(today.getDate() + 5);
      else nextRevision.setDate(today.getDate() + 10);

      const { data, error } = await supabase
        .from("learning_progress")
        .insert([{ student_id, topic, status, mastery_level, last_studied: today, next_revision: nextRevision, confidence_score }]);
      if (error) throw error;
      res.json({ message: "Progress updated successfully", confidence_score, next_revision: nextRevision });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/analytics/:student_id", async (req: Request, res: Response) => {
    try {
      const { student_id } = req.params;
      const { data, error } = await supabase
        .from("learning_progress")
        .select("*")
        .eq("student_id", student_id);
      if (error) throw error;
      if (!data || !data.length) {
        return res.json({ message: "No progress data found", total_topics: 0, average_mastery: 0, average_confidence: 0, exam_readiness_score: 0 });
      }
      const totalTopics = data.length;
      const avgMastery = data.reduce((sum: number, item: any) => sum + item.mastery_level, 0) / totalTopics;
      const avgConfidence = data.reduce((sum: number, item: any) => sum + item.confidence_score, 0) / totalTopics;
      const examReadiness = Math.round((avgMastery + avgConfidence * 100) / 2);
      res.json({ total_topics: totalTopics, average_mastery: avgMastery, average_confidence: avgConfidence, exam_readiness_score: examReadiness, progress_data: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/curriculum-analysis", async (req: Request, res: Response) => {
    try {
      const { education_level, subjects, strengths, weaknesses, goal } = req.body;
      const prompt = `You are an AI learning advisor. Analyze this student profile and create a personalized learning plan.\n\nEducation Level: ${education_level}\nCurrent Subjects: ${subjects?.join(", ") || "General"}\nStrengths: ${strengths?.join(", ") || "Not specified"}\nWeak Areas: ${weaknesses?.join(", ") || "Not specified"}\nGoal: ${goal || "Skill improvement"}\n\nRespond ONLY in JSON:\n{\n  "summary": "Brief analysis of student profile",\n  "confidence_score": 65,\n  "strength_analysis": ["strength1", "strength2"],\n  "weakness_analysis": ["weakness1", "weakness2"],\n  "roadmap": [\n    {"week": 1, "title": "Week 1 Title", "tasks": ["task1", "task2", "task3"]},\n    {"week": 2, "title": "Week 2 Title", "tasks": ["task1", "task2", "task3"]},\n    {"week": 3, "title": "Week 3 Title", "tasks": ["task1", "task2", "task3"]},\n    {"week": 4, "title": "Week 4 Title", "tasks": ["task1", "task2", "task3"]}\n  ],\n  "suggested_path": "Description of suggested learning path"\n}`;
      const result = await callGroq(prompt);
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : result);
        res.json(parsed);
      } catch {
        res.json({ summary: result, confidence_score: 50, strength_analysis: [], weakness_analysis: [], roadmap: [], suggested_path: "" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
