// @ts-nocheck
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
      .select('id, main_tab, Tabs, structure, verification_status, created_at, updated_at')
      .order('id');

    if (error) {
      console.error('Error fetching main tabs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch main tabs' },
        { status: 500 }
      );
    }

    // Process and merge tabs with the same main_tab
    const mergedTabs = mainTabs.reduce((acc, tab) => {
      const existingTabIndex = acc.findIndex(t => t.main_tab === tab.main_tab);
      
      if (existingTabIndex === -1) {
        // Create new tab entry
        acc.push({
          id: tab.id,
          main_tab: tab.main_tab,
          Tabs: tab.Tabs,
          structure: {
            order: tab.structure?.order || {},
            sections: tab.structure?.sections || [],
            visibility: tab.structure?.visibility || {},
            verification: tab.structure?.verification || {
              verified_at: null,
              verified_by: null,
              field_verified: false
            },
            relationships: tab.structure?.relationships || {}
          },
          created_at: tab.created_at,
          updated_at: tab.updated_at,
          verification_status: tab.verification_status || {
            row_verifications: {},
            field_verifications: {},
            section_verifications: {}
          }
        });
      } else {
        // Merge with existing tab
        const existingTab = acc[existingTabIndex];
        
        // Merge sections while preserving order and visibility
        if (tab.structure?.sections) {
          tab.structure.sections.forEach((newSection: any) => {
            const existingSectionIndex = existingTab.structure.sections.findIndex(
              (s: any) => s.name === newSection.name
            );

            if (existingSectionIndex === -1) {
              existingTab.structure.sections.push(newSection);
            } else {
              // Merge subsections
              const existingSection = existingTab.structure.sections[existingSectionIndex];
              if (newSection.subsections) {
                existingSection.subsections = existingSection.subsections || [];
                newSection.subsections.forEach((newSubsection: any) => {
                  const existingSubsectionIndex = existingSection.subsections.findIndex(
                    (s: any) => s.name === newSubsection.name
                  );

                  if (existingSubsectionIndex === -1) {
                    existingSection.subsections.push(newSubsection);
                  } else {
                    // Merge fields
                    const existingSubsection = existingSection.subsections[existingSubsectionIndex];
                    if (newSubsection.fields) {
                      existingSubsection.fields = existingSubsection.fields || [];
                      newSubsection.fields.forEach((newField: any) => {
                        const existingFieldIndex = existingSubsection.fields.findIndex(
                          (f: any) => f.name === newField.name
                        );

                        if (existingFieldIndex === -1) {
                          existingSubsection.fields.push(newField);
                        }
                      });
                    }
                  }
                });
              }
            }
          });
        }

        // Update verification status
        if (tab.verification_status) {
          existingTab.verification_status = {
            row_verifications: { 
              ...existingTab.verification_status.row_verifications, 
              ...tab.verification_status.row_verifications 
            },
            field_verifications: { 
              ...existingTab.verification_status.field_verifications, 
              ...tab.verification_status.field_verifications 
            },
            section_verifications: { 
              ...existingTab.verification_status.section_verifications, 
              ...tab.verification_status.section_verifications 
            }
          };
        }

        // Update timestamps if newer
        if (new Date(tab.updated_at) > new Date(existingTab.updated_at)) {
          existingTab.updated_at = tab.updated_at;
        }
      }
      
      return acc;
    }, []);

    // Sort sections and fields by order
    mergedTabs.forEach(tab => {
      if (tab.structure?.sections) {
        tab.structure.sections.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        tab.structure.sections.forEach((section: any) => {
          if (section.subsections) {
            section.subsections.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
            section.subsections.forEach((subsection: any) => {
              if (subsection.fields) {
                subsection.fields.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
              }
            });
          }
        });
      }
    });

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
