/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Proveedor de persistencia para SWR basado en LocalStorage.
 * Implementa el Ultra-Premium Sync Pattern (UPSP) para carga instantánea.
 */
export const localStorageProvider = () => {
  const CACHE_KEY = 'crm-swr-cache';
  
  // Inicializar mapa desde LocalStorage con tipo any para compatibilidad con SWR internals
  const map = new Map<string, any>(
    JSON.parse(localStorage.getItem(CACHE_KEY) || '[]')
  );
  
  // Función de guardado atómico
  const save = () => {
    try {
      const appCache = JSON.stringify(Array.from(map.entries()));
      localStorage.setItem(CACHE_KEY, appCache);
    } catch (error) {
      console.error('Error guardando en SWR Cache:', error);
    }
  };

  // Interceptar set para persistencia automática
  const originalSet = map.set.bind(map);
  map.set = (key: string, value: any) => {
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
