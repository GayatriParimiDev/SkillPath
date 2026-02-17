import "dotenv/config";
import fetch from "node-fetch";

export async function generateConceptGuide(topic, level = "beginner", language = "English") {

  const prompt = `
You are an AI concept coach.

Topic: ${topic}
Student Level: ${level}
Language: ${language}

Provide:
1. Step-by-step explanation
2. One analogy
3. One hint-based question
4. One mastery check question

Respond ONLY in JSON format:

{
  "topic": "",
  "steps": [],
  "analogy": "",
  "hint_question": "",
  "mastery_question": ""
}
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

  if (!data.choices || !data.choices.length) {
    throw new Error("AI failed to generate concept guidance");
  }

  return JSON.parse(data.choices[0].message.content);
}
