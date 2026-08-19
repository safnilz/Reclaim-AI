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

    // The AI SDK client sends 'parts' for assistant messages when using toUIMessageStreamResponse.
    // Normalize messages first so recentMessages can correctly read assistant content.
    const normalizedMessages = messages.map(m => {
      let content = m.content;
      if (m.role === 'assistant' && m.parts && !m.content) {
        content = m.parts.filter(p => p.type === 'text').map(p => p.text).join('');
      }
      
      // Truncate long assistant messages to save context window and prevent token rate limits
      if (m.role === 'assistant' && content.length > 1500) {
        content = content.substring(0, 1500) + "\n...[truncated]";
      }
      return { ...m, content };
    });

    // Provide recent conversation history for intent analysis so follow-up questions work
    const recentMessages = normalizedMessages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');

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
        model: groq('llama3-8b-8192'), // Use highly reliable original Llama 3 8B model for intent
        system: `You are an intent analyzer. Analyze the user query to determine if external data from Zoho CRM or Zoho Books is required to answer, OR if the user is explicitly telling you to remember/learn a fact, or sharing general company knowledge with you (e.g. who works where, company policies, competitors).
Output ONLY a JSON array of tool calls. Do not output markdown. Available tools:
- {"tool": "searchCrm", "args": {"module": "Deals|Accounts|Contacts|Leads", "criteria": "..."}} (Search for specific records)
- {"tool": "getInactiveAccounts", "args": {"daysInactive": 200}} (Find dormant or inactive accounts)
- {"tool": "getCollectedRevenue", "args": {}} (Find revenue collected by salespeople)
- {"tool": "getUnpaidInvoices", "args": {}} (Use this whenever the user asks about invoices, overdue invoices, outstanding payments, receivables, or debtors)
- {"tool": "getCustomerInvoiceHistory", "args": {}} (Find billing history for customers)
- {"tool": "learnFact", "args": {"fact": "the specific fact to remember"}} (Use this to remember user-provided facts)
If the user shares company knowledge or tells you to remember something, output a learnFact tool call. If no tools are needed, output []. ONLY output a valid JSON array.`,
        prompt: recentMessages,
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
      }))
      .slice(0, 25); // Prevent token limit crashes during bulk CRM updates
    
    // Sort deals by revenue descending and take top 25 (reduced from 50 to save tokens)
    const topDeals = [...activeDeals]
      .sort((a, b) => (Number(b.expectedRevenue) || 0) - (Number(a.expectedRevenue) || 0))
      .slice(0, 25)
      .map(d => ({
        name: d.dealName,
        stage: d.stage,
        revenue: d.expectedRevenue,
        owner: d.ownerId
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
              let res = await fetchUnpaidInvoices();
              const totalUnpaidCount = res.length;
              const totalUnpaidValue = res.reduce((sum, inv) => sum + (Number(inv.balance) || 0), 0);
              
              // Sort by oldest due date and slice to 20 to prevent token limits (Free tier Groq limits)
              res = res.sort((a,b) => {
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                return dateA - dateB;
              }).slice(0, 20);
              additionalContext += `\n[Tool getUnpaidInvoices result]: Total Unpaid Invoices: ${totalUnpaidCount} | Total Unpaid Value: ${totalUnpaidValue} | Showing top 20 oldest:\n${JSON.stringify(res)}`;
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

Today's date is: ${new Date().toISOString().split('T')[0]}.

For pipeline and deal questions, rely on the LIVE ZOHO CRM PIPELINE DATA provided below, which contains summary metrics and the top 50 active deals.
For specific deep-dive questions, relevant tool output has been dynamically fetched and injected below.

Be concise, assertive, and focus on commercial outcomes, pipeline health, and missing data.

LEARNED COMPANY CONTEXT (Important facts to remember):
${factsString}

LIVE ZOHO CRM PIPELINE DATA:
${JSON.stringify(contextData)}

ADDITIONAL DYNAMIC CONTEXT (If any):
${additionalContext}`;

    const result = streamText({
      model: groq('llama3-70b-8192'), // Using original legacy 70b model that is unrestricted
      system: systemPrompt,
      messages: normalizedMessages,
      maxSteps: 1
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return new Response(
      "Failed to generate AI response: " + error.message,
      { status: 500, headers: { 'Content-Type': 'text/plain' } }
    );
  }
}
