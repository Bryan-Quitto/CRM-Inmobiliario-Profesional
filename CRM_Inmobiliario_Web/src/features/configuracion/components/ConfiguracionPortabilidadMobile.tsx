import React from 'react';
import type { UseConfiguracionPortabilidadLogicReturn } from '../hooks/useConfiguracionPortabilidadLogic';
import { Download, Users, Home, AlertTriangle } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';


interface Props {
  logic: UseConfiguracionPortabilidadLogicReturn;
}

const ConfiguracionPortabilidadMobile: React.FC<Props> = ({ logic }) => {
  const { isExportingContactos, isExportingPropiedades, exportModalEntity, requestExport, confirmExport, cancelExport } = logic;

  return (
    <div className="space-y-6 pb-20">
      <div className="px-4 mt-4">
        <h2 className="text-2xl font-black text-slate-900 italic tracking-tight">Portabilidad</h2>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
          Exporta todos tus registros en formato Excel (.xlsx).
        </p>
      </div>

      <div className="bg-white border-y border-slate-200 divide-y divide-slate-100">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Contactos</h3>
              <p className="text-sm text-slate-500">Descarga clientes y propietarios.</p>
            </div>
          </div>
          <button
            onClick={() => requestExport('contactos')}
            disabled={isExportingContactos}
            className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium cursor-pointer hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isExportingContactos ? 'Generando...' : 'Exportar Contactos'}
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Propiedades</h3>
              <p className="text-sm text-slate-500">Descarga todo el inventario.</p>
            </div>
          </div>
          <button
            onClick={() => requestExport('propiedades')}
            disabled={isExportingPropiedades}
            className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium cursor-pointer hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isExportingPropiedades ? 'Generando...' : 'Exportar Propiedades'}
          </button>
        </div>
      </div>

      <div className="px-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-600">
            <strong>Aviso Legal:</strong> Al exportar estos datos, asumes la responsabilidad total de su custodia y tratamiento bajo la ley aplicable.
          </p>
        </div>
      </div>

      <ConfirmModal
        isOpen={exportModalEntity !== null}
        onClose={cancelExport}
        onConfirm={confirmExport}
        title="Responsabilidad de Exportación"
        description="Al descargar esta base de datos, confirmas que actúas como el titular legítimo de esta información o que cuentas con la autorización expresa de tu Agencia/Franquicia."
        confirmText="Confirmo y Exportar"
        cancelText="Cancelar"
        type="warning"
        icon={<AlertTriangle className="h-10 w-10 text-amber-500" />}
      >
        <p className="text-xs text-amber-800 bg-amber-50 p-4 rounded-xl font-medium mt-2 border border-amber-200/50">
          Ziel Luxora CRM no interviene en los acuerdos entre los agentes y sus respectivas agencias. El uso indebido de esta información es de tu exclusiva responsabilidad.
        </p>
      </ConfirmModal>
    </div>
  );
};

export default ConfiguracionPortabilidadMobile;
