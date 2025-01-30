import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

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
  const [activeTab, setActiveTab] = useState<'select' | 'create'>('select');
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<'text' | 'number' | 'boolean' | 'date'>('text');

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

  const isTableFullySelected = (tableName: string) => {
    const columns = tableColumns[tableName] || [];
    return columns.every(col => selectedFields[tableName]?.includes(col.column_name));
  };

  const handleTableSelectAll = (tableName: string, checked: boolean) => {
    if (checked) {
      const columns = tableColumns[tableName] || [];
      setSelectedFields(prev => ({ ...prev, [tableName]: columns.map(col => col.column_name) }));
    } else {
      setSelectedFields(prev => ({ ...prev, [tableName]: [] }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-4">
        <DialogHeader>
          <DialogTitle>Add Fields</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="select" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select" onClick={() => setActiveTab('select')}>Select Existing Fields</TabsTrigger>
            <TabsTrigger value="create" onClick={() => setActiveTab('create')}>Create New Column</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tables</Label>
                <Input
                  placeholder="Search tables..."
                  value={tableSearchQuery}
                  onChange={(e) => setTableSearchQuery(e.target.value)}
                />
                <ScrollArea className="h-[400px] border rounded-md p-2">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedTables.length === tables.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTables(tables);
                          } else {
                            setSelectedTables([]);
                          }
                        }}
                      />
                      <span>Select All</span>
                    </div>
                    {filteredTables.map((table) => (
                      <div key={table} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedTables.includes(table)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTables([...selectedTables, table]);
                            } else {
                              setSelectedTables(selectedTables.filter((t) => t !== table));
                            }
                          }}
                        />
                        <span>{table}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-4 p-4 bg-primary-foreground/10 rounded-md shadow-md">
                <h3 className="font-medium">Select Fields</h3>
                <Input
                  placeholder="Search fields..."
                  value={fieldSearchQuery}
                  onChange={(e) => setFieldSearchQuery(e.target.value)}
                />
                <ScrollArea className="h-[400px] border rounded-md p-2">
                  <div className="space-y-4">
                    {selectedTables.map((table) => (
                      <div key={table} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{table}</h4>
                          <Checkbox
                            checked={isTableFullySelected(table)}
                            onCheckedChange={(checked) => handleTableSelectAll(table, checked)}
                          />
                        </div>
                        <div className="ml-4 space-y-1">
                          {getFilteredColumns(table).map((column) => (
                            <div key={`${table}.${column.column_name}`} className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedFields[table]?.includes(column.column_name)}
                                onCheckedChange={(checked) => handleFieldSelect(table, column.column_name, checked)}
                              />
                              <span>{column.column_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Column Name</Label>
                <Input
                  placeholder="Enter column name..."
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Column Type</Label>
                <Select value={newColumnType} onValueChange={(value: 'text' | 'number' | 'boolean' | 'date') => setNewColumnType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              if (activeTab === 'select') {
                onApply(selectedTables, selectedFields);
              } else {
                // Handle creating new column
                if (newColumnName && newColumnType) {
                  // Add logic to create new column in the database
                  onApply([], [{ table: 'new', field: newColumnName }]);
                }
              }
            }}
          >
            {activeTab === 'select' ? 'Add Selected Fields' : 'Create Column'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
