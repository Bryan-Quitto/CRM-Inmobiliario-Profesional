import { Phone, Mail, Tag } from 'lucide-react';
import type { Cliente } from '../../types';

interface ClienteProfileCardProps {
  cliente: Cliente;
}

export const ClienteProfileCard = ({ cliente }: ClienteProfileCardProps) => {
  return (
    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="h-24 w-24 bg-slate-900 text-white rounded-[32px] flex items-center justify-center text-3xl font-black shadow-2xl mb-4 rotate-3">
          {cliente.nombre[0]}{cliente.apellido?.[0] || ''}
        </div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{[cliente.nombre, cliente.apellido].filter(Boolean).join(' ')}</h2>
        <p className="text-sm font-bold text-slate-400 mt-1 italic">Prospecto desde {new Date(cliente.fechaCreacion!).toLocaleDateString()}</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
            <Phone className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p>
            <p className="text-sm font-bold text-slate-900 truncate">{cliente.telefono}</p>
          </div>
        </div>

        {cliente.email && (
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
              <Mail className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
              <p className="text-sm font-bold text-slate-900 truncate">{cliente.email}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
            <Tag className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origen</p>
            <p className="text-sm font-bold text-slate-900 truncate">{cliente.origen}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
