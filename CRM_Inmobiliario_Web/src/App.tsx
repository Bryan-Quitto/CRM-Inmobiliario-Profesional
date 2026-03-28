import { ClientesList } from './features/clientes/components/ClientesList';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      {/* Navbar Minimalista */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/20">
              CRM
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Inmobiliario <span className="text-blue-600">Pro</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-bold text-blue-600 border-b-2 border-blue-600 py-5 transition-all">Prospectos</a>
            <a href="#" className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">Propiedades</a>
            <a href="#" className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">Ventas</a>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-9 w-9 bg-slate-100 rounded-full border border-slate-200 ring-2 ring-white"></div>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <ClientesList />
      </main>

      {/* Footer Corporativo */}
      <footer className="border-t border-slate-200 bg-white py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm font-medium">
            © 2026 CRM Inmobiliario Profesional. Sistema de Gestión de Alta Disponibilidad.
          </p>
          <div className="flex items-center gap-6 text-slate-300">
            <span className="text-[10px] font-bold uppercase tracking-widest">v1.0.0 Stable Build</span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
