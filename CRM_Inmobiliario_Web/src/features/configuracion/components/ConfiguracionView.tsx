import React, { useState } from 'react';
import ConfiguracionPerfil from '../../auth/components/ConfiguracionPerfil';
import { InvitarAgenteForm } from './InvitarAgenteForm';
import { UserCog, UserPlus, Building2, Plus, Loader2, Check } from 'lucide-react';
import { usePerfil } from '../../auth/api/perfil';
import { crearAgencia } from '../api/agencias';
import { toast } from 'sonner';

export const ConfiguracionView: React.FC = () => {
  const { perfil } = usePerfil();
  const ADMIN_ID = 'd4a6efdd-b801-40fb-901e-64e36f6b1400';
  const isAdmin = perfil?.id === ADMIN_ID;

  // Estado para creación de agencias
  const [nombreAgencia, setNombreAgencia] = useState('');
  const [creandoAgencia, setCreandoAgencia] = useState(false);
  const [agenciaCreada, setAgenciaCreada] = useState(false);

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
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfiguracionView;
