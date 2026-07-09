import React from 'react';
import { HelpButton } from '../../../components/ui/HelpButton';
import { Save, Loader2, Archive } from 'lucide-react';
import { TimeDurationDaysInput } from './TimeDurationDaysInput';
import type { AutoArchivadoSettingsLogic } from '../hooks/useAutoArchivadoSettingsLogic';
import { AutoArchivadoCandidatesList } from './AutoArchivadoCandidatesList';
import { TruncatedText } from '@/components/ui/TruncatedText';

interface Props {
  logic: AutoArchivadoSettingsLogic;
}

export const AutoArchivadoSettingsMobile: React.FC<Props> = ({ logic }) => {
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
      <div className="flex justify-center items-center h-48 w-full">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin shrink-0" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 sm:p-4">
          <div className="flex flex-col gap-3 mb-4 items-center text-center w-full">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Archive className="w-6 h-6" />
            </div>
            <div className="w-full">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 break-words flex justify-center items-center gap-2">
                Auto-Archivado
                <div className="shrink-0"><HelpButton title="Auto-Archivado" path="/docs/manuales/manual_autoarchivado.md" /></div>
              </h2>
              <p className="text-slate-500 text-sm mt-1 break-words">Configura el archivado automático de registros inactivos.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            <div className="space-y-4 w-full">
              <div className="space-y-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 w-full">
                <div className="flex items-center justify-between gap-3 w-full">
                  <label className="text-sm font-semibold text-slate-700 break-words flex-1 min-w-0">Contactos Inactivos</label>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={settings.autoArchivarContactos} onChange={(e) => handleChange('autoArchivarContactos', e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                {settings.autoArchivarContactos && (
                  <div className="pt-2 w-full">
                    <label className="block text-xs font-medium text-slate-500 mb-2 break-words">Límite de Inactividad</label>
                    <TimeDurationDaysInput
                      value={settings.diasInactividadContactos}
                      onChange={(val) => handleChange('diasInactividadContactos', val)}
                      error={isInvalidContactos ? "Rango permitido: 100 a 1095 días (aprox 3 años)." : undefined}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 w-full">
                <div className="flex items-center justify-between gap-3 w-full">
                  <label className="text-sm font-semibold text-slate-700 break-words flex-1 min-w-0">Propiedades Inactivas</label>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={settings.autoArchivarPropiedades} onChange={(e) => handleChange('autoArchivarPropiedades', e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                {settings.autoArchivarPropiedades && (
                  <div className="pt-2 w-full">
                    <label className="block text-xs font-medium text-slate-500 mb-2 break-words">Límite de Inactividad</label>
                    <TimeDurationDaysInput
                      value={settings.diasInactividadPropiedades}
                      onChange={(val) => handleChange('diasInactividadPropiedades', val)}
                      error={isInvalidPropiedades ? "Rango permitido: 100 a 1095 días (aprox 3 años)." : undefined}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 w-full">
              <button
                type="submit"
                disabled={isSaving || !isFormValid}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                ) : (
                  <Save className="w-5 h-5 shrink-0" />
                )}
                <TruncatedText as="span" className="truncate">{isSaving ? 'Guardando...' : 'Guardar Cambios'}</TruncatedText>
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
