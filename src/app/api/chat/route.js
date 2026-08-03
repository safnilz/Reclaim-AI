import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { fetchAllActiveDeals } from '@/lib/zoho';

export const maxDuration = 30;

export async function POST(req) {
  try {
    const { messages } = await req.json();

    // Securely fetch live CRM context behind the scenes
    const activeDeals = await fetchAllActiveDeals();
    
    // Compute summary metrics to avoid passing 300+ deals to the LLM (which exceeds 6k TPM limit)
    const totalDeals = activeDeals.length;
    const totalRevenue = activeDeals.reduce((sum, d) => sum + (Number(d.expectedRevenue) || 0), 0);
    const dealsByStage = activeDeals.reduce((acc, d) => {
      acc[d.stage] = (acc[d.stage] || 0) + 1;
      return acc;
    }, {});
    
    // Sort deals by revenue descending and take top 50
    const topDeals = [...activeDeals]
      .sort((a, b) => (Number(b.expectedRevenue) || 0) - (Number(a.expectedRevenue) || 0))
      .slice(0, 50)
      .map(d => ({
        name: d.dealName,
        stage: d.stage,
        revenue: d.expectedRevenue,
        owner: d.ownerId,
        decisionMaker: d.decisionMaker || "Missing",
        contactPerson: d.contactPerson || "Missing"
      }));

    const contextData = {
      pipelineSummary: { totalDeals, totalRevenue, dealsByStage },
      top50LargestDeals: topDeals
    };

    // Inject the real-time context into the system prompt
    const systemPrompt = `You are the AI Commercial Director for ReClaim.
Your job is to answer the user's questions strictly based on the live Zoho CRM data provided below.
Be concise, assertive, and focus on commercial outcomes, pipeline health, and missing data.

LIVE ZOHO CRM PIPELINE DATA:
${JSON.stringify(contextData)}`;

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
