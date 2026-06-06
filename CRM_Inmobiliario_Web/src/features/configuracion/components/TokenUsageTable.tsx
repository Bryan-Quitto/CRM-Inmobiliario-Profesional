import { useState } from 'react';
import { useTokenUsage } from '../api/finops';

export const TokenUsageTable = () => {
  const { data, isLoading, error } = useTokenUsage();
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  if (isLoading) {
    return (
      <div className="w-full mt-8 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="h-12 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800"></div>
          <div className="h-16 border-b border-gray-200 dark:border-gray-800"></div>
          <div className="h-16 border-b border-gray-200 dark:border-gray-800"></div>
          <div className="h-16"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mt-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
        No se pudo cargar la información de consumo de tokens.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full mt-8 p-8 text-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 dark:text-gray-400">
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

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-500 block mb-1">Desde</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-500 block mb-1">Hasta</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tokens Input</span>
          <span className="text-2xl font-black text-slate-900 font-mono">{totalInputTokens.toLocaleString('es-EC')}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tokens Output</span>
          <span className="text-2xl font-black text-slate-900 font-mono">{totalOutputTokens.toLocaleString('es-EC')}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Costo Total Estimado</span>
          <span className="text-2xl font-black text-emerald-600 font-mono">${grandTotalCost.toFixed(6)}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-4 font-medium tracking-wider text-right">Tokens Input</th>
                <th scope="col" className="px-6 py-4 font-medium tracking-wider text-right">Tokens Output</th>
                <th scope="col" className="px-6 py-4 font-medium tracking-wider text-right">Costo Total ($ USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredData.map((row, index) => (
                <tr 
                  key={index} 
                  className="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-200">
                    {row.fecha}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-mono">
                    {row.tokensInput.toLocaleString('es-EC')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-mono">
                    {row.tokensOutput.toLocaleString('es-EC')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                    ${row.costoTotalUsd.toFixed(6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
