import { create } from "zustand";

interface TranslationStore {
  selectedKey: string | null;
  editValue: string;

  setSelectedKey: (key: string | null) => void;
  setEditValue: (value: string) => void;
  resetState: () => void;
}

export const useTranslationStore = create<TranslationStore>((set) => ({
  selectedKey: null,
  editValue: "",

  setSelectedKey: (key) => set({ selectedKey: key }),
  setEditValue: (value) => set({ editValue: value }),
  resetState: () => set({ selectedKey: null, editValue: "" }),
}));
