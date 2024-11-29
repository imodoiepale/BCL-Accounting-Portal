// @ts-nocheck 
"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface MultiSelectDialogProps {
  showMultiSelectDialog: boolean;
  setShowMultiSelectDialog: (show: boolean) => void;
  selectedTables: string[];
  selectedTableFields: { [table: string]: string[] };
  tables: string[];
  tableColumns: TableColumn[];
  setSelectedTables: (tables: string[]) => void;
  setSelectedTableFields: (fields: { [table: string]: string[] }) => void;
  setNewStructure: (structure: any) => void;
  initialData?: any;
}

export const MultiSelectDialog: React.FC<MultiSelectDialogProps> = ({
  showMultiSelectDialog,
  setShowMultiSelectDialog,
  selectedTables,
  selectedTableFields,
  tables,
  tableColumns,
  setSelectedTables,
  setSelectedTableFields,
  setNewStructure,
  initialData
}) => {
  const [tempSelectedTables, setTempSelectedTables] = useState<string[]>(selectedTables);
  const [tempSelectedFields, setTempSelectedFields] = useState<{ [table: string]: string[] }>(selectedTableFields);
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  
  useEffect(() => {
    if (initialData) {
      const selectedTabs = Object.keys(initialData).map(key => key.split('.')[0]);
      setTempSelectedTables([...new Set(selectedTabs)]);
      
      const fields = Object.keys(initialData).reduce((acc, key) => {
        const [table, field] = key.split('.');
        if (!acc[table]) acc[table] = [];
        acc[table].push(field);
        return acc;
      }, {});
      setTempSelectedFields(fields);
    }
  }, [initialData]);

  useEffect(() => {
    if (showMultiSelectDialog) {
      setTempSelectedTables(selectedTables);
      setTempSelectedFields(selectedTableFields);
    }
  }, [showMultiSelectDialog, selectedTables, selectedTableFields]);

  const filteredTables = tables.filter(table =>
    table.toLowerCase().includes(tableSearchQuery.toLowerCase())
  );

  const handleSelectAllTables = (checked: boolean) => {
    if (checked) {
      setTempSelectedTables(filteredTables);
    } else {
      setTempSelectedTables([]);
      setTempSelectedFields({});
    }
  };

  const handleSelectAllFields = (tableName: string, checked: boolean) => {
    const tableFields = tableColumns
      .filter(col => col.table_name === tableName)
      .filter(col => col.column_name.toLowerCase().includes(fieldSearchQuery.toLowerCase()))
      .map(col => col.column_name);

    setTempSelectedFields(prev => ({
      ...prev,
      [tableName]: checked ? tableFields : []
    }));
  };

  const formatFieldName = (fieldName: string | undefined) => {
    if (!fieldName) return '';
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={showMultiSelectDialog} onOpenChange={setShowMultiSelectDialog}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select Tables and Fields</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h4 className="font-medium mb-4 text-lg text-gray-800">Select Tables</h4>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search tables..."
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div className="flex items-center gap-2 p-2 border-b">
              <input
                type="checkbox"
                id="select-all-tables"
                checked={filteredTables.length > 0 && filteredTables.every(table => tempSelectedTables.includes(table))}
                onChange={(e) => handleSelectAllTables(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="select-all-tables" className="text-sm font-medium text-gray-700">
                Select All Tables
              </label>
            </div>
            <ScrollArea className="h-[400px]">
              {filteredTables.map(table => (
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
                    {formatFieldName(table)}
                  </label>
                </div>
              ))}
            </ScrollArea>
          </div>

          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h4 className="font-medium mb-4 text-lg text-gray-800">Select Fields</h4>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search fields..."
                value={fieldSearchQuery}
                onChange={(e) => setFieldSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <ScrollArea className="h-[400px]">
              {tempSelectedTables.map((tableName, index) => {
                const tableFields = tableColumns
                  .filter(col => col.table_name === tableName)
                  .filter(col => col.column_name.toLowerCase().includes(fieldSearchQuery.toLowerCase()));
                return (
                  <div key={tableName}>
                    <div className="bg-gray-50 p-3 rounded-t-lg border-b-2 border-primary/20">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`select-all-fields-${tableName}`}
                          checked={tableFields.length > 0 && tableFields.every(field => tempSelectedFields[tableName]?.includes(field.column_name))}
                          onChange={(e) => handleSelectAllFields(tableName, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`select-all-fields-${tableName}`} className="font-lg text-black">
                          {formatFieldName(tableName)}
                        </label>
                      </div>
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
                            {formatFieldName(field.column_name)}
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
                    acc[`${table}.${field}`] = formatFieldName(field);
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