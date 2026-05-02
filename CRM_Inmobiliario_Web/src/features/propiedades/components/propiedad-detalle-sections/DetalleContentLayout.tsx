import { Globe } from 'lucide-react';
import type { Propiedad } from '../../types';

interface DetalleContentLayoutProps {
  propiedad: Propiedad;
}

const getMapEmbedUrl = (url: string, direccionFisica: string) => {
  if (!url) return '';
  if (url.includes('/embed') || url.includes('output=embed')) return url;
  if (url.includes('maps.app.goo.gl')) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(direccionFisica)}&hl=es&z=16&output=embed`;
  }
  const matchCoordenadas = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (matchCoordenadas) {
    const lat = matchCoordenadas[1];
    const lng = matchCoordenadas[2];
    return `https://maps.google.com/maps?q=${lat},${lng}&hl=es&z=17&output=embed`;
  }
  try {
    const urlObj = new URL(url);
    const query = urlObj.searchParams.get('q') || urlObj.searchParams.get('query');
    if (query) return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=es&z=17&output=embed`;
  } catch { /* Ignorar */ }
  return `https://maps.google.com/maps?q=${encodeURIComponent(direccionFisica)}&hl=es&z=16&output=embed`;
};

export const DetalleContentLayout = ({ propiedad }: DetalleContentLayoutProps) => {
  return (
    <div className={`grid grid-cols-1 ${propiedad.googleMapsUrl ? 'lg:grid-cols-2' : ''} gap-8`}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-indigo-600 rounded-full"></div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Descripción</h3>
        </div>
        <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
          <p className="text-slate-600 font-medium contactoing-relaxed whitespace-pre-wrap">{propiedad.descripcion}</p>
        </div>
      </div>

      {propiedad.googleMapsUrl && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-rose-600 rounded-full"></div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ubicación</h3>
          </div>
          <div className="bg-slate-100 rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-inner h-[280px] relative group">
            <iframe
              title="Google Maps"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={getMapEmbedUrl(propiedad.googleMapsUrl, `${propiedad.direccion} ${propiedad.sector} ${propiedad.ciudad}`)}
            ></iframe>

            <a
              href={propiedad.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 left-2 bg-white px-6 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-[11px] font-black uppercase tracking-[0.15em] text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-3 border border-slate-100 z-20 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <div className="h-6 w-6 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Globe className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              Ver en Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
