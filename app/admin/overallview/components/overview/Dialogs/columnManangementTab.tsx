// @ts-nocheck
"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export const ColumnManagement: React.FC<ColumnManagementProps> = ({
  structure = [],
  onUpdate,
  supabase,
  mainTabs = [],
  subTabs = {},
  visibilityState = {},
  activeMainTab
}) => {
  const [loading, setLoading] = useState(false);
  const [processedStructure, setProcessedStructure] = useState([]);

  useEffect(() => {
    // Process structure data when it changes
    if (structure && structure.length > 0) {
      const processed = structure.map(item => ({
        mainTab: item.main_tab,
        subTab: item.Tabs,
        sections: item.sections || [],
        order: item.order || {},
        visibility: item.visibility || {}
      }));
      setProcessedStructure(processed);
    }
  }, [structure]);

  const handleReorder = async (type, itemId, direction, context) => {
    try {
      setLoading(true);
      const { data: records, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*')
        .eq('main_tab', context?.mainTab || activeMainTab);

      if (fetchError) {
        throw fetchError;
      }

      const record = records.find(r => r.main_tab === (context?.mainTab || activeMainTab));
      if (!record) {
        return;
      }

      let items;
      let updatedStructure = { ...record.structure };

      switch (type) {
        case 'mainTab':
          items = [...mainTabs];
          break;
        case 'subTab':
          items = [...(subTabs[context.mainTab] || [])];
          break;
        case 'section':
          items = [...(updatedStructure.sections || [])];
          break;
        case 'subsection':
          const section = updatedStructure.sections?.find(s => s.name === context.section);
          items = [...(section?.subsections || [])];
          break;
        case 'field':
          const subsection = updatedStructure.sections
            ?.find(s => s.name === context.section)
            ?.subsections?.find(sub => sub.name === context.subsection);
          items = [...(subsection?.fields || [])];
          break;
      }

      const currentIndex = items.findIndex(item => 
        typeof item === 'string' ? item === itemId : item.name === itemId
      );
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex >= 0 && newIndex < items.length) {
        // Swap items
        [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];
        
        // Update order numbers
        items.forEach((item, index) => {
          if (typeof item === 'object') {
            item.order = index;
          }
        });

        // Update the appropriate part of the structure
        switch (type) {
          case 'mainTab':
            updatedStructure.order = { ...updatedStructure.order, mainTabs: items };
            break;
          case 'subTab':
            updatedStructure.order = { ...updatedStructure.order, subTabs: { 
              ...updatedStructure.order?.subTabs,
              [context.mainTab]: items 
            }};
            break;
          case 'section':
            updatedStructure.sections = items;
            break;
          case 'subsection':
            const sectionIndex = updatedStructure.sections.findIndex(s => s.name === context.section);
            if (sectionIndex !== -1) {
              updatedStructure.sections[sectionIndex].subsections = items;
            }
            break;
          case 'field':
            const section = updatedStructure.sections.find(s => s.name === context.section);
            const subsection = section?.subsections?.find(sub => sub.name === context.subsection);
            if (subsection) {
              subsection.fields = items;
            }
            break;
        }

        const { error: updateError } = await supabase
          .from('profile_category_table_mapping_2')
          .update({
            structure: updatedStructure,
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
        .eq('main_tab', context?.mainTab || activeMainTab)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      let updatedStructure = { ...record.structure };
      let visibility = updatedStructure.visibility || {};

      switch (type) {
        case 'mainTab':
          visibility = {
            ...visibility,
            mainTabs: { ...visibility.mainTabs, [itemId]: !visibility.mainTabs?.[itemId] }
          };
          break;
        case 'subTab':
          visibility = {
            ...visibility,
            subTabs: { ...visibility.subTabs, [itemId]: !visibility.subTabs?.[itemId] }
          };
          break;
        case 'section':
        case 'subsection':
        case 'field':
          const path = type === 'section' ? itemId : 
                      type === 'subsection' ? `${context.section}.${itemId}` : 
                      `${context.section}.${context.subsection}.${itemId}`;
          visibility = {
            ...visibility,
            [type]: { ...visibility[type], [path]: !visibility[type]?.[path] }
          };
          break;
      }

      updatedStructure.visibility = visibility;

      const { error: updateError } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: updatedStructure,
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

  const StructureItem = ({ label, type, id, index, total, context, visible = true, depth = 0 }) => (
    <div className={`
      flex items-center justify-between p-2 hover:bg-gray-50 rounded
      ${depth > 0 ? 'border-l-2 border-gray-200 pl-4 ml-6' : ''}
    `}>
      <span className={`${depth === 0 ? 'font-semibold' : ''}`}>
        {label}
      </span>
      <div className="flex items-center gap-3">
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
            {processedStructure.map((item, mainIndex) => (
              <div key={item.mainTab} className="border rounded-lg p-4">
                {/* Main Tab */}
                <StructureItem
                  label={item.mainTab}
                  type="mainTab"
                  id={item.mainTab}
                  index={mainIndex}
                  total={processedStructure.length}
                  visible={!visibilityState?.mainTabs?.[item.mainTab]}
                  depth={0}
                />

                {/* Sub Tabs */}
                {(subTabs[item.mainTab] || []).map((subTab, subIndex) => (
                  <div key={subTab}>
                    <StructureItem
                      label={subTab}
                      type="subTab"
                      id={subTab}
                      index={subIndex}
                      total={subTabs[item.mainTab].length}
                      context={{ mainTab: item.mainTab }}
                      visible={!visibilityState?.subTabs?.[subTab]}
                      depth={1}
                    />

                    {/* Sections */}
                    {item.sections.map((section, sectionIndex) => (
                      <div key={section.name}>
                        <StructureItem
                          label={section.name}
                          type="section"
                          id={section.name}
                          index={sectionIndex}
                          total={item.sections.length}
                          context={{ mainTab: item.mainTab, subTab }}
                          visible={section.visible}
                          depth={2}
                        />

                        {/* Subsections */}
                        {section.subsections.map((subsection, subsectionIndex) => (
                          <div key={subsection.name}>
                            <StructureItem
                              label={subsection.name}
                              type="subsection"
                              id={subsection.name}
                              index={subsectionIndex}
                              total={section.subsections.length}
                              context={{ mainTab: item.mainTab, subTab, section: section.name }}
                              visible={subsection.visible}
                              depth={3}
                            />

                            {/* Fields */}
                            {subsection.fields.map((field, fieldIndex) => (
                              <StructureItem
                                key={`${field.table}.${field.name}`}
                                label={field.display || `${field.table}.${field.name}`}
                                type="field"
                                id={`${field.table}.${field.name}`}
                                index={fieldIndex}
                                total={subsection.fields.length}
                                context={{
                                  mainTab: item.mainTab,
                                  subTab,
                                  section: section.name,
                                  subsection: subsection.name
                                }}
                                visible={field.visible}
                                depth={4}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
