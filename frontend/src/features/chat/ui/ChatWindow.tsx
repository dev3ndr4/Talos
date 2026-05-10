import React, { useState, useRef, useEffect } from 'react';
import { useChatStore, Message } from '@/entities/chat/model/store';
import { Send, ChevronDown, ChevronUp, Bot, User, Mail } from 'lucide-react';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const ChatWindow = () => {
  const { messages, sendMessage, currentSession, activeAgent } = useChatStore();
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
      <div className="chat-empty-state">
        <div className="empty-state-icon">
          <Bot size={32} strokeWidth={1.5} />
        </div>
        <h2 className="chat-empty-state-title">Welcome to Talos</h2>
        <p className="chat-empty-state-desc">
          Select a conversation from the sidebar or start a new one to begin your multi-agent
          workflow.
        </p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <header className="chat-header">
        <div className="flex items-center gap-3">
          <div className="agent-badge">
            <div className="agent-badge-dot" />
            <span className="agent-badge-text">{activeAgent} Agent</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" style={{ padding: 'var(--spacing-2)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Share</span>
          </button>
        </div>
      </header>

      <div className="chat-messages-container" ref={scrollRef}>
        <div className="chat-messages-inner">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <h1 className="chat-welcome-title">How can I help you today?</h1>
              <p className="chat-welcome-desc">
                Talos is ready to assist with coding, knowledge, and communication.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          <div style={{ height: '8rem' }} />
        </div>
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <div className="chat-input-box">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${
                activeAgent.charAt(0).toUpperCase() + activeAgent.slice(1)
              } Agent...`}
              rows={1}
              className="chat-textarea"
            />
            <button onClick={handleSend} disabled={!input.trim()} className="send-btn">
              <Send size={18} strokeWidth={2} />
            </button>
          </div>
          <p className="chat-disclaimer">Talos can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  );
};

const MessageItem = ({ message }: { message: Message }) => {
  const isAssistant = message.role === 'assistant';
  const [showTrace, setShowTrace] = useState(false);
  const { retryMessage } = useChatStore();

  return (
    <div className={clsx('message-item', isAssistant ? 'assistant' : 'user')}>
      <div className="message-avatar">
        {isAssistant ? <Bot size={18} strokeWidth={1.5} /> : <User size={18} strokeWidth={1.5} />}
      </div>

      <div className="message-body">
        <div className="message-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p>{children}</p>,
              h1: ({ children }) => <h1>{children}</h1>,
              h2: ({ children }) => <h2>{children}</h2>,
              h3: ({ children }) => <h3>{children}</h3>,
              ul: ({ children }) => <ul>{children}</ul>,
              ol: ({ children }) => <ol>{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match;
                return isInline ? (
                  <code {...props}>{children}</code>
                ) : (
                  <pre>
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                );
              },
              blockquote: ({ children }) => (
                <blockquote
                  style={{
                    borderLeft: '4px solid rgba(16, 163, 127, 0.3)',
                    paddingLeft: '1rem',
                    fontStyle: 'italic',
                    margin: '1rem 0',
                    color: 'var(--color-text-subtle)',
                  }}
                >
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div
                  style={{
                    overflowX: 'auto',
                    margin: '1rem 0',
                    border: '1px solid var(--color-muted-subtle)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th
                  style={{
                    backgroundColor: 'rgba(244, 244, 245, 0.3)',
                    padding: '0.5rem',
                    borderBottom: '1px solid var(--color-muted-subtle)',
                    fontWeight: 'bold',
                    fontSize: '13px',
                  }}
                >
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td
                  style={{
                    padding: '0.5rem',
                    borderBottom: '1px solid var(--color-muted-subtle)',
                    fontSize: '13px',
                  }}
                >
                  {children}
                </td>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                >
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {isAssistant && message.reasoning_trace && (
          <div className="w-full" style={{ marginTop: 'var(--spacing-2)' }}>
            <button
              onClick={() => setShowTrace(!showTrace)}
              className={clsx('reasoning-btn', showTrace ? 'active' : 'inactive')}
            >
              {showTrace ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              Reasoning Trace
            </button>
            {showTrace && (
              <div className="trace-container">
                <div className="trace-header">
                  <div className="trace-indicator" />
                  <span
                    style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  >
                    Analysis Log
                  </span>
                </div>
                {message.reasoning_trace}
              </div>
            )}
          </div>
        )}

        {isAssistant && message.email_draft && (
          <div style={{ marginTop: 'var(--spacing-3)' }}>
            <a
              href={`mailto:${message.email_draft.to || ''}?subject=${encodeURIComponent(
                message.email_draft.subject
              )}&body=${encodeURIComponent(message.email_draft.body)}`}
              className="btn btn-primary flex items-center gap-2 w-fit"
              style={{
                textDecoration: 'none',
                padding: 'var(--spacing-2) var(--spacing-4)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.875rem',
              }}
            >
              <Mail size={16} strokeWidth={1.5} />
              Open in Mail App
            </a>
          </div>
        )}

        {isAssistant && message.error && message.error !== 'final_failure' && (
          <div style={{ marginTop: 'var(--spacing-3)' }}>
            <button
              onClick={() => retryMessage(message.id)}
              className="btn btn-ghost flex items-center gap-2 w-fit"
              style={{
                padding: 'var(--spacing-2) var(--spacing-4)',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.75rem',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary)',
              }}
            >
              Retry Response
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
