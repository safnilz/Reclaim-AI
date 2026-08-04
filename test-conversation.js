const { groq } = require('@ai-sdk/groq');
const { streamText } = require('ai');
const { fetchAllActiveDeals } = require('./src/lib/zoho');

async function test() {
  const activeDeals = await fetchAllActiveDeals();
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
    pipelineSummary: {},
    top50LargestDeals: topDeals
  };

  const systemPrompt = `You are the AI Commercial Director for ReClaim.
Your job is to answer the user's questions strictly based on the live Zoho CRM data provided below.
Be concise, assertive, and focus on commercial outcomes, pipeline health, and missing data.

LIVE ZOHO CRM PIPELINE DATA:
${JSON.stringify(contextData)}`;

  const messages = [
    { role: 'user', content: 'Summarize my current pipeline health' },
    { role: 'assistant', content: 'Here is a summary of your pipeline health. It looks good.' },
    { role: 'user', content: 'explain reclaim pipeline and recova pipeline separate' }
  ];

  console.log("Tokens approx:", systemPrompt.length / 4 + JSON.stringify(messages).length / 4);

  try {
    const result = streamText({
      model: groq('llama-3.1-8b-instant'),
      system: systemPrompt,
      messages,
    });
    
    const response = result.toUIMessageStreamResponse();
    console.log("Status:", response.status);
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) console.log(decoder.decode(value));
    }
  } catch (err) {
    console.error("Caught error:", err);
  }
}

test().catch(console.error);
