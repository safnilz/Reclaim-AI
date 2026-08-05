import { groq } from '@ai-sdk/groq';
import { streamText, tool } from 'ai';
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

    // Inject the real-time context into the system prompt
    const systemPrompt = `You are the AI Commercial Director of Ehfaaz.
Your job is to answer the user's questions based on live CRM and Accounting data.

For pipeline and deal questions, rely on the LIVE ZOHO CRM PIPELINE DATA provided below, which contains summary metrics and the top 50 active deals.
If the user asks about inactive accounts, search for other CRM modules, or asks about invoices and revenue collected, you MUST use the provided tools to fetch that data dynamically.

Be concise, assertive, and focus on commercial outcomes, pipeline health, and missing data.

LIVE ZOHO CRM PIPELINE DATA:
${JSON.stringify(contextData)}`;

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
      model: groq('llama-3.1-8b-instant'), // Using the same model from redata
      system: systemPrompt,
      messages: normalizedMessages,
      maxSteps: 3,
      tools: {
        getInactiveAccounts: tool({
          description: 'Fetch accounts that have had no activity for a specified number of days.',
          parameters: z.object({
            daysInactive: z.number().default(200).describe('The number of days an account must be inactive to be included (default 200).'),
          }),
          execute: async ({ daysInactive }) => await fetchInactiveAccounts(daysInactive),
        }),
        searchCrm: tool({
          description: 'Search a Zoho CRM module for records matching criteria. For example, to find an account by name.',
          parameters: z.object({
            module: z.enum(['Accounts', 'Contacts', 'Leads']).describe('The CRM module to search'),
            criteria: z.string().describe('The search criteria string, e.g., (Account_Name:equals:Company Inc)'),
          }),
          execute: async ({ module, criteria }) => await searchModule(module, criteria),
        }),
        getCollectedRevenue: tool({
          description: 'Fetch the total collected revenue grouped by salesperson from Zoho Books.',
          parameters: z.object({}),
          execute: async () => await fetchCollectedRevenueBySalesperson(),
        }),
        getUnpaidInvoices: tool({
          description: 'Fetch all currently unpaid invoices from Zoho Books.',
          parameters: z.object({}),
          execute: async () => await fetchUnpaidInvoices(),
        }),
        getCustomerInvoiceHistory: tool({
          description: 'Fetch the historical invoice data for all customers from Zoho Books.',
          parameters: z.object({}),
          execute: async () => await fetchCustomerInvoiceHistory(),
        }),
      }
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
