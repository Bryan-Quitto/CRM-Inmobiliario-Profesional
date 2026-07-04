import { useState } from 'react';
import { useTokenUsage } from '../api/finops';

interface Props {
  channel?: string;
}

export const TokenUsageTable = ({ channel = 'Copilot' }: Props) => {
  const { data, isLoading, error } = useTokenUsage(channel);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  if (isLoading) {
    return (
      <div className="w-full mt-8 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="h-12 bg-slate-100 border-b border-slate-200"></div>
          <div className="h-16 border-b border-slate-200"></div>
          <div className="h-16 border-b border-slate-200"></div>
          <div className="h-16"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mt-8 p-4 border border-red-200 rounded-lg text-red-600">
        No se pudo cargar la información de consumo de tokens.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full mt-8 p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
        No hay datos de consumo disponibles.
      </div>
    );
  }

  const filteredData = data.filter(row => {
    if (fechaDesde && row.fecha < fechaDesde) return false;
    if (fechaHasta && row.fecha > fechaHasta) return false;
    return true;
  });

  const totalInputTokens = filteredData.reduce((acc, row) => acc + row.tokensInput, 0);
  const totalOutputTokens = filteredData.reduce((acc, row) => acc + row.tokensOutput, 0);
  const grandTotalCost = filteredData.reduce((acc, row) => acc + row.costoTotalUsd, 0);

  const maxDate = new Date();
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 90);
  
  const maxDateStr = maxDate.toISOString().split('T')[0];
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative group">
          <label className="text-xs font-bold text-slate-500 block mb-1">Desde</label>
          <input
            type="date"
            value={fechaDesde}
            min={minDateStr}
            max={maxDateStr}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex-1 relative group">
          <label className="text-xs font-bold text-slate-500 block mb-1">Hasta</label>
          <input
            type="date"
            value={fechaHasta}
            min={minDateStr}
            max={maxDateStr}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max bg-slate-800 text-white text-[10px] font-bold tracking-wider uppercase rounded py-1 px-2 shadow-lg z-10">
            Máx. últimos 90 días
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tokens de Entrada</span>
          <span className="text-2xl font-black text-slate-900 font-mono">{totalInputTokens.toLocaleString('es-EC')}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tokens de Salida</span>
          <span className="text-2xl font-black text-slate-900 font-mono">{totalOutputTokens.toLocaleString('es-EC')}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Costo Total Estimado</span>
          <span className="text-2xl font-black text-emerald-600 font-mono">${grandTotalCost.toFixed(6)}</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3">Fecha</th>
              <th scope="col" className="px-4 py-3 text-right">Tokens de Entrada</th>
              <th scope="col" className="px-4 py-3 text-right">Tokens de Salida</th>
              <th scope="col" className="px-4 py-3 text-right">Costo Total ($ USD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((row, index) => (
              <tr 
                key={index} 
                className="hover:bg-slate-50 transition-colors duration-200"
              >
                <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                  {row.fecha}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right font-mono">
                  {row.tokensInput.toLocaleString('es-EC')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right font-mono">
                  {row.tokensOutput.toLocaleString('es-EC')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-emerald-600 font-mono">
                  ${row.costoTotalUsd.toFixed(6)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
