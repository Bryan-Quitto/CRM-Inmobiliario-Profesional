import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Unlink, AlertTriangle } from 'lucide-react';
import {
  connectFacebook,
  disconnectFacebook,
  saveFacebookPage,
  type FacebookPageOption,
} from '../api/facebook';

/* ─── FB SDK global types ─────────────────────────────────────────────────── */
declare global {
  interface Window {
    FB: {
      init: (config: object) => void;
      login: (
        callback: (response: { authResponse?: { accessToken: string } | null }) => void,
        options?: { scope: string },
      ) => void;
    };
    fbAsyncInit: () => void;
  }
}

/* ─── Props ──────────────────────────────────────────────────────────────── */
interface Props {
  facebookPageId: string | null;
  facebookPageName: string | null;
  isFacebookAiEnabled: boolean;
  setIsFacebookAiEnabled: (val: boolean) => void;
  facebookLimitValue: number;
  setFacebookLimitValue: (val: number) => void;
  isSaving: boolean;
  renderCostEstimate: (limit: number) => React.ReactNode;
  renderLimitWarning: (limit: number) => React.ReactNode;
  onSuccess: () => void;
}

/* ─── Sub-component: Facebook SVG icon ───────────────────────────────────── */
const FacebookIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
  </svg>
);

/* ─── Sub-component: Page Selector Modal ─────────────────────────────────── */
interface PageSelectorProps {
  pages: FacebookPageOption[];
  isSelecting: boolean;
  onSelect: (page: FacebookPageOption) => void;
  onCancel: () => void;
}

const PageSelectorModal: React.FC<PageSelectorProps> = ({
  pages,
  isSelecting,
  onSelect,
  onCancel,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 p-6 animate-in zoom-in-95 duration-200">
      <h3 className="text-lg font-black text-slate-800 mb-1">Selecciona tu Página</h3>
      <p className="text-sm text-slate-500 mb-5">
        Tu cuenta tiene múltiples páginas. Elige la que quieres conectar al CRM.
      </p>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {pages.map((page) => (
          <button
            key={page.pageId}
            onClick={() => onSelect(page)}
            disabled={isSelecting}
            className="w-full flex items-center justify-between gap-3 p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2]">
                <FacebookIcon size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">{page.pageName}</p>
                <p className="text-xs text-slate-500">{page.category}</p>
              </div>
            </div>
            {isSelecting ? (
              <Loader2 size={16} className="animate-spin text-[#1877F2] shrink-0" />
            ) : (
              <span className="text-xs font-bold text-[#1877F2] shrink-0">Conectar →</span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={onCancel}
        disabled={isSelecting}
        className="mt-4 w-full py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Cancelar
      </button>
    </div>
  </div>
);

/* ─── Sub-component: Connected State Card ────────────────────────────────── */
interface ConnectedCardProps {
  facebookPageName: string;
  facebookPageId: string;
  isFacebookAiEnabled: boolean;
  setIsFacebookAiEnabled: (val: boolean) => void;
  facebookLimitValue: number;
  setFacebookLimitValue: (val: number) => void;
  isSaving: boolean;
  renderCostEstimate: (limit: number) => React.ReactNode;
  renderLimitWarning: (limit: number) => React.ReactNode;
  isDisconnecting: boolean;
  onDisconnect: () => void;
}

const ConnectedCard: React.FC<ConnectedCardProps> = ({
  facebookPageName,
  facebookPageId,
  isFacebookAiEnabled,
  setIsFacebookAiEnabled,
  facebookLimitValue,
  setFacebookLimitValue,
  isSaving,
  renderCostEstimate,
  renderLimitWarning,
  isDisconnecting,
  onDisconnect,
}) => (
  <div className="space-y-4 animate-in fade-in duration-300">
    {/* Header badge */}
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-full border border-emerald-200">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        Conectado
      </span>
    </div>

    {/* Page info card */}
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
          <FacebookIcon size={28} />
        </div>
        <div className="min-w-0">
          <p className="font-black text-slate-800 text-lg leading-tight truncate">{facebookPageName}</p>
          <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {facebookPageId}</p>
        </div>
      </div>
    </div>

    {/* AI toggle */}
    <div className="flex flex-col sm:flex-row sm:items-center items-start gap-4 sm:justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div>
        <p className="font-bold text-slate-900">Bot de Messenger activo</p>
        <p className="text-sm text-slate-500">
          Permite que la IA responda mensajes de Messenger automáticamente.
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={isFacebookAiEnabled}
          disabled={isSaving}
          onChange={(e) => setIsFacebookAiEnabled(e.target.checked)}
        />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1877F2] peer-disabled:opacity-60" />
      </label>
    </div>

    {/* Límite de Tokens */}
    <div className="flex flex-col sm:flex-row sm:items-center items-start gap-4 sm:justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-[#1877F2]/10 rounded-lg text-[#1877F2]">
          <FacebookIcon size={18} />
        </div>
        <div>
          <p className="font-bold text-slate-900">Límite Diario de Tokens</p>
          <p className="text-sm text-slate-500 max-w-[280px] leading-snug">Máximo consumo por contacto en Messenger al día.</p>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-1">
        <input
          type="number"
          min={20000}
          max={1000000}
          step={1000}
          className={`border rounded-xl px-4 py-2 text-sm w-36 focus:outline-none focus:ring-2 font-mono ${
            facebookLimitValue < 20000 || facebookLimitValue > 1000000 
              ? 'border-red-300 focus:ring-red-500 bg-red-50' 
              : 'border-slate-300 focus:ring-indigo-500'
          }`}
          value={facebookLimitValue}
          onChange={(e) => setFacebookLimitValue(Number(e.target.value))}
          disabled={isSaving}
        />
        {renderCostEstimate(facebookLimitValue)}
      </div>
    </div>
    {renderLimitWarning(facebookLimitValue)}

    {/* Disconnect button */}
    <div className="pt-2">
      <button
        onClick={onDisconnect}
        disabled={isDisconnecting}
        className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isDisconnecting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Unlink size={16} />
        )}
        Desconectar página
      </button>
    </div>
  </div>
);

/* ─── Main component ─────────────────────────────────────────────────────── */
export const FacebookIntegracionTab: React.FC<Props> = ({
  facebookPageId,
  facebookPageName,
  isFacebookAiEnabled,
  setIsFacebookAiEnabled,
  facebookLimitValue,
  setFacebookLimitValue,
  isSaving,
  renderCostEstimate,
  renderLimitWarning,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [availablePages, setAvailablePages] = useState<FacebookPageOption[]>([]);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  /* ── Load FB SDK ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v21.0',
      });
    };

    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/es_LA/sdk.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const showError = (msg: string) => {
    setError(msg);
    setSuccessMsg(null);
    setTimeout(() => setError(null), 6000);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setError(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  /* ── Connect flow ─────────────────────────────────────────────────────── */

  // Lógica async separada del callback de FB.login — el SDK exige que el callback sea síncrono.
  // Pasar un async directamente lanza: "Expression is of type asyncfunction, not function".
  const handleFbLoginResponse = async (accessToken: string) => {
    try {
      const pages = await connectFacebook(accessToken);

      if (pages.length === 0) {
        showError('No se encontraron páginas en tu cuenta. Asegúrate de ser administrador de al menos una página.');
        return;
      }

      if (pages.length === 1) {
        await saveFacebookPage(pages[0].pageId, pages[0].pageName, pages[0].pageAccessToken);
        showSuccess('¡Página conectada exitosamente!');
        onSuccess();
      } else {
        setAvailablePages(pages);
        setShowPageSelector(true);
      }
    } catch {
      showError('Error al conectar con Facebook. Verifica tus permisos e inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectFacebook = () => {
    setError(null);
    setIsLoading(true);

    // FB.login requiere callback síncrono — la lógica async se despacha con void
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          void handleFbLoginResponse(response.authResponse.accessToken);
        } else {
          showError('Autorización cancelada. Inténtalo de nuevo.');
          setIsLoading(false);
        }
      },
      { scope: 'pages_show_list,pages_manage_metadata,pages_messaging' },
    );
  };

  /* ── Select page ──────────────────────────────────────────────────────── */
  const handleSelectPage = async (page: FacebookPageOption) => {
    setIsSelecting(true);
    try {
      await saveFacebookPage(page.pageId, page.pageName, page.pageAccessToken);
      setShowPageSelector(false);
      setAvailablePages([]);
      showSuccess('¡Página conectada exitosamente!');
      onSuccess();
    } catch {
      showError('Error al guardar la página. Inténtalo de nuevo.');
    } finally {
      setIsSelecting(false);
    }
  };

  const handleCancelSelector = () => {
    if (isSelecting) return;
    setShowPageSelector(false);
    setAvailablePages([]);
  };

  /* ── Disconnect ───────────────────────────────────────────────────────── */
  const handleDisconnect = async () => {
    if (!showDisconnectConfirm) {
      setShowDisconnectConfirm(true);
      return;
    }
    setIsDisconnecting(true);
    setShowDisconnectConfirm(false);
    try {
      await disconnectFacebook();
      showSuccess('Página desconectada correctamente.');
      onSuccess();
    } catch {
      showError('Error al desconectar la página. Inténtalo de nuevo.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  /* ─── Render ───────────────────────────────────────────────────────────── */
  const isConnected = facebookPageId !== null;

  return (
    <>
      {/* Page selector modal */}
      {showPageSelector && (
        <PageSelectorModal
          pages={availablePages}
          isSelecting={isSelecting}
          onSelect={handleSelectPage}
          onCancel={handleCancelSelector}
        />
      )}

      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <div className="w-7 h-7 flex items-center justify-center text-[#1877F2]">
            <FacebookIcon size={22} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Integración con Facebook Messenger</h3>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in duration-200">
            <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in duration-200">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-emerald-700">{successMsg}</p>
          </div>
        )}

        {/* Disconnect confirmation banner */}
        {showDisconnectConfirm && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-in fade-in duration-200">
            <div className="flex items-center gap-2 flex-1">
              <AlertTriangle size={18} className="text-amber-600 shrink-0" />
              <p className="text-sm font-semibold text-amber-800">
                ¿Confirmas que deseas desconectar la página? El bot dejará de responder mensajes.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-60"
              >
                Sí, desconectar
              </button>
              <button
                onClick={() => setShowDisconnectConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all duration-200 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Connected state */}
        {isConnected ? (
          <ConnectedCard
            facebookPageName={facebookPageName!}
            facebookPageId={facebookPageId}
            isFacebookAiEnabled={isFacebookAiEnabled}
            setIsFacebookAiEnabled={setIsFacebookAiEnabled}
            facebookLimitValue={facebookLimitValue}
            setFacebookLimitValue={setFacebookLimitValue}
            isSaving={isSaving}
            renderCostEstimate={renderCostEstimate}
            renderLimitWarning={renderLimitWarning}
            isDisconnecting={isDisconnecting}
            onDisconnect={handleDisconnect}
          />
        ) : (
          /* Not connected state */
          <div className="flex flex-col items-center text-center py-10 gap-6">
            {/* Logo */}
            <div className="w-24 h-24 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-blue-500/30"
              style={{ background: 'linear-gradient(135deg, #1877F2 0%, #0a5fc4 100%)' }}>
              <FacebookIcon size={44} />
            </div>

            <div className="space-y-2">
              <h4 className="text-2xl font-black text-slate-800">Conecta tu Página de Facebook</h4>
              <p className="text-slate-500 max-w-sm font-medium">
                Recibe y responde mensajes de Messenger automáticamente con IA.
              </p>
            </div>

            {/* Benefits */}
            <ul className="space-y-2 text-sm text-slate-600">
              {[
                'Respuestas automáticas 24/7',
                'Misma IA que WhatsApp',
                'Integración con el CRM',
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 font-medium">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>

            {/* Connect button */}
            <button
              onClick={handleConnectFacebook}
              disabled={isLoading}
              className="flex items-center gap-3 px-6 py-3 bg-[#1877F2] hover:bg-[#166FE5] active:bg-[#1468D5] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <FacebookIcon size={20} />
              )}
              Conectar con Facebook
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default FacebookIntegracionTab;
