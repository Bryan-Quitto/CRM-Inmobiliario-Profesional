/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Proveedor de persistencia para SWR basado en LocalStorage.
 * Implementa el Ultra-Premium Sync Pattern (UPSP) para carga instantánea.
 */
export const localStorageProvider = () => {
  const CACHE_KEY = 'crm-swr-cache-v2';
  
  // Inicializar mapa desde LocalStorage con tipo any para compatibilidad con SWR internals
  const map = new Map<string, any>(
    JSON.parse(localStorage.getItem(CACHE_KEY) || '[]')
  );
  
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  // Función de guardado atómico y asíncrono en batch (evita el congelamiento del Main Thread)
  const save = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      try {
        const entries = Array.from(map.entries());
        // LRU Cache: Limitar a las 30 peticiones más recientes para no exceder la cuota de 5MB
        const recentEntries = entries.slice(-30);
        const appCache = JSON.stringify(recentEntries);
        localStorage.setItem(CACHE_KEY, appCache);
      } catch {
        localStorage.removeItem(CACHE_KEY);
      }
    }, 500); // 500ms debounce
  };

  // Interceptar set para persistencia automática
  const originalSet = map.set.bind(map);
  map.set = (key: string, value: any) => {
    // Al eliminar y volver a insertar, movemos la llave al final (LRU: Most Recently Used)
    if (map.has(key)) {
      map.delete(key);
    }
    const result = originalSet(key, value);
    save();
    return result;
  };

  return map as any;
};

/**
 * Configuración base recomendada para hooks useSWR (UPSP)
 */
export const swrDefaultConfig = {
  dedupingInterval: 10000, // 10s para evitar peticiones redundantes
  revalidateOnFocus: false, // Evitar refetch al cambiar de pestaña si los datos son recientes
  revalidateIfStale: true,  // Revalidar en segundo plano si hay datos viejos
  keepPreviousData: true    // Mantener datos anteriores visibles (Zero Wait)
};

/**
 * Helper to globally invalidate CRM data across lists, dropdowns and analytics.
 */
export const invalidateCRMData = (mutate: any, features: string[] = ['contactos', 'tareas', 'calendario', 'propiedades', 'agenda']) => {
  // Disparar evento personalizado para que los hooks principales escuchen y fuercen su propio mutate ligado.
  // Esto soluciona de raíz los bugs de `mutate(filterFn)` de SWR con llaves tipo arreglo.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('crm-invalidate', { detail: { features } }));
  }

  // Mantener el mutate global para endpoints simples tipo string
  mutate(
    (key: any) => {
      try {
        const keyStr = typeof key === 'string' ? key : JSON.stringify(key);
        const isMatch = keyStr.includes('/dashboard') || 
                        keyStr.includes('/analitica') || 
                        keyStr.includes('/ia/logs') || 
                        features.some(f => keyStr.includes(`/${f}`));
        return isMatch;
      } catch {
        return false;
      }
    },
    (currentData: any) => currentData,
    { revalidate: true }
  );
};
