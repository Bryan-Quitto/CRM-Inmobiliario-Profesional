import { SWRConfig } from 'swr';
import { localStorageProvider } from '@/lib/swr';
import { usePropiedadesListLogic } from '../hooks/usePropiedadesListLogic';

import { PropiedadesListDesktop } from './PropiedadesListDesktop';
import { PropiedadesListMobile } from './PropiedadesListMobile';
import { PropiedadesModalsOrchestrator } from './propiedades-list-sections/PropiedadesModalsOrchestrator';

const PropiedadesOrchestrator = () => {
  const logic = usePropiedadesListLogic();

  return (
    <>
      <PropiedadesListDesktop logic={logic} />
      <PropiedadesListMobile logic={logic} />
      
      <PropiedadesModalsOrchestrator 
        propiedades={logic.propiedades}
        selectedPropiedadId={logic.selectedPropiedadId}
        handleCloseDetail={logic.handleCloseDetail}
        handleCoverUpdate={logic.handleCoverUpdate}
        selectedPropiedadIdForEdit={logic.selectedPropiedadIdForEdit}
        setSelectedPropiedadIdForEdit={logic.setSelectedPropiedadIdForEdit}
        mutate={logic.mutate}
        isModalOpen={logic.isModalOpen}
        setIsModalOpen={logic.setIsModalOpen}
        statusConfirmation={logic.statusConfirmation}
        setStatusConfirmation={logic.setStatusConfirmation}
        handleStatusChange={logic.handleStatusChange}
        closingPropiedad={logic.closingPropiedad}
        setClosingPropiedad={logic.setClosingPropiedad}
        handleClosingConfirm={logic.handleClosingConfirm}
        showReversionModal={logic.showReversionModal}
        setShowReversionModal={logic.setShowReversionModal}
        handleRelistPropiedad={logic.handleRelistPropiedad}
      />
    </>
  );
};

export const PropiedadesList = () => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <PropiedadesOrchestrator />
    </SWRConfig>
  );
};
