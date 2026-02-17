import "dotenv/config";
import fetch from "node-fetch";

export async function checkIntegrity(content) {

  const prompt = `
You are an academic integrity evaluator.

Analyze this submission:

${content}

Respond ONLY in JSON:

{
  "originality_risk": "Low | Medium | High",
  "citation_needed": true/false,
  "recommendation": ""
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

  return JSON.parse(data.choices[0].message.content);
}
