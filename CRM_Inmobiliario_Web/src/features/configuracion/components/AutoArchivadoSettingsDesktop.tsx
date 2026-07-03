import React from 'react';
import { HelpButton } from '../../../components/ui/HelpButton';
import { Save, Loader2, Archive } from 'lucide-react';
import { TimeDurationDaysInput } from './TimeDurationDaysInput';
import type { AutoArchivadoSettingsLogic } from '../hooks/useAutoArchivadoSettingsLogic';
import { AutoArchivadoCandidatesList } from './AutoArchivadoCandidatesList';

interface Props {
  logic: AutoArchivadoSettingsLogic;
}

export const AutoArchivadoSettingsDesktop: React.FC<Props> = ({ logic }) => {
  const {
    settings,
    isLoading,
    isSaving,
    isInvalidContactos,
    isInvalidPropiedades,
    isFormValid,
    handleChange,
    handleSubmit
  } = logic;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48 max-w-3xl mx-auto">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Auto-Archivado
                <div className="pt-0.5"><HelpButton title="Auto-Archivado" path="/docs/manuales/manual_autoarchivado.md" /></div>
              </h2>
              <p className="text-slate-500 text-sm mt-1">Configura el archivado automático de registros inactivos.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Contactos Inactivos</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={settings.autoArchivarContactos} onChange={(e) => handleChange('autoArchivarContactos', e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                {settings.autoArchivarContactos && (
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-500 mb-2">Límite de Inactividad</label>
                    <TimeDurationDaysInput
                      value={settings.diasInactividadContactos}
                      onChange={(val) => handleChange('diasInactividadContactos', val)}
                      error={isInvalidContactos ? "Rango permitido: 100 a 1095 días (aprox 3 años)." : undefined}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Propiedades Inactivas</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={settings.autoArchivarPropiedades} onChange={(e) => handleChange('autoArchivarPropiedades', e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                {settings.autoArchivarPropiedades && (
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-500 mb-2">Límite de Inactividad</label>
                    <TimeDurationDaysInput
                      value={settings.diasInactividadPropiedades}
                      onChange={(val) => handleChange('diasInactividadPropiedades', val)}
                      error={isInvalidPropiedades ? "Rango permitido: 100 a 1095 días (aprox 3 años)." : undefined}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving || !isFormValid}
                className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>

          <AutoArchivadoCandidatesList
            type="contactos"
            candidates={logic.candidatesData?.contactos || []}
            isLoading={logic.isLoadingCandidates}
            sortBy={logic.candidatesSortBy}
            setSortBy={logic.setCandidatesSortBy}
            isEnabled={settings.autoArchivarContactos}
          />
          <AutoArchivadoCandidatesList
            type="propiedades"
            candidates={logic.candidatesData?.propiedades || []}
            isLoading={logic.isLoadingCandidates}
            sortBy={logic.candidatesSortBy}
            setSortBy={logic.setCandidatesSortBy}
            isEnabled={settings.autoArchivarPropiedades}
          />
        </div>
      </div>
    </div>
  );
};
