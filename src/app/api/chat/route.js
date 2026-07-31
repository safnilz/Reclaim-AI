import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { fetchAllActiveDeals } from '@/lib/zoho';

export const maxDuration = 30;

export async function POST(req) {
  try {
    const { messages } = await req.json();

    // Securely fetch live CRM context behind the scenes
    const activeDeals = await fetchAllActiveDeals();
    
    // Inject the real-time context into the system prompt
    const systemPrompt = `You are the AI Commercial Director for ReClaim.
Your job is to answer the user's questions strictly based on the live Zoho CRM data provided below.
Be concise, assertive, and focus on commercial outcomes, pipeline health, and missing data.

LIVE ZOHO CRM PIPELINE DATA:
${JSON.stringify(activeDeals, null, 2)}
`;

    const result = streamText({
      model: groq('llama-3.1-8b-instant'), // Using the same model from redata
      system: systemPrompt,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate AI response. Make sure GROQ_API_KEY is set." }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
