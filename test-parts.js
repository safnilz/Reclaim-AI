const { groq } = require('@ai-sdk/groq');
const { streamText } = require('ai');

async function test() {
  const messages = [
    { role: 'user', content: 'Summarize my current pipeline health' },
    { 
      role: 'assistant', 
      parts: [ { type: 'text', text: 'Here is a summary of your pipeline health. It looks good.' } ]
    },
    { role: 'user', content: 'explain reclaim pipeline and recova pipeline separate' }
  ];

  const normalizedMessages = messages.map(m => {
    if (m.role === 'assistant' && m.parts && !m.content) {
      return {
        ...m,
        content: m.parts.filter(p => p.type === 'text').map(p => p.text).join('')
      };
    }
    return m;
  });

  try {
    const result = streamText({
      model: groq('llama-3.1-8b-instant'),
      system: 'hello',
      messages: normalizedMessages,
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
