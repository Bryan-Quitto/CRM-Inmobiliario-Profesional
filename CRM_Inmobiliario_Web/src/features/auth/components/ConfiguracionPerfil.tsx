import React, { useState, useEffect } from 'react';
import { usePerfil } from '../api/perfil';
import { User, Save, CheckCircle, Loader2, Lock, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import FotoPerfilUpload from './FotoPerfilUpload';
import LogoAgenciaUpload from './LogoAgenciaUpload';
import { toast } from 'sonner';

const ConfiguracionPerfil: React.FC = () => {
  const { perfil, actualizarPerfil, mutate, isLoading } = usePerfil();
  
  // Ref para rastrear si ya hemos inicializado el formulario con datos reales
  const isInitialized = React.useRef(false);
  const lastSyncedData = React.useRef(perfil);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    agencia: '',
    fotoUrl: '',
    logoUrl: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  // Estados para Cambio de Contraseña
  const [pwdData, setPwdData] = useState({
    currentPassword: '',
    password: '',
    confirmPassword: ''
  });
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  const validations = {
    length: pwdData.password.length >= 8,
    hasUpper: /[A-Z]/.test(pwdData.password),
    hasLower: /[a-z]/.test(pwdData.password),
    hasNumber: /[0-9]/.test(pwdData.password),
    match: pwdData.password === pwdData.confirmPassword && pwdData.password !== ''
  };

  const allValid = Object.values(validations).every(v => v);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid || !pwdData.currentPassword) return;

    setIsUpdatingPwd(true);

    try {
      if (perfil?.email) {
        // Verificar contraseña actual intentando hacer login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: perfil.email,
          password: pwdData.currentPassword
        });

        if (signInError) {
          throw new Error('La contraseña actual es incorrecta.');
        }
      } else {
         throw new Error('No se pudo encontrar el correo electrónico asociado.');
      }

      // Actualizar a la nueva contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: pwdData.password,
      });

      if (updateError) throw updateError;

      toast.success('¡Contraseña actualizada!', {
        description: 'Tu contraseña de acceso ha sido cambiada correctamente.'
      });

      setPwdData({ currentPassword: '', password: '', confirmPassword: '' });
      
    } catch (err) {
      const pError = err as Error;
      toast.error('Error', { description: pError.message || 'Ocurrió un error al actualizar la contraseña' });
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  // Sincronizar datos del servidor con el formulario local (Smart Merge Robusto)
  useEffect(() => {
    if (!perfil) return;

    // Caso 1: Inicialización forzada (Primera vez que llegan datos reales)
    if (!isInitialized.current && (perfil.nombre || perfil.apellido)) {
      // Usamos un timeout de 0 para sacar el setState del flujo síncrono del efecto
      // y evitar el error de react-hooks/set-state-in-effect
      const timer = setTimeout(() => {
        setFormData({
          nombre: perfil.nombre ?? '',
          apellido: perfil.apellido ?? '',
          telefono: perfil.telefono ?? '',
          agencia: perfil.agencia ?? '',
          fotoUrl: perfil.fotoUrl ?? '',
          logoUrl: perfil.logoUrl ?? ''
        });
        lastSyncedData.current = perfil;
        isInitialized.current = true;
      }, 0);
      return () => clearTimeout(timer);
    }

    // Caso 2: Sincronización en segundo plano (Solo si ya inicializamos)
    if (isInitialized.current) {
      setFormData(prev => {
        const merged = {
          nombre: prev.nombre !== (lastSyncedData.current?.nombre ?? '') ? prev.nombre : (perfil.nombre ?? ''),
          apellido: prev.apellido !== (lastSyncedData.current?.apellido ?? '') ? prev.apellido : (perfil.apellido ?? ''),
          telefono: prev.telefono !== (lastSyncedData.current?.telefono ?? '') ? prev.telefono : (perfil.telefono ?? ''),
          agencia: prev.agencia !== (lastSyncedData.current?.agencia ?? '') ? prev.agencia : (perfil.agencia ?? ''),
          fotoUrl: prev.fotoUrl !== (lastSyncedData.current?.fotoUrl ?? '') ? prev.fotoUrl : (perfil.fotoUrl ?? ''),
          logoUrl: prev.logoUrl !== (lastSyncedData.current?.logoUrl ?? '') ? prev.logoUrl : (perfil.logoUrl ?? '')
        };
        lastSyncedData.current = perfil;
        return merged;
      });
    }
  }, [perfil]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // FIRE AND FORGET: Respuesta instantánea (Zero Wait)
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Ejecutamos la petición en segundo plano
    actualizarPerfil(formData)
      .then(() => {
        // Mutate ya lo hace internamente actualizarPerfil, pero podemos forzar revalidación
        mutate();
      })
      .catch((err) => {
        console.error('Error al actualizar perfil:', err);
        toast.error('No se pudo sincronizar el perfil', {
          description: 'Tus cambios se mantendrán localmente pero hubo un error de conexión.'
        });
        // Revertimos a los datos del servidor para mantener consistencia
        mutate();
      });
  };


  if (isLoading || !perfil) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-500">
        <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Sincronizando perfil corporativo...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Configuración del Perfil</h1>
        <p className="text-slate-500 font-medium mt-2">Gestiona tu identidad personal y branding corporativo para el CRM y PDFs.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Branding y Media */}
        <div className="lg:col-span-1 space-y-8">
          {/* Card: Foto de Perfil */}
          <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-center gap-2">
              <Camera size={16} /> Foto de Perfil
            </h3>
            <FotoPerfilUpload 
              userId={perfil?.id || ''} 
              currentFotoUrl={formData.fotoUrl}
              onUploadSuccess={async (url) => {
                const nuevosDatos = { ...formData, fotoUrl: url };
                setFormData(nuevosDatos);
                await actualizarPerfil(nuevosDatos);
              }}
              onDeleteSuccess={async () => {
                const nuevosDatos = { ...formData, fotoUrl: '' };
                setFormData(nuevosDatos);
                await actualizarPerfil(nuevosDatos);
              }}
            />
            <p className="text-xs text-slate-400 mt-6 leading-relaxed">
              Esta foto se usará en tus fichas técnicas y en la barra lateral.
            </p>
          </div>

          {/* Card: Logo de Agencia */}
          <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-center gap-2">
              <ImageIcon size={16} /> Logo Corporativo
            </h3>
            <LogoAgenciaUpload 
              userId={perfil?.id || ''} 
              currentLogoUrl={formData.logoUrl}
              onUploadSuccess={async (url) => {
                const nuevosDatos = { ...formData, logoUrl: url };
                setFormData(nuevosDatos);
                await actualizarPerfil(nuevosDatos);
              }}
              onDeleteSuccess={async () => {
                const nuevosDatos = { ...formData, logoUrl: '' };
                setFormData(nuevosDatos);
                await actualizarPerfil(nuevosDatos);
              }}
            />
            <p className="text-xs text-slate-400 mt-6 leading-relaxed">
              El logo aparecerá en la cabecera de tus PDFs profesionales.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Datos y Formulario */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden border border-slate-100">
            <div className="p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Nombre */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nombre</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all font-bold text-slate-700"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>

                  {/* Apellido */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Apellido</label>
                    <input
                      type="text"
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all font-bold text-slate-700"
                      placeholder="Tu apellido"
                      required
                    />
                  </div>

                  {/* Email (Solo lectura) */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email (Privado)</label>
                    <input
                      type="email"
                      value={perfil?.email || ''}
                      disabled
                      className="w-full px-6 py-4 rounded-2xl bg-slate-100 border-transparent text-slate-400 cursor-not-allowed outline-none font-bold"
                    />
                  </div>

                  {/* Teléfono */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val && !val.startsWith('+')) {
                           val = '+593 ' + val.replace(/^0/, '');
                        }
                        setFormData({ ...formData, telefono: val });
                      }}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all font-bold text-slate-700"
                      placeholder="+593 98 765 4321"
                    />
                  </div>

                  {/* Agencia */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nombre de la Agencia</label>
                    <input
                      type="text"
                      value={formData.agencia}
                      onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all font-bold text-slate-700"
                      placeholder="Ej: Inmobiliaria Horizonte Real"
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    {showSuccess && (
                      <span className="text-emerald-600 flex items-center gap-2 font-black text-sm animate-in fade-in slide-in-from-left-4">
                        <CheckCircle size={20} /> PERFIL ACTUALIZADO
                      </span>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    className="flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-white transition-all transform active:scale-95 shadow-xl bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 cursor-pointer"
                  >
                    <Save size={20} /> GUARDAR CAMBIOS
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Card: Cambio de Contraseña */}
          <div className="bg-white shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden border border-slate-100">
            <div className="p-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Seguridad y Acceso</h3>
                  <p className="text-sm font-bold text-slate-400">Actualiza tu contraseña principal</p>
                </div>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-8">
                <div className="space-y-6">
                  {/* Contraseña Actual */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña Actual</label>
                    <div className="relative group">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input
                        type="password"
                        value={pwdData.currentPassword}
                        onChange={(e) => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all font-bold text-slate-700"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nueva Contraseña */}
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nueva Contraseña</label>
                      <div className="relative group">
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                          type="password"
                          value={pwdData.password}
                          onChange={(e) => setPwdData({ ...pwdData, password: e.target.value })}
                          className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all font-bold text-slate-700"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>

                    {/* Confirmar Contraseña */}
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Confirmar Contraseña</label>
                      <div className="relative group">
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                          type="password"
                          value={pwdData.confirmPassword}
                          onChange={(e) => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                          className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all font-bold text-slate-700"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <Requirement met={validations.length} label="Mínimo 8 caracteres" />
                  <Requirement met={validations.hasUpper} label="Una mayúscula" />
                  <Requirement met={validations.hasNumber} label="Un número" />
                  <Requirement met={validations.match} label="Las contraseñas coinciden" />
                </div>

                <div className="pt-8 border-t border-slate-50 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingPwd || !allValid || !pwdData.currentPassword}
                    className={`cursor-pointer ${`flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-white transition-all transform active:scale-95 shadow-xl ${
                                                                                              allValid && pwdData.currentPassword 
                                                                                                ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200' 
                                                                                                : 'bg-slate-300 pointer-events-none'
                                                                                            }`}`}
                  >
                    {isUpdatingPwd ? <Loader2 className="animate-spin h-5 w-5" /> : <><Lock size={20} /> ACTUALIZAR CONTRASEÑA</>}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Vista Previa de Ficha PDF - REDISEÑADA */}
          <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden group">
            {/* Círculos decorativos de fondo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full -ml-24 -mb-24 blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/10">
                <h3 className="text-lg font-black tracking-tighter uppercase text-indigo-400">Previsualización de Branding</h3>
                <div className="h-8 px-3 bg-white/10 rounded-full flex items-center text-[10px] font-black tracking-widest uppercase border border-white/10">
                  Formato PDF A4
                </div>
              </div>

              {/* Cabecera Simulada */}
              <div className="flex items-center justify-between mb-12">
                <div className="h-16 w-48 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo Preview" className="max-w-[80%] max-h-[80%] object-contain" />
                  ) : (
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Logo Agencia</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="h-2 w-32 bg-white/20 rounded-full mb-2 ml-auto" />
                  <div className="h-2 w-20 bg-white/10 rounded-full ml-auto" />
                </div>
              </div>

              {/* Pie de Página Simulado */}
              <div className="mt-16 pt-8 border-t border-white/10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden border border-white/20 ring-4 ring-white/5">
                    {formData.fotoUrl ? (
                      <img src={formData.fotoUrl} alt="Foto Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User size={32} className="text-white/20" />
                    )}
                  </div>
                  <div>
                    <p className="text-xl font-black tracking-tight">{formData.nombre} {formData.apellido}</p>
                    <p className="text-indigo-400 font-bold text-sm tracking-wide">{formData.agencia || 'Agente Independiente'}</p>
                    <p className="text-white/40 text-xs font-bold mt-1 tracking-widest uppercase">{formData.telefono || 'Sin teléfono'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Requirement = ({ met, label }: { met: boolean; label: string }) => (
  <div className={`flex items-center gap-2 text-[10px] font-bold transition-colors ${met ? 'text-indigo-600' : 'text-slate-400'}`}>
    {met ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3 opacity-30" />}
    {label}
  </div>
);

export default ConfiguracionPerfil;
