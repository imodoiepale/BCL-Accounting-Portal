import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface Column {
  column_name: string;
  data_type: string;
  table_name: string;
}

interface SelectTablesAndFieldsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedTables: string[], selectedFields: { [table: string]: string[] }) => void;
}

export function SelectTablesAndFieldsDialog({
  isOpen,
  onClose,
  onApply
}: SelectTablesAndFieldsDialogProps) {
  const [tables, setTables] = useState<string[]>([]);
  const [tableColumns, setTableColumns] = useState<{ [table: string]: Column[] }>({});
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<{ [table: string]: string[] }>({});
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');

  // Fetch tables on component mount
  useEffect(() => {
    if (isOpen) {
      fetchTables().then(setTables);
    }
  }, [isOpen]);

  // Fetch columns when a table is selected
  useEffect(() => {
    selectedTables.forEach(async (table) => {
      if (!tableColumns[table]) {
        const columns = await fetchTableColumns(table);
        setTableColumns(prev => ({ ...prev, [table]: columns }));
      }
    });
  }, [selectedTables]);

  const fetchTables = async () => {
    try {
      const { data: tablesData, error: tablesError } = await supabase.rpc('get_all_tables');
      if (tablesError) throw tablesError;
      return tablesData.map(t => t.table_name).sort();
    } catch (error) {
      toast.error('Failed to fetch tables');
      return [];
    }
  };

  const fetchTableColumns = async (tableName: string) => {
    try {
      const { data, error } = await supabase.rpc('get_table_columns', {
        input_table_name: tableName
      });
      if (error) throw error;
      return data.map(col => ({
        column_name: col.column_name,
        data_type: col.data_type,
        table_name: tableName
      }));
    } catch (error) {
      toast.error('Failed to fetch columns');
      return [];
    }
  };

  const handleTableSelect = (tableName: string, checked: boolean) => {
    setSelectedTables(prev => {
      const newSelection = checked
        ? [...prev, tableName]
        : prev.filter(t => t !== tableName);
      
      // Update selected fields
      setSelectedFields(prevFields => {
        const newFields = { ...prevFields };
        if (!checked) {
          delete newFields[tableName];
        } else {
          newFields[tableName] = [];
        }
        return newFields;
      });

      return newSelection;
    });
  };

  const handleFieldSelect = (tableName: string, fieldName: string, checked: boolean) => {
    setSelectedFields(prev => ({
      ...prev,
      [tableName]: checked
        ? [...(prev[tableName] || []), fieldName]
        : (prev[tableName] || []).filter(f => f !== fieldName)
    }));
  };

  const handleSelectAllTables = (checked: boolean) => {
    if (checked) {
      setSelectedTables(tables);
      const allFields = {};
      tables.forEach(table => {
        allFields[table] = [];
      });
      setSelectedFields(allFields);
    } else {
      setSelectedTables([]);
      setSelectedFields({});
    }
  };

  const filteredTables = tables.filter(table =>
    table.toLowerCase().includes(tableSearchQuery.toLowerCase())
  );

  const getFilteredColumns = (tableName: string) => {
    const columns = tableColumns[tableName] || [];
    return columns.filter(col =>
      col.column_name.toLowerCase().includes(fieldSearchQuery.toLowerCase())
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select Tables and Fields</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Tables Selection */}
          <div className="space-y-4">
            <h3 className="font-medium">Select Tables</h3>
            <Input
              placeholder="Search tables..."
              value={tableSearchQuery}
              onChange={(e) => setTableSearchQuery(e.target.value)}
            />
            <ScrollArea className="h-[400px] border rounded-md p-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all-tables"
                    checked={selectedTables.length === tables.length}
                    onCheckedChange={handleSelectAllTables}
                  />
                  <label htmlFor="select-all-tables">Select All Tables</label>
                </div>
                <div className="space-y-1">
                  {filteredTables.map((table) => (
                    <div key={table} className="flex items-center space-x-2">
                      <Checkbox
                        id={table}
                        checked={selectedTables.includes(table)}
                        onCheckedChange={(checked) => handleTableSelect(table, !!checked)}
                      />
                      <label htmlFor={table}>{table}</label>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Fields Selection */}
          <div className="space-y-4">
            <h3 className="font-medium">Select Fields</h3>
            <Input
              placeholder="Search fields..."
              value={fieldSearchQuery}
              onChange={(e) => setFieldSearchQuery(e.target.value)}
            />
            <ScrollArea className="h-[400px] border rounded-md p-4">
              <div className="space-y-4">
                {selectedTables.map((table) => (
                  <div key={table} className="space-y-2">
                    <h4 className="font-medium">{table}</h4>
                    <div className="space-y-1 ml-4">
                      {getFilteredColumns(table).map((column) => (
                        <div key={`${table}-${column.column_name}`} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${table}-${column.column_name}`}
                            checked={selectedFields[table]?.includes(column.column_name)}
                            onCheckedChange={(checked) => handleFieldSelect(table, column.column_name, !!checked)}
                          />
                          <label htmlFor={`${table}-${column.column_name}`}>
                            {column.column_name}
                            <span className="text-sm text-muted-foreground ml-2">({column.data_type})</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => {
            onApply(selectedTables, selectedFields);
            onClose();
          }}>
            Apply Selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
