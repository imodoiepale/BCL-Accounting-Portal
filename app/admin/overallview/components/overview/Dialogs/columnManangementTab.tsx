// @ts-nocheck
"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface ColumnManagementProps {
  structure: Array<{
    id: number;
    main_tab: string;
    Tabs: string;
    structure: {
      order: Record<string, any>;
      fields: Record<string, any>;
      sections: Array<any>;
      visibility: Record<string, any>;
      relationships: Record<string, any>;
    };
    created_at?: string;
    updated_at?: string;
    verification_status: {
      row_verifications: Record<string, any>;
      field_verifications: Record<string, any>;
      section_verifications: Record<string, any>;
    };
  }>;
  onUpdate: () => Promise<void>;
  supabase: any;
  mainTabs: string[];
  subTabs: Record<string, string[]>;
  visibilityState: Record<string, any>;
}

export const ColumnManagement: React.FC<ColumnManagementProps> = ({
  structure = [],
  onUpdate,
  supabase,
  mainTabs = [],
  subTabs = {},
  visibilityState = {}
}) => {
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (itemType, itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [`${itemType}-${itemId}`]: !prev[`${itemType}-${itemId}`]
    }));
  };

  const handleReorder = async (type, itemId, direction, context) => {
    try {
      setLoading(true);
      const { data: records, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*');

      if (fetchError) {
        throw fetchError;
      }

      const record = records.find(r => {
        if (type === 'main_tab') {
          return true;
        }
        if (type === 'subTab') {
          return r.main_tab === context.main_tab;
        }
        return r.main_tab === context.main_tab && r.Tabs === context.subTab;
      });

      if (!record) {
        return;
      }

      let updatedStructure = { ...record.structure };
      let items = [];

      switch (type) {
        case 'main_tab':
          items = [...mainTabs];
          break;
        case 'subTab':
          items = [...(subTabs[context.main_tab] || [])];
          break;
        case 'section':

          items = [...(record.structure.sections || [])];
          break;
        case 'subsection':

          items = [...(record.structure.sections.find(s => s.name === context.section)?.subsections || [])];
          break;
        case 'field':

          items = [...(record.structure.sections
            .find(s => s.name === context.section)
            ?.subsections
            .find(sub => sub.name === context.subsection)
            ?.fields || [])];
          break;
      }

      const currentIndex = items.findIndex(item => 
        typeof item === 'string' ? item === itemId : item.name === itemId
      );
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex >= 0 && newIndex < items.length) {
        [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];

        const { error: updateError } = await supabase
          .from('profile_category_table_mapping_2')
          .update({
            structure: {
              ...updatedStructure,
              order: {
                ...updatedStructure.order,
                [type]: items.reduce((acc, item, idx) => ({
                  ...acc,
                  [typeof item === 'string' ? item : item.name]: idx
                }), {})
              }
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id);

        if (updateError) {
          throw updateError;
        }
        await onUpdate();
      }
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder items');
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityToggle = async (type, itemId, context) => {
    try {
      setLoading(true);
      const { data: record, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*')
        .eq('id', context?.recordId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      let updatedStructure = { ...record.structure };
      let visibility = updatedStructure.visibility || {};

      visibility = {
        ...visibility,
        [type]: {
          ...visibility[type],
          [itemId]: !visibility[type]?.[itemId]
        }
      };

      const { error: updateError } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: {
            ...updatedStructure,
            visibility
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id);

      if (updateError) {
        throw updateError;
      }
      await onUpdate();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update visibility');
    } finally {
      setLoading(false);
    }
  };

  const StructureItem = ({ 
    label, 
    type, 
    id, 
    index, 
    total, 
    context, 
    visible = true, 
    depth = 0,
    hasChildren = false 
  }) => (
    <div 
      className={`
        flex items-center justify-between p-2 hover:bg-gray-50 rounded
        ${depth > 0 ? `ml-${depth * 4} border-l-2 border-gray-200` : ''}
      `}
    >
      <div className="flex items-center gap-2">
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleExpand(type, id)}
            className="p-0 h-6 w-6"
          >
            <ChevronRight 
              className={`h-4 w-4 transition-transform ${
                expandedItems[`${type}-${id}`] ? 'rotate-90' : ''
              }`}
            />
          </Button>
        )}
        <span className={depth === 0 ? 'font-semibold' : ''}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleReorder(type, id, 'up', context)}
            disabled={index === 0 || loading}
            className="h-6 w-6 p-0"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleReorder(type, id, 'down', context)}
            disabled={index === total - 1 || loading}
            className="h-6 w-6 p-0"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <Switch
          checked={visible}
          onCheckedChange={() => handleVisibilityToggle(type, id, context)}
          disabled={loading}
        />
      </div>
    </div>
  );

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {mainTabs.map((mainTab, mainIndex) => {
              const mainTabStructure = structure.filter(item => item.main_tab === mainTab);
              const mainTabVisible = !visibilityState?.mainTabs?.[mainTab];
              
              return (
                <div key={mainTab} className="border rounded-lg p-4">
                  <StructureItem
                    label={mainTab}
                    type="main_tab"
                    id={mainTab}
                    index={mainIndex}
                    total={mainTabs.length}
                    visible={mainTabVisible}
                    depth={0}
                    hasChildren={true}
                  />
                  {expandedItems[`main_tab-${mainTab}`] && subTabs[mainTab]?.map((subTab, subTabIndex) => {
                    const subTabStructure = mainTabStructure.find(item => item.Tabs === subTab)?.structure;
                    const subTabVisible = !visibilityState?.subTabs?.[subTab];

                    return (
                      <div key={subTab}>
                        <StructureItem
                          label={subTab}
                          type="subTab"
                          id={subTab}
                          index={subTabIndex}
                          total={subTabs[mainTab].length}
                          context={{ main_tab: mainTab, recordId: mainTabStructure.find(item => item.Tabs === subTab)?.id }}
                          visible={subTabVisible}
                          depth={1}
                          hasChildren={true}
                        />
                        {expandedItems[`subTab-${subTab}`] && subTabStructure?.sections?.map((section, sectionIndex) => {
                          const sectionVisible = !visibilityState?.sections?.[section.name];

                          return (
                            <div key={section.name}>
                              <StructureItem
                                label={section.name}
                                type="section"
                                id={section.name}
                                index={sectionIndex}
                                total={subTabStructure.sections.length}
                                context={{ 
                                  main_tab: mainTab, 
                                  subTab: subTab,
                                  recordId: mainTabStructure.find(item => item.Tabs === subTab)?.id 
                                }}
                                visible={sectionVisible}
                                depth={2}
                                hasChildren={true}
                              />
                              {expandedItems[`section-${section.name}`] && section.subsections?.map((subsection, subsectionIndex) => {
                                const subsectionVisible = !visibilityState?.subsections?.[`${section.name}.${subsection.name}`];

                                return (
                                  <div key={subsection.name}>
                                    <StructureItem
                                      label={subsection.name}
                                      type="subsection"
                                      id={subsection.name}
                                      index={subsectionIndex}
                                      total={section.subsections.length}
                                      context={{ 
                                        main_tab: mainTab, 
                                        subTab: subTab, 
                                        section: section.name,
                                        recordId: mainTabStructure.find(item => item.Tabs === subTab)?.id 
                                      }}
                                      visible={subsectionVisible}
                                      depth={3}
                                      hasChildren={true}
                                    />
                                    {expandedItems[`subsection-${subsection.name}`] && subsection.fields?.map((field, fieldIndex) => {
                                      const fieldVisible = !visibilityState?.fields?.[`${section.name}.${subsection.name}.${field.name}`];

                                      return (
                                        <StructureItem
                                          key={`${field.table}.${field.name}`}
                                          label={field.display || `${field.table}.${field.name}`}
                                          type="field"
                                          id={`${field.table}.${field.name}`}
                                          index={fieldIndex}
                                          total={subsection.fields.length}
                                          context={{
                                            main_tab: mainTab,
                                            subTab: subTab,
                                            section: section.name,
                                            subsection: subsection.name,
                                            recordId: mainTabStructure.find(item => item.Tabs === subTab)?.id
                                          }}
                                          visible={fieldVisible}
                                          depth={4}
                                        />
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};