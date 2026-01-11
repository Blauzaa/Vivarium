/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useChat } from '@ai-sdk/react';
// Define Message interface manually since import failed or use any for now to unblock
interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'data';
  content: string;
  toolInvocations?: Array<{
    state: 'result' | 'call';
    toolCallId: string;
    toolName: string;
    args: any;
    result?: any;
  }>;
}
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { Send, Bot, Sparkles, Zap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const VivariumGame = dynamic(() => import('../components/VivariumGame'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-slate-900 text-white p-10">Loading Game...</div>
});

export default function Page() {
  const [gameCommand, setGameCommand] = useState<{ type: string, data: any } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    maxSteps: 5,
  } as any) as any;

  // Handle side effects from tool calls via messages
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    // Check if the last message has tool invocations that are not results yet (or just process them)
    // Note: This logic might re-trigger if not careful, but for this simple game command passing it should be okay 
    // if setGameCommand handles redundancy or if we only trigger on strict conditions.
    // However, usually we want to trigger only when tool is CALLED.

    if (lastMessage?.toolInvocations) {
      lastMessage.toolInvocations.forEach((toolInvocation: any) => {
        // Only trigger if we haven't processed this specific call ID ? 
        // For now, simpler approach: Just pass the latest command. React state update will trigger re-render.
        if (toolInvocation.state === 'call') {
          const { toolName, args } = toolInvocation;
          if (toolName === 'spawnCreature') {
            setGameCommand({ type: 'spawnCreature', data: args });
          }
          if (toolName === 'changeWeather') {
            setGameCommand({ type: 'changeWeather', data: args });
          }
        }
      });
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans text-slate-200">

      <VivariumGame lastCommand={gameCommand} />

      <div className="absolute top-0 right-0 p-6 z-10 w-full md:w-[450px] h-full pointer-events-none flex flex-col justify-end">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl pointer-events-auto flex flex-col max-h-[80vh] overflow-hidden">

          <div className="p-4 bg-gradient-to-r from-blue-900 to-slate-900 flex items-center gap-3 border-b border-white/5">
            <Bot size={20} className="text-blue-400" />
            <h1 className="font-bold text-sm text-white">GAIA CONTROL</h1>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center py-10 opacity-50">
                <Sparkles className="mx-auto mb-2 text-blue-400" />
                <p className="text-sm">Perintahkan: &quot;Buat 5 minion merah&quot;</p>
              </div>
            )}

            {messages.map((m: any) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={m.id}
                className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800/80 text-slate-200'
                  }`}>
                  {m.content}
                </div>

                {(m as Message).toolInvocations?.map((tool) => {
                  // Ensure we handle the union type of ToolInvocation (call or result)
                  const isDone = tool.state === 'result';
                  return (
                    <div key={tool.toolCallId} className="flex items-center gap-2 text-[10px] bg-black/30 px-2 py-1 rounded-md text-emerald-400">
                      {isDone ? <Zap size={10} /> : <Loader2 size={10} className="animate-spin" />}
                      <span className="uppercase font-mono">
                        {tool.toolName}
                      </span>
                    </div>
                  )
                })}
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 bg-black/20 border-t border-white/5 flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Masukkan perintah..."
              className="flex-1 bg-slate-800/50 text-white px-4 py-3 rounded-xl text-sm outline-none"
            />
            <button type="submit" disabled={isLoading} className="bg-blue-600 text-white p-3 rounded-xl">
              <Send size={18} />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}