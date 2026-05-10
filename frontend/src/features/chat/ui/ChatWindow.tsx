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
      <div className="flex h-full flex-col items-center justify-center text-center px-4">
        <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6 animate-pulse">
          <Bot size={32} strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-semibold text-text-strong mb-2">Welcome to Talos</h2>
        <p className="text-sm text-text-subtle max-w-sm">
          Select a conversation from the sidebar or start a new one to begin your multi-agent workflow.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col relative bg-surface">
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="max-w-3xl mx-auto w-full px-4 py-8 space-y-8">
          {messages.length === 0 && (
             <div className="text-center py-20">
                <h1 className="text-3xl font-bold text-text-strong mb-4">How can I help you today?</h1>
                <p className="text-text-subtle">Talos is ready to assist with coding, knowledge, and communication.</p>
             </div>
          )}
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          <div className="h-32" /> {/* Bottom spacing for input */}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-surface via-surface/90 to-transparent pb-8 pt-12 px-4">
        <div className="max-w-3xl mx-auto relative group">
          <div className="absolute -inset-0.5 bg-primary/20 rounded-[22px] blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-end gap-2 bg-surface border border-muted-subtle shadow-xl shadow-primary/5 rounded-[20px] p-2 transition-all border-muted group-focus-within:border-primary/50">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message Talos..."
              rows={1}
              className="flex-1 bg-transparent border-none focus:ring-0 text-text-strong py-3 px-4 resize-none max-h-60"
              style={{ height: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-text-strong text-white p-2.5 rounded-xl hover:bg-primary transition-all disabled:opacity-20 disabled:hover:bg-text-strong mb-0.5 mr-0.5"
            >
              <Send size={18} strokeWidth={2} />
            </button>
          </div>
          <p className="text-[10px] text-center mt-3 text-text-subtle font-medium">
            Talos can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
};

const MessageItem = ({ message }: { message: Message }) => {
  const isAssistant = message.role === 'assistant';
  const [showTrace, setShowTrace] = useState(false);

  return (
    <div className={clsx("flex gap-5 group", isAssistant ? "items-start" : "items-start flex-row-reverse")}>
      <div className={clsx(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
        isAssistant 
          ? "bg-primary text-white border-primary shadow-sm" 
          : "bg-surface border-muted text-text-strong group-hover:border-primary/30"
      )}>
        {isAssistant ? <Bot size={18} strokeWidth={1.5} /> : <User size={18} strokeWidth={1.5} />}
      </div>
      
      <div className={clsx("flex flex-col gap-2 min-w-0 flex-1", !isAssistant && "items-end")}>
        <div className={clsx(
          "text-sm leading-relaxed whitespace-pre-wrap",
          isAssistant ? "text-text-strong pr-10" : "bg-muted/50 rounded-2xl px-4 py-2 text-text-strong inline-block"
        )}>
          {message.content}
        </div>

        {isAssistant && message.reasoning_trace && (
          <div className="w-full mt-2">
            <button
              onClick={() => setShowTrace(!showTrace)}
              className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-text-subtle hover:text-primary transition-all bg-muted/30 px-2 py-1 rounded-md"
            >
              {showTrace ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              Reasoning Trace
            </button>
            {showTrace && (
              <div className="mt-3 rounded-xl bg-muted/30 border border-muted/50 p-4 text-[13px] font-mono text-text-subtle leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-muted/50">
                   <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" />
                   <span className="text-[10px] font-bold uppercase tracking-tighter">Analysis Log</span>
                </div>
                {message.reasoning_trace}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
