import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { api } from '../../../lib/axios';
import { Lock, Loader2, CheckCircle2, AlertCircle, ShieldCheck, XCircle, User, Building, Phone } from 'lucide-react';
import { toast } from 'sonner';

export const ConfirmarInvitacion: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    agenciaId: '',
    agenciaNombre: '',
    password: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPredefinedAgency, setHasPredefinedAgency] = useState(false);

  // Recuperar metadata de la invitación
  useEffect(() => {
    const checkMetadata = async () => {
      try {
        // Esperar un momento a que la sesión se estabilice si venimos de un link externo
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.warn('No se pudo recuperar el usuario de la sesión actual');
          return;
        }

        if (user.user_metadata?.agencia_id) {
          const agencyId = user.user_metadata.agencia_id;
          setFormData(prev => ({ ...prev, agenciaId: agencyId }));
          setHasPredefinedAgency(true);

          // Intentar resolver el nombre de la agencia
          // Agregamos un pequeño delay opcional para asegurar que el interceptor de axios vea el token
          const response = await api.get(`/configuracion/agencias/${agencyId}`);
          if (response.data) {
            setFormData(prev => ({ ...prev, agenciaNombre: response.data.nombre }));
          }
        }
      } catch (err) {
        console.error('Error al inicializar datos de invitación:', err);
        // Si falla la API pero tenemos el ID, al menos mostramos algo genérico
        setFormData(prev => ({ 
          ...prev, 
          agenciaNombre: prev.agenciaId ? 'Agencia Asignada' : 'Independiente' 
        }));
      }
    };
    
    checkMetadata();
  }, []);

  const validations = {
    personal: formData.nombre.trim() !== '' && formData.apellido.trim() !== '' && formData.telefono.trim() !== '',
    length: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    match: formData.password === formData.confirmPassword && formData.password !== ''
  };

  const allValid = Object.values(validations).every(v => v);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Actualizar contraseña en Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
        data: {
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono
        }
      });

      if (updateError) throw updateError;

      // 2. Registrar el Agente en nuestra DB local mediante el nuevo endpoint del backend
      // Esto maneja la creación/actualización en la tabla 'Agents' de forma segura.
      await api.post('/configuracion/activar-perfil', {
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        agenciaId: formData.agenciaId || null
      });

      toast.success('¡Perfil configurado!', {
        description: 'Tu cuenta ha sido activada con éxito.'
      });

      // Limpiar la URL para evitar bucles de redirección
      window.history.replaceState(null, '', window.location.pathname);

      // Redirigir al dashboard
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (err: unknown) {
      console.error(err);
      const errorWithMsg = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = errorWithMsg.response?.data?.message || errorWithMsg.message || 'Error al activar tu perfil';
      setError(msg);
      toast.error('Error de activación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-xl animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-emerald-600/40 mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight text-center">
            Activa tu <span className="text-emerald-500">Perfil Pro</span>
          </h1>
          <p className="text-slate-400 mt-2 font-bold uppercase tracking-[0.2em] text-[10px]">
            Completa tus datos para comenzar
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-[2rem] shadow-2xl">
          <form onSubmit={handleActivate} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3 text-rose-400 text-sm font-bold">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Fila 1: Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  <input name="nombre" type="text" required value={formData.nombre} onChange={handleChange}
                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 transition-all"
                    placeholder="Tu nombre" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  <input name="apellido" type="text" required value={formData.apellido} onChange={handleChange}
                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 transition-all"
                    placeholder="Tu apellido" />
                </div>
              </div>
            </div>

            {/* Fila 2: Teléfono y Agencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  <input name="telefono" type="tel" required value={formData.telefono} onChange={handleChange}
                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 transition-all"
                    placeholder="+593 ..." />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agencia (Solo lectura)</label>
                <div className="relative group">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    name="agenciaNombre"
                    type="text"
                    value={formData.agenciaNombre || 'Independiente'}
                    onChange={handleChange}
                    disabled={hasPredefinedAgency}
                    className={`w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all ${hasPredefinedAgency ? 'opacity-60 cursor-not-allowed border-dashed' : 'focus:border-emerald-500'}`}
                    placeholder="Nombre empresa"
                  />
                </div>
              </div>
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  <input name="password" type="password" required value={formData.password} onChange={handleChange}
                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 transition-all"
                    placeholder="••••••••" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange}
                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 transition-all"
                    placeholder="••••••••" />
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4 bg-slate-900/40 rounded-2xl border border-slate-700/50">
              <Requirement met={validations.personal} label="Datos personales" />
              <Requirement met={validations.length} label="8+ caracteres" />
              <Requirement met={validations.hasUpper} label="Mayúscula" />
              <Requirement met={validations.hasNumber} label="Un número" />
              <Requirement met={validations.match} label="Coinciden" />
            </div>

            <button type="submit" disabled={isLoading || !allValid}
              className={`cursor-pointer ${`w-full rounded-xl py-4 font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3
                ${allValid ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20' : 'bg-slate-700 text-slate-400'}`}`}>
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <><CheckCircle2 className="h-5 w-5" /> Activar mi Cuenta</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Requirement = ({ met, label }: { met: boolean; label: string }) => (
  <div className={`flex items-center gap-2 text-[10px] font-bold transition-colors ${met ? 'text-emerald-400' : 'text-slate-500'}`}>
    {met ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3 opacity-30" />}
    {label}
  </div>
);
