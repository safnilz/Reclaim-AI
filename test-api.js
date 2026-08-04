(async () => {
  console.log("Sending request to /api/chat");
  const response = await fetch('https://reclaim-ai-henna.vercel.app/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] })
  });
  console.log("Status:", response.status);
  
  if (!response.ok) {
    const text = await response.text();
    console.log("Error:", text);
    return;
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      console.log("CHUNK:", decoder.decode(value));
    }
  }
  console.log("Finished reading stream.");
})();
