import "dotenv/config";
import fetch from "node-fetch";

export async function generateRoadmap(student) {
  const prompt = `
You are an AI career mentor.

Student details:
- Skills: ${student.skills.join(", ")}
- Career Goal: ${student.career_goal}
- Available hours per day: ${student.available_hours}

Tasks:
1. List missing skills
2. Create a simple 4-week learning roadmap
Return in bullet points.
`;

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
      }),
    }
  );

  const data = await response.json();

  // 🔍 DEBUG LOG (VERY IMPORTANT)
  console.log("AI RAW RESPONSE:", JSON.stringify(data, null, 2));

  // ❌ Handle API errors safely
  if (!data.choices || !data.choices.length) {
    throw new Error(
      data.error?.message || "AI did not return a valid response"
    );
  }

  return data.choices[0].message.content;
}
