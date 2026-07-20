import React, { useState } from 'react';
import { Database, UploadCloud, Eye, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PerfilAgente } from '../../api/perfil';
import { HelpButton } from '@/components/ui/HelpButton';
import StorageHistoryModal from './StorageHistoryModal';

interface CuotaSectionProps {
  perfil: PerfilAgente;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const CuotaSection: React.FC<CuotaSectionProps> = ({ perfil }) => {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const opsUsed = perfil.currentMonthUploadOpsUsed || 0;
  const opsLimit = perfil.monthlyUploadOpsLimit || 0;
  const opsPercentage = opsLimit > 0 ? Math.min((opsUsed / opsLimit) * 100, 100) : 0;
  
  const storageUsed = perfil.currentMonthStorageBytesUsed || 0;
  const storageLimit = perfil.monthlyStorageBytesLimit || 0;
  const storagePercentage = storageLimit > 0 ? Math.min((storageUsed / storageLimit) * 100, 100) : 0;

  const globalStorageUsed = perfil.globalStorageBytesUsed || 0;
  const globalStorageLimit = perfil.globalStorageBytesLimit || 0;
  const globalStoragePercentage = globalStorageLimit > 0 ? Math.min((globalStorageUsed / globalStorageLimit) * 100, 100) : 0;

  return (
    <>
      <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Database size={16} className="shrink-0" /> Uso de Plataforma
          </h3>
          <HelpButton 
            title="Uso de Plataforma"
            path="/docs/manuales/manual_uso_plataforma.md"
          />
        </div>

        <div className="space-y-6">
          {/* Operaciones */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <UploadCloud size={14} className="text-indigo-500" /> Operaciones
              </div>
              <div className="text-xs font-bold text-slate-500">
                {opsUsed.toLocaleString()} / {opsLimit.toLocaleString()}
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${opsPercentage > 90 ? 'bg-rose-500' : opsPercentage > 75 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                style={{ width: `${opsPercentage}%` }}
              />
            </div>
          </div>

          {/* Almacenamiento Global */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <Database size={14} className="text-indigo-500" /> Almacenamiento Global
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs font-bold text-slate-500">
                  {formatBytes(globalStorageUsed)} / {formatBytes(globalStorageLimit)}
                </div>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${globalStoragePercentage > 90 ? 'bg-rose-500' : globalStoragePercentage > 75 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                style={{ width: `${globalStoragePercentage}%` }}
              />
            </div>
            <div className="flex justify-end">
              <Link 
                to="/configuracion/historial-almacenamiento"
                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
              >
                Administrar Historial <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Almacenamiento Mensual */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm text-slate-500">
                <Database size={14} className="text-slate-400" /> Almacenamiento Mensual
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs font-bold text-slate-400">
                  {formatBytes(storageUsed)} / {formatBytes(storageLimit)}
                </div>
                <button 
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                  title="Ver historial de almacenamiento mensual"
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 opacity-60 ${storagePercentage > 90 ? 'bg-rose-500' : storagePercentage > 75 ? 'bg-amber-500' : 'bg-slate-400'}`}
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
          </div>
          
          <div className="text-[10px] text-center text-slate-400 font-medium pt-2">
            Se reinicia en {perfil.daysUntilStorageReset} días
          </div>
        </div>
      </div>

      <StorageHistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        startDate={perfil.currentCycleStartDate}
        endDate={perfil.currentCycleEndDate}
      />
    </>
  );
};

export default CuotaSection;
