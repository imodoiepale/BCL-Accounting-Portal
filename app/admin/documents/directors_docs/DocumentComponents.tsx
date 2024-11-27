import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MoreVertical, Plus, Edit2, Settings, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

// Document Actions Component
export const DocumentActions = ({ document, onAddField, onUpdateFields }: DocumentActionsProps) => {
  const [isManageFieldsOpen, setIsManageFieldsOpen] = useState(false);
  const [fields, setFields] = useState<Field[]>(document.fields || []);

  const handleFieldChange = (id: string, key: 'name' | 'type', value: string) => {
    setFields(prevFields =>
      prevFields.map(field => (field.id === id ? { ...field, [key]: value } : field))
    );
  };

  const handleDeleteField = (id: string) => {
    setFields(prevFields => prevFields.filter(field => field.id !== id));
  };

  const handleSaveChanges = () => {
    onUpdateFields(document.id, fields);
    setIsManageFieldsOpen(false);
    toast.success('Fields updated successfully');
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
          <DropdownMenuItem>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Document
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isManageFieldsOpen} onOpenChange={setIsManageFieldsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Fields for {document.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {fields.map((field) => (
              <div key={field.id} className="flex gap-2 items-start p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="text-sm font-medium">Field Name</label>
                  <Input
                    value={field.name}
                    onChange={(e) => handleFieldChange(field.id, 'name', e.target.value)}
                    placeholder="Enter field name"
                    className="mt-1"
                  />
                </div>
                <div className="w-1/3">
                  <label htmlFor={`field-type-${field.id}`} className="text-sm font-medium">Type</label>
                  <select
                    id={`field-type-${field.id}`}
                    value={field.type}
                    onChange={(e) => handleFieldChange(field.id, 'type', e.target.value)}
                    className="w-full mt-1 border rounded-md p-2"
                    aria-label={`Select field type for ${field.name}`}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="file">File</option>
                  </select>
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
          <DialogFooter>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface DocumentActionCellProps {
  company: {
    id: number;
    company_name: string;
  };
  document: Document;
  upload?: {
    id: string;
    filepath: string;
  };
  onView: (document: Document, company: { id: number; company_name: string }) => void;
  onUpload: (companyId: number, documentId: string) => void;
  onExtract: (document: Document, upload: any) => void;
}

// Document Action Cell Component
export const DocumentActionCell = ({
  company,
  document,
  upload,
  onView,
  onUpload,
  onExtract
}: DocumentActionCellProps) => {
  return (
    <div className="flex items-center justify-center">
      <div className="flex justify-center space-x-2">
        {upload ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onView(document, company)}
              title="View Document"
            >
              <Edit2 className="h-4 w-4 text-blue-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onExtract(document, upload)}
              title="Extract Details"
            >
              <Settings className="h-4 w-4 text-green-500" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onUpload(company.id, document.id)}
            title="Upload Document"
          >
            <Plus className="h-4 w-4 text-orange-500" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Utility Functions
export const formatFieldValue = (value: any, type: string) => {
  switch (type) {
    case 'date':
      return value ? new Date(value).toISOString().split('T')[0] : '';
    case 'number':
      return value ? parseFloat(value) : '';
    default:
      return value || '';
  }
};

export const validateField = (value: any, type: string) => {
  switch (type) {
    case 'date':
      return !value || !isNaN(Date.parse(value));
    case 'number':
      return !value || !isNaN(parseFloat(value));
    default:
      return true;
  }
};

// Helper function to generate unique IDs
export const generateId = () => crypto.randomUUID();

// Helper function to sanitize field names
export const sanitizeFieldName = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

// Helper function to check if a field name is unique
export const isFieldNameUnique = (name: string, fields: Field[], excludeId?: string) => {
  return !fields.some(field => 
    field.name.toLowerCase() === name.toLowerCase() && field.id !== excludeId
  );
};

// Extract utilities
export const extractDetailsFromText = (text: string, fields: Field[]) => {
  const extracted: Record<string, any> = {};
  fields.forEach(field => {
    const regex = new RegExp(`${field.name}[:\\s]+([^\\n]+)`, 'i');
    const match = text.match(regex);
    if (match) {
      extracted[field.name] = formatFieldValue(match[1].trim(), field.type);
    }
  });
  return extracted;
};