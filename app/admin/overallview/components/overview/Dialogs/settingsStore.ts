// settingsStore.ts
import { create } from 'zustand';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { VisibilitySettings, OrderSettings } from './visibilityHandler';

interface SettingsState {
  // Structure State
  structure: any[];
  selectedTab: string;
  selectedSection: { section: string } | null;
  selectedSubsection: string | null;
  uniqueTabs: string[];
  mappingData: any;
  
  // Visibility State
  visibilitySettings: VisibilitySettings;
  orderSettings: OrderSettings;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setStructure: (structure: any[]) => void;
  setSelectedTab: (tab: string) => void;
  setSelectedSection: (section: { section: string } | null) => void;
  setSelectedSubsection: (subsection: string | null) => void;
  setVisibilitySettings: (settings: VisibilitySettings) => void;
  setOrderSettings: (settings: OrderSettings) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial State
  structure: [],
  selectedTab: '',
  selectedSection: null,
  selectedSubsection: null,
  uniqueTabs: [],
  mappingData: null,
  visibilitySettings: {
    tabs: {},
    sections: {},
    subsections: {},
    fields: {}
  },
  orderSettings: {
    tabs: {},
    sections: {},
    subsections: {},
    fields: {}
  },
  isLoading: false,
  error: null,

  // Basic Actions
  setStructure: (structure) => set({ structure }),
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  setSelectedSection: (section) => set({ selectedSection: section }),
  setSelectedSubsection: (subsection) => set({ selectedSubsection: subsection }),
  setVisibilitySettings: (settings) => set({ visibilitySettings: settings }),
  setOrderSettings: (settings) => set({ orderSettings: settings }),
}));
