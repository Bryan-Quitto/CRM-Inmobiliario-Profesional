import React from 'react';
import { Loader2, KeyRound, Smartphone, Save, AlertTriangle, Bot, Settings2, ShieldAlert, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { FacebookIntegracionTab } from './FacebookIntegracionTab';
import { TokenUsageTable } from './TokenUsageTable';
import type { ConfiguracionIntegracionIALogic } from '../hooks/useConfiguracionIntegracionIALogic';
import { CostEstimateTooltip, LimitWarning } from './ConfiguracionIntegracionIAShared';
import { HelpButton } from '../../../components/ui/HelpButton';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';

export const ConfiguracionIntegracionIAMobile: React.FC<{ logic: ConfiguracionIntegracionIALogic }> = ({ logic }) => {
  const {
    activeTab, setActiveTab,
    aiApiKey, setAiApiKey,
    whatsAppId, setWhatsAppId,
    limitValue, setLimitValue,
    personalLimitValue, setPersonalLimitValue,
    facebookLimitValue, setFacebookLimitValue,
    isPersonalAiEnabled, setIsPersonalAiEnabled,
    isWhatsAppAiEnabled, setIsWhatsAppAiEnabled,
    autoCreateWhatsAppContacts, setAutoCreateWhatsAppContacts,
    facebookPageId, facebookPageName,
    isFacebookAiEnabled, setIsFacebookAiEnabled,
    autoCreateFacebookContacts, setAutoCreateFacebookContacts,
    isFetching, isSaving,
    aiKeyError, waIdError, isValidating,
    handleSave, loadSettings, mutateSettings
  } = logic;
  const [showApiKey, setShowApiKey] = React.useState(false);
  const { canWrite } = useSubscriptionGuard();

  return (
    <div className="block lg:hidden space-y-4 animate-in fade-in duration-500 pb-20">
      <section className="bg-white p-4 sm:p-4 rounded-2xl shadow-sm border border-slate-200 mt-4 mx-2">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
              <Settings2 size={24} />
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight leading-tight flex-1 min-w-0 break-words">Configuración de IA</h2>
          </div>
          <div className="shrink-0">
            <HelpButton title="Configuración de IA" path="/docs/manuales/manual_ia.md" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {(['General', 'Personal', 'WhatsApp', 'Facebook'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`cursor-pointer py-2.5 px-1 break-words text-xs font-bold rounded-xl transition-all duration-300 border ${
                activeTab === tab 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                  : 'bg-slate-50 border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isFetching ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <div className="space-y-4">
            
            {activeTab === 'General' && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-3">
                  <KeyRound className="text-slate-400 shrink-0" size={18} />
                  <h3 className="text-base font-bold text-slate-800 leading-tight flex-1 min-w-0 break-words">Credenciales (Clave API Propia)</h3>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block break-words">API Key de IA</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type={showApiKey ? "text" : "password"} 
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      disabled={!canWrite}
                      placeholder="Tu API Key"
                      className={`w-full pl-10 pr-12 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none transition-all font-mono text-sm ${aiKeyError ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50 text-red-900' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none cursor-pointer"
                      tabIndex={-1}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {aiKeyError ? (
                    <p className="text-xs text-red-600 mt-1 font-medium flex items-start gap-1"><AlertTriangle size={12} className="shrink-0 mt-0.5"/> <span className="flex-1 min-w-0 break-words">{aiKeyError}</span></p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1 leading-snug break-words">Esta llave es privada y pagará tu consumo de IA.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'WhatsApp' && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="text-slate-400 shrink-0" size={18} />
                    <h3 className="text-base font-bold text-slate-800 leading-tight flex-1 min-w-0 break-words">Integración con WhatsApp</h3>
                  </div>
                  <div className="shrink-0">
                    <HelpButton title="Integración con WhatsApp" path="/docs/manuales/manual_ia.md#whatsapp" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block break-words">WhatsApp Phone Number ID</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={whatsAppId}
                      onChange={(e) => setWhatsAppId(e.target.value)}
                      disabled={!canWrite}
                      placeholder="1234567890"
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none transition-all font-mono text-sm ${waIdError ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50 text-red-900' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                  </div>
                  {waIdError ? (
                    <p className="text-xs text-red-600 mt-1 font-medium flex items-start gap-1"><AlertTriangle size={12} className="shrink-0 mt-0.5"/> <span className="flex-1 min-w-0 break-words">{waIdError}</span></p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1 leading-snug break-words">El identificador de tu número en Meta.</p>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Control y Acceso</h4>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm font-bold text-slate-900 break-words">Activar IA</p>
                      <p className="text-xs text-slate-500 mt-0.5 break-words">Responde msjs entrantes.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" className="sr-only peer" checked={isWhatsAppAiEnabled} onChange={(e) => setIsWhatsAppAiEnabled(e.target.checked)} disabled={!canWrite}/>
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div 
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer"
                    onClick={() => {
                      if (isWhatsAppAiEnabled) toast.warning("Debes apagar la IA primero.");
                    }}
                  >
                    <div className={`flex-1 min-w-0 pr-3 ${isWhatsAppAiEnabled ? "opacity-50" : ""}`}>
                      <p className="text-sm font-bold text-slate-900 break-words">Crear Contactos</p>
                      <p className="text-xs text-slate-500 mt-0.5 break-words">Automático en primer msj.</p>
                    </div>
                    <label className={`relative inline-flex items-center shrink-0 ${isWhatsAppAiEnabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                      <input type="checkbox" className="sr-only peer" checked={isWhatsAppAiEnabled || autoCreateWhatsAppContacts} onChange={(e) => { if (!isWhatsAppAiEnabled) setAutoCreateWhatsAppContacts(e.target.checked); }} disabled={isWhatsAppAiEnabled || !canWrite}/>
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 break-words">Límite Diario</p>
                        <p className="text-xs text-slate-500 break-words">Máx consumo/contacto al día.</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 w-full">
                      <input
                        type="number" min={20000} max={1000000} step={1000}
                        className={`border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 font-mono ${limitValue < 20000 || limitValue > 1000000 ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-indigo-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        value={limitValue}
                        onChange={(e) => setLimitValue(Number(e.target.value))}
                        disabled={isSaving || !canWrite}
                      />
                      <div className="self-end">
                        <CostEstimateTooltip limit={limitValue} aiApiKey={aiApiKey} />
                      </div>
                    </div>
                  </div>
                  <LimitWarning limit={limitValue} />
                </div>
              </div>
            )}

            {activeTab === 'Personal' && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="text-slate-400 shrink-0" size={18} />
                    <h3 className="text-base font-bold text-slate-800 leading-tight flex-1 min-w-0 break-words">IA del Sistema (Personal)</h3>
                  </div>
                  <div className="shrink-0">
                    <HelpButton title="IA del Sistema (Personal)" path="/docs/manuales/manual_ia.md#personal" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Control y Acceso</h4>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm font-bold text-slate-900 break-words">Activar IA del Sistema</p>
                      <p className="text-xs text-slate-500 mt-0.5 break-words">Permite usar el Copiloto.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" className="sr-only peer" checked={isPersonalAiEnabled} onChange={(e) => setIsPersonalAiEnabled(e.target.checked)} disabled={!canWrite}/>
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 break-words">Límite Diario</p>
                        <p className="text-xs text-slate-500 break-words">Límite global para tu uso.</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 w-full">
                      <input
                        type="number" min={20000} max={1000000} step={1000}
                        className={`border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 font-mono ${personalLimitValue < 20000 || personalLimitValue > 1000000 ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-indigo-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        value={personalLimitValue}
                        onChange={(e) => setPersonalLimitValue(Number(e.target.value))}
                        disabled={isSaving || !canWrite}
                      />
                      <div className="self-end">
                        <CostEstimateTooltip limit={personalLimitValue} aiApiKey={aiApiKey} />
                      </div>
                    </div>
                  </div>
                  <LimitWarning limit={personalLimitValue} />
                </div>
              </div>
            )}

            {activeTab === 'Facebook' && (
              <FacebookIntegracionTab
                facebookPageId={facebookPageId}
                facebookPageName={facebookPageName}
                isFacebookAiEnabled={isFacebookAiEnabled}
                setIsFacebookAiEnabled={setIsFacebookAiEnabled}
                autoCreateFacebookContacts={autoCreateFacebookContacts}
                setAutoCreateFacebookContacts={setAutoCreateFacebookContacts}
                facebookLimitValue={facebookLimitValue}
                setFacebookLimitValue={setFacebookLimitValue}
                isSaving={isSaving}
                renderCostEstimate={(limit) => <CostEstimateTooltip limit={limit} aiApiKey={aiApiKey} />}
                renderLimitWarning={(limit) => <LimitWarning limit={limit} />}
                onSuccess={() => { mutateSettings(); loadSettings(); }}
              />
            )}

            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={(e) => {
                  if (!canWrite) {
                    e.preventDefault();
                    toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
                    return;
                  }
                  handleSave();
                }}
                disabled={isSaving || isValidating || !!aiKeyError || !!waIdError || limitValue < 20000 || limitValue > 1000000 || personalLimitValue < 20000 || personalLimitValue > 1000000 || facebookLimitValue < 20000 || facebookLimitValue > 1000000}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isSaving || isValidating ? <Loader2 size={18} className="animate-spin shrink-0" /> : <Save size={18} className="shrink-0" />}
                <span className="break-words">Guardar Configuración</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {!isFetching && (activeTab === 'Personal' || (activeTab === 'WhatsApp' && whatsAppId) || (activeTab === 'Facebook' && facebookPageId)) && (
        <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mx-2 animate-in fade-in duration-300">
          <h3 className="text-base font-black text-slate-800 mb-4 break-words">Consumo de Tokens</h3>
          <TokenUsageTable channel={activeTab === 'Personal' ? 'Copilot' : activeTab === 'WhatsApp' ? 'WhatsApp' : 'Facebook'} />
        </section>
      )}
    </div>
  );
};
