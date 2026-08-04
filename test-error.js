import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';

async function test() {
  const result = streamText({
    model: groq('llama-3.1-8b-instant'),
    system: "hello",
    messages: [
      {role: 'user', content: 'hello'},
      // Intentionally cause an error by passing a bad role or exceeding max tokens
      {role: 'system', content: 'Wait, system message in the middle is invalid for Groq!'}
    ],
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
}

test().catch(console.error);
