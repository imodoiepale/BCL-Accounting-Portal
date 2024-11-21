// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";


export const MultiSelectDialog = ({ showMultiSelectDialog, setShowMultiSelectDialog, tables, selectedTables, setSelectedTables, selectedTableFields, setSelectedTableFields, tableColumns, setNewStructure }) => {
  const [tempSelectedTables, setTempSelectedTables] = useState<string[]>(selectedTables);
  const [tempSelectedFields, setTempSelectedFields] = useState<{ [table: string]: string[] }>(selectedTableFields);

  useEffect(() => {
    if (showMultiSelectDialog) {
      setTempSelectedTables(selectedTables);
      setTempSelectedFields(selectedTableFields);
    }
  }, [showMultiSelectDialog, selectedTables, selectedTableFields]);

  return (
    <Dialog open={showMultiSelectDialog} onOpenChange={setShowMultiSelectDialog}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select Tables and Fields</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Tables Selection */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h4 className="font-medium mb-4 text-lg text-gray-800">Select Tables</h4>
            <ScrollArea className="h-[400px]">
              {tables.map(table => (
                <div key={table} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id={`multiselect-table-${table}`}
                    checked={tempSelectedTables.includes(table)}
                    onChange={(e) => {
                      setTempSelectedTables(prev =>
                        e.target.checked
                          ? [...prev, table]
                          : prev.filter(t => t !== table)
                      );
                      if (!e.target.checked) {
                        setTempSelectedFields(prev => {
                          const { [table]: _, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor={`multiselect-table-${table}`}
                    className="text-sm text-gray-700 hover:text-gray-900 cursor-pointer flex-1"
                  >
                    {table.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Fields Selection */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h4 className="font-medium mb-4 text-lg text-gray-800">Select Fields</h4>
            <ScrollArea className="h-[400px]">
              {tempSelectedTables.map((tableName, index) => {
                const tableFields = tableColumns.filter(col => col.table_name === tableName);
                return (
                  <div key={tableName}>
                    <div className="bg-gray-50 p-3 rounded-t-lg border-b-2 border-primary/20">
                      <h5 className="font-lg text-black">
                        {tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h5>
                    </div>
                    <div className="p-2 mb-4 border-x border-b rounded-b-lg">
                      {tableFields.map(field => (
                        <div
                          key={`${tableName}-${field.column_name}`}
                          className="flex items-center gap-3 p-2.5 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                        >
                          <input
                            type="checkbox"
                            id={`multiselect-field-${tableName}-${field.column_name}`}
                            checked={tempSelectedFields[tableName]?.includes(field.column_name) || false}
                            onChange={(e) => {
                              setTempSelectedFields(prev => ({
                                ...prev,
                                [tableName]: e.target.checked
                                  ? [...(prev[tableName] || []), field.column_name]
                                  : (prev[tableName] || []).filter(f => f !== field.column_name)
                              }));
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label
                            htmlFor={`multiselect-field-${tableName}-${field.column_name}`}
                            className="text-sm text-gray-700 hover:text-gray-900 cursor-pointer flex-1"
                          >
                            {field.column_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            <span className="ml-2 text-xs text-gray-500">({field.data_type})</span>
                          </label>
                        </div>
                      ))}
                    </div>
                    {index < tempSelectedTables.length - 1 && (
                      <div className="h-4 border-l-2 border-r-2 border-dashed border-gray-200 mx-4" />
                    )}
                  </div>
                );
              })}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowMultiSelectDialog(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setSelectedTables(tempSelectedTables);
              setSelectedTableFields(tempSelectedFields);
              setNewStructure(prev => ({
                ...prev,
                table_names: tempSelectedTables,
                column_mappings: Object.entries(tempSelectedFields).reduce((acc, [table, fields]) => {
                  fields.forEach(field => {
                    acc[`${table}.${field}`] = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  });
                  return acc;
                }, {})
              }));
              setShowMultiSelectDialog(false);
            }}
          >
            Apply Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const EditFieldDialog = ({ editFieldDialogOpen, setEditFieldDialogOpen, editingField, setEditingField, handleSaveFieldEdit }) => (
  <Dialog open={editFieldDialogOpen} onOpenChange={setEditFieldDialogOpen}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Edit Field</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Table Name</label>
            <Input value={editingField.tableName} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Column Name</label>
            <Input value={editingField.columnName} disabled />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Display Name</label>
          <Input 
            value={editingField.displayName}
            onChange={(e) => setEditingField(prev => ({
              ...prev,
              displayName: e.target.value
            }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Has Dropdown Options?</label>
          <Select
            value={editingField.hasDropdown}
            onValueChange={(value: 'yes' | 'no') => setEditingField(prev => ({
              ...prev,
              hasDropdown: value,
              dropdownOptions: value === 'no' ? [] : prev.dropdownOptions
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {editingField.hasDropdown === 'yes' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Dropdown Options</label>
            <div className="space-y-2">
              {editingField.dropdownOptions.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...editingField.dropdownOptions];
                      newOptions[index] = e.target.value;
                      setEditingField(prev => ({
                        ...prev,
                        dropdownOptions: newOptions
                      }));
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setEditingField(prev => ({
                        ...prev,
                        dropdownOptions: prev.dropdownOptions.filter((_, i) => i !== index)
                      }));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  setEditingField(prev => ({
                    ...prev,
                    dropdownOptions: [...prev.dropdownOptions, '']
                  }));
                }}
              >
                Add Option
              </Button>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setEditFieldDialogOpen(false)}>
          Cancel
        </Button>
        <Button onClick={handleSaveFieldEdit}>
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const AddFieldDialog = ({ addFieldDialogOpen, setAddFieldDialogOpen, addFieldState, setAddFieldState, tables, selectedTables, setSelectedTables, selectedTableFields, setSelectedTableFields, handleAddNewField, handleAddExistingFields }) => (
  <Dialog open={addFieldDialogOpen} onOpenChange={setAddFieldDialogOpen}>
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>Add Field</DialogTitle>
      </DialogHeader>

      <Tabs defaultValue="new" onValueChange={(value) => setAddFieldState(prev => ({ ...prev, selectedTab: value }))}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">Add New Field</TabsTrigger>
          <TabsTrigger value="existing">Add Existing Field</TabsTrigger>
        </TabsList>

        {/* New Field Tab */}
        <div className={addFieldState.selectedTab === 'new' ? 'space-y-4 py-4' : 'hidden'}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input
              value={addFieldState.displayName}
              onChange={(e) => setAddFieldState(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="Enter display name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Has Dropdown Options?</label>
            <Select
              value={addFieldState.hasDropdown}
              onValueChange={(value) => setAddFieldState(prev => ({ ...prev, hasDropdown: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select yes/no" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {addFieldState.hasDropdown === 'yes' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Dropdown Options</label>
              <div className="space-y-2">
                {addFieldState.dropdownOptions?.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(addFieldState.dropdownOptions || [])];
                        newOptions[index] = e.target.value;
                        setAddFieldState(prev => ({ ...prev, dropdownOptions: newOptions }));
                      }}
                      placeholder="Enter option"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newOptions = addFieldState.dropdownOptions?.filter((_, i) => i !== index);
                        setAddFieldState(prev => ({ ...prev, dropdownOptions: newOptions }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    const newOptions = [...(addFieldState.dropdownOptions || []), ''];
                    setAddFieldState(prev => ({ ...prev, dropdownOptions: newOptions }));
                  }}
                >
                  Add Option
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Table</label>
            <Select
              value={addFieldState.newFieldTable}
              onValueChange={(value) => setAddFieldState(prev => ({ ...prev, newFieldTable: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {tables.filter(table => table?.trim()).map(table => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Existing Fields Tab */}
        <div className={addFieldState.selectedTab === 'existing' ? 'grid grid-cols-2 gap-4 py-4' : 'hidden'}>
          {/* Tables Selection */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Select Tables</h4>
            <ScrollArea className="h-[400px]">
              {tables.map(table => (
                <div key={table} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id={`table-${table}`}
                    checked={selectedTables.includes(table)}
                    onChange={(e) => {
                      const newSelection = e.target.checked
                        ? [...selectedTables, table]
                        : selectedTables.filter(t => t !== table);
                      setSelectedTables(newSelection);

                    }}
                    className="h-4 w-4"
                  />
                  <label htmlFor={`table-${table}`}>{table}</label>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Fields Selection */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Select Fields</h4>
            <ScrollArea className="h-[400px]">
              {selectedTables.map((tableName) => {
                const tableFields = tableColumns.filter(col => col.table_name === tableName);
                return (
                  <div key={tableName}>
                    <div className="bg-gray-50 p-3 rounded-t-lg border-b-2 border-primary/20">
                      <h5 className="font-lg text-black">{tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h5>
                    </div>
                    <div className="p-2 mb-4 border-x border-b rounded-b-lg">
                      {tableFields.map(field => (
                        <div key={`${tableName}-${field.column_name}`} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            id={`field-${tableName}-${field.column_name}`}
                            checked={selectedTableFields[tableName]?.includes(field.column_name) || false}
                            onChange={(e) => {
                              setSelectedTableFields(prev => ({
                                ...prev,
                                [tableName]: e.target.checked
                                  ? [...(prev[tableName] || []), field.column_name]
                                  : (prev[tableName] || []).filter(f => f !== field.column_name)
                              }));
                            }}
                            className="h-4 w-4"
                          />
                          <label htmlFor={`field-${tableName}-${field.column_name}`}>
                            {field.column_name}
                            <span className="ml-2 text-xs text-gray-500">({field.data_type})</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </ScrollArea>
          </div>
        </div>
      </Tabs>

      <DialogFooter>
        <Button onClick={() => setAddFieldDialogOpen(false)} variant="outline">
          Cancel
        </Button>
        <Button onClick={() => {
          if (addFieldState.selectedTab === 'new') {
            handleAddNewField();
          } else {
            handleAddExistingFields();
          }
        }}>
          Add Field{addFieldState.selectedTab === 'existing' && 's'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const NewTableDialog = ({ showNewTableDialog, setShowNewTableDialog, newTableName, setNewTableName, handleCreateTable, loadingTable }) => (
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
);