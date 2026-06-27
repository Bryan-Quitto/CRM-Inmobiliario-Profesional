import React from 'react';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import type { ChatMessage } from '../store/useCopilotStore';
import { PropertyCardPreview } from './PropertyCardPreview';
import { ContactCardPreview } from './ContactCardPreview';

interface ChatMessageItemProps {
  msg: ChatMessage;
  isHighlighted?: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ msg, isHighlighted }) => {
  const navigate = useNavigate();
  return (
    <div id={`msg-${msg.id}`} className={`flex gap-3 w-full ${msg.role === 'user' ? 'flex-row-reverse' : ''} ${isHighlighted ? 'ring-2 ring-orange-500 ring-offset-2 rounded-2xl transition-all' : ''}`}>
      <div
        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'
        }`}
      >
        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={`px-4 py-3 rounded-2xl max-w-[85%] min-w-0 break-words ${
          msg.role === 'user'
            ? 'bg-indigo-600 text-white rounded-tr-none'
            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
        }`}
      >
        <div className={`text-sm max-w-none break-words min-w-0 w-full ${msg.role === 'user' ? 'text-white' : 'text-slate-700'}`}>
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
                const cleanHref = href?.trim() ?? '';
                if (cleanHref.startsWith('/propiedades/') && text.includes('Ver Ficha Completa:')) {
                  const id = cleanHref.replace('/propiedades/', '');

                  const titleMatch = text.match(/Ver Ficha Completa:\s*(.*)/);
                  const title = titleMatch ? titleMatch[1] : 'Propiedad';
                  return <PropertyCardPreview id={id} title={title} />;
                }
                if (cleanHref.startsWith('/contactos/') && text.includes('Ver Perfil:')) {
                  const id = cleanHref.replace('/contactos/', '');
                  const nameMatch = text.match(/Ver Perfil:\s*(.*)/);
                  const name = nameMatch ? nameMatch[1] : 'Contacto';
                  return <ContactCardPreview id={id} name={name} />;
                }
                // Links internos del SPA: navegan sin recarga ni tokens extra.
                if (cleanHref.startsWith('/')) {
                  return (
                    <a
                      href={cleanHref}
                      className="text-indigo-600 hover:underline hover:text-indigo-700 cursor-pointer font-medium break-all"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(cleanHref);
                      }}
                      {...props}
                    >
                      {children}
                    </a>
                  );
                }
                return (
                  <a href={href} className="text-indigo-600 hover:underline hover:text-indigo-700 cursor-pointer break-all" target="_blank" rel="noopener noreferrer" {...props}>
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
