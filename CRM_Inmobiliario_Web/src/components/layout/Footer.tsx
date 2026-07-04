export const Footer = () => (
  <footer className="p-8 border-t border-slate-100 mt-auto">
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-600 text-[11px] font-bold uppercase tracking-widest">
      <p>© 2026 Lúmina CRM. v1.1.0-Elite</p>
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="flex gap-4">
          <a href="/terminos" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Términos</a>
          <span>•</span>
          <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Privacidad</a>
        </div>
        <span className="flex items-center gap-2 text-slate-500">
          <div className="h-2 w-2 bg-emerald-600 rounded-full animate-pulse"></div>
          Sistemas Operativos en la Nube
        </span>
      </div>
    </div>
  </footer>
);
