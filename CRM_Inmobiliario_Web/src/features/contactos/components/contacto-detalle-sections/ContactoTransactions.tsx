import { Award, ExternalLink, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../constants/contactos';
import type { Contacto, Interes } from '../../types';

interface ContactoTransactionsProps {
  contacto: Contacto;
}

export const ContactoTransactions = ({ contacto }: ContactoTransactionsProps) => {
  const transacciones = (contacto.intereses || []).filter((interes: Interes) => 
    ['Reservada', 'Vendida', 'Alquilada'].includes(interes.estadoComercial)
  );

  if (transacciones.length === 0) {
    return (
      <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 border border-slate-100 shadow-sm text-center space-y-4">
        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
          <Award className="h-8 w-8 text-slate-300" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Sin éxitos comerciales</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Este contacto aún no tiene transacciones completadas o en reserva.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Transacciones</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Éxitos comerciales</p>
        </div>
        <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Award className="h-5 w-5 text-emerald-600" />
        </div>
      </div>

      <div className="space-y-4">
        {transacciones.map((transaccion) => (
          <div key={transaccion.propiedadId} className="group relative bg-white border border-slate-100 p-4 rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="h-12 w-12 bg-emerald-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-emerald-100/60">
                {transaccion.imagenPortadaUrl ? (
                  <img src={transaccion.imagenPortadaUrl} alt={transaccion.titulo} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="h-5 w-5 text-emerald-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-900 uppercase truncate tracking-tight group-hover:text-emerald-600 transition-colors">
                  {transaccion.titulo}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {formatCurrency(transaccion.precio || 0)}
                </p>
                
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                    transaccion.estadoComercial === 'Reservada' 
                      ? 'bg-amber-50 text-amber-600 border-amber-100' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {transaccion.estadoComercial}
                  </span>
                </div>
              </div>
            </div>
            
            <Link 
              to={`/propiedades?id=${transaccion.propiedadId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
