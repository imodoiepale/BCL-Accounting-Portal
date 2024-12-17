// @ts-nocheck
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Fetch main tabs from profile_category_table_mapping_2
    const { data: mainTabs, error } = await supabase
      .from('profile_category_table_mapping_2')
      .select('id, main_tab, Tabs, structure, verification_status')
      .order('id');

    if (error) {
      console.error('Error fetching main tabs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch main tabs' },
        { status: 500 }
      );
    }

    // Merge tabs with the same names
    const mergedTabs = mainTabs.reduce((acc, tab) => {
      const existingTabIndex = acc.findIndex(t => t.main_tab === tab.main_tab);
      
      if (existingTabIndex === -1) {
        // If no existing tab with this name, add it
        acc.push({
          id: tab.id,
          main_tab: tab.main_tab,
          tabs: tab.Tabs,
          structure: {
            order: tab.structure.order || {},
            fields: tab.structure.fields || {},
            sections: tab.structure.sections || [],
            visibility: tab.structure.visibility || {},
            relationships: tab.structure.relationships || {}
          },
          verification_status: tab.verification_status || {
            row_verifications: {},
            field_verifications: {},
            section_verifications: {}
          }
        });
      } else {
        // If tab already exists, merge its data
        const existingTab = acc[existingTabIndex];
        
        // Merge structures
        existingTab.structure = {
          order: { ...existingTab.structure.order, ...(tab.structure.order || {}) },
          fields: { ...existingTab.structure.fields, ...(tab.structure.fields || {}) },
          sections: [...new Set([...existingTab.structure.sections, ...(tab.structure.sections || [])])],
          visibility: { ...existingTab.structure.visibility, ...(tab.structure.visibility || {}) },
          relationships: { ...existingTab.structure.relationships, ...(tab.structure.relationships || {}) }
        };

        // Merge verification status
        existingTab.verification_status = {
          row_verifications: { 
            ...existingTab.verification_status.row_verifications, 
            ...(tab.verification_status?.row_verifications || {}) 
          },
          field_verifications: { 
            ...existingTab.verification_status.field_verifications, 
            ...(tab.verification_status?.field_verifications || {}) 
          },
          section_verifications: { 
            ...existingTab.verification_status.section_verifications, 
            ...(tab.verification_status?.section_verifications || {}) 
          }
        };

        // Merge tabs if they exist
        if (tab.Tabs) {
          existingTab.tabs = existingTab.tabs 
            ? [...new Set([...existingTab.tabs, tab.Tabs])] 
            : tab.Tabs;
        }
      }
      
      return acc;
    }, []);

    // Log main tabs for debugging
    console.log('Merged Main Tabs:', mergedTabs.map(tab => tab.main_tab));

    return NextResponse.json(mergedTabs);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to extract visible fields from structure JSONB
function extractVisibleFields(structure: any) {
  try {
    if (!structure) return [];
    
    const fields: any[] = [];
    
    // Process each section in the structure
    Object.entries(structure).forEach(([sectionName, sectionData]: [string, any]) => {
      if (sectionData && typeof sectionData === 'object') {
        Object.entries(sectionData).forEach(([fieldName, fieldConfig]: [string, any]) => {
          if (fieldConfig && fieldConfig.visible !== false) {
            fields.push({
              section: sectionName,
              field: fieldName,
              ...fieldConfig
            });
          }
        });
      }
    });
    
    return fields;
  } catch (error) {
    console.error('Error processing structure:', error);
    return [];
  }
}
