import { useState } from 'react';
import { ClientesList } from './features/clientes/components/ClientesList';
import { 
  Users, 
  Home, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Bell,
  Search
} from 'lucide-react';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { icon: <Users className="h-5 w-5" />, label: 'Prospectos', active: true },
    { icon: <Home className="h-5 w-5" />, label: 'Propiedades', active: false },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Ventas y KPIs', active: false },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full bg-slate-900 text-slate-400 transition-all duration-300 z-[100] shadow-2xl flex flex-col ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="min-w-[36px] h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/20">
              C
            </div>
            {isSidebarOpen && (
              <span className="text-lg font-black tracking-tight text-white animate-in fade-in duration-500">
                CRM<span className="text-blue-500">Pro</span>
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all group relative ${
                item.active 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className={item.active ? 'text-white' : 'group-hover:scale-110 transition-transform'}>
                {item.icon}
              </div>
              {isSidebarOpen && (
                <span className="text-sm font-bold animate-in fade-in slide-in-from-left-2 duration-300">
                  {item.label}
                </span>
              )}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-4 px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800/50 space-y-2">
          <button className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-slate-800 hover:text-slate-200 transition-all group relative">
            <Settings className="h-5 w-5 group-hover:rotate-45 transition-transform" />
            {isSidebarOpen && <span className="text-sm font-bold">Configuración</span>}
          </button>
          <button className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-all group relative">
            <LogOut className="h-5 w-5" />
            {isSidebarOpen && <span className="text-sm font-bold">Cerrar Sesión</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-24 h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-[110]"
        >
          {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header Superior */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Búsqueda global..." 
                className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900">Agente Demo</p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Admin Global</p>
              </div>
              <div className="h-10 w-10 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-sm">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8 max-w-7xl mx-auto w-full">
          <ClientesList />
        </main>

        {/* Minimal Footer inside content */}
        <footer className="p-8 border-t border-slate-100 mt-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
            <p>© 2026 CRM Inmobiliario Profesional. v1.1.0-Elite</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                Cloud Systems Active
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
