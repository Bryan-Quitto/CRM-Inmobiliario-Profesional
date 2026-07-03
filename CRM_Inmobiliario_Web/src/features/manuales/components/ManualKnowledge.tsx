import { ManualKnowledgeDesktop } from './ManualKnowledgeDesktop';
import { ManualKnowledgeMobile } from './ManualKnowledgeMobile';

export const ManualKnowledge = () => {
  return (
    <div className="w-full">
      <div className="hidden lg:block">
        <ManualKnowledgeDesktop />
      </div>
      <div className="block lg:hidden">
        <ManualKnowledgeMobile />
      </div>
    </div>
  );
};
