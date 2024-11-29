// columnManagementTab.tsx
//@ts-nocheck
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { ChevronUp, ChevronDown } from 'lucide-react';
import {
  updateVisibility,
  updateOrder,
  getVisibilityState,
  getOrderState,
  type VisibilitySettings,
  type OrderSettings
} from './visibilityHandlers';

interface ColumnManagementProps {
  structure: any;
  structureId: number;
  onUpdate: () => Promise<void>;
}

export const ColumnManagement: React.FC<ColumnManagementProps> = ({
  structure,
  structureId,
  onUpdate
}) => {
  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>({
    tabs: {},
    sections: {},
    subsections: {},
    fields: {}
  });
  const [orderSettings, setOrderSettings] = useState<OrderSettings>({
    tabs: {},
    sections: {},
    subsections: {},
    fields: {}
  });

  useEffect(() => {
    setVisibilitySettings(getVisibilityState(structure));
    setOrderSettings(getOrderState(structure));
  }, [structure]);

  const handleVisibilityToggle = async (
    type: 'tabs' | 'sections' | 'subsections' | 'fields',
    key: string
  ) => {
    const currentValue = visibilitySettings[type][key];
    const success = await updateVisibility(structureId, type, key, !currentValue);
    
    if (success) {
      setVisibilitySettings(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          [key]: !currentValue
        }
      }));
      await onUpdate();
    }
  };

  const handleBulkVisibilityToggle = async (
    type: 'tabs' | 'sections' | 'subsections' | 'fields',
    value: boolean
  ) => {
    const updates = Object.keys(visibilitySettings[type]).map(key =>
      updateVisibility(structureId, type, key, value)
    );
    
    await Promise.all(updates);
    await onUpdate();
  };

  const handleOrderChange = async (
    type: 'tabs' | 'sections' | 'subsections' | 'fields',
    key: string,
    direction: 'up' | 'down'
  ) => {
    const items = Object.entries(orderSettings[type])
      .sort(([, a], [, b]) => a - b)
      .map(([id]) => id);
    
    const currentIndex = items.indexOf(key);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= items.length) return;
    
    const reorderedItems = [...items];
    [reorderedItems[currentIndex], reorderedItems[newIndex]] = 
    [reorderedItems[newIndex], reorderedItems[currentIndex]];
    
    const updatedOrder = reorderedItems.map((id, index) => ({
      id,
      order: index + 1
    }));
    
    const success = await updateOrder(structureId, type, updatedOrder);
    
    if (success) {
      const newOrderSettings = {
        ...orderSettings,
        [type]: updatedOrder.reduce((acc, { id, order }) => ({
          ...acc,
          [id]: order
        }), {})
      };
      setOrderSettings(newOrderSettings);
      await onUpdate();
    }
  };

  const renderItem = (
    type: 'tabs' | 'sections' | 'subsections' | 'fields',
    key: string,
    label: string,
    level: number = 0
  ) => (
    <div
      key={key}
      className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors ${
        level > 0 ? `ml-${level * 4}` : ''
      }`}
    >
      <span className="flex-1 font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOrderChange(type, key, 'up')}
            className="h-7 w-7 p-0 hover:bg-gray-100"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOrderChange(type, key, 'down')}
            className="h-7 w-7 p-0 hover:bg-gray-100"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <Switch
          checked={visibilitySettings[type][key] ?? true}
          onCheckedChange={() => handleVisibilityToggle(type, key)}
          className="data-[state=checked]:bg-blue-600"
        />
      </div>
    </div>
  );

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Global controls */}
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="text-xl font-semibold text-gray-800">Column Visibility Settings</h3>
            <div className="flex gap-3">
              <Button 
                onClick={() => handleBulkVisibilityToggle('fields', true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Show All
              </Button>
              <Button 
                onClick={() => handleBulkVisibilityToggle('fields', false)}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                Hide All
              </Button>
            </div>
          </div>

          {/* Sections */}
          {structure.sections
            .sort((a, b) => (orderSettings.sections[a.name] || 0) - (orderSettings.sections[b.name] || 0))
            .map(section => (
              <div key={section.name} className="border rounded-lg p-4 space-y-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                {renderItem('sections', section.name, section.name)}

                {/* Subsections */}
                <div className="pl-4 space-y-3">
                  {section.subsections
                    .sort((a, b) => (orderSettings.subsections[a.name] || 0) - (orderSettings.subsections[b.name] || 0))
                    .map(subsection => (
                      <div key={subsection.name} className="bg-gray-50 rounded-md p-3">
                        {renderItem('subsections', subsection.name, subsection.name, 1)}

                        {/* Fields */}
                        <div className="pl-4 space-y-2 mt-2">
                          {subsection.fields
                            .sort((a, b) => {
                              const keyA = `${a.table}.${a.name}`;
                              const keyB = `${b.table}.${b.name}`;
                              return (orderSettings.fields[keyA] || 0) - (orderSettings.fields[keyB] || 0);
                            })
                            .map(field => {
                              const fieldKey = `${field.table}.${field.name}`;
                              return renderItem('fields', fieldKey, field.display, 2);
                            })}
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
}