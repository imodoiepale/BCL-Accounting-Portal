import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { MoreVertical, Plus, Edit2, Settings, Trash2, Upload, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import toast from 'react-hot-toast';

// Type Definitions
interface Field {
  id: string;
  name: string;
}

interface Document {
  id: string;
  name: string;
  fields?: Field[];
}

interface Company {
  id: number;
  company_name: string;
}

interface Upload {
  id: string;
  userid: string;
  kyc_document_id: string;
  filepath: string;
  issue_date?: Date;
  expiry_date?: Date;
  created_at: Date;
}

// Utility Functions
export const generateId = (): string => crypto.randomUUID();

export const sanitizeFieldName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

export const isFieldNameUnique = (
  name: string, 
  fields: Field[], 
  excludeId?: string
): boolean => {
  return !fields.some(
    field => field.name.toLowerCase() === name.toLowerCase() && field.id !== excludeId
  );
};

export const extractDetailsFromText = (text: string, fields: Field[]) => {
  const extracted: Record<string, string> = {};
  fields.forEach(field => {
    const regex = new RegExp(`${field.name}[:\\s]+([^\\n]+)`, 'i');
    const match = text.match(regex);
    if (match) {
      extracted[field.name] = match[1].trim();
    }
  });
  return extracted;
};

// Document Actions Component
export const DocumentActions: React.FC<{
  document: Document;
  onUpdateFields: (documentId: string, fields: Field[]) => void;
}> = ({ document, onUpdateFields }) => {
  const [isManageFieldsOpen, setIsManageFieldsOpen] = useState(false);
  const [fields, setFields] = useState<Field[]>(document.fields || []);
  const [pasteInput, setPasteInput] = useState('');

  const handleFieldChange = useCallback((id: string, value: string) => {
    setFields(prevFields =>
      prevFields.map(field => 
        field.id === id ? { ...field, name: value } : field
      )
    );
  }, []);

  const handleDeleteField = useCallback((id: string) => {
    setFields(prevFields => prevFields.filter(field => field.id !== id));
  }, []);

  const handleAddField = useCallback(() => {
    const newField = { id: generateId(), name: '' };
    setFields(prevFields => [...prevFields, newField]);
  }, []);

  const handlePasteFields = useCallback(() => {
    const pastedFields = pasteInput
      .split('\n')
      .filter(field => field.trim() !== '')
      .map(field => ({
        id: generateId(),
        name: field.trim()
      }));

    setFields(prevFields => [...prevFields, ...pastedFields]);
    setPasteInput('');
    toast.success(`Added ${pastedFields.length} new fields`);
  }, [pasteInput]);

  const handleSaveChanges = useCallback(() => {
    const filteredFields = fields.filter(field => field.name.trim() !== '');
    onUpdateFields(document.id, filteredFields);
    setIsManageFieldsOpen(false);
    toast.success('Fields updated successfully');
  }, [document.id, fields, onUpdateFields]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-transparent">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
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
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Fields for {document.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-row gap-4 h-full">
            {/* Fields List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-4 border-r">
              {fields.map((field) => (
                <div 
                  key={field.id} 
                  className="flex gap-2 items-center bg-gray-50 rounded-lg p-3"
                >
                  <Input
                    value={field.name}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder="Enter field name"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteField(field.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full mt-4" 
                onClick={handleAddField}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Field
              </Button>
            </div>

            {/* Paste Fields Section */}
            <div className="w-1/3 flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Paste Fields</h3>
                <textarea
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  placeholder="Paste field names here (one per line)"
                  className="w-full h-40 p-2 border rounded-md"
                />
              </div>
              <Button 
                onClick={handlePasteFields}
                disabled={!pasteInput.trim()}
                className="w-full"
              >
                Add Pasted Fields
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Document Action Cell Component
export const DocumentActionCell: React.FC<{
  company: Company;
  document: Document;
  upload?: Upload;
  onView: (document: Document, company: Company) => void;
  onUpload: (companyId: number, documentId: string) => void;
  onExtract: (document: Document, upload: Upload) => void;
}> = ({ 
  company, 
  document, 
  upload, 
  onView, 
  onUpload, 
  onExtract 
}) => {
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
              <Eye className="h-4 w-4 text-blue-500" />
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
            <Upload className="h-4 w-4 text-orange-500" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Document Management Table Component
export const DocumentManagementTable: React.FC<{
  companies: Company[];
  documents: Document[];
  uploads: Upload[];
  onUpdateFields: (documentId: string, fields: Field[]) => void;
  onView: (document: Document, company: Company) => void;
  onUpload: (companyId: number, documentId: string) => void;
  onExtract: (document: Document, upload: Upload) => void;
}> = ({
  companies,
  documents,
  uploads,
  onUpdateFields,
  onView,
  onUpload,
  onExtract
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document Name</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Fields</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map(document => {
          const company = companies.find(c => c.id === Number(document.id));
          const upload = uploads.find(u => u.id === document.id);
          
          return (
            <TableRow key={document.id}>
              <TableCell>{document.name}</TableCell>
              <TableCell>{company?.company_name || 'N/A'}</TableCell>
              <TableCell>
                {document.fields?.map(field => field.name).join(', ') || 'No fields'}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <DocumentActions 
                    document={document} 
                    onUpdateFields={onUpdateFields} 
                  />
                  <DocumentActionCell
                    company={company!}
                    document={document}
                    upload={upload}
                    onView={onView}
                    onUpload={onUpload}
                    onExtract={onExtract}
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default DocumentManagementTable;