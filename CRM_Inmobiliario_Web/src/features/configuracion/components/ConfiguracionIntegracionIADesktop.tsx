import React from 'react';
import { Loader2, KeyRound, Smartphone, Save, AlertTriangle, Bot, Settings2, ShieldAlert, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { FacebookIntegracionTab } from './FacebookIntegracionTab';
import { TokenUsageTable } from './TokenUsageTable';
import type { ConfiguracionIntegracionIALogic } from '../hooks/useConfiguracionIntegracionIALogic';
import { CostEstimateTooltip, LimitWarning } from './ConfiguracionIntegracionIAShared';

export const ConfiguracionIntegracionIADesktop: React.FC<{ logic: ConfiguracionIntegracionIALogic }> = ({ logic }) => {
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

  return (
    <div className="hidden lg:block space-y-6 animate-in fade-in duration-500">
      <section className="space-y-6 bg-slate-100/50 p-8 rounded-[40px] border border-slate-200/60 mt-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Settings2 size={20} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Configuración de IA</h2>
        </div>

        <div className="flex space-x-1 bg-slate-200/50 p-1.5 rounded-2xl mb-6 overflow-x-auto hide-scrollbar whitespace-nowrap">
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
          <>
            <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8 animate-in fade-in duration-300">
            
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
                        type={showApiKey ? "text" : "password"} 
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder="Tu API Key (ej. sk-... o AIza...)"
                        className={`w-full pl-10 pr-12 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none transition-all font-mono ${aiKeyError ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50 text-red-900' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                        tabIndex={-1}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
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
                  
                  <div className="flex flex-col sm:flex-row sm:items-center items-start gap-4 sm:justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
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

                  <div 
                    className="flex flex-col sm:flex-row sm:items-center items-start gap-4 sm:justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4"
                    onClick={() => {
                      if (isWhatsAppAiEnabled) {
                        toast.warning("La Inteligencia Artificial requiere la creación automática de contactos para funcionar. Apaga la IA primero si deseas deshabilitar esta opción.");
                      }
                    }}
                  >
                    <div className={isWhatsAppAiEnabled ? "opacity-50" : ""}>
                      <p className="font-bold text-slate-900">Creación automática de contactos</p>
                      <p className="text-sm text-slate-500">Agrega contactos al CRM al recibir el primer mensaje.</p>
                    </div>
                    <label className={`relative inline-flex items-center ${isWhatsAppAiEnabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isWhatsAppAiEnabled || autoCreateWhatsAppContacts}
                        onChange={(e) => {
                          if (!isWhatsAppAiEnabled) {
                            setAutoCreateWhatsAppContacts(e.target.checked);
                          }
                        }}
                        disabled={isWhatsAppAiEnabled}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center items-start gap-4 sm:justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
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
                      <CostEstimateTooltip limit={limitValue} aiApiKey={aiApiKey} />
                    </div>
                  </div>
                  <LimitWarning limit={limitValue} />
                </div>
              </div>
            )}

            {activeTab === 'Personal' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-4">
                  <Bot className="text-slate-400" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">IA del Sistema (Personal)</h3>
                </div>

                <div className="space-y-4">
                  <h4 className="text-base font-bold text-slate-800">Control Financiero y Acceso</h4>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center items-start gap-4 sm:justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
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

                  <div className="flex flex-col sm:flex-row sm:items-center items-start gap-4 sm:justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
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
                      <CostEstimateTooltip limit={personalLimitValue} aiApiKey={aiApiKey} />
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

            <div className="flex justify-end pt-6 border-t border-slate-100 mt-8">
              <button
                onClick={handleSave}
                disabled={
                  isSaving ||
                  isValidating ||
                  !!aiKeyError ||
                  !!waIdError ||
                  limitValue < 20000 || limitValue > 1000000 ||
                  personalLimitValue < 20000 || personalLimitValue > 1000000 ||
                  facebookLimitValue < 20000 || facebookLimitValue > 1000000
                }
                className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving || isValidating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Guardar Configuración
              </button>
            </div>

          </div>

          {(activeTab === 'Personal' || (activeTab === 'Facebook' && facebookPageId)) && (
            <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-slate-200 mt-6 animate-in fade-in duration-300">
              <h3 className="text-xl font-black text-slate-800 mb-6">Consumo Total de Tokens</h3>
              <TokenUsageTable channel={activeTab === 'Personal' ? 'Copilot' : 'Facebook'} />
            </div>
          )}
        </>
        )}
      </section>
    </div>
  );
};
