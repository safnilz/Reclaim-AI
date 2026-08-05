"use client";

import { useChat } from '@ai-sdk/react';
import { Bot, User, Send, Target } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function AIAssistantPage() {
  const { messages, status, error, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const isLoading = status !== 'ready' && status !== 'error' && status !== undefined;

  useEffect(() => {
    console.log("MESSAGES STATE:", JSON.stringify(messages, null, 2));
  }, [messages]);

  const handleInputChange = (e) => setInput(e.target.value);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ role: 'user', content: input });
    setInput('');
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="p-8 max-w-5xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Bot className="w-8 h-8 text-blue-500" />
          AI Commercial Director
        </h1>
        <p className="text-slate-9000 mt-1">Ask questions about your live Zoho pipeline. Powered by AI LLM.</p>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-9000 space-y-4">
              <Target className="w-12 h-12 text-slate-700" />
              <p>Ask me about your stale deals, missing data, or specific pipeline metrics.</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => sendMessage({ role: 'user', content: "Summarize my current pipeline health." })} 
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-700 rounded-lg text-xs text-slate-600 transition-colors"
                >
                  Summarize pipeline health
                </button>
                <button 
                  onClick={() => sendMessage({ role: 'user', content: "Which deals are missing a decision maker?" })} 
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-700 rounded-lg text-xs text-slate-600 transition-colors"
                >
                  Missing decision makers?
                </button>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-500" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-xl p-4 text-sm ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                  : 'bg-white text-slate-800 border border-slate-200 shadow-sm'
              }`}>
                <div className="whitespace-pre-wrap">
                  {m.parts 
                    ? m.parts.map((p, i) => p.type === 'text' ? p.text : '').join('')
                    : m.content}
                </div>
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-500" />
              </div>
              <div className="bg-white text-slate-800 border border-slate-200 shadow-sm rounded-xl p-4 text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-500" />
              </div>
              <div className="max-w-[80%] rounded-xl p-4 text-sm bg-white text-slate-800 border border-slate-200 shadow-sm">
                I'm sorry, I don't have access to that information right now or encountered an issue. Could you try rephrasing your question?
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask the Commercial Director a question..."
              className="flex-1 bg-slate-100 border border-slate-300 text-slate-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-9000"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input?.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-9000 text-slate-900 font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              Send <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
