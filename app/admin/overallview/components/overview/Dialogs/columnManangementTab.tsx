// columnManagementTab.tsx
//@ts-nocheck
"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { toast } from "sonner";
import { motion } from 'framer-motion';

interface ColumnManagementProps {
  structure: any;
  structureId: number;
  onUpdate: () => Promise<void>;
  supabase: any;
  activeMainTab: string;
}

export const ColumnManagement: React.FC<ColumnManagementProps> = ({
  structure,
  structureId,
  onUpdate,
  supabase,
  activeMainTab
}) => {
  const [loading, setLoading] = useState(false);
  const [lastMovedItem, setLastMovedItem] = useState<string | null>(null);
  const [filteredStructure, setFilteredStructure] = useState(structure);

  useEffect(() => {
    if (structure && activeMainTab) {
      const filtered = {
        ...structure,
        sections: structure.sections.filter(section => 
          section.mainTab === activeMainTab
        )
      };
      setFilteredStructure(filtered);
    }
  }, [structure, activeMainTab]);

  const handleOrderChange = async (
    type: 'sections' | 'subsections' | 'fields',
    parentId: string,
    itemId: string,
    direction: 'up' | 'down'
  ) => {
    try {
      setLoading(true);
      const currentStructure = { ...filteredStructure };
      let items;
      let parentPath;

      if (type === 'sections') {
        items = currentStructure.sections;
        parentPath = 'sections';
      } else if (type === 'subsections') {
        const section = currentStructure.sections.find(s => s.name === parentId);
        items = section?.subsections;
        parentPath = `sections.${currentStructure.sections.indexOf(section)}.subsections`;
      } else {
        const section = currentStructure.sections.find(s => 
          s.subsections.some(sub => sub.name === parentId)
        );
        const subsection = section?.subsections.find(sub => sub.name === parentId);
        items = subsection?.fields;
        parentPath = `sections.${currentStructure.sections.indexOf(section)}.subsections.${section.subsections.indexOf(subsection)}.fields`;
      }

      if (!items) return;

      const currentIndex = items.findIndex(item => 
        type === 'fields' ? `${item.table}.${item.name}` === itemId : item.name === itemId
      );
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= items.length) return;

      // Swap items
      const temp = items[currentIndex];
      items[currentIndex] = items[newIndex];
      items[newIndex] = temp;

      // Update order properties
      items.forEach((item, index) => {
        item.order = index + 1;
      });

      // Update database
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: currentStructure,
          updated_at: new Date().toISOString()
        })
        .eq('id', structureId);

      if (error) throw error;

      // Set the moved item for highlighting
      setLastMovedItem(itemId);
      setTimeout(() => setLastMovedItem(null), 2000);

      // Update UI and trigger table refresh
      await onUpdate();
      window.dispatchEvent(new CustomEvent('structure-updated'));
      window.dispatchEvent(new CustomEvent('refreshTable'));

    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const cascadeVisibility = async (
    currentStructure: any,
    type: string,
    itemId: string,
    isVisible: boolean
  ) => {
    if (type === 'sections') {
      const section = currentStructure.sections.find(s => s.name === itemId);
      if (section) {
        section.visible = isVisible;
        section.subsections.forEach(sub => {
          sub.visible = isVisible;
          sub.fields.forEach(field => field.visible = isVisible);
        });
      }
    } else if (type === 'subsections') {
      const subsection = currentStructure.sections
        .flatMap(s => s.subsections)
        .find(sub => sub.name === itemId);
      if (subsection) {
        subsection.visible = isVisible;
        subsection.fields.forEach(field => field.visible = isVisible);
      }
    }
  };

  const handleVisibilityToggle = async (
    type: 'sections' | 'subsections' | 'fields',
    parentId: string,
    itemId: string
  ) => {
    try {
      setLoading(true);
      const currentStructure = { ...filteredStructure };
      let item;

      if (type === 'sections') {
        item = currentStructure.sections.find(s => s.name === itemId);
      } else if (type === 'subsections') {
        const section = currentStructure.sections.find(s => s.name === parentId);
        item = section?.subsections.find(sub => sub.name === itemId);
      } else {
        const section = currentStructure.sections.find(s => 
          s.subsections.some(sub => sub.name === parentId)
        );
        const subsection = section?.subsections.find(sub => sub.name === parentId);
        item = subsection?.fields.find(f => `${f.table}.${f.name}` === itemId);
      }

      if (!item) return;

      const newVisibility = !item.visible;
      item.visible = newVisibility;

      // Cascade visibility changes
      await cascadeVisibility(currentStructure, type, itemId, newVisibility);

      // Update database
      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: currentStructure,
          updated_at: new Date().toISOString()
        })
        .eq('id', structureId);

      if (error) throw error;

      // Update UI and trigger table refresh
      await onUpdate();
      window.dispatchEvent(new CustomEvent('structure-updated'));
      window.dispatchEvent(new CustomEvent('refreshTable'));

    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkVisibilityToggle = async (isVisible: boolean) => {
    try {
      setLoading(true);
      const currentStructure = { ...filteredStructure };

      currentStructure.sections.forEach(section => {
        section.visible = isVisible;
        section.subsections.forEach(subsection => {
          subsection.visible = isVisible;
          subsection.fields.forEach(field => {
            field.visible = isVisible;
          });
        });
      });

      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: currentStructure,
          updated_at: new Date().toISOString()
        })
        .eq('id', structureId);

      if (error) throw error;

      await onUpdate();
      window.dispatchEvent(new CustomEvent('structure-updated'));
      window.dispatchEvent(new CustomEvent('refreshTable'));

    } catch (error) {
      console.error('Error updating bulk visibility:', error);
      toast.error('Failed to update visibility');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = (
    type: 'sections' | 'subsections' | 'fields',
    parentId: string,
    item: any,
    level: number = 0
  ) => {
    const itemId = type === 'fields' ? `${item.table}.${item.name}` : item.name;
    const displayName = type === 'fields' ? item.display : item.name;
    const isHighlighted = lastMovedItem === itemId;

    return (
      <motion.div
        key={itemId}
        initial={isHighlighted ? { backgroundColor: '#e3f2fd' } : {}}
        animate={isHighlighted ? { backgroundColor: '#ffffff' } : {}}
        transition={{ duration: 2 }}
        className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors ${
          level > 0 ? `ml-${level * 4}` : ''
        }`}
      >
        <span className="flex-1 font-medium text-gray-700">{displayName}</span>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOrderChange(type, parentId, itemId, 'up')}
              className="h-7 w-7 p-0 hover:bg-gray-100"
              disabled={loading}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOrderChange(type, parentId, itemId, 'down')}
              className="h-7 w-7 p-0 hover:bg-gray-100"
              disabled={loading}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <Switch
            checked={item.visible}
            onCheckedChange={() => handleVisibilityToggle(type, parentId, itemId)}
            disabled={loading}
          />
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="text-xl font-semibold text-gray-800">Column Management - {activeMainTab}</h3>
            <div className="flex gap-3">
              <Button 
                onClick={() => handleBulkVisibilityToggle(true)}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                Show All
              </Button>
              <Button 
                onClick={() => handleBulkVisibilityToggle(false)}
                disabled={loading}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Hide All
              </Button>
            </div>
          </div>

          {filteredStructure.sections
            .sort((a, b) => a.order - b.order)
            .map(section => (
              <div key={section.name} className="border rounded-lg p-4 space-y-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                {renderItem('sections', '', section)}
                <div className="pl-4 space-y-3">
                  {section.subsections
                    .sort((a, b) => a.order - b.order)
                    .map(subsection => (
                      <div key={subsection.name} className="bg-gray-50 rounded-md p-3">
                        {renderItem('subsections', section.name, subsection, 1)}
                        <div className="pl-4 space-y-2 mt-2">
                          {subsection.fields
                            .sort((a, b) => a.order - b.order)
                            .map(field => renderItem('fields', subsection.name, field, 2))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};