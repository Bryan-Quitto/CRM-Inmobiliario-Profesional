import { MessageSquare, MessageCircle, User, Settings2, type LucideIcon } from 'lucide-react';

export interface IaLogsLayoutLogicReturn {
  tabs: { path: string; label: string; icon: LucideIcon }[];
}

export const useIaLogsLayoutLogic = (): IaLogsLayoutLogicReturn => {
  const tabs = [
    { path: '/registros-sistema-ia/whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { path: '/registros-sistema-ia/facebook', label: 'Facebook', icon: MessageCircle },
    { path: '/registros-sistema-ia/personal', label: 'Personal', icon: User },
    { path: '/registros-sistema-ia/general', label: 'General', icon: Settings2 },
  ];

  return { tabs };
};
