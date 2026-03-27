import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-cyan-500/30">
      <main className="max-w-4xl mx-auto px-6 py-20 flex flex-col items-center justify-center space-y-12">
        <div className="relative flex items-center justify-center gap-8">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <a href="https://vite.dev" target="_blank" className="relative transition-transform hover:scale-110 duration-300">
            <img src={viteLogo} className="w-24 h-24" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank" className="relative transition-transform hover:scale-110 duration-300">
            <img src={reactLogo} className="w-24 h-24" alt="React logo" />
          </a>
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
            CRM Inmobiliario Profesional
          </h1>
          <p className="text-neutral-400 text-lg max-w-md mx-auto">
            Inicializando arquitectura <span className="text-cyan-400 font-mono">Vertical Slice</span> & <span className="text-blue-400 font-mono">Feature-Sliced</span>.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={() => setCount((count) => count + 1)}
            className="px-8 py-4 bg-white text-neutral-900 rounded-xl font-bold transition-all hover:bg-neutral-200 active:scale-95 shadow-xl shadow-white/5"
          >
            Contador: {count}
          </button>
          
          <p className="text-neutral-500 text-sm">
            Edita <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-cyan-300">src/App.tsx</code> para comenzar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-12 border-t border-neutral-800">
          <a 
            href="https://vite.dev/guide/features.html" 
            target="_blank"
            className="group p-6 rounded-2xl bg-neutral-800/50 border border-neutral-700/50 hover:border-cyan-500/50 transition-all duration-300"
          >
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2 group-hover:text-cyan-400">
              Documentación <span className="transition-transform group-hover:translate-x-1">→</span>
            </h2>
            <p className="text-neutral-400 text-sm">Explora las capacidades de Vite y React 19 en este entorno profesional.</p>
          </a>
          
          <div className="p-6 rounded-2xl bg-neutral-800/50 border border-neutral-700/50">
            <h2 className="text-xl font-bold mb-2 text-white/90">Stack Detectado</h2>
            <ul className="text-sm space-y-2 text-neutral-400">
              <li className="flex items-center gap-2 italic">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                React 19 + Tailwind 4
              </li>
              <li className="flex items-center gap-2 italic">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                .NET 10 Minimal APIs
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
