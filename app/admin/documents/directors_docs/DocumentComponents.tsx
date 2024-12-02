import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { MoreVertical, Plus, Edit2, Settings, Trash2, Upload } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from 'react-hot-toast';

interface Field {
  id: string;
  name: string;
  type: string;
}

interface Document {
  id: string;
  name: string;
  fields?: Field[];
}

interface DocumentActionsProps {
  document: Document;
  onAddField: () => void;
  onUpdateFields: (documentId: string, fields: Field[]) => void;
}

export const DocumentActions = ({ document, onAddField, onUpdateFields }: DocumentActionsProps) => {
  const [isManageFieldsOpen, setIsManageFieldsOpen] = useState(false);
  const [fields, setFields] = useState<Field[]>(document.fields || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = (id: string, key: 'name' | 'type', value: string) => {
    setFields(prevFields =>
      prevFields.map(field => (field.id === id ? { ...field, [key]: value } : field))
    );
  };

  const handleDeleteField = (id: string) => {
    setFields(prevFields => prevFields.filter(field => field.id !== id));
  };

  const generateId = () => crypto.randomUUID();

  const handleAddNewField = () => {
    const newField: Field = {
      id: generateId(),
      name: `Field ${fields.length + 1}`,
      type: 'text'
    };
    setFields(prevFields => [...prevFields, newField]);
  };

  const handleSaveChanges = () => {
    // Validate unique field names
    const uniqueNames = new Set();
    const hasUniqueNames = fields.every(field => {
      const sanitizedName = field.name.toLowerCase().trim();
      if (uniqueNames.has(sanitizedName)) {
        toast.error(`Duplicate field name: ${field.name}`);
        return false;
      }
      uniqueNames.add(sanitizedName);
      return true;
    });

    if (hasUniqueNames) {
      onUpdateFields(document.id, fields);
      setIsManageFieldsOpen(false);
      toast.success('Fields updated successfully');
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Assuming CSV format: Field Name,Field Type
        const newFields = lines.slice(1).map(line => {
          const [name, type = 'text'] = line.split(',').map(item => item.trim());
          return {
            id: generateId(),
            name,
            type: ['text', 'number', 'date', 'file'].includes(type.toLowerCase()) 
              ? type.toLowerCase() 
              : 'text'
          };
        });

        setFields(newFields);
        toast.success(`Imported ${newFields.length} fields from CSV`);
      };
      reader.readAsText(file);
    }
  };

  const handlePasteFields = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData('text');
    const lines = pastedText.split('\n').filter(line => line.trim());
    
    const newFields = lines.map(line => {
      const [name, type = 'text'] = line.split(',').map(item => item.trim());
      return {
        id: generateId(),
        name,
        type: ['text', 'number', 'date', 'file'].includes(type.toLowerCase()) 
          ? type.toLowerCase() 
          : 'text'
      };
    });

    setFields(newFields);
    toast.success(`Imported ${newFields.length} fields from text`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-transparent">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={onAddField}>
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsManageFieldsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Manage Fields
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isManageFieldsOpen} onOpenChange={setIsManageFieldsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Fields for {document.name}</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="manual">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="csv">CSV Import</TabsTrigger>
              <TabsTrigger value="paste">Paste Fields</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-4">
              <div className="max-h-[60vh] overflow-y-auto">
                {fields.map((field) => (
                  <div key={field.id} className="flex gap-2 items-start p-4 bg-gray-50 rounded-lg mb-2">
                    <div className="flex-1">
                      <label className="text-sm font-medium">Field Name</label>
                      <Input
                        value={field.name}
                        onChange={(e) => handleFieldChange(field.id, 'name', e.target.value)}
                        placeholder="Enter field name"
                        className="mt-1"
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6"
                      onClick={() => handleDeleteField(field.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button 
                variant="secondary" 
                onClick={handleAddNewField} 
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" /> Add New Field
              </Button>
            </TabsContent>
            
            <TabsContent value="csv" className="space-y-4">
              <div className="text-center p-6 border-2 border-dashed rounded-lg">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".csv" 
                  onChange={handleCSVUpload} 
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> 
                  Upload CSV
                </Button>
                <p className="mt-2 text-sm text-gray-500">
                  CSV format: Field Name, Field Type (optional)
                </p>
                <p className="text-xs text-gray-400">
                  Example: Name, text | Age, number
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="paste" className="space-y-4">
              <textarea 
                className="w-full min-h-[200px] border rounded-md p-2"
                placeholder="Paste your fields here. Format: Field Name, Field Type (optional)"
                onPaste={handlePasteFields}
              />
              <p className="text-sm text-gray-500">
                Example: 
                Name, text
                Age, number
                Birthdate, date
              </p>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentActions;