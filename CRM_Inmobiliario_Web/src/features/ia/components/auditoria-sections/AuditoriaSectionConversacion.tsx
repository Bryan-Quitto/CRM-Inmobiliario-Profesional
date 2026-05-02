import { MessageSquare, Loader2, CheckCheck } from 'lucide-react';
import { useConversacionIA } from '../../hooks/useConversacionIA';
import { fullDateFormatter, timeFormatter } from '../../constants/auditoriaConstants';

interface SectionConversacionProps {
  telefono: string;
  isActive: boolean;
}

const formatWhatsAppText = (text: string) => {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={i} className="font-black">{part.slice(1, -1)}</strong>;
    }
    return part;
  });
};

export const AuditoriaSectionConversacion = ({ telefono, isActive }: SectionConversacionProps) => {
  const { mensajes, totalMensajes, loadingChat, loadingMore, scrollRef, loadMore } = useConversacionIA(telefono, isActive);

  return (
    <div className="relative bg-[#e5ddd5] rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl h-[600px] flex flex-col">
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
        {mensajes.length < totalMensajes && (
          <div className="flex justify-center pb-4">
            <button 
              onClick={loadMore} 
              disabled={loadingMore} 
              className="bg-white/80 hover:bg-white text-slate-600 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all border border-slate-200/50 disabled:opacity-50 cursor-pointer"
            >
              {loadingMore ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Cargando...
                </div>
              ) : 'Cargar mensajes anteriores'}
            </button>
          </div>
        )}
        {loadingChat ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center shadow-xl animate-bounce">
              <MessageSquare className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="font-black uppercase text-[10px] tracking-widest animate-pulse">Sincronizando Chat...</p>
          </div>
        ) : mensajes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="h-16 w-16 bg-white/50 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-300">
              <MessageSquare className="h-8 w-8 text-slate-300" />
            </div>
            <p className="font-black uppercase text-[10px] tracking-widest">No hay historial de chat</p>
          </div>
        ) : (
          (() => {
            let lastDate = '';
            return mensajes.map((msg, idx) => {
              const msgDate = new Date(msg.fecha).toDateString();
              const showDivider = msgDate !== lastDate;
              lastDate = msgDate;
              return (
                <div key={idx} className="space-y-4">
                  {showDivider && (
                    <div className="flex justify-center my-6">
                      <span className="bg-white/90 px-4 py-1.5 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest shadow-sm border border-slate-100">
                        {fullDateFormatter.format(new Date(msg.fecha))}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${msg.rol === 'ia' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`relative max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm ${msg.rol === 'ia' ? 'bg-[#dcf8c6] text-slate-800 rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                      <div className={`absolute top-0 w-3 h-3 ${msg.rol === 'ia' ? '-right-2 bg-[#dcf8c6] [clip-path:polygon(0_0,0_100%,100%_0)]' : '-left-2 bg-white [clip-path:polygon(100%_0,100%_100%,0_0)]'}`}></div>
                      <p className="text-[13px] contactoing-relaxed whitespace-pre-wrap">{formatWhatsAppText(msg.contenido)}</p>
                      <div className="flex items-center justify-end gap-1.5 mt-1 opacity-50">
                        <span className="text-[9px] font-bold uppercase">{timeFormatter.format(new Date(msg.fecha))}</span>
                        {msg.rol === 'ia' && <CheckCheck size={12} className="text-blue-500" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>
      <div className="bg-[#f0f2f5] p-4 flex items-center gap-4">
        <div className="flex-1 bg-white h-12 rounded-2xl px-6 flex items-center text-slate-400 text-sm font-medium">
          Solo lectura (Modo Auditoría)
        </div>
      </div>
    </div>
  );
};
