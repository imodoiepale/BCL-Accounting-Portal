// @ts-nocheck

'use client'

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Loader2, X, ChevronDown, ChevronUp, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import { performExtraction } from '@/lib/extractionUtils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

// Interfaces
interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (data: any) => Promise<void>;
    company: {
        id: string;
        company_name: string;
    };
    document: {
        id: string;
        name: string;
        fields?: Array<{
            id: string;
            name: string;
            type: string;
            isArray?: boolean;
            arrayConfig?: {
                maxItems?: number;
                fields?: Array<any>;
            };
        }>;
    };
}

interface ViewModalProps {
    url: string | null;
    onClose: () => void;
}

interface ExtractedArrayField {
    id: string;
    name: string;
    type: string;
    isArray: boolean;
    arrayConfig?: {
        fields?: Array<{
            id: string;
            name: string;
            type: string;
        }>;
    };
}

interface ExtractDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: {
        id: string;
        name: string;
        fields?: Array<{
            id: string;
            name: string;
            type: string;
            isArray?: boolean;
            arrayConfig?: {
                maxItems?: number;
                fields?: Array<any>;
            };
        }>;
    };
    upload: {
        id: string;
        filepath: string;
        userid: string;
        kyc_document_id: string;
    };
    onSubmit: (data: any) => void;
}

interface AddFieldsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    document: {
        id: string;
        name: string;
    };
    onSubmit: (documentId: string, fields: Array<any>) => void;
}

interface ExtractionHistoryEntry {
    id: string;
    filepath: string;
    extracted_details: any;
    created_at: string;
    issue_date?: string;
    expiry_date?: string;
}

// Helper functions
const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
    return Object.keys(obj).reduce((acc: Record<string, any>, k: string) => {
        const pre = prefix.length ? prefix + '_' : '';
        if (
            typeof obj[k] === 'object' && 
            obj[k] !== null && 
            !Array.isArray(obj[k])
        ) {
            Object.assign(acc, flattenObject(obj[k], pre + k));
        } else if (Array.isArray(obj[k])) {
            obj[k].forEach((item: any, index: number) => {
                if (typeof item === 'object') {
                    Object.assign(
                        acc, 
                        flattenObject(item, `${pre}${k}_${index + 1}`)
                    );
                } else {
                    acc[`${pre}${k}_${index + 1}`] = item;
                }
            });
        } else {
            acc[pre + k] = obj[k];
        }
        return acc;
    }, {});
};

const unflattenObject = (obj: Record<string, any>): any => {
    const result: any = {};
    
    for (const key in obj) {
        const keys = key.split('_');
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            const nextKey = keys[i + 1];
            
            if (!isNaN(Number(nextKey))) {
                if (!current[k]) current[k] = [];
                while (current[k].length < Number(nextKey)) {
                    current[k].push({});
                }
                current = current[k][Number(nextKey) - 1];
                i++;
            } else {
                if (!current[k]) current[k] = {};
                current = current[k];
            }
        }
        
        current[keys[keys.length - 1]] = obj[key];
    }
    
    return result;
};

const isNestedField = (field: any): boolean => {
    return field.type === 'array' || field.type === 'object';
};

const getFieldPath = (field: any, parent?: string): string => {
    return parent ? `${parent}.${field.name}` : field.name;
};
// Basic View Modal Component
export const ViewModal: React.FC<ViewModalProps> = ({ url, onClose }) => {
    if (!url) return null;

    return (
        <Dialog open={!!url} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Document Preview</DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-[500px]">
                    <iframe src={url} className="w-full h-full" title="Document Preview" />
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Upload Modal Component
export const UploadModal: React.FC<UploadModalProps> = ({
    isOpen,
    onClose,
    onUpload,
    company,
    document
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [extractOnUpload, setExtractOnUpload] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error('Please select a file');
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress('Uploading document...');

            if (extractOnUpload) {
                setUploadProgress('Uploading document and preparing for extraction...');
            }

            await onUpload({
                companyId: company.id,
                documentId: document.id,
                file,
                extractOnUpload,
                onProgress: (status: string) => setUploadProgress(status),
            });

            onClose();
        } catch (error) {
            console.error('Error during upload:', error);
            toast.error('An error occurred during upload');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Upload a {document?.name} for {company.company_name}
                    </p>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <div>
                            <Input
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
                                        toast.error('Please upload a valid document (PDF) or image file (JPG, PNG)');
                                        return;
                                    }
                                    setFile(file || null);
                                }}
                                accept=".pdf,.jpg,.jpeg,.png"
                                disabled={isUploading}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="extractOnUpload"
                                checked={extractOnUpload}
                                onChange={(e) => setExtractOnUpload(e.target.checked)}
                                className="rounded border-gray-300"
                                disabled={isUploading}
                            />
                            <label htmlFor="extractOnUpload" className="text-sm text-gray-600">
                                Extract details immediately after upload
                            </label>
                        </div>

                        {isUploading && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                </div>
                                <p className="text-sm text-center text-gray-600">{uploadProgress}</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="mt-4">
                        <Button type="submit" disabled={isUploading || !file}>
                            {isUploading ? 'Processing...' : 'Upload'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
export const ExtractDetailsModal: React.FC<ExtractDetailsModalProps> = ({
    isOpen,
    onClose,
    document,
    upload,
    onSubmit
}) => {
    // State management
    const [extractedData, setExtractedData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState(true);
    const [originalData, setOriginalData] = useState({});
    const [editedData, setEditedData] = useState({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [viewUrl, setViewUrl] = useState<string | null>(null);
    const [documentHistory, setDocumentHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Initial data fetching
    useEffect(() => {
        if (isOpen && upload) {
            fetchDocumentHistory();
            performInitialExtraction();
        }
    }, [isOpen, upload]);

    // Fetch document history
    const fetchDocumentHistory = async () => {
        try {
            const { data: documents, error } = await supabase
                .from('acc_portal_kyc_uploads')
                .select('*')
                .eq('userid', upload.userid)
                .eq('kyc_document_id', document.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocumentHistory(documents || []);
        } catch (error) {
            console.error('Error fetching document history:', error);
            toast.error('Failed to fetch document history');
        }
    };

    // Initial extraction
    const performInitialExtraction = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .storage
                .from('kyc-documents')
                .createSignedUrl(upload.filepath, 60);

            if (error) throw error;
            setViewUrl(data.signedUrl);

            const extracted = await performExtraction(data.signedUrl, document);

            // Process and initialize array fields
            const processedData = document.fields?.reduce((acc, field) => {
                if (field.type === 'array') {
                    // Handle array fields
                    const extractedArray = extracted[field.name];
                    acc[field.name] = Array.isArray(extractedArray) 
                        ? extractedArray.map(item => {
                            // Ensure each array item has all defined fields with defaults
                            const processedItem: Record<string, any> = {};
                            field.arrayConfig?.fields?.forEach(subField => {
                                processedItem[subField.name] = item?.[subField.name as keyof typeof item] || '';
                            });
                            return processedItem;
                        })
                        : [];
                } else if (field.type === 'object') {
                    // Handle object fields
                    acc[field.name] = extracted[field.name] || {};
                } else {
                    // Handle primitive fields
                    acc[field.name] = extracted[field.name] || '';
                }
                return acc;
            }, {} as Record<string, any>) || {};

            setOriginalData(processedData);
            setEditedData(processedData);
            setExtractedData(extracted);
        } catch (error) {
            console.error('Error during extraction:', error);
            toast.error('Failed to extract details');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle field editing
    const handleFieldEdit = (fieldName: string, value: any) => {
        setEditedData(prev => {
            const newData = { ...prev } as Record<string, any>;
            const field = document.fields?.find(f => f.name === fieldName);

            if (field?.type === 'array') {
                newData[fieldName] = Array.isArray(value) ? value.map(item => {
                    const processedItem: Record<string, any> = {};
                    field.arrayConfig?.fields?.forEach(subField => {
                        processedItem[subField.name] = item[subField.name] || '';
                    });
                    return processedItem;
                }) : [];
            } else if (field?.type === 'object') {
                newData[fieldName] = typeof value === 'object' && value !== null ? value : {};
            } else {
                newData[fieldName] = value;
            }

            return newData;
        });    };

    // Handle save
    const handleSave = () => {
        const hasChanges = Object.keys(editedData).some(key => {
            if (Array.isArray(editedData[key as keyof typeof editedData])) {
                return JSON.stringify(editedData[key as keyof typeof editedData]) !== JSON.stringify(originalData[key as keyof typeof originalData]);
            }
            return editedData[key as keyof typeof editedData] !== originalData[key as keyof typeof originalData];
        });

        if (hasChanges) {
            setShowConfirmDialog(true);
        } else {
            onSubmit(editedData);
        }
    };
    // Rendering functions for ExtractDetailsModal
    const renderFieldInput = (field: any, value: any, onChange: (value: any) => void) => {
        if (field.type === 'array') {
            const arrayValue = Array.isArray(value) ? value : [];

            return (
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">{field.name}</label>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const newItem = field.arrayConfig?.fields?.reduce((acc: { [x: string]: string; }, subField: { name: string | number; }) => {
                                    acc[subField.name] = '';
                                    return acc;
                                }, {}) || {};
                                onChange([...arrayValue, newItem]);
                            }}
                        >
                            Add Item
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {arrayValue.map((item: any, index: number) => (
                            <div key={index} className="border rounded-lg p-3 bg-gray-50">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium">Item {index + 1}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const newValue = arrayValue.filter((_, i) => i !== index);
                                            onChange(newValue);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                                {field.arrayConfig?.fields?.map((subField: any) => (
                                    <div key={subField.id} className="mb-2">
                                        <label className="text-xs font-medium">
                                            {subField.name}
                                        </label>
                                        <Input
                                            value={item[subField.name] || ''}
                                            onChange={(e) => {
                                                const newValue = [...arrayValue];
                                                newValue[index] = {
                                                    ...newValue[index],
                                                    [subField.name]: e.target.value
                                                };
                                                onChange(newValue);
                                            }}
                                            className="mt-1"
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                        {arrayValue.length === 0 && (
                            <div className="text-sm text-gray-500 text-center py-4">
                                No items added yet
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (field.type === 'object') {
            return (
                <div className="space-y-2">
                    {Object.entries(value || {}).map(([key, val]) => (
                        <div key={key}>
                            <label className="text-xs font-medium">{key}</label>
                            <Input
                                value={val as string}
                                onChange={(e) => {
                                    onChange({
                                        ...value,
                                        [key]: e.target.value
                                    });
                                }}
                                className="mt-1"
                            />
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <Input
                type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
            />
        );
    };

    const renderHistoryTable = () => (
        <Card className="p-4">
            <h3 className="text-sm font-medium mb-4">Document History</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Version</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documentHistory.map((doc, index) => (
                        <TableRow key={doc.id}>
                            <TableCell>Version {documentHistory.length - index}</TableCell>
                            <TableCell>
                                {new Date(doc.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                                {doc.extracted_details ? 'Extracted' : 'Uploaded'}
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        const { data } = await supabase
                                            .storage
                                            .from('kyc-documents')
                                            .createSignedUrl(doc.filepath, 60);
                                        setViewUrl(data?.signedUrl ?? null);
                                        if (doc.extracted_details) {
                                            setEditedData(doc.extracted_details);
                                            setOriginalData(doc.extracted_details);
                                        }
                                    }}
                                >
                                    View
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );

// Main render method for ExtractDetailsModal
return (
    <>
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <div>
                            <span>Document Details Extraction</span>
                            <p className="text-sm text-muted-foreground mt-1">
                                {document.name}
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowHistory(!showHistory)}
                            >
                                <History className="h-4 w-4 mr-2" />
                                {showHistory ? 'Hide History' : 'Show History'}
                            </Button>
                            {!isLoading && (
                                <>
                                    <Button
                                        variant={previewMode ? "default" : "outline"}
                                        onClick={() => setPreviewMode(true)}
                                        size="sm"
                                    >
                                        Preview
                                    </Button>
                                    <Button
                                        variant={!previewMode ? "default" : "outline"}
                                        onClick={() => setPreviewMode(false)}
                                        size="sm"
                                    >
                                        Edit
                                    </Button>
                                </>
                            )}
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="text-sm text-muted-foreground">
                            Processing...
                        </p>
                    </div>
                ) : (
                    <div className="flex gap-4 h-[calc(90vh-8rem)]">
                        <div className="w-1/2 flex flex-col space-y-4">
                            <div className="flex-1 border rounded-lg overflow-hidden">
                                {viewUrl && (
                                    <iframe
                                        src={viewUrl}
                                        className="w-full h-full"
                                        title="Document Preview"
                                    />
                                )}
                            </div>
                            {showHistory && (
                                <div className="h-1/3 overflow-y-auto">
                                    {renderHistoryTable()}
                                </div>
                            )}
                        </div>

                        <div className="w-1/2 overflow-y-auto">
                            <div className="space-y-4">
                                <Button
                                    onClick={performInitialExtraction}
                                    className="w-full"
                                >
                                    Extract From Current Document
                                </Button>

                                <div className="space-y-4">
                                    {document.fields?.map((field) => (
                                        <div key={field.id} className="space-y-2">
                                            <label className="text-sm font-medium">
                                                {field.name}
                                            </label>
                                            {previewMode ? (
                                                <div className="p-2 bg-gray-50 rounded border">
                                                    {field.type === 'array' ? (
                                                        <Accordion type="single" collapsible>
                                                            {((editedData[field.name as keyof typeof editedData] as any[]) || []).map((item, idx) => (
                                                                <AccordionItem key={idx} value={`item-${idx}`}>
                                                                    <AccordionTrigger>Item {idx + 1}</AccordionTrigger>
                                                                    <AccordionContent>
                                                                        <div className="space-y-2">
                                                                            {Object.entries(item).map(([key, value]) => (
                                                                                <div key={key} className="flex justify-between">
                                                                                    <span className="font-medium">{key}:</span>
                                                                                    <span>{String(value)}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </AccordionContent>
                                                                </AccordionItem>
                                                            ))}
                                                        </Accordion>
                                                    ) : (
                                                        <span>{(editedData[field.name as keyof typeof editedData] as string) || '-'}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                renderFieldInput(
                                                    field,
                                                    editedData[field.name as keyof typeof editedData],
                                                    (value) => handleFieldEdit(field.name, value)
                                                )
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <DialogFooter className="mt-4">
                                <Button onClick={handleSave}>
                                    Save Extraction
                                </Button>
                            </DialogFooter>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>

        <Dialog open={showConfirmDialog} onOpenChange={() => setShowConfirmDialog(false)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Changes</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-gray-600">
                        Youve made changes to the extracted data. Are you sure you want to save these changes?
                    </p>
                    <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium">Changed Fields:</h4>
                        {Object.keys(editedData).map(key => {
                            const hasChanged = Array.isArray(editedData[key as keyof typeof editedData])
                                ? JSON.stringify(editedData[key as keyof typeof editedData]) !== JSON.stringify(originalData[key as keyof typeof originalData])
                                : editedData[key as keyof typeof editedData] !== originalData[key as keyof typeof originalData];

                            if (hasChanged) {
                                return (
                                    <div key={key} className="text-sm">
                                        <span className="font-medium">{key}:</span>
                                        <div className="grid grid-cols-2 gap-2 ml-4">
                                            <div className="text-gray-500">
                                                Original: {JSON.stringify(originalData[key as keyof typeof originalData]) || '-'}
                                            </div>
                                            <div className="text-blue-600">
                                                New: {JSON.stringify(editedData[key as keyof typeof editedData]) || '-'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => {
                        onSubmit(editedData);
                        setShowConfirmDialog(false);
                    }}>
                        Confirm & Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
);
};
// Add Fields Dialog Component
export const AddFieldsDialog: React.FC<AddFieldsDialogProps> = ({
    isOpen,
    onClose,
    document,
    onSubmit
}) => {
    const [fields, setFields] = useState([{
        id: crypto.randomUUID(),
        name: '',
        type: 'text',
        isArray: false,
        arrayConfig: null
    }]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateField = (field: { id: string; name: string; type: string }) => {
        const fieldErrors: { [key: string]: string } = {};

        if (!field.name.trim()) {
            fieldErrors[field.id] = 'Field name is required';
        } else if (!/^[a-zA-Z0-9_]+$/.test(field.name)) {
            fieldErrors[field.id] = 'Field name can only contain letters, numbers and underscores';
        } else if (fields.filter(f => f.id !== field.id && f.name === field.name).length > 0) {
            fieldErrors[field.id] = 'Field name must be unique';
        }

        return fieldErrors;
    };

    const addField = () => {
        setFields(prev => [...prev, {
            id: crypto.randomUUID(),
            name: '',
            type: 'text',
            isArray: false,
            arrayConfig: null
        }]);
    };

    const addArrayField = (fieldId: string) => {
        setFields(prev => prev.map(field => {
            if (field.id === fieldId) {
                return {
                    ...field,
                    isArray: true,
                    arrayConfig: {
                        fields: [{
                            id: crypto.randomUUID(),
                            name: '',
                            type: 'text',
                            isArray: false,
                            arrayConfig: null
                        }]
                    }
                } as unknown as typeof field;
            }
            return field;
        }));    };

    const removeField = (id: string) => {
        if (fields.length === 1) {
            toast.error('You must have at least one field');
            return;
        }
        setFields(prev => prev.filter(field => field.id !== id));
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[id];
            return newErrors;
        });
    };

    const handleFieldChange = (
        id: string,
        value: string,
        field: 'name' | 'type'
    ) => {
        const newFields = fields.map(f =>
            f.id === id ? { ...f, [field]: value } : f
        );
        setFields(newFields);

        if (field === 'name') {
            const fieldToValidate = newFields.find(f => f.id === id);
            if (fieldToValidate) {
                const fieldErrors = validateField(fieldToValidate);
                setErrors(prev => ({
                    ...prev,
                    [id]: fieldErrors[id] || ''
                }));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const allErrors: { [key: string]: string } = {};
        fields.forEach(field => {
            const fieldErrors = validateField(field);
            Object.assign(allErrors, fieldErrors);
        });

        if (Object.keys(allErrors).length > 0) {
            setErrors(allErrors);
            return;
        }

        const validFields = fields.filter(field => field.name.trim() !== '');

        if (validFields.length === 0) {
            toast.error('Please add at least one field');
            return;
        }

        onSubmit(document.id, validFields);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add Fields for {document?.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {fields.map((field) => (
                            <div key={field.id} className="space-y-2">
                                <div className="flex gap-2 items-start p-4 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <label className="text-sm font-medium">Field Name</label>
                                        <Input
                                            value={field.name}
                                            onChange={(e) => handleFieldChange(field.id, e.target.value, 'name')}
                                            placeholder="Enter field name"
                                            className={errors[field.id] ? 'border-red-500' : ''}
                                        />
                                        {errors[field.id] && (
                                            <p className="text-xs text-red-500 mt-1">{errors[field.id]}</p>
                                        )}
                                    </div>
                                    <div className="w-1/3">
                                        <label className="text-sm font-medium">Type</label>
                                        <select
                                            value={field.type}
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
                                    <div className="flex items-center space-x-2 mt-6">
                                        {field.type === 'array' && !field.isArray && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addArrayField(field.id)}
                                            >
                                                Configure Array
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeField(field.id)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash2 className={`h-4 w-4 ${fields.length === 1 ? 'text-gray-300' : 'text-red-500'}`} />
                                        </Button>
                                    </div>
                                </div>
                                {field.isArray && field.arrayConfig && (
                                    <div className="ml-8 border-l-2 pl-4 space-y-4">
                                        <h4 className="text-sm font-medium">Array Item Fields</h4>
                                        {field.arrayConfig.fields?.map((subField) => (
                                            <div key={subField.id} className="flex gap-2">
                                                <Input
                                                    value={subField.name}
                                                    onChange={(e) => {
                                                        const newFields = fields.map(f =>
                                                            f.id === field.id
                                                                ? {
                                                                    ...f,
                                                                    arrayConfig: {
                                                                        ...f.arrayConfig,
                                                                        fields: f.arrayConfig?.fields?.map(sf =>
                                                                            sf.id === subField.id
                                                                                ? { ...sf, name: e.target.value }
                                                                                : sf
                                                                        ) || []
                                                                    }
                                                                }
                                                                : f
                                                        );
                                                        setFields(newFields);
                                                    }}
                                                    placeholder="Enter array item field name"
                                                />
                                                <select
                                                    value={subField.type}
                                                    onChange={(e) => {
                                                        const newFields = fields.map(f =>
                                                            f.id === field.id
                                                                ? {
                                                                    ...f,
                                                                    arrayConfig: {
                                                                        ...f.arrayConfig,
                                                                        fields: f.arrayConfig?.fields?.map(sf =>
                                                                            sf.id === subField.id
                                                                                ? { ...sf, type: e.target.value }
                                                                                : sf
                                                                        ) || []
                                                                    }
                                                                }
                                                                : f
                                                        );
                                                        setFields(newFields);
                                                    }}
                                                    className="w-1/3 border rounded-md p-2"
                                                >
                                                    <option value="text">Text</option>
                                                    <option value="number">Number</option>
                                                    <option value="date">Date</option>
                                                </select>
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const newFields = fields.map(f =>
                                                    f.id === field.id
                                                        ? {
                                                            ...f,
                                                            arrayConfig: {
                                                                ...f.arrayConfig,
                                                                fields: [
                                                                    ...(f.arrayConfig?.fields ?? []),
                                                                    {
                                                                        id: crypto.randomUUID(),
                                                                        name: '',
                                                                        type: 'text'
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                        : f
                                                );
                                                setFields(newFields);
                                            }}
                                        >
                                            Add Array Item Field
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <DialogFooter className="flex justify-between items-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addField}
                            className="flex items-center"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Field
                        </Button>
                        <div className="flex space-x-2">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit">Save Fields</Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// Final exports
export type {
    UploadModalProps,
    ViewModalProps,
    ExtractDetailsModalProps,
    AddFieldsDialogProps,
    ExtractionHistoryEntry
};

export {
    flattenObject,
    unflattenObject,
    isNestedField,
    getFieldPath
};