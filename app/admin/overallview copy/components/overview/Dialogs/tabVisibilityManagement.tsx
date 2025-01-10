// @ts-nocheck

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const TabVisibilityManagement = ({ 
  mainTabs, 
  subTabs, 
  activeMainTab,
  visibilityState,
  onReorder,
  supabase
}) => {
  const handleReorder = async (type, id, direction, parentId = null) => {
    try {
      const { data: mappings, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*')
        .order('main_tab');

      if (fetchError) throw fetchError;

      let items = [];
      let updatedMappings = [...mappings];

      if (type === 'mainTab') {
        items = Array.isArray(mainTabs) ? mainTabs : Object.keys(mainTabs || {});
      } else if (type === 'subTab') {
        items = Array.isArray(subTabs) ? subTabs : (subTabs?.[activeMainTab] || []);
      }

      const currentIndex = items.indexOf(id);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= items.length) return;

      // Swap items
      [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];

      // Update order and preserve visibility settings
      for (const mapping of updatedMappings) {
        const updatedStructure = {
          ...mapping.structure,
          order: {
            ...mapping.structure.order,
            [type === 'mainTab' ? 'mainTabs' : 'subTabs']: items.reduce((acc, tab, idx) => ({
              ...acc,
              [tab]: idx
            }), {})
          }
        };

        const { error: updateError } = await supabase
          .from('profile_category_table_mapping_2')
          .update({
            structure: updatedStructure,
            updated_at: new Date().toISOString()
          })
          .eq('id', mapping.id);

        if (updateError) throw updateError;
      }

      onReorder();
      window.dispatchEvent(new CustomEvent('structure-updated'));

    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder items');
    }
  };

  const toggleVisibility = async (type, id) => {
    try {
      const { data: mappings, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*');
  
      if (fetchError) throw fetchError;
  
      for (const mapping of mappings) {
        // When toggling main tab visibility
        if (type === 'mainTab') {
          // Create visibility object if it doesn't exist
          const newVisibility = {
            ...mapping.structure.visibility || {},
            tabs: {
              ...mapping.structure.visibility?.tabs || {},
              [mapping.main_tab]: !mapping.structure.visibility?.tabs?.[mapping.main_tab]
            }
          };
  
          const { error: updateError } = await supabase
            .from('profile_category_table_mapping_2')
            .update({
              structure: {
                ...mapping.structure,
                visibility: newVisibility
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', mapping.id)
            .eq('main_tab', id);
  
          if (updateError) throw updateError;
        }
        // When toggling subtab visibility
        else if (type === 'subTab') {
          if (mapping.Tabs === id) {
            const newVisibility = {
              ...mapping.structure.visibility || {},
              tabs: {
                ...mapping.structure.visibility?.tabs || {},
                [mapping.Tabs]: !mapping.structure.visibility?.tabs?.[mapping.Tabs]
              }
            };
  
            const { error: updateError } = await supabase
              .from('profile_category_table_mapping_2')
              .update({
                structure: {
                  ...mapping.structure,
                  visibility: newVisibility
                },
                updated_at: new Date().toISOString()
              })
              .eq('id', mapping.id);
  
            if (updateError) throw updateError;
          }
        }
      }
  
      onReorder();
      window.dispatchEvent(new CustomEvent('structure-updated'));
      window.dispatchEvent(new CustomEvent('visibility-updated'));
  
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-4">Tab Structure Management</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Main Tabs */}
          <div>
            <h4 className="font-medium mb-2">Main Tabs</h4>
            <ScrollArea className="h-[300px]">
              {(Array.isArray(mainTabs) ? mainTabs : Object.keys(mainTabs || {})).map((tab, index) => (
                <div key={tab} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span>{tab}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorder('mainTab', tab, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorder('mainTab', tab, 'down')}
                        disabled={index === ((Array.isArray(mainTabs) ? mainTabs : Object.keys(mainTabs || {})).length || 0) - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Switch
                      checked={!visibilityState?.tabs?.[tab]}
                      onCheckedChange={() => toggleVisibility('mainTab', tab)}
                    />
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Sub Tabs */}
          <div>
            <h4 className="font-medium mb-2">Sub Tabs for {activeMainTab}</h4>
            <ScrollArea className="h-[300px]">
              {(Array.isArray(subTabs) ? subTabs : (subTabs?.[activeMainTab] || [])).map((tab, index) => (
                <div key={tab} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span>{tab}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorder('subTab', tab, 'up', activeMainTab)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorder('subTab', tab, 'down', activeMainTab)}
                        disabled={index === ((Array.isArray(subTabs) ? subTabs : (subTabs?.[activeMainTab] || [])).length || 0) - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Switch
                      checked={!visibilityState?.tabs?.[tab]}
                      onCheckedChange={() => toggleVisibility('subTab', tab)}
                    />
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TabVisibilityManagement;