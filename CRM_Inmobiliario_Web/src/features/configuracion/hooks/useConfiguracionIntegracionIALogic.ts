import { useState, useEffect } from 'react';
import { usePerfil } from '../../auth/api/perfil';
import { supabase } from '../../../lib/supabase';
import { api } from '../../../lib/axios';
import { toast } from 'sonner';
import { useConfiguracionIA, type IASettings } from './useConfiguracionIA';

export type TabType = 'General' | 'Personal' | 'WhatsApp' | 'Facebook';

export const useConfiguracionIntegracionIALogic = () => {
  const { perfil } = usePerfil();
  const { mutate: mutateSettings } = useConfiguracionIA();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Settings state
  const [activeTab, setActiveTab] = useState<TabType>('General');
  const [aiApiKey, setAiApiKey] = useState('');
  const [whatsAppId, setWhatsAppId] = useState('');
  const [limitValue, setLimitValue] = useState<number>(50000);
  const [personalLimitValue, setPersonalLimitValue] = useState<number>(500000);
  const [facebookLimitValue, setFacebookLimitValue] = useState<number>(50000);
  const [isPersonalAiEnabled, setIsPersonalAiEnabled] = useState(true);
  const [isWhatsAppAiEnabled, setIsWhatsAppAiEnabled] = useState(true);
  const [autoCreateWhatsAppContacts, setAutoCreateWhatsAppContacts] = useState(true);
  const [facebookPageId, setFacebookPageId] = useState<string | null>(null);
  const [facebookPageName, setFacebookPageName] = useState<string | null>(null);
  const [isFacebookAiEnabled, setIsFacebookAiEnabled] = useState(false);
  const [autoCreateFacebookContacts, setAutoCreateFacebookContacts] = useState(true);
  
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
      setFacebookLimitValue(response.data.dailyTokenLimitFacebook || 50000);
      setIsPersonalAiEnabled(response.data.isPersonalAiEnabled ?? true);
      setIsWhatsAppAiEnabled(response.data.isWhatsAppAiEnabled ?? true);
      setAutoCreateWhatsAppContacts(response.data.autoCreateWhatsAppContacts ?? true);
      setFacebookPageId(response.data.facebookPageId ?? null);
      setFacebookPageName(response.data.facebookPageName ?? null);
      setIsFacebookAiEnabled(response.data.isFacebookAiEnabled ?? false);
      setAutoCreateFacebookContacts(response.data.autoCreateFacebookContacts ?? true);
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

    if (facebookLimitValue < 20000 || facebookLimitValue > 1000000) {
      toast.error('El límite de Facebook debe estar entre 20,000 y 1,000,000 de tokens.');
      return;
    }

    setIsSaving(true);
    try {
      await api.put('/configuracion/ia-settings', {
        aiApiKey: aiApiKey || null,
        whatsAppPhoneNumberId: whatsAppId || null,
        dailyTokenLimitPerContact: limitValue,
        dailyTokenLimitPersonal: personalLimitValue,
        dailyTokenLimitFacebook: facebookLimitValue,
        isPersonalAiEnabled,
        isWhatsAppAiEnabled,
        autoCreateWhatsAppContacts: isWhatsAppAiEnabled ? true : autoCreateWhatsAppContacts,
        isFacebookAiEnabled,
        autoCreateFacebookContacts: isFacebookAiEnabled ? true : autoCreateFacebookContacts
      });
      
      mutateSettings((currentData?: IASettings) => {
        if (!currentData) return undefined;
        return {
          ...currentData,
          isPersonalAiEnabled,
          isWhatsAppAiEnabled,
          autoCreateWhatsAppContacts: isWhatsAppAiEnabled ? true : autoCreateWhatsAppContacts,
          isFacebookAiEnabled,
          autoCreateFacebookContacts: isFacebookAiEnabled ? true : autoCreateFacebookContacts,
          dailyTokenLimitPerContact: limitValue,
          dailyTokenLimitPersonal: personalLimitValue,
          dailyTokenLimitFacebook: facebookLimitValue,
          aiApiKey,
          whatsAppPhoneNumberId: whatsAppId
        };
      }, { revalidate: true });

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

  return {
    isAuthenticated, setIsAuthenticated,
    password, setPassword,
    isLoading, setIsLoading,
    activeTab, setActiveTab,
    aiApiKey, setAiApiKey,
    whatsAppId, setWhatsAppId,
    limitValue, setLimitValue,
    personalLimitValue, setPersonalLimitValue,
    facebookLimitValue, setFacebookLimitValue,
    isPersonalAiEnabled, setIsPersonalAiEnabled,
    isWhatsAppAiEnabled, setIsWhatsAppAiEnabled,
    autoCreateWhatsAppContacts, setAutoCreateWhatsAppContacts,
    facebookPageId, setFacebookPageId,
    facebookPageName, setFacebookPageName,
    isFacebookAiEnabled, setIsFacebookAiEnabled,
    autoCreateFacebookContacts, setAutoCreateFacebookContacts,
    isFetching, setIsFetching,
    isSaving, setIsSaving,
    aiKeyError, setAiKeyError,
    waIdError, setWaIdError,
    isValidating, setIsValidating,
    handleAuthenticate, handleSave, loadSettings, mutateSettings
  };
};

export type ConfiguracionIntegracionIALogic = ReturnType<typeof useConfiguracionIntegracionIALogic>;
