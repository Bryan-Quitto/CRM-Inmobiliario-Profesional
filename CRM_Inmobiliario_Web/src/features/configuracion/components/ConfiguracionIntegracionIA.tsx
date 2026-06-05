import React, { useState, useEffect } from 'react';
import { Lock, Loader2, KeyRound, Smartphone, Save, MessageSquare, AlertTriangle, Bot, Settings2, ShieldAlert } from 'lucide-react';
import { usePerfil } from '../../auth/api/perfil';
import { supabase } from '../../../lib/supabase';
import { api } from '../../../lib/axios';
import { toast } from 'sonner';
import { TokenUsageTable } from './TokenUsageTable';

type TabType = 'General' | 'Personal' | 'WhatsApp' | 'Facebook';

export const ConfiguracionIntegracionIA: React.FC = () => {
  const { perfil } = usePerfil();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Settings state
  const [activeTab, setActiveTab] = useState<TabType>('General');
  const [aiApiKey, setAiApiKey] = useState('');
  const [whatsAppId, setWhatsAppId] = useState('');
  const [limitValue, setLimitValue] = useState<number>(50000);
  const [personalLimitValue, setPersonalLimitValue] = useState<number>(500000);
  const [isPersonalAiEnabled, setIsPersonalAiEnabled] = useState(true);
  const [isWhatsAppAiEnabled, setIsWhatsAppAiEnabled] = useState(true);
  
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Validation state
  const [aiKeyError, setAiKeyError] = useState<string | null>(null);
  const [waIdError, setWaIdError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || isFetching) return;

    const validateCredentials = async () => {
      if (!aiApiKey.trim() && !whatsAppId.trim()) {
        setAiKeyError(null);
        setWaIdError(null);
        return;
      }

      setIsValidating(true);
      try {
        const response = await api.post('/configuracion/ia-settings/validate', {
          aiApiKey: aiApiKey.trim() || null,
          whatsAppPhoneNumberId: whatsAppId.trim() || null
        });
        
        if (response.data.aiKeyInUse) {
          setAiKeyError('Esta Key ya se está ocupando, si el error persiste contacte con administración.');
        } else {
          setAiKeyError(null);
        }

        if (response.data.waIdInUse) {
          setWaIdError('Este ID ya se está ocupando, si el error persiste contacte con administración.');
        } else {
          setWaIdError(null);
        }
      } catch {
        setAiKeyError(null);
        setWaIdError(null);
      } finally {
        setIsValidating(false);
      }
    };

    const debounceTimer = setTimeout(validateCredentials, 500);
    return () => clearTimeout(debounceTimer);
  }, [aiApiKey, whatsAppId, isAuthenticated, isFetching]);

  const loadSettings = async () => {
    try {
      const response = await api.get('/configuracion/ia-settings');
      setAiApiKey(response.data.aiApiKey || '');
      setWhatsAppId(response.data.whatsAppPhoneNumberId || '');
      setLimitValue(response.data.dailyTokenLimitPerContact || 50000);
      setPersonalLimitValue(response.data.dailyTokenLimitPersonal || 500000);
      setIsPersonalAiEnabled(response.data.isPersonalAiEnabled ?? true);
      setIsWhatsAppAiEnabled(response.data.isWhatsAppAiEnabled ?? true);
    } catch {
      toast.error('Error al cargar la configuración.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    if (!perfil?.email) {
      toast.error('No se pudo obtener el email del perfil.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: perfil.email,
        password: password,
      });

      if (error) throw error;

      setIsAuthenticated(true);
      toast.success('Autenticación exitosa.');
    } catch (err) {
      const error = err as Error;
      let errorMsg = error.message;
      if (errorMsg === 'Invalid login credentials') {
        errorMsg = 'Credenciales de inicio de sesión no válidas.';
      }
      toast.error('Contraseña incorrecta.', {
        description: errorMsg
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (limitValue < 20000 || limitValue > 1000000) {
      toast.error('El límite de WhatsApp debe estar entre 20,000 y 1,000,000 de tokens.');
      return;
    }
    
    if (personalLimitValue < 20000 || personalLimitValue > 1000000) {
      toast.error('El límite de IA Personal debe estar entre 20,000 y 1,000,000 de tokens.');
      return;
    }

    setIsSaving(true);
    try {
      await api.put('/configuracion/ia-settings', {
        aiApiKey: aiApiKey || null,
        whatsAppPhoneNumberId: whatsAppId || null,
        dailyTokenLimitPerContact: limitValue,
        dailyTokenLimitPersonal: personalLimitValue,
        isPersonalAiEnabled,
        isWhatsAppAiEnabled
      });
      toast.success('Configuración guardada correctamente.');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string, Message?: string } } };
      const backendMessage = error.response?.data?.message || error.response?.data?.Message;
      if (backendMessage) {
        toast.error(backendMessage);
      } else {
        toast.error('Error al guardar la configuración.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const renderCostEstimate = (limit: number) => {
    const isGemini = aiApiKey.startsWith('AIza') || aiApiKey.startsWith('AQ.');
    const providerName = isGemini ? 'Gemini 2.5 Flash' : 'OpenAI GPT-4o-mini';
    const avgPrice = isGemini ? 0.075 : 0.15;
    const estimatedCost = (limit * avgPrice / 1000000).toFixed(4);
    
    return (
      <div className="group relative flex items-center justify-end mt-1">
        <span className="text-xs font-bold text-slate-500 cursor-help border-b border-dashed border-slate-400">
          ≈ ${estimatedCost} USD
        </span>
        <div className="absolute bottom-full right-0 mb-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50 w-64">
          <div className="bg-white/80 backdrop-blur-xl border border-indigo-100/50 p-4 rounded-2xl shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 -z-10" />
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-indigo-100/50">
              <div className="p-1.5 bg-indigo-100/80 rounded-lg text-indigo-600">
                <Bot className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-indigo-900">Estimación de Costo</p>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Cálculo aproximado basado en un costo de <strong className="text-indigo-600 font-bold">${avgPrice} por 1M de tokens</strong> ({providerName}).
            </p>
            <div className="mt-3 bg-indigo-50/50 rounded-lg p-2 border border-indigo-100/50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Costo Max. Diario</span>
              <span className="text-xs font-black text-indigo-600">${estimatedCost} USD</span>
            </div>
          </div>
          <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white/80 backdrop-blur-xl border-b border-r border-indigo-100/50 rotate-45 transform" />
        </div>
      </div>
    );
  };

  const renderLimitWarning = (limit: number) => {
    if (limit < 20000) {
      return (
        <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in mt-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm">El límite mínimo es 20,000. Límites menores detendrán el bot casi de inmediato.</p>
        </div>
      );
    }
    if (limit > 1000000) {
      return (
        <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in mt-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm">El límite máximo es 1,000,000. Superar este límite expone la cuenta a costos excesivos.</p>
        </div>
      );
    }
    return null;
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <section className="bg-slate-100/50 p-8 rounded-[40px] border border-slate-200/60 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-xl mx-auto mt-12">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Área Segura</h2>
            <p className="text-slate-600 font-medium mt-2">
              Por seguridad, re-ingresa tu contraseña para acceder a tus llaves de integración y límites de uso.
            </p>
          </div>

          <form onSubmit={handleAuthenticate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block">Contraseña</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full cursor-pointer flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              Verificar Identidad
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section className="space-y-6 bg-slate-100/50 p-8 rounded-[40px] border border-slate-200/60 mt-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Settings2 size={20} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Configuración de IA</h2>
        </div>

        {/* Tabs - Diseño tipo Pills Premium */}
        <div className="flex space-x-1 bg-slate-200/50 p-1.5 rounded-2xl mb-6">
          {(['General', 'Personal', 'WhatsApp', 'Facebook'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                activeTab === tab 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 cursor-pointer'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isFetching ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8 animate-in fade-in duration-300">
            
            {/* TAB: GENERAL */}
            {activeTab === 'General' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-4">
                  <KeyRound className="text-slate-400" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">Credenciales (Bring Your Own Key)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="text-sm font-bold text-slate-700 mb-2 block">API Key de IA</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="password" 
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder="Tu API Key (ej. sk-... o AIza...)"
                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none transition-all font-mono ${aiKeyError ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50 text-red-900' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'}`}
                      />
                    </div>
                    {aiKeyError ? (
                      <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1"><AlertTriangle size={12}/> {aiKeyError}</p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-2">Esta llave es privada y pagará tu consumo de IA.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: WHATSAPP */}
            {activeTab === 'WhatsApp' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-4">
                  <Smartphone className="text-slate-400" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">Integración con WhatsApp</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="text-sm font-bold text-slate-700 mb-2 block">WhatsApp Phone Number ID</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={whatsAppId}
                        onChange={(e) => setWhatsAppId(e.target.value)}
                        placeholder="1234567890"
                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none transition-all font-mono ${waIdError ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50 text-red-900' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'}`}
                      />
                    </div>
                    {waIdError ? (
                      <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1"><AlertTriangle size={12}/> {waIdError}</p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-2">El identificador de tu número en Meta.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-base font-bold text-slate-800">Control Financiero y Acceso</h4>
                  
                  {/* Switch para Activar/Desactivar IA de WhatsApp */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900">Activar IA para WhatsApp</p>
                      <p className="text-sm text-slate-500">Permite que el bot responda mensajes entrantes de WhatsApp.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isWhatsAppAiEnabled}
                        onChange={(e) => setIsWhatsAppAiEnabled(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Límite de Tokens */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-bold text-slate-900">Límite Diario de Tokens</p>
                        <p className="text-sm text-slate-500 max-w-[280px] leading-snug">Máximo consumo por contacto al día.</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <input
                        type="number"
                        min={20000}
                        max={1000000}
                        step={1000}
                        className={`border rounded-xl px-4 py-2 text-sm w-36 focus:outline-none focus:ring-2 font-mono ${
                          limitValue < 20000 || limitValue > 1000000 
                            ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                            : 'border-slate-300 focus:ring-indigo-500'
                        }`}
                        value={limitValue}
                        onChange={(e) => setLimitValue(Number(e.target.value))}
                        disabled={isSaving}
                      />
                      {renderCostEstimate(limitValue)}
                    </div>
                  </div>
                  {renderLimitWarning(limitValue)}
                </div>
              </div>
            )}

            {/* TAB: PERSONAL */}
            {activeTab === 'Personal' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-4">
                  <Bot className="text-slate-400" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">IA del Sistema (Personal)</h3>
                </div>

                <div className="space-y-4">
                  <h4 className="text-base font-bold text-slate-800">Control Financiero y Acceso</h4>
                  
                  {/* Switch para Activar/Desactivar IA Personal */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900">Activar IA del Sistema</p>
                      <p className="text-sm text-slate-500">Permite usar el Copiloto dentro del CRM.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isPersonalAiEnabled}
                        onChange={(e) => setIsPersonalAiEnabled(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Límite de Tokens Personal */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-bold text-slate-900">Límite Diario de Tokens</p>
                        <p className="text-sm text-slate-500 max-w-[280px] leading-snug">Límite global para tu uso personal en el sistema al día.</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <input
                        type="number"
                        min={20000}
                        max={1000000}
                        step={1000}
                        className={`border rounded-xl px-4 py-2 text-sm w-36 focus:outline-none focus:ring-2 font-mono ${
                          personalLimitValue < 20000 || personalLimitValue > 1000000 
                            ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                            : 'border-slate-300 focus:ring-indigo-500'
                        }`}
                        value={personalLimitValue}
                        onChange={(e) => setPersonalLimitValue(Number(e.target.value))}
                        disabled={isSaving}
                      />
                      {renderCostEstimate(personalLimitValue)}
                    </div>
                  </div>
                  {renderLimitWarning(personalLimitValue)}
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100">
                  <h4 className="text-lg font-bold text-slate-800 mb-4">Consumo Total de Tokens</h4>
                  <TokenUsageTable />
                </div>
              </div>
            )}

            {/* TAB: FACEBOOK */}
            {activeTab === 'Facebook' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-[24px] flex items-center justify-center mb-6 text-slate-400 shadow-sm border border-slate-200/50">
                  <MessageSquare size={36} />
                </div>
                <h3 className="text-2xl font-black text-slate-800">Próximamente</h3>
                <p className="text-slate-500 max-w-sm mt-2 font-medium">
                  La integración con Facebook Messenger e Instagram Direct está en desarrollo y estará disponible en futuras actualizaciones.
                </p>
              </div>
            )}

            {/* Botón de Guardar Global */}
            <div className="flex justify-end pt-6 border-t border-slate-100 mt-8">
              <button
                onClick={handleSave}
                disabled={
                  isSaving || 
                  isValidating || 
                  !!aiKeyError || 
                  !!waIdError || 
                  limitValue < 20000 || limitValue > 1000000 ||
                  personalLimitValue < 20000 || personalLimitValue > 1000000
                }
                className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving || isValidating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Guardar Configuración
              </button>
            </div>

          </div>
        )}
      </section>
    </div>
  );
};

export default ConfiguracionIntegracionIA;
