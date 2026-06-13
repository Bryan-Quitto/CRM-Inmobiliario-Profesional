import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';

export const ConfiguracionLayout: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-10 px-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">Panel de Control</h1>
        <p className="text-slate-500 font-medium mt-2">Gestiona tu identidad.</p>
      </header>

      <div className="px-6 mb-8">
        <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <NavLink
            to="perfil"
            className={({ isActive }) =>
              `cursor-pointer px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`
            }
          >
            Identidad
          </NavLink>
          <NavLink
            to="integracion-ia"
            className={({ isActive }) =>
              `cursor-pointer px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`
            }
          >
            IA y Límites
          </NavLink>
          {isAdmin && (
            <>
              <NavLink
                to="ia"
                className={({ isActive }) =>
                  `cursor-pointer px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`
                }
              >
                IA y Vectorización
              </NavLink>
              <NavLink
                to="organizacion"
                className={({ isActive }) =>
                  `cursor-pointer px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`
                }
              >
                Organización
              </NavLink>
              <NavLink
                to="agentes"
                className={({ isActive }) =>
                  `cursor-pointer px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`
                }
              >
                Agentes
              </NavLink>
              <NavLink
                to="agencias"
                className={({ isActive }) =>
                  `cursor-pointer px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`
                }
              >
                Agencias
              </NavLink>
              <NavLink
                to="seguridad"
                className={({ isActive }) =>
                  `cursor-pointer px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`
                }
              >
                Seguridad
              </NavLink>
            </>
          )}
        </nav>
      </div>

      <div className="animate-in fade-in duration-500">
        <Outlet />
      </div>
    </div>
  );
};

export default ConfiguracionLayout;
