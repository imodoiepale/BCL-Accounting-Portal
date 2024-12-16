// @ts-nocheck
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const OrderManagement = ({ 
  mainTabs, 
  subTabs, 
  activeMainTab,
  onReorder,
  supabase
}) => {
  const handleReorder = async (type, id, direction, parentId = null) => {
    try {
      // Get current mappings
      const { data: mappings, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*')
        .order('main_tab');

      if (fetchError) throw fetchError;

      let items = [];
      let updatedMappings = [...mappings];

      if (type === 'mainTab') {
        items = mainTabs;
      } else if (type === 'subTab') {
        items = subTabs[parentId] || [];
      }

      const currentIndex = items.indexOf(id);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= items.length) return;

      // Swap items
      [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];

      // Update order in database
      for (const mapping of updatedMappings) {
        if (type === 'mainTab') {
          mapping.structure.order.mainTabs = items.reduce((acc, tab, idx) => ({
            ...acc,
            [tab]: idx
          }), {});
        } else if (type === 'subTab' && mapping.main_tab === parentId) {
          mapping.structure.order.subTabs = items.reduce((acc, tab, idx) => ({
            ...acc,
            [tab]: idx
          }), {});
        }

        const { error: updateError } = await supabase
          .from('profile_category_table_mapping_2')
          .update({
            structure: mapping.structure,
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

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-4">Tab Order Management</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Main Tabs */}
          <div>
            <h4 className="font-medium mb-2">Main Tabs</h4>
            <ScrollArea className="h-[300px]">
              {mainTabs.map((tab, index) => (
                <div key={tab} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span>{tab}</span>
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
                      disabled={index === mainTabs.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Sub Tabs */}
          <div>
            <h4 className="font-medium mb-2">Sub Tabs for {activeMainTab}</h4>
            <ScrollArea className="h-[300px]">
              {(subTabs[activeMainTab] || []).map((tab, index) => (
                <div key={tab} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span>{tab}</span>
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
                      disabled={index === (subTabs[activeMainTab] || []).length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
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

export default OrderManagement;