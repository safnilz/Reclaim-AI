const { streamText } = require('ai');
const { groq } = require('@ai-sdk/groq');

async function test() {
  const result = streamText({
    model: groq('llama-3.1-8b-instant'),
    system: "hello",
    messages: [{role: 'user', content: 'hi'}],
  });
  
  console.log("METHODS:", Object.keys(result).filter(k => typeof result[k] === 'function'));
  console.log("toDataStreamResponse exists:", typeof result.toDataStreamResponse === 'function');
  console.log("toUIMessageStreamResponse exists:", typeof result.toUIMessageStreamResponse === 'function');
  console.log("toAIStreamResponse exists:", typeof result.toAIStreamResponse === 'function');
}

test().catch(console.error);
