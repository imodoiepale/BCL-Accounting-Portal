import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { MoreVertical, Plus, Edit2, Settings, Trash2, Upload, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import toast from 'react-hot-toast';

// Enhanced Type Definitions
interface Field {
  id: string;
  name: string;
  type: string;
  isArray?: boolean;
  parentField?: string;
  arrayConfig?: {
    maxItems?: number;
    fields?: Field[];
  };
}

interface Document {
  id: string;
  name: string;
  fields?: Field[];
  category?: string;
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
  issue_date?: string;
  expiry_date?: string;
  created_at: string;
  extracted_details?: any;
}

// Enhanced Document Actions Component
export const DocumentActions: React.FC<{
  document: Document;
  onUpdateFields: (documentId: string, fields: Field[]) => void;
}> = ({ document, onUpdateFields }) => {
  const [isManageFieldsOpen, setIsManageFieldsOpen] = useState(false);
  const [fields, setFields] = useState<Field[]>(document.fields || []);
  const [pasteInput, setPasteInput] = useState('');
  const [showArrayConfig, setShowArrayConfig] = useState<string | null>(null);

  const handleFieldChange = useCallback((id: string, value: string, type: 'name' | 'type' = 'name') => {
    setFields(prevFields =>
      prevFields.map(field => {
        if (field.id === id) {
          const updatedField = { ...field, [type]: value };
          if (type === 'type' && value === 'array' && !field.arrayConfig) {
            updatedField.isArray = true;
            updatedField.arrayConfig = {
              maxItems: 10,
              fields: []
            };
          }
          return updatedField;
        }
        return field;
      })
    );
  }, []);

  const handleAddArrayField = useCallback((parentId: string) => {
    setFields(prevFields =>
      prevFields.map(field => {
        if (field.id === parentId && field.arrayConfig) {
          return {
            ...field,
            arrayConfig: {
              ...field.arrayConfig,
              fields: [
                ...(field.arrayConfig.fields || []),
                {
                  id: crypto.randomUUID(),
                  name: '',
                  type: 'text',
                  parentField: parentId
                }
              ]
            }
          };
        }
        return field;
      })
    );
  }, []);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-transparent">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
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
        <DialogContent className="max-w-5xl h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Manage Fields for {document.name}
              <span className="ml-2 text-sm text-muted-foreground">
                {document.category}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-6 h-full max-h-[calc(90vh-10rem)] mt-4">
            <div className="flex-1 overflow-y-auto space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <h3 className="text-sm font-semibold">Document Fields</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field) => (
                    <div key={field.id} className="space-y-3">
                      <div className="flex gap-3 items-start bg-gray-50 rounded-lg p-4">
                        <div className="flex-1 space-y-2">
                          <label className="text-sm font-medium text-gray-700">Field Name</label>
                          <Input
                            value={field.name}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder="Enter field name"
                          />
                        </div>
                        <div className="w-1/3 space-y-2">
                          <label className="text-sm font-medium text-gray-700">Type</label>
                          <select
                            value={field.type || 'text'}
                            onChange={(e) => handleFieldChange(field.id, e.target.value, 'type')}
                            className="w-full mt-1 border rounded-md p-2"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="array">Array</option>
                            <option value="object">Object</option>
                          </select>
                        </div>
                        <div className="flex gap-2 pt-8">
                          {field.type === 'array' && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowArrayConfig(field.id)}
                            >
                              Configure Array
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setFields(prev => prev.filter(f => f.id !== field.id));
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>

                      {field.type === 'array' && showArrayConfig === field.id && (
                        <div className="ml-6 pl-4 border-l-2 border-gray-200 space-y-3">
                          <h4 className="text-sm font-medium text-gray-700">Array Item Fields</h4>
                          {field.arrayConfig?.fields?.map((subField) => (
                            <div key={subField.id} className="flex gap-3 bg-white rounded-lg p-3">
                              <Input
                                value={subField.name}
                                onChange={(e) => {
                                  setFields(prev =>
                                    prev.map(f =>
                                      f.id === field.id
                                        ? {
                                          ...f,
                                          arrayConfig: {
                                            ...f.arrayConfig!,
                                            fields: f.arrayConfig!.fields!.map(sf =>
                                              sf.id === subField.id
                                                ? { ...sf, name: e.target.value }
                                                : sf
                                            )
                                          }
                                        }
                                        : f
                                    )
                                  );
                                }}
                                placeholder="Enter array item field name"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setFields(prev =>
                                    prev.map(f =>
                                      f.id === field.id
                                        ? {
                                          ...f,
                                          arrayConfig: {
                                            ...f.arrayConfig!,
                                            fields: f.arrayConfig!.fields!.filter(
                                              sf => sf.id !== subField.id
                                            )
                                          }
                                        }
                                        : f
                                    )
                                  );
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddArrayField(field.id)}
                          >
                            Add Array Item Field
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => {
                      setFields(prev => [
                        ...prev,
                        { id: crypto.randomUUID(), name: '', type: 'text' }
                      ]);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Field
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="w-1/3">
              <Card>
                <CardHeader className="py-3">
                  <h3 className="text-sm font-semibold">Paste Multiple Fields</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <textarea
                    value={pasteInput}
                    onChange={(e) => setPasteInput(e.target.value)}
                    placeholder="Paste field names here (one per line)"
                    className="w-full h-48 p-3 text-sm border rounded-md"
                  />
                  <Button
                    onClick={() => {
                      const newFields = pasteInput
                        .split('\n')
                        .filter(Boolean)
                        .map(name => ({
                          id: crypto.randomUUID(),
                          name: name.trim(),
                          type: 'text'
                        }));
                      setFields(prev => [...prev, ...newFields]);
                      setPasteInput('');
                      toast.success(`Added ${newFields.length} new fields`);
                    }}
                    disabled={!pasteInput.trim()}
                    className="w-full"
                  >
                    Add Pasted Fields
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                const validFields = fields.filter(f => f.name.trim());
                onUpdateFields(document.id, validFields);
                setIsManageFieldsOpen(false);
                toast.success('Fields updated successfully');
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};


