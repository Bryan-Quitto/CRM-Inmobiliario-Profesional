import { create } from 'zustand';

interface HelpDrawerState {
  isOpen: boolean;
  title: string;
  markdownPath?: string;
  customContent?: string;
  openHelp: (title: string, data: { path?: string; content?: string }) => void;
  closeHelp: () => void;
}

export const useHelpDrawerStore = create<HelpDrawerState>((set) => ({
  isOpen: false,
  title: '',
  markdownPath: undefined,
  customContent: undefined,
  openHelp: (title, { path, content }) => set({ isOpen: true, title, markdownPath: path, customContent: content }),
  closeHelp: () => set({ isOpen: false, title: '', markdownPath: undefined, customContent: undefined })
}));
