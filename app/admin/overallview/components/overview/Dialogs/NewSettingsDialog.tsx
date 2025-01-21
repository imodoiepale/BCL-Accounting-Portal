import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronUp, ChevronDown, Plus, GripVertical, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface StructureItem {
  id: string;
  name: string;
  order: number;
  visible: boolean;
  tableName?: string;
}

const NewSettingsDialog = () => {
  const [selectedTab, setSelectedTab] = useState('maintabs');
  const [structure, setStructure] = useState({
    maintabs: [] as StructureItem[],
    subtabs: [] as StructureItem[],
    sections: [] as StructureItem[],
    subsections: [] as StructureItem[],
    fields: [] as StructureItem[],
  });

  const tabLabels = {
    maintabs: 'Main Tabs (Level 1)',
    subtabs: 'Sub Tabs (Level 2)',
    sections: 'Sections (Level 3)',
    subsections: 'Subsections (Level 4)',
    fields: 'Fields (Level 5)',
  };

  const handleOrderChange = (index: number, direction: 'up' | 'down', items: StructureItem[], type: string) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) return;

    const newItems = [...items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    
    newItems.forEach((item, idx) => {
      item.order = idx;
    });

    setStructure(prev => ({
      ...prev,
      [type]: newItems
    }));
  };

  const handleDelete = (item: StructureItem, type: string) => {
    setStructure(prev => ({
      ...prev,
      [type]: prev[type].filter(i => i.id !== item.id)
    }));
  };

  const handleAdd = (type: string) => {
    const newItem: StructureItem = {
      id: Math.random().toString(),
      name: `New ${type.slice(0, -1)}`,
      order: structure[type].length,
      visible: true
    };

    setStructure(prev => ({
      ...prev,
      [type]: [...prev[type], newItem]
    }));
  };

  const renderTable = (items: StructureItem[], type: string) => (
    <div className="rounded-md border">
      <div className="grid grid-cols-[40px,1fr,100px,80px,160px] bg-blue-600 text-white text-sm">
        <div className="p-2 text-center">Order</div>
        <div className="p-2 font-medium">Name</div>
        <div className="p-2 font-medium text-center">Table Name</div>
        <div className="p-2 font-medium text-center">Visible</div>
        <div className="p-2 font-medium text-center">Actions</div>
      </div>
      <div className="divide-y">
        {items.map((item, index) => (
          <div key={item.id} className="grid grid-cols-[40px,1fr,100px,80px,160px] items-center text-sm hover:bg-muted/50">
            <div className="flex items-center justify-center gap-1 p-2">
              <span className="w-6 text-center">{index + 1}</span>
            </div>
            <div className="p-2 flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <span>{item.name}</span>
            </div>
            <div className="p-2 text-center">
              {item.tableName || '-'}
            </div>
            <div className="p-2 flex justify-center">
              <Switch
                checked={item.visible}
                onCheckedChange={(checked) => {
                  setStructure(prev => ({
                    ...prev,
                    [type]: prev[type].map(i => 
                      i.id === item.id ? { ...i, visible: checked } : i
                    )
                  }));
                }}
              />
            </div>
            <div className="p-2 flex items-center justify-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => handleOrderChange(index, 'up', items, type)}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => handleOrderChange(index, 'down', items, type)}
                disabled={index === items.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  // Add edit functionality
                  const newName = window.prompt('Enter new name:', item.name);
                  if (newName) {
                    setStructure(prev => ({
                      ...prev,
                      [type]: prev[type].map(i => 
                        i.id === item.id ? { ...i, name: newName } : i
                      )
                    }));
                  }
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this item?')) {
                    handleDelete(item, type);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-4 text-center text-muted-foreground">
            No items added yet. Click the Add button above to create one.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Table Structure Settings</DialogTitle>
        </DialogHeader>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 overflow-hidden">
          <div className="border rounded-lg p-1 mb-4">
            <TabsList className="grid grid-cols-5 w-full">
              {Object.entries(tabLabels).map(([value, label]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={cn(
                    "data-[state=active]:bg-blue-600 data-[state=active]:text-white",
                    "flex flex-col items-center gap-1 py-2"
                  )}
                >
                  <span className="text-sm font-medium">{label.split(' (')[0]}</span>
                  <span className="text-xs opacity-75">{label.split(' (')[1].replace(')', '')}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {Object.entries(tabLabels).map(([value, label]) => (
            <TabsContent key={value} value={value} className="flex-1 overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{label}</h3>
                <Button
                  onClick={() => handleAdd(value)}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {label.split(' (')[0].slice(0, -1)}
                </Button>
              </div>
              {renderTable(structure[value], value)}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default NewSettingsDialog;
