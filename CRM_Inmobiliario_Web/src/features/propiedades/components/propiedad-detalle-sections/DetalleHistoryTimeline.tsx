import { useState, useEffect } from 'react';
import { History, TrendingUp, RotateCcw, X, MoreVertical, Trash2, Loader2, Check } from 'lucide-react';
import type { PropertyTransactionResponse } from '../../api/getHistorialPropiedad';

interface DetalleHistoryTimelineProps {
  historial?: PropertyTransactionResponse[];
  transactionMenuOpen: string | null;
  setTransactionMenuOpen: (id: string | null) => void;
  handleDeleteTransaction: (id: string) => Promise<void>;
  handleInlineUpdateNote: (transaction: PropertyTransactionResponse, notes: string) => Promise<void>;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
}

export const DetalleHistoryTimeline = ({
  historial,
  transactionMenuOpen,
  setTransactionMenuOpen,
  handleDeleteTransaction,
  handleInlineUpdateNote,
  formatDate,
  formatCurrency
}: DetalleHistoryTimelineProps) => {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-2">
        <div className="h-8 w-1 bg-slate-900 rounded-full"></div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Historial Inmobiliario</h3>
      </div>

      {!historial || historial.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
          <History className="h-12 w-12 text-slate-300 mx-auto mb-4 opacity-50" />
          <p className="text-xs font-bold text-slate-400 italic">No hay registros históricos para esta propiedad.</p>
        </div>
      ) : (
        <div className="relative space-y-8 before:absolute before:left-6 before:top-4 before:bottom-0 before:w-0.5 before:bg-slate-100 before:content-['']">
          {historial.map((item) => (
            <div key={item.id} className="relative pl-14 group">
              <div className={`absolute left-3 top-0 h-7 w-7 bg-white border-2 rounded-full z-10 flex items-center justify-center shadow-sm transition-colors
                ${item.transactionType === 'Sale' || item.transactionType === 'Rent' ? 'border-emerald-500 text-emerald-600' :
                  item.transactionType === 'Relisting' ? 'border-indigo-500 text-indigo-600' : 'border-rose-500 text-rose-600'}`}>
                {item.transactionType === 'Sale' || item.transactionType === 'Rent' ? <TrendingUp size={14} /> :
                  item.transactionType === 'Relisting' ? <RotateCcw size={14} /> : <X size={14} />}
              </div>

              <div className="bg-white border border-slate-100 p-6 rounded-3xl hover:border-slate-200 hover:shadow-xl transition-all duration-500">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md
                      ${item.transactionType === 'Sale' || item.transactionType === 'Rent' ? 'bg-emerald-50 text-emerald-600' :
                        item.transactionType === 'Relisting' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                      {item.transactionType === 'Sale' ? 'Venta' :
                        item.transactionType === 'Rent' ? 'Alquiler' :
                          item.transactionType === 'Relisting' ? 'Re-Listado' : 'Cancelación'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{formatDate(item.transactionDate)}</span>
                  </div>
                  {item.amount && (
                    <span className="text-sm font-black text-slate-900">{formatCurrency(item.amount)}</span>
                  )}

                  <div className="relative">
                    <button
                      onClick={() => {
                        setTransactionMenuOpen(transactionMenuOpen === item.id ? null : item.id);
                      }}
                      className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {transactionMenuOpen === item.id && (
                      <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-100 rounded-xl shadow-2xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                        <button 
                          onClick={() => handleDeleteTransaction(item.id)}
                          className="w-full px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <InlineNoteEditor 
                  transaction={item} 
                  onSave={(notes) => handleInlineUpdateNote(item, notes)} 
                />

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-tighter shadow-inner">
                      {item.agenteNombre[0]}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agente: {item.agenteNombre}</span>
                  </div>
                  {item.leadId && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Titular:</span>
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{item.leadNombre}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const InlineNoteEditor = ({ transaction, onSave }: { transaction: PropertyTransactionResponse, onSave: (notes: string) => Promise<void> }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(transaction.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNotes(transaction.notes || '');
  }, [transaction.notes]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(notes);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(transaction.notes || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="mb-4 relative">
        <textarea
          autoFocus
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none min-h-[80px]"
          placeholder="Escribe la nota y presiona Enter para guardar..."
        />
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button onClick={handleSave} disabled={isSaving} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer" title="Guardar (Enter)">{isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}</button>
          <button onClick={handleCancel} disabled={isSaving} className="p-1.5 bg-white border border-slate-200 text-slate-400 rounded-lg hover:bg-slate-50 transition-colors shadow-sm cursor-pointer" title="Cancelar (Esc)"><X size={14} /></button>
        </div>
      </div>
    );
  }

  return (
    <p onDoubleClick={() => setIsEditing(true)} className={`text-sm font-medium leading-relaxed mb-4 italic cursor-text hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors border border-transparent hover:border-slate-100 ${transaction.notes ? 'text-slate-600' : 'text-slate-300'}`} title="Doble clic para editar nota">
      {transaction.notes ? `"${transaction.notes}"` : 'Doble clic para añadir nota...'}
    </p>
  );
};
