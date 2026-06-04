import { useTokenUsage } from '../api/finops';

export const TokenUsageTable = () => {
  const { data, isLoading, error } = useTokenUsage();

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

  return (
    <div className="w-full mt-8">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Consumo de Tokens IA</h3>
      <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-4 font-medium tracking-wider">Modelo</th>
                <th scope="col" className="px-6 py-4 font-medium tracking-wider text-right">Tokens Input</th>
                <th scope="col" className="px-6 py-4 font-medium tracking-wider text-right">Tokens Output</th>
                <th scope="col" className="px-6 py-4 font-medium tracking-wider text-right">Costo Total ($ USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {data.map((row, index) => (
                <tr 
                  key={index} 
                  className="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-200">
                    {row.fecha}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {row.modelo}
                    </span>
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
