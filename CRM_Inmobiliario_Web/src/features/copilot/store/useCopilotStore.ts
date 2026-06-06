import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface CopilotState {
  isOpen: boolean;
  conversationId: string | null;
  messages: ChatMessage[];
  isTyping: boolean;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  setTyping: (typing: boolean) => void;
  addMessage: (msg: ChatMessage) => void;
  updateLastMessage: (chunk: string) => void;
  overwriteLastMessage: (content: string) => void;
  setConversationId: (id: string) => void;
  clearConversation: () => void;
  setMessages: (messages: ChatMessage[]) => void;
}

export const useCopilotStore = create<CopilotState>()(
  persist(
    (set) => ({
      isOpen: false,
      conversationId: null,
      messages: [],
      isTyping: false,
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
      setTyping: (typing) => set({ isTyping: typing }),
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      updateLastMessage: (chunk) =>
        set((state) => {
          const newMessages = [...state.messages];
          if (newMessages.length > 0) {
            const lastIndex = newMessages.length - 1;
            const lastMsg = newMessages[lastIndex];
            if (lastMsg.role === 'assistant') {
              newMessages[lastIndex] = {
                ...lastMsg,
                content: lastMsg.content + chunk,
              };
            }
          }
          return { messages: newMessages };
        }),
      overwriteLastMessage: (content) =>
        set((state) => {
          const newMessages = [...state.messages];
          if (newMessages.length > 0) {
            const lastIndex = newMessages.length - 1;
            const lastMsg = newMessages[lastIndex];
            if (lastMsg.role === 'assistant') {
              newMessages[lastIndex] = { ...lastMsg, content };
            }
          }
          return { messages: newMessages };
        }),
      setConversationId: (id) => set({ conversationId: id }),
      clearConversation: () => set({ conversationId: null, messages: [] }),
      setMessages: (messages) => set({ messages }),
    }),
    {
      name: 'crm_copilot_storage',
    }
  )
);
