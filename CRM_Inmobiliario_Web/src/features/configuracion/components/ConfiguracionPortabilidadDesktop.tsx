import React from 'react';
import type { UseConfiguracionPortabilidadLogicReturn } from '../hooks/useConfiguracionPortabilidadLogic';
import { Download, Users, Home, AlertTriangle } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';


interface Props {
  logic: UseConfiguracionPortabilidadLogicReturn;
}

const ConfiguracionPortabilidadDesktop: React.FC<Props> = ({ logic }) => {
  const { isExportingContactos, isExportingPropiedades, exportModalEntity, requestExport, confirmExport, cancelExport } = logic;

  return (
    <div className="space-y-6 max-w-4xl px-6 pb-20">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Portabilidad de Datos</h2>
        <p className="text-sm text-slate-500 mt-1">
          Exporta todos tus registros en formato Excel (.xlsx).
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Contactos</h3>
              <p className="text-sm text-slate-500">Descarga todos tus clientes, prospectos y propietarios.</p>
            </div>
          </div>
          <button
            onClick={() => requestExport('contactos')}
            disabled={isExportingContactos}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium cursor-pointer hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isExportingContactos ? 'Generando...' : 'Exportar Contactos'}
          </button>
        </div>

        <div className="h-px bg-slate-100" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Propiedades</h3>
              <p className="text-sm text-slate-500">Descarga todo el inventario que has captado o tienes asignado.</p>
            </div>
          </div>
          <button
            onClick={() => requestExport('propiedades')}
            disabled={isExportingPropiedades}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium cursor-pointer hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isExportingPropiedades ? 'Generando...' : 'Exportar Propiedades'}
          </button>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <p className="text-sm text-slate-600">
          <strong>Aviso Legal:</strong> Al exportar estos datos, asumes la responsabilidad total de su custodia y tratamiento bajo la ley de protección de datos aplicable. Ziel Luxora CRM no se hace responsable por la filtración de la información una vez descargada del sistema.
        </p>
      </div>

      <ConfirmModal
        isOpen={exportModalEntity !== null}
        onClose={cancelExport}
        onConfirm={confirmExport}
        title="Aviso de Responsabilidad de Exportación"
        description="Al descargar esta base de datos, confirmas que actúas como el titular legítimo de esta información o que cuentas con la autorización expresa de tu Agencia/Franquicia para extraer estos registros de la plataforma."
        confirmText="Confirmo y Exportar"
        cancelText="Cancelar"
        type="warning"
        icon={<AlertTriangle className="h-10 w-10 text-amber-500" />}
      >
        <p className="text-sm text-amber-800 bg-amber-50 p-4 rounded-xl font-medium mt-2 border border-amber-200/50">
          Ziel Luxora CRM no interviene en los acuerdos de confidencialidad o propiedad de datos entre los agentes y sus respectivas agencias. El uso indebido de esta información exportada es de tu exclusiva responsabilidad legal.
        </p>
      </ConfirmModal>
    </div>
  );
};

export default ConfiguracionPortabilidadDesktop;

