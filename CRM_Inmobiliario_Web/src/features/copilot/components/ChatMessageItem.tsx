import React from 'react';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../store/useCopilotStore';
import { PropertyCardPreview } from './PropertyCardPreview';

interface ChatMessageItemProps {
  msg: ChatMessage;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ msg }) => {
  return (
    <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'
        }`}
      >
        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={`px-4 py-3 rounded-2xl max-w-[85%] ${
          msg.role === 'user'
            ? 'bg-indigo-600 text-white rounded-tr-none'
            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
        }`}
      >
        <div className={`text-sm max-w-none ${msg.role === 'user' ? 'text-white' : 'text-slate-700'}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              a: ({ href, children, ...props }) => {
                const text = String(children);
                if (href?.startsWith('/propiedades/') && text.includes('Ver Ficha Completa:')) {
                  const id = href.replace('/propiedades/', '');
                  const titleMatch = text.match(/Ver Ficha Completa:\s*(.*)/);
                  const title = titleMatch ? titleMatch[1] : 'Propiedad';
                  return <PropertyCardPreview id={id} title={title} />;
                }
                return (
                  <a href={href} className="text-indigo-600 hover:underline hover:text-indigo-700 cursor-pointer" target="_blank" rel="noopener noreferrer" {...props}>
                    {children}
                  </a>
                );
              }
            }}
          >
            {msg.content}
          </ReactMarkdown>
        </div>
        <span
          className={`text-[10px] mt-1.5 block ${
            msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
          }`}
        >
          {new Date(msg.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
};
