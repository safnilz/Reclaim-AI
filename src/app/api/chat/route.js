import { groq } from '@ai-sdk/groq';
import { streamText, generateText } from 'ai';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { 
  fetchAllActiveDeals, 
  fetchInactiveAccounts,
  searchModule,
  fetchCollectedRevenueBySalesperson,
  fetchUnpaidInvoices,
  fetchCustomerInvoiceHistory
} from '@/lib/zoho';

const prisma = new PrismaClient();

export const maxDuration = 30;

export async function POST(req) {
  try {
    const { messages } = await req.json();

    // Extract user message early
    const userMessage = messages[messages.length - 1]?.content || "";

    // Run active deals fetch, learned facts fetch, and intent analysis concurrently to save time
    const [activeDeals, learnedFacts, toolPlanResult] = await Promise.all([
      fetchAllActiveDeals().catch(e => {
        console.error("Failed to fetch active deals:", e);
        return [];
      }),
      prisma.learnedFact.findMany().catch(e => {
        console.error("Failed to fetch learned facts:", e);
        return [];
      }),
      generateText({
        model: groq('llama-3.1-8b-instant'), // Use 8B model for lightning fast intent analysis
        system: `You are an intent analyzer. Analyze the user query to determine if external data from Zoho CRM or Zoho Books is required to answer, OR if the user is explicitly telling you to remember/learn a fact, or sharing general company knowledge with you (e.g. who works where, company policies, competitors).
Output ONLY a JSON array of tool calls. Do not output markdown. Available tools:
- {"tool": "searchCrm", "args": {"module": "Deals|Accounts|Contacts|Leads", "criteria": "..."}}
- {"tool": "getInactiveAccounts", "args": {"daysInactive": 200}}
- {"tool": "getCollectedRevenue", "args": {}}
- {"tool": "getUnpaidInvoices", "args": {}}
- {"tool": "getCustomerInvoiceHistory", "args": {}}
- {"tool": "learnFact", "args": {"fact": "the specific fact to remember"}}
If the user shares company knowledge or tells you to remember something, output a learnFact tool call. If no tools are needed, output []. ONLY output a valid JSON array.`,
        prompt: userMessage,
      }).catch(e => {
        console.error("Intent analyzer failed:", e);
        return { text: "[]" };
      })
    ]);
    
    // Compute summary metrics to avoid passing 300+ deals to the LLM
    const totalDeals = activeDeals.length;
    const totalRevenue = activeDeals.reduce((sum, d) => sum + (Number(d.expectedRevenue) || 0), 0);
    const dealsByStage = activeDeals.reduce((acc, d) => {
      acc[d.stage] = (acc[d.stage] || 0) + 1;
      return acc;
    }, {});
    
    // Determine which deals were updated this week (Monday to Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay() || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1);
    monday.setHours(0, 0, 0, 0);

    const updatedThisWeek = activeDeals
      .filter(d => d.lastUpdated && new Date(d.lastUpdated) >= monday)
      .map(d => ({
        name: d.dealName,
        stage: d.stage,
        owner: d.ownerId,
        revenue: d.expectedRevenue
      }));
    
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
      top50LargestDeals: topDeals,
      dealsUpdatedThisWeek: updatedThisWeek
    };

    // Pre-process user intent to determine if we need to call external tools
    let additionalContext = "";
    try {
      const jsonMatch = toolPlanResult.text.match(/\[.*\]/s);
      if (jsonMatch) {
        const toolCalls = JSON.parse(jsonMatch[0]);
        for (const call of toolCalls) {
          try {
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
            } else if (call.tool === 'learnFact') {
              const fact = call.args.fact;
              if (fact) {
                await prisma.learnedFact.create({ data: { fact } });
                additionalContext += `\n[Tool learnFact result]: I have memorized this fact: "${fact}". Please acknowledge this to the user.`;
                // Add the newly learned fact to the current array immediately so it is included in context
                learnedFacts.push({ fact }); 
              }
            }
          } catch(toolErr) {
            additionalContext += `\n[Tool ${call.tool} failed]: ${toolErr.message}`;
          }
        }
      }
    } catch (e) {
      console.log("Pre-processing tool step parsing failed:", e);
    }

    const factsString = learnedFacts.length > 0 
      ? learnedFacts.map(f => `- ${f.fact}`).join('\n') 
      : "No learned facts yet.";

    // Inject the real-time context and any tool results into the system prompt
    const systemPrompt = `You are the AI Commercial Director of Ehfaaz. You were created by Safnil Zainudeen, a Growth Analyst at Ehfaaz.
Your job is to answer the user's questions based on live CRM and Accounting data, and dynamically adapt based on Learned Facts.

For pipeline and deal questions, rely on the LIVE ZOHO CRM PIPELINE DATA provided below, which contains summary metrics and the top 50 active deals.
For specific deep-dive questions, relevant tool output has been dynamically fetched and injected below.

Be concise, assertive, and focus on commercial outcomes, pipeline health, and missing data.

LEARNED COMPANY CONTEXT (Important facts to remember):
${factsString}

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
