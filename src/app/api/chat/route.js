import { groq } from '@ai-sdk/groq';
import { streamText, generateText } from 'ai';
import { z } from 'zod';
import { 
  fetchAllActiveDeals, 
  fetchInactiveAccounts,
  searchModule,
  fetchCollectedRevenueBySalesperson,
  fetchUnpaidInvoices,
  fetchCustomerInvoiceHistory
} from '@/lib/zoho';

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

    // Pre-process user intent to determine if we need to call external tools
    let additionalContext = "";
    try {
      const userMessage = messages[messages.length - 1]?.content || "";
      
      const { text: toolPlan } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: `You are an intent analyzer. Analyze the user query to determine if external data from Zoho CRM or Zoho Books is required to answer.
Output ONLY a JSON array of tool calls. Do not output markdown. Available tools:
- {"tool": "searchCrm", "args": {"module": "Deals|Accounts|Contacts|Leads", "criteria": "..."}}
- {"tool": "getInactiveAccounts", "args": {"daysInactive": 200}}
- {"tool": "getCollectedRevenue", "args": {}}
- {"tool": "getUnpaidInvoices", "args": {}}
- {"tool": "getCustomerInvoiceHistory", "args": {}}
If no tools are needed, output []. ONLY output a valid JSON array.`,
        prompt: userMessage,
      });

      const jsonMatch = toolPlan.match(/\[.*\]/s);
      if (jsonMatch) {
        const toolCalls = JSON.parse(jsonMatch[0]);
        for (const call of toolCalls) {
          if (call.tool === 'searchCrm') {
            const res = await searchModule(call.args.module, call.args.criteria);
            additionalContext += `\n[Tool searchCrm (${call.args.module} - ${call.args.criteria}) result]: ${JSON.stringify(res)}`;
          } else if (call.tool === 'getInactiveAccounts') {
            const res = await fetchInactiveAccounts(call.args.daysInactive || 200);
            additionalContext += `\n[Tool getInactiveAccounts result]: ${JSON.stringify(res)}`;
          } else if (call.tool === 'getCollectedRevenue') {
            const res = await fetchCollectedRevenueBySalesperson();
            additionalContext += `\n[Tool getCollectedRevenue result]: ${JSON.stringify(res)}`;
          } else if (call.tool === 'getUnpaidInvoices') {
            const res = await fetchUnpaidInvoices();
            additionalContext += `\n[Tool getUnpaidInvoices result]: ${JSON.stringify(res)}`;
          } else if (call.tool === 'getCustomerInvoiceHistory') {
            const res = await fetchCustomerInvoiceHistory();
            additionalContext += `\n[Tool getCustomerInvoiceHistory result]: ${JSON.stringify(res)}`;
          }
        }
      }
    } catch (e) {
      console.log("Pre-processing tool step failed:", e);
    }

    // Inject the real-time context and any tool results into the system prompt
    const systemPrompt = `You are the AI Commercial Director of Ehfaaz.
Your job is to answer the user's questions based on live CRM and Accounting data.

For pipeline and deal questions, rely on the LIVE ZOHO CRM PIPELINE DATA provided below, which contains summary metrics and the top 50 active deals.
For specific deep-dive questions, relevant tool output has been dynamically fetched and injected below.

Be concise, assertive, and focus on commercial outcomes, pipeline health, and missing data.

LIVE ZOHO CRM PIPELINE DATA:
${JSON.stringify(contextData)}

ADDITIONAL DYNAMIC CONTEXT (If any):
${additionalContext}`;

    // The AI SDK client sends 'parts' for assistant messages when using toUIMessageStreamResponse.
    // The AI provider requires 'content' to be a string. We must normalize this to prevent validation errors.
    const normalizedMessages = messages.map(m => {
      if (m.role === 'assistant' && m.parts && !m.content) {
        return {
          ...m,
          content: m.parts.filter(p => p.type === 'text').map(p => p.text).join('')
        };
      }
      return m;
    });

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'), // Switched to 70b model for better reasoning
      system: systemPrompt,
      messages: normalizedMessages,
      maxSteps: 1
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate AI response: " + error.message, stack: error.stack }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
