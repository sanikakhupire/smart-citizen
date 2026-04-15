// utils/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeIssueWithAI(
  newIssue: { title: string; description: string; category: string },
  nearbyIssues: { _id: string; title: string; description: string }[]
) {
  const prompt = `
    You are an expert civic maintenance AI. Analyze the newly reported civic issue.
    
    NEW ISSUE:
    Title: "${newIssue.title}"
    Description: "${newIssue.description}"
    User Category: "${newIssue.category}"

    NEARBY RECENT ISSUES (within 200 meters):
    ${nearbyIssues.length > 0 ? JSON.stringify(nearbyIssues) : "None"}

    TASK:
    1. Categorize the new issue correctly (must be exactly one of: "road", "water", "electricity", "garbage", "other").
    2. Determine the priority (must be exactly one of: "low", "medium", "high") based on public safety and infrastructure impact.
    3. Provide a brief, 1-sentence "suggested_solution" for the maintenance team.
    4. Check if the new issue is a duplicate of any "NEARBY RECENT ISSUES". If it describes the exact same physical problem, mark "is_duplicate" as true and provide the "_id" in "duplicate_of".

    Return a STRICT JSON object matching this structure:
    {
      "category": "string",
      "priority": "string",
      "suggested_solution": "string",
      "is_duplicate": boolean,
      "duplicate_of": "string or null"
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast, cheap, and excellent at JSON
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: 'You output only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1, // Low temperature for deterministic, analytical outputs
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("OpenAI API Error:", error);
    // Graceful fallback if AI fails
    return {
      category: newIssue.category,
      priority: 'medium',
      suggested_solution: 'Requires manual assessment.',
      is_duplicate: false,
      duplicate_of: null
    };
  }
}