// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from "sonner";

interface StructureItem {
  id: number;
  category: string;
  subcategory: string;
  table_name: string;
  column_mappings: any;
}

export function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [structure, setStructure] = useState<StructureItem[]>([]);
  const [newItem, setNewItem] = useState({
    category: '',
    subcategory: '',
    table_name: '',
    column_mappings: {}
  });

  // Fetch structure from database
  useEffect(() => {
    fetchStructure();
  }, []);

  const fetchStructure = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_category_table_mapping')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setStructure(data || []);
    } catch (error) {
      toast.error('Failed to fetch structure');
    }
  };

  // Get unique tabs (categories)
  const tabs = [...new Set(structure.map(item => item.category))];

  // Get sections for selected tab
  const getSections = (tab: string) => {
    return [...new Set(structure
      .filter(item => item.category === tab)
      .map(item => item.subcategory))];
  };

  // Get column mappings for selected section
  const getFields = (tab: string, section: string) => {
    const item = structure.find(
      item => item.category === tab && item.subcategory === section
    );
    return item?.column_mappings || {};
  };

  // Add new structure item
  const handleAdd = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_category_table_mapping')
        .insert([newItem])
        .select();

      if (error) throw error;

      setStructure([...structure, data[0]]);
      toast.success('Structure updated successfully');
    } catch (error) {
      toast.error('Failed to update structure');
    }
  };

  // Delete structure item
  const handleDelete = async (category: string, subcategory: string) => {
    try {
      const { error } = await supabase
        .from('profile_category_table_mapping')
        .delete()
        .match({ category, subcategory });

      if (error) throw error;

      setStructure(structure.filter(
        item => !(item.category === category && item.subcategory === subcategory)
      ));
      toast.success('Item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Structure Settings</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4">
            {/* Left panel - Structure tree */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Structure</h3>
              <ScrollArea className="h-[500px]">
                {tabs.map(tab => (
                  <div key={tab} className="mb-4">
                    <div className="font-medium text-primary">{tab}</div>
                    {getSections(tab).map(section => (
                      <div 
                        key={section}
                        className="ml-4 py-1 cursor-pointer hover:text-primary"
                        onClick={() => {
                          setSelectedTab(tab);
                          setSelectedSection(section);
                        }}
                      >
                        {section}
                      </div>
                    ))}
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Middle panel - Details */}
            <div className="border rounded-lg p-4 col-span-2">
              <h3 className="font-semibold mb-4">Details</h3>
              {selectedTab && selectedSection ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Table Name</label>
                    <Input 
                      value={structure.find(
                        item => item.category === selectedTab && 
                               item.subcategory === selectedSection
                      )?.table_name || ''}
                      onChange={async (e) => {
                        const { error } = await supabase
                          .from('profile_category_table_mapping')
                          .update({ table_name: e.target.value })
                          .match({
                            category: selectedTab,
                            subcategory: selectedSection
                          });
                        
                        if (error) toast.error('Failed to update table name');
                        else fetchStructure();
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Column Mappings</label>
                    <div className="space-y-2">
                      {Object.entries(getFields(selectedTab, selectedSection)).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Input value={key} disabled />
                          <Input value={value as string} disabled />
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              // Handle delete field
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handleDelete(selectedTab, selectedSection)}
                  >
                    Delete Section
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  Select a section to view details
                </div>
              )}
            </div>
          </div>

          {/* Add new structure form */}
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-4">Add New Structure</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Category (Tab)"
                value={newItem.category}
                onChange={(e) => setNewItem({
                  ...newItem,
                  category: e.target.value
                })}
              />
              <Input
                placeholder="Subcategory (Section)"
                value={newItem.subcategory}
                onChange={(e) => setNewItem({
                  ...newItem,
                  subcategory: e.target.value
                })}
              />
              <Input
                placeholder="Table Name"
                value={newItem.table_name}
                onChange={(e) => setNewItem({
                  ...newItem,
                  table_name: e.target.value
                })}
              />
              <Button onClick={handleAdd}>
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