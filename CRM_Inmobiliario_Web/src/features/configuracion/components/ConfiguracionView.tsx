import React, { useState } from 'react';
import ConfiguracionPerfil from '../../auth/components/ConfiguracionPerfil';
import { InvitarAgenteForm } from './InvitarAgenteForm';
import { BaseConocimientoSection } from './BaseConocimientoSection';
import { UserCog, UserPlus, Building2, Plus, Loader2, Check, Database, AlertTriangle, X } from 'lucide-react';
import { usePerfil } from '../../auth/api/perfil';
import { crearAgencia } from '../api/agencias';
import { toast } from 'sonner';
import { api } from '../../../lib/axios';

export const ConfiguracionView: React.FC = () => {
  const { perfil } = usePerfil();
  const ADMIN_ID = 'd4a6efdd-b801-40fb-901e-64e36f6b1400';
  const isAdmin = perfil?.id === ADMIN_ID;

  // Estado para creación de agencias
  const [nombreAgencia, setNombreAgencia] = useState('');
  const [creandoAgencia, setCreandoAgencia] = useState(false);
  const [agenciaCreada, setAgenciaCreada] = useState(false);

  // Estado para vectorización
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [showForceModal, setShowForceModal] = useState(false);

  const handleVectorize = async (force: boolean) => {
    setIsVectorizing(true);
    if (force) setShowForceModal(false);
    
    try {
      const response = await api.post('/admin/re-vectorize', { force });
      const count = response.data?.count || 0;
      toast.success('Proceso en segundo plano iniciado', { 
        description: force 
          ? `La re-vectorización de todas las propiedades (${count}) ha comenzado.` 
          : `La vectorización de ${count} propiedades faltantes ha comenzado.` 
      });
    } catch {
      toast.error('Error al iniciar la vectorización');
    } finally {
      setIsVectorizing(false);
    }
  };

  const handleCrearAgencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreAgencia.trim()) return;

    setCreandoAgencia(true);
    try {
      await crearAgencia(nombreAgencia);
      setAgenciaCreada(true);
      toast.success('Agencia creada', { description: `La agencia "${nombreAgencia}" ha sido registrada.` });
      setNombreAgencia('');
      setTimeout(() => setAgenciaCreada(false), 2000);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: string } };
      const msg = axiosError.response?.data || 'Error al crear la agencia';
      toast.error(msg);
    } finally {
      setCreandoAgencia(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-10 px-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">Panel de Control</h1>
        <p className="text-slate-500 font-medium mt-2">Gestiona tu identidad, el equipo de agentes y las agencias autorizadas.</p>
      </header>

      <div className="grid grid-cols-1 gap-12">
        {/* Sección: Mi Perfil */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-6">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <UserCog size={20} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Identidad Corporativa</h2>
          </div>
          <ConfiguracionPerfil />
        </section>

        {/* Sección: Administración (Solo Super Admin) */}
        {isAdmin && (
          <div className="space-y-12">
            {/* Gestión de Equipo */}
            <section className="space-y-6 bg-slate-100/50 p-8 rounded-[40px] border border-slate-200/60 animate-in fade-in slide-in-from-top-4 duration-1000">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <UserPlus size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Equipo</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-slate-600 font-medium contactoing-relaxed">
                    Invita a nuevos agentes y vinculalos a sus respectivas agencias. 
                    Recibirán un correo con un enlace seguro.
                  </p>
                  <ul className="space-y-3">
                    {[
                      'Acceso seguro por invitación.',
                      'Vinculación a agencias multi-tenant.',
                      'Configuración de contraseña al primer ingreso.',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <InvitarAgenteForm />
                </div>
              </div>
            </section>

            {/* Gestión de Agencias */}
            <section className="space-y-6 bg-indigo-50/30 p-8 rounded-[40px] border border-indigo-100/60 animate-in fade-in slide-in-from-bottom-4 duration-1000">
               <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Building2 size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Agencias</h2>
              </div>

              <div className="max-w-xl">
                <p className="text-slate-600 font-medium mb-6">
                  Registra nuevas agencias para organizar a tus agentes. Cada agencia podrá tener su propio equipo.
                </p>
                
                <form onSubmit={handleCrearAgencia} className="flex gap-2">
                  <div className="relative flex-1 group">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      value={nombreAgencia}
                      onChange={(e) => setNombreAgencia(e.target.value)}
                      placeholder="Nombre de la nueva agencia..."
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creandoAgencia || agenciaCreada || !nombreAgencia.trim()}
                    className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 shadow-sm
                      ${agenciaCreada 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100'
                      }`}
                  >
                    {creandoAgencia ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : agenciaCreada ? (
                      <Check size={18} className="animate-bounce" />
                    ) : (
                      <Plus size={18} />
                    )}
                    {creandoAgencia ? 'Creando...' : agenciaCreada ? '¡Creada!' : 'Crear Agencia'}
                  </button>
                </form>
              </div>
            </section>

            {/* Gestión de IA y Vectorización */}
            <section className="space-y-6 bg-slate-100/50 p-8 rounded-[40px] border border-slate-200/60 animate-in fade-in slide-in-from-bottom-4 duration-1000">
               <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Database size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">IA y Vectorización</h2>
              </div>

              <div className="max-w-xl">
                <p className="text-slate-600 font-medium mb-6">
                  Sincroniza los embeddings vectoriales de las propiedades para las búsquedas semánticas y recomendaciones. El proceso se ejecutará de forma asíncrona en segundo plano.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleVectorize(false)}
                    disabled={isVectorizing}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isVectorizing ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
                    Vectorizar Faltantes
                  </button>

                  <button
                    onClick={() => setShowForceModal(true)}
                    disabled={isVectorizing}
                    className="flex-1 px-6 py-3 bg-white text-rose-600 border-2 border-rose-100 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-rose-50 hover:border-rose-200 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <AlertTriangle size={18} />
                    Forzar Todas
                  </button>
                </div>
              </div>
            </section>

            {/* Ingestión de Conocimiento Corporativo (RAG) */}
            <BaseConocimientoSection />
          </div>
        )}
      </div>

      {/* Modal Confirmación Force Vectorización */}
      {showForceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
                  <AlertTriangle size={24} />
                </div>
                <button onClick={() => setShowForceModal(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">¿Forzar Re-Vectorización?</h3>
              <p className="text-slate-600 mb-8 font-medium">
                Esta acción sobrescribirá todos los vectores existentes. 
                Se consumirán tokens de OpenAI por cada propiedad registrada en el sistema. 
                ¿Estás seguro de que deseas continuar?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowForceModal(false)}
                  className="flex-1 px-4 py-3 font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleVectorize(true)}
                  className="flex-1 px-4 py-3 font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20"
                >
                  Sí, Forzar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfiguracionView;
