import React, { useState, useRef, useEffect } from 'react';
import { useChatStore, Message } from '@/entities/chat/model/store';
import { Send, ChevronDown, ChevronUp, Bot, User } from 'lucide-react';
import { clsx } from 'clsx';

export const ChatWindow = () => {
  const { messages, sendMessage, currentSession } = useChatStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  if (!currentSession) {
    return (
      <div className="flex h-full items-center justify-center text-text-subtle">
        Select or create a conversation to start
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-surface border border-muted rounded-2xl shadow-sm overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
      </div>
      
      <div className="p-4 border-t border-muted bg-muted/10">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Talos..."
            className="flex-1 bg-surface border border-muted rounded-xl px-4 py-2 text-text-strong focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-primary text-white p-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

const MessageItem = ({ message }: { message: Message }) => {
  const isAssistant = message.role === 'assistant';
  const [showTrace, setShowTrace] = useState(false);

  return (
    <div className={clsx("flex gap-4", isAssistant ? "flex-row" : "flex-row-reverse")}>
      <div className={clsx(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
        isAssistant ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-muted text-text-strong"
      )}>
        {isAssistant ? <Bot size={18} strokeWidth={1.5} /> : <User size={18} strokeWidth={1.5} />}
      </div>
      
      <div className={clsx("flex max-w-[80%] flex-col gap-2", !isAssistant && "items-end")}>
        <div className={clsx(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isAssistant ? "bg-muted/30 text-text-strong border border-muted" : "bg-primary text-white"
        )}>
          {message.content}
        </div>

        {isAssistant && message.reasoning_trace && (
          <div className="w-full">
            <button
              onClick={() => setShowTrace(!showTrace)}
              className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-text-subtle hover:text-primary transition-colors"
            >
              {showTrace ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Reasoning Trace
            </button>
            {showTrace && (
              <div className="mt-2 rounded-xl bg-muted/20 border border-muted/50 p-3 text-xs font-mono text-text-subtle animate-in fade-in slide-in-from-top-1 duration-200">
                {message.reasoning_trace}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
