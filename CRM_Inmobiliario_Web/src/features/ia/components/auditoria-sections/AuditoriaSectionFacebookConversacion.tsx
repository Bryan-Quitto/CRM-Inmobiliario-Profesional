import { Loader2, MessageCircle, SendHorizonal } from 'lucide-react';
import { useConversacionIAFacebook } from '../../hooks/useConversacionIAFacebook';
import { fullDateFormatter, timeFormatter } from '../../constants/auditoriaConstants';
import ReactMarkdown from 'react-markdown';

interface SectionConversacionProps {
  psid: string;
  isActive: boolean;
}

export const AuditoriaSectionFacebookConversacion = ({ psid, isActive }: SectionConversacionProps) => {
  const { mensajes, totalMensajes, loadingChat, loadingMore, scrollRef, loadMore } = useConversacionIAFacebook(psid, isActive);

  return (
    <div className="relative bg-white rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl h-[600px] flex flex-col font-sans">
      
      {/* Header Messenger */}
      <div className="flex items-center justify-between px-5 py-3 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 bg-[#F0F2F5] rounded-full flex items-center justify-center overflow-hidden">
              <MessageCircle className="h-6 w-6 text-[#0084FF]" />
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-[#31A24C] border-2 border-white rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <h3 className="text-[15px] font-bold text-[#050505] leading-tight">Cliente (Messenger)</h3>
            <span className="text-[12px] text-[#65676B] font-medium">Activo(a) ahora</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[#0084FF]">
          {/* Botones de acción removidos por modo auditoría */}
        </div>
      </div>

      {/* Area de Mensajes */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto p-4 space-y-1 scroll-smooth bg-white">
        {mensajes.length < totalMensajes && (
          <div className="flex justify-center pb-4 pt-2">
            <button 
              onClick={loadMore} 
              disabled={loadingMore} 
              className="text-[#0084FF] hover:bg-[#F0F2F5] px-4 py-2 rounded-full text-[13px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loadingMore ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando...
                </div>
              ) : 'Cargar mensajes anteriores'}
            </button>
          </div>
        )}
        
        {loadingChat ? (
          <div className="h-full flex flex-col items-center justify-center text-[#65676B] gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#0084FF]" />
            <p className="font-medium text-[14px]">Cargando conversación...</p>
          </div>
        ) : mensajes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#65676B] gap-4">
            <div className="h-16 w-16 bg-[#F0F2F5] rounded-full flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-[#BCC0C4]" />
            </div>
            <p className="font-medium text-[14px]">No hay mensajes aún</p>
            <p className="text-[12px] text-[#8C939D]">Inicia una conversación</p>
          </div>
        ) : (
          (() => {
            let lastDate = '';
            return mensajes.map((msg, idx) => {
              const msgDate = new Date(msg.fecha).toDateString();
              const showDivider = msgDate !== lastDate;
              lastDate = msgDate;
              
              const isIA = msg.rol === 'ia';
              const prevMsg = mensajes[idx - 1];
              const nextMsg = mensajes[idx + 1];

              const isFirstInGroup = !prevMsg || prevMsg.rol !== msg.rol || new Date(prevMsg.fecha).toDateString() !== msgDate;
              const isLastInGroup = !nextMsg || nextMsg.rol !== msg.rol || new Date(nextMsg.fecha).toDateString() !== msgDate;

              let bubbleClasses = 'rounded-[20px]';
              if (isIA) {
                if (isFirstInGroup && isLastInGroup) bubbleClasses = 'rounded-[20px]';
                else if (isFirstInGroup) bubbleClasses = 'rounded-[20px] rounded-br-[4px]';
                else if (isLastInGroup) bubbleClasses = 'rounded-[20px] rounded-tr-[4px]';
                else bubbleClasses = 'rounded-[20px] rounded-r-[4px]';
              } else {
                if (isFirstInGroup && isLastInGroup) bubbleClasses = 'rounded-[20px]';
                else if (isFirstInGroup) bubbleClasses = 'rounded-[20px] rounded-bl-[4px]';
                else if (isLastInGroup) bubbleClasses = 'rounded-[20px] rounded-tl-[4px]';
                else bubbleClasses = 'rounded-[20px] rounded-l-[4px]';
              }

              return (
                <div key={idx} className="flex flex-col">
                  {showDivider && (
                    <div className="flex justify-center my-5">
                      <span className="text-[12px] font-semibold text-[#8C939D]">
                        {fullDateFormatter.format(new Date(msg.fecha))}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isIA ? 'justify-end' : 'justify-start'} mb-[2px]`}>
                    {!isIA && (
                       <div className="w-7 h-7 rounded-full bg-[#E4E6EB] overflow-hidden mr-2 flex-shrink-0 self-end mb-[2px]">
                          {isLastInGroup ? (
                            <svg className="w-full h-full text-[#BCC0C4] mt-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          ) : <div className="w-7 h-7"></div>}
                       </div>
                    )}
                    <div className="group relative flex flex-col max-w-[70%]">
                       <div 
                         className={`px-[14px] py-[8px] ${
                           isIA 
                             ? 'bg-gradient-to-br from-[#00B2FF] to-[#006AFF] text-white' 
                             : 'bg-[#E4E6EB] text-[#050505]'
                          } ${bubbleClasses} shadow-none`}
                       >
                         <div className="text-[15px] leading-[1.3] whitespace-pre-wrap break-words prose prose-sm prose-p:my-0 prose-p:leading-tight">
                           <ReactMarkdown>
                             {msg.contenido}
                           </ReactMarkdown>
                         </div>
                       </div>
                    </div>
                  </div>
                  {isLastInGroup && (
                    <div className={`flex items-center gap-2 mt-1 mb-3 ${isIA ? 'justify-end mr-1' : 'ml-10'}`}>
                      {isIA && msg.origenMensaje && (
                        <div className="text-[10px] font-bold text-[#65676B] bg-[#F0F2F5] px-2 py-0.5 rounded-md">
                          {msg.origenMensaje === 'IA' ? '🤖 IA' : '👤 Agente'}
                        </div>
                      )}
                      <div className="text-[11px] font-medium text-[#8C939D]">
                        {timeFormatter.format(new Date(msg.fecha))}
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()
        )}
      </div>

      {/* Footer Messenger */}
      <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center gap-3 z-10">
        {/* Botones de adjuntos removidos por modo auditoría */}
        <div className="flex-1 bg-[#F0F2F5] h-[36px] rounded-full px-4 flex items-center text-[#65676B] text-[15px]">
          Modo auditoría...
        </div>
        <SendHorizonal className="h-6 w-6 text-[#BCC0C4] cursor-not-allowed" />
      </div>

    </div>
  );
};
