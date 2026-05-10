import React from 'react';
import { useChatStore, AgentType } from '@/entities/chat/model/store';
import { Code, Library, MessageCircle, Share2, PanelLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export const Header = () => {
  const { activeAgent, setActiveAgent, currentSession } = useChatStore();

  const agents: { type: AgentType; icon: React.ReactNode; label: string }[] = [
    { type: 'coding', icon: <Code size={14} strokeWidth={2} />, label: 'Coding' },
    { type: 'knowledge', icon: <Library size={14} strokeWidth={2} />, label: 'Knowledge' },
    { type: 'comms', icon: <MessageCircle size={14} strokeWidth={2} />, label: 'Comms' },
  ];

  return (
    <header className="global-header">
      <div className="flex items-center gap-4">
        <button className="btn btn-ghost p-2 lg:hidden">
          <PanelLeft size={20} strokeWidth={1.5} />
        </button>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-text-subtle uppercase tracking-wider">
            {currentSession?.title || 'New Chat'}
          </span>
        </div>
      </div>

      <div className="agent-toggle">
        {agents.map((agent) => (
          <button
            key={agent.type}
            onClick={() => setActiveAgent(agent.type)}
            className={clsx('agent-toggle-item', activeAgent === agent.type && 'active')}
          >
            {agent.icon}
            <span>{agent.label}</span>
            {activeAgent === agent.type && (
              <motion.div
                layoutId="agent-pill"
                className="absolute inset-0 bg-white rounded-full -z-10 shadow-sm"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button className="btn btn-surface py-1.5 px-3 flex items-center gap-2 text-xs">
          <Share2 size={14} strokeWidth={1.5} />
          <span>Share</span>
        </button>
      </div>
    </header>
  );
};
