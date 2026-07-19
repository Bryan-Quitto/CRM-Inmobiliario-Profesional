export interface SuscripcionInfo {
  tier: 'Gratis' | 'Pro';
  status: 'Activo' | 'Inactivo' | 'Cancelado' | 'Pendiente';
  renuevaAutomaticamente: boolean;
  fechaProximoCobro?: string;
  agentesActivos: number;
  agentesPermitidos: number;
  precioMensualBase: number;
  precioPorAgenteAdicional: number;
}
