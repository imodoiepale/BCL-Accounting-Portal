// visibilityHandlers.ts
// @ts-nocheck
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

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

export const updateVisibility = async (
  id: number,
  type: 'tabs' | 'sections' | 'subsections' | 'fields',
  key: string,
  value: boolean
) => {
  try {
    const { data: existingRecord, error: fetchError } = await supabase
      .from('profile_category_table_mapping_2')
      .select('structure')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const updatedStructure = { ...existingRecord.structure };

    // Update visibility in the appropriate section
    if (type === 'tabs') {
      updatedStructure.visibility.tabs = {
        ...updatedStructure.visibility.tabs,
        [key]: value
      };
    } else if (type === 'sections') {
      // Find and update section visibility
      updatedStructure.sections = updatedStructure.sections.map(section => {
        if (section.name === key) {
          return { ...section, visible: value };
        }
        return section;
      });
    } else if (type === 'subsections') {
      // Find and update subsection visibility
      updatedStructure.sections = updatedStructure.sections.map(section => ({
        ...section,
        subsections: section.subsections.map(subsection => {
          if (subsection.name === key) {
            return { ...subsection, visible: value };
          }
          return subsection;
        })
      }));
    } else if (type === 'fields') {
      // Find and update field visibility
      updatedStructure.sections = updatedStructure.sections.map(section => ({
        ...section,
        subsections: section.subsections.map(subsection => ({
          ...subsection,
          fields: subsection.fields.map(field => {
            if (`${field.table}.${field.name}` === key) {
              return { ...field, visible: value };
            }
            return field;
          })
        }))
      }));
    }

    const { error: updateError } = await supabase
      .from('profile_category_table_mapping_2')
      .update({
        structure: updatedStructure,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Dispatch event to refresh the table
    window.dispatchEvent(new CustomEvent('structure-updated'));
    return true;
  } catch (error) {
    console.error('Error updating visibility:', error);
    toast.error('Failed to update visibility');
    return false;
  }
};

export const updateOrder = async (
  id: number,
  type: 'tabs' | 'sections' | 'subsections' | 'fields',
  items: { id: string; order: number }[]
) => {
  try {
    const { data: existingRecord, error: fetchError } = await supabase
      .from('profile_category_table_mapping_2')
      .select('structure')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const updatedStructure = { ...existingRecord.structure };

    // Update order in the appropriate section
    if (type === 'tabs') {
      updatedStructure.order.tabs = items.reduce((acc, item) => ({
        ...acc,
        [item.id]: item.order
      }), {});
    } else if (type === 'sections') {
      updatedStructure.sections = updatedStructure.sections.map(section => {
        const orderItem = items.find(item => item.id === section.name);
        if (orderItem) {
          return { ...section, order: orderItem.order };
        }
        return section;
      });
    } else if (type === 'subsections') {
      updatedStructure.sections = updatedStructure.sections.map(section => ({
        ...section,
        subsections: section.subsections.map(subsection => {
          const orderItem = items.find(item => item.id === subsection.name);
          if (orderItem) {
            return { ...subsection, order: orderItem.order };
          }
          return subsection;
        })
      }));
    } else if (type === 'fields') {
      updatedStructure.sections = updatedStructure.sections.map(section => ({
        ...section,
        subsections: section.subsections.map(subsection => ({
          ...subsection,
          fields: subsection.fields.map(field => {
            const fieldKey = `${field.table}.${field.name}`;
            const orderItem = items.find(item => item.id === fieldKey);
            if (orderItem) {
              return { ...field, order: orderItem.order };
            }
            return field;
          })
        }))
      }));
    }

    const { error: updateError } = await supabase
      .from('profile_category_table_mapping_2')
      .update({
        structure: updatedStructure,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Dispatch event to refresh the table
    window.dispatchEvent(new CustomEvent('structure-updated'));
    return true;
  } catch (error) {
    console.error('Error updating order:', error);
    toast.error('Failed to update order');
    return false;
  }
};

export const getVisibilityState = (structure: any) => {
  const visibilityState = {
    tabs: {},
    sections: {},
    subsections: {},
    fields: {}
  };

  // Get tab visibility
  if (structure.visibility?.tabs) {
    visibilityState.tabs = structure.visibility.tabs;
  }

  // Get section, subsection, and field visibility
  structure.sections.forEach(section => {
    visibilityState.sections[section.name] = section.visible ?? true;

    section.subsections.forEach(subsection => {
      visibilityState.subsections[subsection.name] = subsection.visible ?? true;

      subsection.fields.forEach(field => {
        const fieldKey = `${field.table}.${field.name}`;
        visibilityState.fields[fieldKey] = field.visible ?? true;
      });
    });
  });

  return visibilityState;
};

export const getOrderState = (structure: any) => {
  const orderState = {
    tabs: {},
    sections: {},
    subsections: {},
    fields: {}
  };

  // Get tab order
  if (structure.order?.tabs) {
    orderState.tabs = structure.order.tabs;
  }

  // Get section, subsection, and field order
  structure.sections.forEach(section => {
    orderState.sections[section.name] = section.order ?? 0;

    section.subsections.forEach(subsection => {
      orderState.subsections[subsection.name] = subsection.order ?? 0;

      subsection.fields.forEach(field => {
        const fieldKey = `${field.table}.${field.name}`;
        orderState.fields[fieldKey] = field.order ?? 0;
      });
    });
  });

  return orderState;
};

// Handle visibility-related functions
export const handleVisibilityToggle = async (
  type: string, 
  key: string,
  visibilitySettings: any,
  supabase: any,
  selectedTab: string,
  setVisibilitySettings: any,
  fetchStructure: any,
  activeMainTab: string
) => {
  try {
    const newSettings = {
      ...visibilitySettings,
      [type]: {
        ...visibilitySettings[type],
        [key]: !visibilitySettings[type]?.[key]
      }
    };

    const { data: current, error: fetchError } = await supabase
      .from('profile_category_table_mapping_2')
      .select('structure')
      .eq('Tabs', selectedTab)
      .single();

    if (fetchError) throw fetchError;

    const updatedStructure = {
      ...current.structure,
      visibility: newSettings
    };

    await supabase
      .from('profile_category_table_mapping_2')
      .update({
        structure: updatedStructure,
        updated_at: new Date().toISOString()
      })
      .eq('Tabs', selectedTab);

    setVisibilitySettings(newSettings);
    await fetchStructure(activeMainTab);

  } catch (error) {
    throw new Error('Failed to update visibility');
  }
};

// Handle reordering functions
export const handleReorder = async (
  type: 'tab' | 'section' | 'subsection' | 'column',
  id: string,
  direction: 'up' | 'down',
  items: any[],
  structure: any,
  currentStructure: any,
  supabase: any,
  fetchStructure: any,
  activeMainTab: string
) => {
  const currentIndex = items.findIndex(item =>
    type === 'tab' ? item === id :
    type === 'section' ? item.name === id :
    type === 'subsection' ? item.name === id :
    item === id
  );

  const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (newIndex < 0 || newIndex >= items.length) return;

  const newOrder = [...items];
  [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

  await supabase
    .from('profile_category_table_mapping_2')
    .update({
      structure: {
        ...structure,
        order: {
          ...structure.order,
          [type + 's']: newOrder.reduce((acc, item, index) => ({
            ...acc,
            [type === 'tab' ? item : item.name]: index + 1
          }), {})
        }
      }
    })
    .eq('id', currentStructure.id);

  await fetchStructure(activeMainTab);
};

