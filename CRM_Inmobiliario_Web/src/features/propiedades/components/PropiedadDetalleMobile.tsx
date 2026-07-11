import { Loader2, MapPin, Handshake, Bed, Bath, CarFront, Maximize, Ruler, AlertTriangle } from 'lucide-react';
import { DetalleHeader } from './propiedad-detalle-sections/DetalleHeader';
import { DetalleModalsOrchestrator } from './propiedad-detalle-sections/DetalleModalsOrchestrator';
import { DetalleFaqManager } from './propiedad-detalle-sections/DetalleFaqManager';
import { formatCurrency, type PropiedadDetalleLogic } from '../hooks/usePropiedadDetalleLogic';
import type { MultimediaPropiedad } from '../types';
import { TruncatedText } from '@/components/ui/TruncatedText';

interface Props {
  id: string;
  onClose: () => void;
  logic: PropiedadDetalleLogic;
}

export const PropiedadDetalleMobile = ({ id, onClose, logic }: Props) => {
  const {
    activeTab, setActiveTab, user, propiedad, syncing, isUpdatingStatus,
    statusConfirmation, isClosingModalOpen, closingState, isStatusDropdownOpen, showEditModal,
    showReversionModal, setIsStatusDropdownOpen, setShowEditModal, setStatusConfirmation,
    setIsClosingModalOpen, setClosingState, setShowReversionModal, handleClosingConfirm,
    handleStatusChange, handleRelist, handleCancelTransaction, mutate, isTogglingArchive,
    handleToggleArchive, handleWhatsAppShare, handleMessengerShare
  } = logic;

  if (!propiedad && syncing) {
    return (
      <div className="fixed inset-0 z-[200] flex lg:hidden bg-white items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-2 w-full px-2">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin shrink-0" />
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse text-center break-words w-full">Sincronizando...</p>
        </div>
      </div>
    );
  }

  if (!propiedad) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col lg:hidden bg-white overflow-hidden">
      {syncing && (
        <div className="absolute top-20 right-4 z-[100] animate-in slide-in-from-top-4">
          <div className="bg-slate-900/90 text-white px-2 py-2 rounded-full shadow-2xl flex items-center gap-2 max-w-[90vw]">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
            <TruncatedText as="span" className="text-[10px] font-black uppercase tracking-[0.2em] truncate">Sync...</TruncatedText>
          </div>
        </div>
      )}

      <DetalleHeader
        id={id}
        propiedad={propiedad}
        onClose={onClose}
        onShowEditModal={() => setShowEditModal(true)}
        isUpdatingStatus={isUpdatingStatus}
        isStatusDropdownOpen={isStatusDropdownOpen}
        setIsStatusDropdownOpen={setIsStatusDropdownOpen}
        handleStatusChange={handleStatusChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        handleWhatsAppShare={handleWhatsAppShare}
        handleMessengerShare={handleMessengerShare}
        isTogglingArchive={isTogglingArchive}
        onToggleArchive={handleToggleArchive}
      />

      <div className="flex-1 overflow-y-auto p-2 pb-6 space-y-4 w-full">
        {activeTab === 'detalle' && (
          <>
            {propiedad.fechaProgramadaLimpiezaR2 && (
              <div className="bg-red-500 text-white p-3 rounded-xl shadow-lg border border-red-600 flex flex-col items-center gap-2 w-full">
                <div className="bg-white/20 p-2 rounded-full shrink-0">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 text-center">
                  <h4 className="font-black uppercase tracking-wider text-sm mb-1">Limpieza programada</h4>
                  <p className="text-xs font-medium text-red-50">
                    {propiedad.estadoComercial === 'Vendida' || propiedad.estadoComercial === 'Alquilada' ? (
                      <>Sus imágenes secundarias y su archivo PDF serán eliminados el <strong>{new Date(propiedad.fechaProgramadaLimpiezaR2).toLocaleDateString('es-ES')}</strong> al cumplir 1 año de cierre.</>
                    ) : (
                      <>Sus imágenes serán eliminadas el <strong>{new Date(propiedad.fechaProgramadaLimpiezaR2).toLocaleDateString('es-ES')}</strong>. Registra una actividad para cancelar automáticamente.</>
                    )}
                  </p>
                </div>
              </div>
            )}
            {/* Hero Info */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-wrap items-center gap-2 w-full">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase">
                  {propiedad.tipoPropiedad}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${propiedad.operacion === 'Venta' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                  {propiedad.operacion}
                </span>
                <span className="text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md uppercase flex items-center gap-1 max-w-full">
                  <Handshake className="h-3 w-3 shrink-0" /> 
                  <TruncatedText as="span" className="truncate flex-1 min-w-0">Captación: {propiedad.agenteNombre || 'Externa'}</TruncatedText>
                </span>
              </div>
              
              <h1 className="text-lg md:text-2xl font-black text-slate-900 break-words leading-tight w-full">{propiedad.titulo}</h1>
              
              <div className="flex items-start gap-2 text-slate-500 w-full">
                <MapPin className="h-4 w-4 shrink-0 mt-1 text-indigo-500" />
                <p className="text-sm font-medium break-words leading-snug flex-1 min-w-0">{propiedad.direccion || `${propiedad.sector}, ${propiedad.ciudad}`}</p>
              </div>

              <div className="bg-indigo-50 p-2 rounded-xl flex flex-col items-center w-full text-center">
                <p className="text-xs font-bold text-indigo-600/50 uppercase tracking-widest mb-1 break-words w-full">Precio de {propiedad.operacion}</p>
                <p className="text-xl md:text-3xl font-black text-indigo-600 break-words w-full">{formatCurrency(propiedad.precio)}</p>

              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-col gap-3 w-full">
              {['Casa', 'Departamento', 'Suite', 'Local Comercial', 'Oficina', 'Hotel'].includes(propiedad.tipoPropiedad) && (
                <div className="flex justify-between bg-slate-50 p-2 rounded-lg border border-slate-100 w-full gap-2">
                  <div className="flex items-center gap-2 text-slate-600 min-w-0"><Bed className="h-4 w-4 shrink-0" /> <TruncatedText as="span" className="text-sm font-bold truncate">Habitaciones</TruncatedText></div>
                  <span className="text-sm font-black text-slate-900 shrink-0">{propiedad.habitaciones || 0}</span>
                </div>
              )}
              {['Casa', 'Departamento', 'Suite', 'Local Comercial', 'Oficina', 'Hotel'].includes(propiedad.tipoPropiedad) && (
                <div className="flex justify-between bg-slate-50 p-2 rounded-lg border border-slate-100 w-full gap-2">
                  <div className="flex items-center gap-2 text-slate-600 min-w-0"><Bath className="h-4 w-4 shrink-0" /> <TruncatedText as="span" className="text-sm font-bold truncate">Baños</TruncatedText></div>
                  <span className="text-sm font-black text-slate-900 shrink-0">{propiedad.banos || 0}</span>
                </div>
              )}
              {propiedad.estacionamientos && propiedad.estacionamientos > 0 ? (
                <div className="flex justify-between bg-slate-50 p-2 rounded-lg border border-slate-100 w-full gap-2">
                  <div className="flex items-center gap-2 text-slate-600 min-w-0"><CarFront className="h-4 w-4 shrink-0" /> <TruncatedText as="span" className="text-sm font-bold truncate">Parqueaderos</TruncatedText></div>
                  <span className="text-sm font-black text-slate-900 shrink-0">{propiedad.estacionamientos}</span>
                </div>
              ) : null}
              <div className="flex justify-between bg-indigo-50 p-2 rounded-lg border border-indigo-100 w-full gap-2">
                <div className="flex items-center gap-2 text-indigo-600 min-w-0"><Maximize className="h-4 w-4 shrink-0" /> <TruncatedText as="span" className="text-sm font-bold truncate">Área Construcción</TruncatedText></div>
                <span className="text-sm font-black text-indigo-900 shrink-0">{propiedad.areaConstruccion || 0} m²</span>
              </div>
              <div className="flex justify-between bg-slate-50 p-2 rounded-lg border border-slate-100 w-full gap-2">
                <div className="flex items-center gap-2 text-slate-600 min-w-0"><Ruler className="h-4 w-4 shrink-0" /> <TruncatedText as="span" className="text-sm font-bold truncate">Área Total</TruncatedText></div>
                <span className="text-sm font-black text-slate-900 shrink-0">{propiedad.areaTotal || 0} m²</span>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2 w-full">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest w-full">Descripción</h2>
              <p className="text-sm text-slate-600 leading-relaxed break-words whitespace-pre-wrap bg-slate-50 p-2 rounded-xl w-full">
                {propiedad.descripcion}
              </p>
            </div>

            {/* Gallery (Horizontal Scroll) */}
            <div className="flex flex-col gap-2 w-full overflow-hidden">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest w-full">Galería</h2>
              {propiedad.media && propiedad.media.length > 0 ? (
                <div className="flex w-full overflow-x-auto gap-2 snap-x snap-mandatory pb-4">
                  {propiedad.media.map((img: MultimediaPropiedad) => (
                    <img 
                      key={img.id}
                      src={img.urlPublica}
                      alt="propiedad media"
                      className="w-[85vw] h-64 object-cover rounded-xl snap-center shrink-0 border border-slate-200"
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center w-full">
                  <p className="text-sm font-bold text-slate-500">Sin imágenes</p>
                </div>
              )}
            </div>
            

            
          </>
        )}

        {activeTab === 'ia' && (
          <DetalleFaqManager
            propiedadId={propiedad.id}
            canManage={!!propiedad.permissions?.canEditMasterData}
            currentAgenteId={user?.id ?? ''}
            isArchived={propiedad.isArchivedForCurrentUser}
          />
        )}
      </div>

      <DetalleModalsOrchestrator
        propiedad={propiedad}
        statusConfirmation={statusConfirmation}
        ownerReactivationConfirmation={logic.ownerReactivationConfirmation}
        showEditModal={showEditModal}
        isClosingModalOpen={isClosingModalOpen}
        closingState={closingState}
        showReversionModal={showReversionModal}
        setStatusConfirmation={setStatusConfirmation}
        setOwnerReactivationConfirmation={logic.setOwnerReactivationConfirmation}
        setShowEditModal={setShowEditModal}
        setIsClosingModalOpen={setIsClosingModalOpen}
        setClosingState={setClosingState}
        setShowReversionModal={setShowReversionModal}
        handleStatusChange={handleStatusChange}
        handleClosingConfirm={handleClosingConfirm}
        handleRelist={handleRelist}
        handleCancelTransaction={handleCancelTransaction}
        mutate={() => mutate()}
      />
    </div>
  );
};
