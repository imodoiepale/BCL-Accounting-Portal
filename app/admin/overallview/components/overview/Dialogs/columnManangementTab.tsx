// @ts-nocheck
"use client"
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export const ColumnManagement: React.FC<ColumnManagementProps> = ({
  structure = [],
  structureId,
  onUpdate,
  supabase,
  activeMainTab,
  mainTabs = [],
  subTabs = {},
  visibilityState = {}
}) => {
  const [loading, setLoading] = useState(false);
  const [lastMovedItem, setLastMovedItem] = useState<string | null>(null);

  const handleReorder = async (
    type: 'mainTab' | 'subTab' | 'section' | 'subsection' | 'field',
    itemId: string,
    direction: 'up' | 'down',
    parentIds?: { mainTab?: string; subTab?: string; section?: string; subsection?: string }
  ) => {
    try {
      setLoading(true);

      const { data: records, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*');

      if (fetchError) throw fetchError;

      // Find the relevant record based on the hierarchy
      let record = records.find(r => {
        if (type === 'mainTab') return r.main_tab === itemId;
        if (type === 'subTab') return r.main_tab === parentIds?.mainTab && r.Tabs === itemId;
        return r.main_tab === parentIds?.mainTab && r.Tabs === parentIds?.subTab;
      });

      if (!record) return;

      // Get the array to reorder based on the type
      let items = [];
      switch (type) {
        case 'mainTab':
          items = mainTabs;
          break;
        case 'subTab':
          items = subTabs[parentIds?.mainTab || ''] || [];
          break;
        case 'section':
          items = record.structure.sections;
          break;
        case 'subsection':
          items = record.structure.sections.find(s => s.name === parentIds?.section)?.subsections || [];
          break;
        case 'field':
          items = record.structure.sections
            .find(s => s.name === parentIds?.section)
            ?.subsections.find(sub => sub.name === parentIds?.subsection)
            ?.fields || [];
          break;
      }

      // Calculate new positions
      const currentIndex = items.findIndex(item => 
        typeof item === 'string' ? item === itemId : item.name === itemId
      );
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= items.length) return;

      // Swap items
      [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];

      // Update order numbers
      items.forEach((item, index) => {
        if (typeof item !== 'string') {
          item.order = index + 1;
        }
      });

      // Update the database
      const { error: updateError } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: record.structure,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id);

      if (updateError) throw updateError;

      setLastMovedItem(itemId);
      setTimeout(() => setLastMovedItem(null), 2000);

      await onUpdate();
      window.dispatchEvent(new CustomEvent('structure-updated'));

    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder items');
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityToggle = async (
    type: 'mainTab' | 'subTab' | 'section' | 'subsection' | 'field',
    itemId: string,
    parentIds?: { mainTab?: string; subTab?: string; section?: string; subsection?: string }
  ) => {
    try {
      setLoading(true);

      const { data: record, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*')
        .eq('main_tab', parentIds?.mainTab || itemId)
        .single();

      if (fetchError) throw fetchError;

      let updatedStructure = { ...record.structure };

      switch (type) {
        case 'mainTab':
          updatedStructure.visibility = {
            ...updatedStructure.visibility,
            tab: !updatedStructure.visibility?.tab
          };
          break;
        case 'section':
          const section = updatedStructure.sections.find(s => s.name === itemId);
          if (section) {
            section.visible = !section.visible;
            // Cascade visibility to subsections and fields
            section.subsections?.forEach(sub => {
              sub.visible = section.visible;
              sub.fields?.forEach(f => f.visible = section.visible);
            });
          }
          break;
        case 'subsection':
          const subsection = updatedStructure.sections
            .find(s => s.name === parentIds?.section)
            ?.subsections.find(sub => sub.name === itemId);
          if (subsection) {
            subsection.visible = !subsection.visible;
            // Cascade visibility to fields
            subsection.fields?.forEach(f => f.visible = subsection.visible);
          }
          break;
        case 'field':
          const field = updatedStructure.sections
            .find(s => s.name === parentIds?.section)
            ?.subsections.find(sub => sub.name === parentIds?.subsection)
            ?.fields.find(f => `${f.table}.${f.name}` === itemId);
          if (field) {
            field.visible = !field.visible;
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

      if (updateError) throw updateError;

      await onUpdate();
      window.dispatchEvent(new CustomEvent('structure-updated'));
      window.dispatchEvent(new CustomEvent('visibility-updated'));

    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update visibility');
    } finally {
      setLoading(false);
    }
  };

  const renderOrderControls = (index: number, total: number, onMoveUp: () => void, onMoveDown: () => void) => (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onMoveUp}
        disabled={index === 0 || loading}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onMoveDown}
        disabled={index === total - 1 || loading}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {mainTabs.map((mainTab, mainIndex) => {
              const mainTabStructure = structure.filter(item => item.main_tab === mainTab);
              
              return (
                <div key={mainTab} className="border rounded-lg p-4">
                  {/* Main Tab */}
                  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <span className="text-lg font-semibold">{mainTab}</span>
                    <div className="flex items-center gap-3">
                      {renderOrderControls(
                        mainIndex,
                        mainTabs.length,
                        () => handleReorder('mainTab', mainTab, 'up'),
                        () => handleReorder('mainTab', mainTab, 'down')
                      )}
                      <Switch
                        checked={!visibilityState?.mainTabs?.[mainTab]}
                        onCheckedChange={() => handleVisibilityToggle('mainTab', mainTab)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Sub Tabs */}
                  <div className="ml-6 mt-2 space-y-2">
                    {(subTabs[mainTab] || []).map((subTab, subIndex) => {
                      const subTabStructure = mainTabStructure.find(item => item.Tabs === subTab);
                      const sections = subTabStructure?.structure?.sections || [];

                      return (
                        <div key={subTab} className="border-l-2 pl-4">
                          <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                            <span className="font-medium">{subTab}</span>
                            <div className="flex items-center gap-3">
                              {renderOrderControls(
                                subIndex,
                                subTabs[mainTab].length,
                                () => handleReorder('subTab', subTab, 'up', { mainTab }),
                                () => handleReorder('subTab', subTab, 'down', { mainTab })
                              )}
                              <Switch
                                checked={!visibilityState?.subTabs?.[subTab]}
                                onCheckedChange={() => handleVisibilityToggle('subTab', subTab, { mainTab })}
                                disabled={loading}
                              />
                            </div>
                          </div>

                          {/* Sections */}
                          <div className="ml-6 mt-2 space-y-2">
                            {sections.map((section, sectionIndex) => (
                              <div key={section.name} className="border-l-2 pl-4">
                                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                  <span>{section.name}</span>
                                  <div className="flex items-center gap-3">
                                    {renderOrderControls(
                                      sectionIndex,
                                      sections.length,
                                      () => handleReorder('section', section.name, 'up', { mainTab, subTab }),
                                      () => handleReorder('section', section.name, 'down', { mainTab, subTab })
                                    )}
                                    <Switch
                                      checked={section.visible}
                                      onCheckedChange={() => handleVisibilityToggle('section', section.name, { mainTab, subTab })}
                                      disabled={loading}
                                    />
                                  </div>
                                </div>

                                {/* Subsections */}
                                <div className="ml-6 mt-2 space-y-2">
                                  {section.subsections.map((subsection, subsectionIndex) => (
                                    <div key={subsection.name} className="border-l-2 pl-4">
                                      <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                        <span>{subsection.name}</span>
                                        <div className="flex items-center gap-3">
                                          {renderOrderControls(
                                            subsectionIndex,
                                            section.subsections.length,
                                            () => handleReorder('subsection', subsection.name, 'up', { mainTab, subTab, section: section.name }),
                                            () => handleReorder('subsection', subsection.name, 'down', { mainTab, subTab, section: section.name })
                                          )}
                                          <Switch
                                            checked={subsection.visible}
                                            onCheckedChange={() => handleVisibilityToggle('subsection', subsection.name, { mainTab, subTab, section: section.name })}
                                            disabled={loading}
                                          />
                                        </div>
                                      </div>

                                      {/* Fields */}
                                      <div className="ml-6 mt-2 space-y-2">
                                        {subsection.fields.map((field, fieldIndex) => (
                                          <div key={`${field.table}.${field.name}`} className="border-l-2 pl-4">
                                            <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                              <span>{field.display}</span>
                                              <div className="flex items-center gap-3">
                                                {renderOrderControls(
                                                  fieldIndex,
                                                  subsection.fields.length,
                                                  () => handleReorder('field', `${field.table}.${field.name}`, 'up', 
                                                    { mainTab, subTab, section: section.name, subsection: subsection.name }),
                                                  () => handleReorder('field', `${field.table}.${field.name}`, 'down',
                                                    { mainTab, subTab, section: section.name, subsection: subsection.name })
                                                )}
                                                <Switch
                                                  checked={field.visible}
                                                  onCheckedChange={() => handleVisibilityToggle('field', `${field.table}.${field.name}`,
                                                    { mainTab, subTab, section: section.name, subsection: subsection.name })}
                                                  disabled={loading}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
