import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const maxDuration = 30;

export async function POST(req) {
  try {
    const { salespersonName, deals } = await req.json();

    const systemPrompt = `You are a strict, data-driven Commercial Director preparing for a weekly 1-on-1 with your salesperson, ${salespersonName}.
Here is their current active pipeline from Zoho CRM:
${JSON.stringify(deals, null, 2)}

Analyze this pipeline. Look for:
- High value deals that are stuck (stale)
- Deals missing mandatory data
- Opportunities that should be closing soon but haven't moved

Generate exactly 3 tough, specific coaching questions to ask them in the review.
Format the output as a simple JSON array of strings. Do not include markdown formatting or explanations, just the raw JSON array.
Example: ["Why is the X deal stuck?", "What is the status of Y?"]`;

    const result = await generateText({
      model: groq('llama-3.1-8b-instant'),
      system: systemPrompt,
      prompt: "Generate the 3 questions now.",
    });

    let questions = [];
    try {
      questions = JSON.parse(result.text.trim());
    } catch (e) {
      // fallback if LLM wraps in markdown
      const cleaned = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
      questions = JSON.parse(cleaned);
    }

    // Save to database
    const review = await prisma.weeklyReview.create({
      data: {
        salespersonId: salespersonName, // Using name as ID for now
        salespersonName: salespersonName,
        reviewContent: JSON.stringify(questions),
      }
    });

    return new Response(JSON.stringify({ questions, reviewId: review.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Review Generation Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate review" }), { status: 500 });
  }
}
