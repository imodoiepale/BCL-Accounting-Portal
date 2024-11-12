// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash, Settings, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StructureItem {
  id: number;
  section: string;
  subsection: string;
  table_name: string;
  column_mappings: Record<string, string>;
  Tabs: string;
}

export function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [structure, setStructure] = useState<StructureItem[]>([]);
  const [selectedTab, setSelectedTab] = useState('');
  const [selectedSection, setSelectedSection] = useState<StructureItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [newField, setNewField] = useState({ key: '', value: '' });
  const [newStructure, setNewStructure] = useState({
    section: '',
    subsection: '',
    table_name: '',
    Tabs: '',
    column_mappings: {}
  });

  useEffect(() => {
    fetchStructure();
  }, []);

  const fetchStructure = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_category_table_mapping')
        .select('*')
        .order('Tabs', { ascending: true });

      if (error) throw error;
      setStructure(data || []);
    } catch (error) {
      toast.error('Failed to fetch structure');
    }
  };

  const uniqueTabs = [...new Set(structure.map(item => item.Tabs))];

  const handleAddField = () => {
    if (!selectedSection || !newField.key || !newField.value) return;

    const updatedMappings = {
      ...selectedSection.column_mappings,
      [newField.key]: newField.value
    };

    handleUpdateSection(selectedSection.id, { column_mappings: updatedMappings });
    setNewField({ key: '', value: '' });
  };

  const handleDeleteField = async (key: string) => {
    if (!selectedSection) return;

    const updatedMappings = { ...selectedSection.column_mappings };
    delete updatedMappings[key];

    handleUpdateSection(selectedSection.id, { column_mappings: updatedMappings });
  };

  const handleUpdateSection = async (id: number, updates: Partial<StructureItem>) => {
    try {
      const { error } = await supabase
        .from('profile_category_table_mapping')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchStructure();
      toast.success('Updated successfully');
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleAddStructure = async () => {
    try {
      const { error } = await supabase
        .from('profile_category_table_mapping')
        .insert([newStructure]);

      if (error) throw error;
      await fetchStructure();
      setNewStructure({
        section: '',
        subsection: '',
        table_name: '',
        Tabs: '',
        column_mappings: {}
      });
      toast.success('Added new structure');
    } catch (error) {
      toast.error('Failed to add structure');
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen} modal>
        <DialogContent className="max-w-7xl max-h-[170vh]">
          <DialogHeader>
            <DialogTitle>Table Structure Settings</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-12 gap-4">
            {/* Tabs List */}
            <Card className="col-span-2 h-[700px]">
              <CardContent className="p-2">
                <ScrollArea className="h-full">
                  <h3 className="font-semibold mb-2 px-2">Tabs</h3>
                  {uniqueTabs.map(tab => (
                    <button
                      key={tab}
                      className={`w-full text-left px-3 py-2 rounded ${
                        selectedTab === tab ? 'bg-primary text-white' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Sections List */}
            <Card className="col-span-3 h-[700px]">
              <CardContent className="p-2">
                <ScrollArea className="h-full">
                  <h3 className="font-semibold mb-2 px-2">Sections</h3>
                  {structure
                    .filter(item => item.Tabs === selectedTab)
                    .map(item => (
                      <div
                        key={item.id}
                        className={`mb-2 p-2 rounded cursor-pointer ${
                          selectedSection?.id === item.id ? 'bg-primary/10' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedSection(item)}
                      >
                        <div className="font-medium">{item.section}</div>
                        <div className="text-sm text-gray-500">{item.subsection}</div>
                      </div>
                    ))}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Details Panel */}
            <Card className="col-span-7 h-[700px]">
              <CardContent className="p-4">
                <ScrollArea className="h-full">
                  {selectedSection ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Section Details</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditing(!editing)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          {editing ? 'View' : 'Edit'}
                        </Button>
                      </div>

                      {/* Section Info */}
                      <div className="grid gap-4">
                        <div>
                          <label className="text-sm font-medium">Section</label>
                          <Input 
                            value={selectedSection.section}
                            disabled={!editing}
                            onChange={(e) => handleUpdateSection(selectedSection.id, { section: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Subsection</label>
                          <Input 
                            value={selectedSection.subsection}
                            disabled={!editing}
                            onChange={(e) => handleUpdateSection(selectedSection.id, { subsection: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Table Name</label>
                          <Input 
                            value={selectedSection.table_name}
                            disabled={!editing}
                            onChange={(e) => handleUpdateSection(selectedSection.id, { table_name: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Column Mappings */}
                      <div>
                        <h4 className="font-medium mb-2">Column Mappings</h4>
                        <ScrollArea className="h-[260px]">
                          <div className="space-y-2">
                            {Object.entries(selectedSection.column_mappings).map(([key, value], index) => (
                              <div key={key} className="flex items-center gap-2">
                                <div className="w-8 text-center text-sm text-gray-500">{index + 1}</div>
                                <Input 
                                  value={key} 
                                  disabled={!editing}
                                  onChange={(e) => handleUpdateField(key, e.target.value, value)} 
                                />
                                <Input 
                                  value={value} 
                                  disabled={!editing}
                                  onChange={(e) => handleUpdateField(key, key, e.target.value)}
                                />
                                {editing && (
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleDeleteField(key)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>

                        {editing && (
                          <div className="mt-4 flex items-end gap-2">
                            <div className="flex-1">
                              <label className="text-sm font-medium">Field Key</label>
                              <Input
                                value={newField.key}
                                onChange={(e) => setNewField(prev => ({ ...prev, key: e.target.value }))}
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-sm font-medium">Display Name</label>
                              <Input
                                value={newField.value}
                                onChange={(e) => setNewField(prev => ({ ...prev, value: e.target.value }))}
                              />
                            </div>
                            <Button onClick={handleAddField}>Add Field</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 mt-8">
                      Select a section to view details
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* New Structure Form */}
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-4">Add New Structure</h3>
            <div className="grid grid-cols-4 gap-4">
              <Input
                placeholder="Tab"
                value={newStructure.Tabs}
                onChange={(e) => setNewStructure(prev => ({ ...prev, Tabs: e.target.value }))}
              />
              <Input
                placeholder="Section"
                value={newStructure.section}
                onChange={(e) => setNewStructure(prev => ({ ...prev, section: e.target.value }))}
              />
              <Input
                placeholder="Subsection"
                value={newStructure.subsection}
                onChange={(e) => setNewStructure(prev => ({ ...prev, subsection: e.target.value }))}
              />
              <Button onClick={handleAddStructure}>
                <Plus className="h-4 w-4 mr-2" />
                Add Structure
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}