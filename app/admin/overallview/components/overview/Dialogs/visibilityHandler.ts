// visibilityHandlers.ts
// @ts-nocheck
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useSettingsStore } from './settingsStore';

export interface VisibilitySettings {
  tabs: Record<string, boolean>;
  sections: Record<string, boolean>;
  subsections: Record<string, boolean>;
  fields: Record<string, boolean>;
}

export interface OrderSettings {
  tabs: Record<string, number>;
  sections: Record<string, number>;
  subsections: Record<string, number>;
  fields: Record<string, number>;
}

export const handleVisibilityToggle = async (
  type: keyof VisibilitySettings,
  key: string,
  value: boolean
) => {
  const updateVisibility = useSettingsStore.getState().updateVisibility;
  await updateVisibility(supabase, type, key, value);
};

export const handleOrderUpdate = async (
  type: keyof OrderSettings,
  items: { id: string; order: number }[]
) => {
  const updateOrder = useSettingsStore.getState().updateOrder;
  await updateOrder(supabase, type, items);
};

export const getVisibilityState = (structure: any): VisibilitySettings => {
  if (!structure?.visibility) {
    return {
      tabs: {},
      sections: {},
      subsections: {},
      fields: {}
    };
  }

  return {
    tabs: structure.visibility.tabs || {},
    sections: structure.visibility.sections || {},
    subsections: structure.visibility.subsections || {},
    fields: structure.visibility.fields || {}
  };
};

export const getOrderState = (structure: any): OrderSettings => {
  if (!structure?.order) {
    return {
      tabs: {},
      sections: {},
      subsections: {},
      fields: {}
    };
  }

  return {
    tabs: structure.order.tabs || {},
    sections: structure.order.sections || {},
    subsections: structure.order.subsections || {},
    fields: structure.order.fields || {}
  };
};