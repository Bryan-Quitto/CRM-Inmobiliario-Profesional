import { ManualKnowledgeDesktop } from './ManualKnowledgeDesktop';
import { ManualKnowledgeMobile } from './ManualKnowledgeMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const ManualKnowledge = () => {
  const isMobile = useIsMobile();
  return (
    <div className="w-full">
      {isMobile ? (
        <ManualKnowledgeMobile />
      ) : (
        <ManualKnowledgeDesktop />
      )}
    </div>
  );
};
