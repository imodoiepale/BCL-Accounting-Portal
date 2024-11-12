// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash, Settings, Edit2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface StructureItem {
  id: number;
  section: string;
  subsection: string;
  table_name: string;
  column_mappings: Record<string, string>;
  column_order: Record<string, number>;
  Tabs: string;
}

// Add these helper functions
const toColumnName = (displayName: string) => {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim();
};

// Add this interface
interface TableColumn {
  column_name: string;
  data_type: string;
}

interface NewStructure {
  section: string;
  subsection: string;
  table_name: string;
  Tabs: string;
  column_mappings: Record<string, string>;
  isNewTab: boolean;
  isNewSection: boolean;
  isNewSubsection: boolean;
}

export function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [structure, setStructure] = useState<StructureItem[]>([]);
  const [selectedTab, setSelectedTab] = useState('');
  const [selectedSection, setSelectedSection] = useState<StructureItem | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [newField, setNewField] = useState({ key: '', value: '' });
  const [newStructure, setNewStructure] = useState<NewStructure>({
    section: '',
    subsection: '',
    table_name: '',
    Tabs: '',
    column_mappings: {},
    isNewTab: false,
    isNewSection: false,
    isNewSubsection: false
  });
  const [tables, setTables] = useState<string[]>([]);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]); // Ensure this is an array
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [existingSections, setExistingSections] = useState<string[]>([]);
  const [existingSubsections, setExistingSubsections] = useState<Record<string, string[]>>({});
  const [showNewTableDialog, setShowNewTableDialog] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [loadingTable, setLoadingTable] = useState(false);
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [uniqueTabs, setUniqueTabs] = useState<string[]>([]); // Initialize uniqueTabs

  useEffect(() => {
    fetchStructure();
  }, []);

  const fetchStructure = async () => {
    try {
      const { data: mappings, error } = await supabase
        .from('profile_category_table_mapping')
        .select('*')
        .order('Tabs', { ascending: true })
        .order('section', { ascending: true })
        .order('subsection', { ascending: true });

      if (error) throw error;

      const processedMappings = mappings.map(mapping => ({
        id: mapping.id,
        section: mapping.section,
        subsection: mapping.subsection,
        table_name: mapping.table_name,
        column_mappings: mapping.column_mappings || {},
        column_order: mapping.column_order || {},
        Tabs: mapping.Tabs,
        column_settings: mapping.column_settings || {}
      }));

      setStructure(processedMappings);

      const tabs = [...new Set(mappings.map(m => m.Tabs))];
      setUniqueTabs(tabs); // Set uniqueTabs here

      const sections = [...new Set(mappings.map(m => m.section))];
      const subsections = mappings.reduce((acc, m) => {
        if (!acc[m.section]) {
          acc[m.section] = [];
        }
        if (!acc[m.section].includes(m.subsection)) {
          acc[m.section].push(m.subsection);
        }
        return acc;
      }, {});

      setExistingSections(sections);
      setExistingSubsections(subsections);

      if (!selectedTab && tabs.length > 0) {
        setSelectedTab(tabs[0]);
      }

    } catch (error) {
      console.error('Error fetching structure:', error);
      toast.error('Failed to fetch table structure');
    }
  };

  useEffect(() => {
    fetchTables();
    fetchExistingSectionsAndSubsections();
  }, []);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_category_table_mapping')
        .select('table_name')
        .order('table_name', { ascending: true });

      if (error) throw error;
      setTables([...new Set(data.map(t => t.table_name))]);
    } catch (error) {
      toast.error('Failed to fetch tables');
    }
  };

  const fetchTableColumns = async (tableName: string) => {
    try {
      const { data, error } = await supabase
        .from('profile_category_table_mapping')
        .select('column_mappings, column_settings, column_order')
        .eq('table_name', tableName);

      if (error) throw error;
      setTableColumns(prev => ({
        ...prev,
        [tableName]: data
      }));
    } catch (error) {
      toast.error('Failed to fetch columns');
    }
  };

  const fetchExistingSectionsAndSubsections = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_category_table_mapping')
        .select('section, subsection')
        .order('section', { ascending: true });

      if (error) throw error;

      const sections = [...new Set(data.map(item => item.section))];
      const subsections = data.reduce((acc, item) => {
        if (!acc[item.section]) {
          acc[item.section] = [];
        }
        acc[item.section].push(item.subsection);
        return acc;
      }, {});

      setExistingSections(sections);
      setExistingSubsections(subsections);
    } catch (error) {
      toast.error('Failed to fetch sections');
    }
  };

  const handleAddColumn = async (tableName: string, columnName: string) => {
    try {
      const { error } = await supabase.rpc('add_column_to_table', {
        p_table_name: tableName,
        p_column_name: columnName,
        p_data_type: 'text'
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding column:', error);
      return false;
    }
  };

  const handleRemoveColumn = async (tableName: string, columnName: string) => {
    try {
      const { error } = await supabase.rpc('remove_column_from_table', {
        p_table_name: tableName,
        p_column_name: columnName
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing column:', error);
      return false;
    }
  };

  const handleAddField = async () => {
    if (!selectedSection || !newField.value) return;

    const columnName = toColumnName(newField.value);

    try {
      const columnAdded = await handleAddColumn(selectedSection.table_name, columnName);
      if (!columnAdded) throw new Error('Failed to add column to table');

      const updatedMappings = {
        ...selectedSection.column_mappings,
        [columnName]: newField.value
      };

      const maxOrder = Math.max(...Object.values(selectedSection.column_order), -1);
      const updatedOrder = {
        ...selectedSection.column_order,
        [columnName]: maxOrder + 1
      };

      await handleUpdateSection(selectedSection.id, {
        column_mappings: updatedMappings,
        column_order: updatedOrder
      });

      setNewField({ key: '', value: '' });
      setShowAddFieldDialog(false);
      toast.success('Field added successfully');

    } catch (error) {
      console.error('Error adding field:', error);
      toast.error('Failed to add field');
    }
  };

  const handleDeleteField = async (key: string) => {
    if (!selectedSection) return;

    try {
      const columnRemoved = await handleRemoveColumn(selectedSection.table_name, key);
      if (!columnRemoved) throw new Error('Failed to remove column from table');

      const updatedMappings = { ...selectedSection.column_mappings };
      delete updatedMappings[key];

      await handleUpdateSection(selectedSection.id, {
        column_mappings: updatedMappings
      });

      toast.success('Field removed successfully');

    } catch (error) {
      console.error('Error removing field:', error);
      toast.error('Failed to remove field');
    }
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

  const handleCreateTable = async (tableName) => {
    setLoadingTable(true);
    try {
      const { error: createError } = await supabase.rpc('create_table_with_defaults', {
        p_table_name: tableName
      });

      if (createError) throw createError;

      await fetchTables();
      setNewTableName('');
      setShowNewTableDialog(false);
      toast.success('Table created successfully');
    } catch (error) {
      toast.error('Failed to create table');
      console.error('Error creating table:', error);
    } finally {
      setLoadingTable(false);
    }
  };

  const handleAddStructure = async () => {
    try {
      if (newStructure.table_name === 'new' && newTableName) {
        await handleCreateTable(newTableName);
        newStructure.table_name = newTableName;
      }

      const columnMappings = selectedFields.reduce((acc, field) => {
        acc[field] = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return acc;
      }, {});

      const columnOrder = selectedFields.reduce((acc, field, index) => {
        acc[field] = index;
        return acc;
      }, {});

      const { error } = await supabase
        .from('profile_category_table_mapping')
        .insert([{
          section: newStructure.section,
          subsection: newStructure.subsection,
          table_name: newStructure.table_name,
          Tabs: newStructure.Tabs,
          column_mappings: columnMappings,
          column_order: columnOrder
        }]);

      if (error) throw error;

      await fetchStructure();
      setNewStructure({
        section: '',
        subsection: '',
        table_name: '',
        Tabs: '',
        column_mappings: {},
        isNewTab: false,
        isNewSection: false,
        isNewSubsection: false
      });
      setSelectedFields([]);
      toast.success('Added new structure');
    } catch (error) {
      toast.error('Failed to add structure');
      console.error('Error adding structure:', error);
    }
  };

  const handleReorder = async (key: string, newOrder: number) => {
    if (!selectedSection) return;

    try {
      const updatedOrder = { ...selectedSection.column_order };
      updatedOrder[key] = newOrder;

      Object.entries(updatedOrder).forEach(([k, v]) => {
        if (k !== key && v >= newOrder) {
          updatedOrder[k] = v + 1;
        }
      });

      await handleUpdateSection(selectedSection.id, {
        column_order: updatedOrder
      });

      toast.success('Order updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen} modal>
        <DialogContent className="max-w-7xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Table Structure Settings</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-12 gap-4">
            {/* Left Panel - Tabs */}
            <Card className="col-span-2 h-[600px]">
              <CardContent className="p-2">
                <ScrollArea className="h-[550px]">  
                  <div className="flex justify-between items-center mb-2 px-2">
                    <h3 className="font-semibold">Tabs</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTab('')}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {uniqueTabs.map(tab => (
                    <button
                      key={tab}
                      className={`w-full text-left px-3 py-2 rounded transition-colors ${
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

            {/* Middle Panel - Sections */}
            <Card className="col-span-3 h-[600px]">
              <CardContent className="p-2">
                <ScrollArea className="h-[550px]">  
                  <div className="flex justify-between items-center mb-2 px-2">
                    <h3 className="font-semibold">Sections</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSection(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {structure
                    .filter(item => item.Tabs === selectedTab)
                    .map(item => (
                      <div
                        key={item.id}
                        className={`mb-2 p-2 rounded cursor-pointer transition-colors ${
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

            {/* Subsections Panel */}
            <Card className="col-span-3 h-[600px]">
              <CardContent className="p-2">
                <ScrollArea className="h-[550px]">  
                  <div className="flex justify-between items-center mb-2 px-2">
                    <h3 className="font-semibold">Subsections</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSubsection(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedSection && existingSubsections[selectedSection.section]?.map(subsection => (
                    <div
                      key={subsection}
                      className={`mb-2 p-2 rounded cursor-pointer transition-colors ${
                        selectedSubsection === subsection ? 'bg-primary/10' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedSubsection(subsection)}
                    >
                      <div className="font-medium">{subsection}</div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Right Panel - Details */}
            <Card className="col-span-4 h-[600px]">
              <CardContent className="p-4">
                <ScrollArea className="h-[550px]">  
                  {selectedSection ? (
                    <div className="space-y-4">
                      {/* Header with Edit Button */}
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Section Details</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditing(!editing)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            {editing ? 'View' : 'Edit'}
                          </Button>
                          {editing && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {/* Add delete handler */}}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          )}
                        </div>
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
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Column Mappings</h4>
                          {editing && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAddFieldDialog(true)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Field
                            </Button>
                          )}
                        </div>
                        <div className="border rounded-lg">
                          <div className="grid grid-cols-[60px,40px,1fr,1fr,80px] gap-2 p-2 bg-gray-50 border-b">
                            <div className="text-sm font-medium text-gray-500">Order</div>
                            <div className="text-sm font-medium text-gray-500">#</div>
                            <div className="text-sm font-medium text-gray-500">Column Name</div>
                            <div className="text-sm font-medium text-gray-500">Display Name</div>
                            <div></div>
                          </div>
                          <ScrollArea className="h-[300px]">
                            {Object.entries(selectedSection.column_mappings)
                              .sort((a, b) => {
                                const orderA = selectedSection.column_order ? selectedSection.column_order[a[0]] : 0;
                                const orderB = selectedSection.column_order ? selectedSection.column_order[b[0]] : 0;
                                return (orderA || 0) - (orderB || 0);
                              })
                              .map(([key, value], index) => (
                                <div 
                                  key={key}
                                  className="grid grid-cols-[60px,40px,1fr,1fr,80px] gap-2 p-2 border-b last:border-b-0 hover:bg-gray-50"
                                >
                                  <div className="flex items-center gap-1">
                                    {editing ? (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          disabled={index === 0}
                                          onClick={() => handleReorder(key, (selectedSection.column_order[key] || index) - 1)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <ChevronUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          disabled={index === Object.keys(selectedSection.column_mappings).length - 1}
                                          onClick={() => handleReorder(key, (selectedSection.column_order[key] || index) + 1)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <ChevronDown className="h-4 w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <span className="text-sm text-gray-500">
                                        {selectedSection.column_order[key] || index + 1}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500 text-center">{index + 1}</div>
                                  <div className="text-sm">{key}</div>
                                  <div className="text-sm">{value}</div>
                                  {editing && (
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteField(key)}
                                        className="h-6 w-6"
                                      >
                                        <Trash className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </ScrollArea>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <Settings className="h-12 w-12 mb-4" />
                      <p>Select a section to view details</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Add New Structure UI */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-6">Add New Structure</h3>
            <div className="flex flex-row md:flex-row gap-4">
              {/* Tab Selection/Creation */}
              <div className="space-y-3 w-full md:w-1/2 mb-4">
                <label className="text-sm font-medium text-gray-700">Tab</label>
                <Select
                  value={newStructure.Tabs}
                  onValueChange={(value) => {
                    if (value === 'new') {
                      setNewStructure(prev => ({
                        ...prev,
                        Tabs: '',
                        isNewTab: true
                      }));
                    } else {
                      setNewStructure(prev => ({
                        ...prev,
                        Tabs: value,
                        isNewTab: false
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select or Create Tab" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueTabs.map(tab => (
                      tab && <SelectItem key={tab} value={tab}>{tab}</SelectItem>
                    ))}
                    <SelectItem value="new" className="text-blue-600 font-medium">+ Create New Tab</SelectItem>
                  </SelectContent>
                </Select>

                {newStructure.isNewTab && (
                  <Input
                    placeholder="Enter new tab name"
                    value={newStructure.Tabs}
                    onChange={(e) => setNewStructure(prev => ({
                      ...prev,
                      Tabs: e.target.value
                    }))}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Section Selection/Creation */}
              <div className="space-y-3 w-full md:w-1/2 mb-4 ">
                <label className="text-sm font-medium text-gray-700">Section</label>
                <Select
                  value={newStructure.section}
                  onValueChange={(value) => {
                    if (value === 'new') {
                      setNewStructure(prev => ({
                        ...prev,
                        section: '',
                        isNewSection: true,
                        subsection: '',
                        isNewSubsection: false
                      }));
                    } else {
                      setNewStructure(prev => ({
                        ...prev,
                        section: value,
                        isNewSection: false
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select or Create Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingSections.map(section => (
                      <SelectItem key={section} value={section}>{section}</SelectItem>
                    ))}
                    <SelectItem value="new" className="text-blue-600 font-medium">+ Create New Section</SelectItem>
                  </SelectContent>
                </Select>

                {newStructure.isNewSection && (
                  <Input
                    placeholder="Enter new section name"
                    value={newStructure.section}
                    onChange={(e) => setNewStructure(prev => ({
                      ...prev,
                      section: e.target.value
                    }))}
                    className="mt-2"
                  />
                )}
              </div>

              </div>
              <div className="flex flex-row md:flex-row gap-4">
              {/* Subsection Selection/Creation */}
              <div className="space-y-3 w-full md:w-1/2 mb-4">
                <label className="text-sm font-medium text-gray-700">Subsection</label>
                {!newStructure.isNewSection ? (
                  <Select
                    value={newStructure.subsection}
                    onValueChange={(value) => {
                      if (value === 'new') {
                        setNewStructure(prev => ({
                          ...prev,
                          subsection: '',
                          isNewSubsection: true
                        }));
                      } else {
                        setNewStructure(prev => ({
                          ...prev,
                          subsection: value,
                          isNewSubsection: false
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select or Create Subsection" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingSubsections[newStructure.section]?.map(subsection => (
                        subsection && <SelectItem key={subsection} value={subsection}>{subsection}</SelectItem>
                      ))}
                      <SelectItem value="new" className="text-blue-600 font-medium">+ Create New Subsection</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Enter new subsection name"
                    value={newStructure.subsection}
                    onChange={(e) => setNewStructure(prev => ({
                      ...prev,
                      subsection: e.target.value
                    }))}
                    className="mt-2"
                  />
                )}

                {!newStructure.isNewSection && newStructure.isNewSubsection && (
                  <Input
                    placeholder="Enter new subsection name"
                    value={newStructure.subsection}
                    onChange={(e) => setNewStructure(prev => ({
                      ...prev,
                      subsection: e.target.value
                    }))}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Table Selection/Creation */}
              <div className="space-y-3 w-full md:w-1/2 mb-4">
                <label className="text-sm font-medium text-gray-700">Table</label>
                <Select
                  value={newStructure.table_name}
                  onValueChange={(value) => {
                    if (value === 'new') {
                      setShowNewTableDialog(true);
                    } else {
                      setNewStructure(prev => ({
                        ...prev,
                        table_name: value
                      }));
                      if (value) fetchTableColumns(value);
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select or Create Table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map(table => (
                      table && <SelectItem key={table} value={table}>{table}</SelectItem>
                    ))}
                    <SelectItem value="new" className="text-blue-600 font-medium">+ Create New Table</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>
              <div className="flex flex-row md:flex-row gap-4">
              {/* Field Selection */}
              <div className="space-y-3 w-full md:w-1/2 mb-4">
                <label className="text-sm font-medium text-gray-700">Fields</label>
                <Select
                  multiple
                  value={selectedFields}
                  onValueChange={setSelectedFields}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select Fields" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(tableColumns) && tableColumns.map(column => (
                      <SelectItem key={column.column_name} value={column.column_name}>
                        {column.column_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview and Add Button */}
              <div className="pt-6 space-y-6">
                {(newStructure.Tabs || newStructure.isNewTab) && 
                 (newStructure.section || newStructure.isNewSection) && 
                 (newStructure.subsection || newStructure.isNewSubsection) && 
                 newStructure.table_name && (
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                    <h4 className="font-medium text-gray-900">Structure Preview</h4>
                    <div className="flex justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium text-gray-700">Tab:</span> <span className="text-gray-600">{newStructure.Tabs}</span></p>
                        <p className="text-sm"><span className="font-medium text-gray-700">Section:</span> <span className="text-gray-600">{newStructure.section}</span></p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium text-gray-700">Subsection:</span> <span className="text-gray-600">{newStructure.subsection}</span></p>
                        <p className="text-sm"><span className="font-medium text-gray-700">Table:</span> <span className="text-gray-600">{newStructure.table_name}</span></p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleAddStructure}
                    disabled={
                      (!newStructure.Tabs && !newStructure.isNewTab) || 
                      (!newStructure.section && !newStructure.isNewSection) || 
                      (!newStructure.subsection && !newStructure.isNewSubsection) || 
                      !newStructure.table_name ||
                      loadingTable
                    }
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Structure
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Table Dialog */}
      <AlertDialog open={showNewTableDialog} onOpenChange={setShowNewTableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Table</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a name for the new table. It will be created with default columns (id, created_at, updated_at).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="table_name"
              className="mb-2"
            />
            <p className="text-sm text-gray-500">
              Only lowercase letters, numbers, and underscores allowed
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleCreateTable(newTableName)}
              disabled={!newTableName || loadingTable}
            >
              {loadingTable ? 'Creating...' : 'Create Table'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}