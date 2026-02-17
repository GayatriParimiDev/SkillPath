import "dotenv/config";
import fetch from "node-fetch";

export async function generateFeedback(content, rubric) {

  const prompt = `
You are an academic evaluator.

Submission:
${content}

Rubric Criteria:
${rubric}

Evaluate strictly based on rubric.

Respond ONLY in JSON:

{
  "criteria_scores": {},
  "strengths": [],
  "improvements": [],
  "overall_score": 0
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
    throw new Error("AI failed to generate feedback");
  }

  return JSON.parse(data.choices[0].message.content);
}
