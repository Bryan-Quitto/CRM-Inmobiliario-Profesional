import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Bot, Save, AlertTriangle, MessageSquare } from 'lucide-react';
import { useConfiguracionIA, updateIASettings } from '../hooks/useConfiguracionIA';

export const ConfiguracionUsoIA: React.FC = () => {
  const { settings, isLoading, isError, mutate } = useConfiguracionIA();
  const [limitValue, setLimitValue] = useState<number>(50000);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.dailyTokenLimitPerContact) {
      setLimitValue(settings.dailyTokenLimitPerContact);
    }
  }, [settings]);

  const handleSave = async () => {
    if (limitValue < 20000 || limitValue > 1000000) {
      toast.error('El límite debe estar entre 20,000 y 1,000,000 de tokens.');
      return;
    }

    setSaving(true);
    try {
      await updateIASettings(limitValue);
      toast.success('Límite actualizado correctamente');
      mutate();
      setIsEditing(false);
    } catch {
      toast.error('Error al actualizar el límite');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error al cargar la configuración de uso IA.
      </div>
    );
  }

  const hasMissingCredentials = !settings?.aiApiKey || !settings?.whatsAppPhoneNumberId;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Bot className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Autogestión de IA</h3>
              <p className="text-sm text-slate-500 mt-1">
                Configura los parámetros de Inteligencia Artificial para tus contactos.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {hasMissingCredentials && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">Credenciales incompletas</h4>
                <p className="text-sm mt-1">
                  Para que tu asistente de IA funcione correctamente, debes configurar tu <strong>API Key de OpenAI</strong> y tu <strong>ID de número de WhatsApp</strong> en tu perfil.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">Límite Diario de Tokens</p>
                  <p className="text-sm text-slate-500">Por contacto (20k - 1M)</p>
                </div>
              </div>
              
              <div>
                {isEditing ? (
                  <div className="flex flex-col items-end gap-1">
                    <input
                      type="number"
                      min={20000}
                      max={1000000}
                      step={1000}
                      className={`border rounded-md px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 ${
                        limitValue < 20000 || limitValue > 1000000 
                          ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                          : 'border-slate-300 focus:ring-indigo-500'
                      }`}
                      value={limitValue}
                      onChange={(e) => setLimitValue(Number(e.target.value))}
                      disabled={saving}
                    />
                    <span className="text-xs text-slate-500">
                      ≈ ${(limitValue * 0.15 / 1000000).toFixed(4)} USD
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-end gap-1">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {settings?.dailyTokenLimitPerContact?.toLocaleString() || '50,000'} tokens
                    </span>
                    <span className="text-xs text-slate-500">
                      ≈ ${(((settings?.dailyTokenLimitPerContact || 50000) * 0.15) / 1000000).toFixed(4)} USD
                    </span>
                  </div>
                )}
              </div>
            </div>

            {isEditing && limitValue < 20000 && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-sm">El límite mínimo es 20,000. Límites menores son ineficientes ya que el bot se detendría tras solo ~5 mensajes.</p>
              </div>
            )}

            {isEditing && limitValue > 1000000 && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-sm">El límite máximo es 1,000,000. Superar este límite expone la cuenta a abusos maliciosos y posibles pérdidas financieras inesperadas.</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setLimitValue(settings?.dailyTokenLimitPerContact || 50000);
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || limitValue < 20000 || limitValue > 1000000}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar Cambios
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  Modificar Límite
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
