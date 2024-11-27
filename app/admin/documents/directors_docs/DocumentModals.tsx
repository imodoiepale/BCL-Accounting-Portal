// DocumentModals.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import { performExtraction } from '@/lib/extractionUtils';

// Interface definitions
interface Director {
    id: string;
    company_id: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
}

interface Company {
    id: string;
    company_name: string;
}

interface Document {
    id: string;
    name: string;
    fields?: Array<{
        id: string;
        name: string;
        type: string;
    }>;
}

interface Upload {
    id: string;
    filepath: string;
    userid: string;
    kyc_document_id: string;
    extracted_details?: Record<string, any>;
}

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File, extractOnUpload: boolean, onProgress: (status: string) => void) => Promise<void>;
    director: Director;  // Changed from company to director
    document: Document | null;
    isUploading?: boolean;
}

interface ViewModalProps {
    url: string | null;
    onClose: () => void;
}

interface ExtractDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: Document;
    upload: Upload;
    onSubmit: (data: Record<string, any>) => Promise<void>;
}

interface AddFieldsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    document: Document;
    onSubmit: (documentId: string, fields: Array<{
        id: string;
        name: string;
        type: string;
    }>) => void;
}

// Upload Modal Component
export const UploadModal: React.FC<UploadModalProps> = ({
    isOpen,
    onClose,
    onUpload,
    director,
    document,
    isUploading: externalIsUploading = false
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [extractOnUpload, setExtractOnUpload] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setFile(null);
            setUploadProgress('');
            setIsUploading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error('Please select a file');
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress('Uploading document...');

            await onUpload(
                file,
                extractOnUpload,
                (status: string) => setUploadProgress(status)
            );

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
                <DialogTitle>Upload Document - {document?.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <Label>Director</Label>
                        <Input 
                            value={director.full_name || `${director.first_name || ''} ${director.last_name || ''}`} 
                            disabled 
                        />
                    </div>
                    <div>
                        <Label>File</Label>
                        <Input
                            type="file"
                            onChange={(e) => {
                                const selectedFile = e.target.files?.[0];
                                if (selectedFile && !['application/pdf', 'image/jpeg', 'image/png'].includes(selectedFile.type)) {
                                    toast.error('Please upload a valid document (PDF) or image file (JPG, PNG)');
                                    return;
                                }
                                setFile(selectedFile || null);
                            }}
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={isUploading || externalIsUploading}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="extractOnUpload"
                            checked={extractOnUpload}
                            onChange={(e) => setExtractOnUpload(e.target.checked)}
                            className="rounded border-gray-300"
                            disabled={isUploading || externalIsUploading}
                        />
                        <Label htmlFor="extractOnUpload" className="text-sm text-gray-600">
                            Extract details after upload
                        </Label>
                    </div>

                    {(isUploading || externalIsUploading) && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                            <p className="text-sm text-center text-gray-600">{uploadProgress}</p>
                        </div>
                    )}
                </div>
                <DialogFooter className="mt-4">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose} 
                        disabled={isUploading || externalIsUploading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={isUploading || externalIsUploading || !file}
                    >
                        {isUploading || externalIsUploading ? 'Processing...' : 'Upload'}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
    );
};

// View Modal Component
export const ViewModal: React.FC<ViewModalProps> = ({ url, onClose }) => {
    if (!url) return null;

    return (
        <Dialog open={!!url} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span>Document Preview</span>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-[500px]">
                    <iframe src={url} className="w-full h-full" />
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Extract Details Modal Component
export const ExtractDetailsModal: React.FC<ExtractDetailsModalProps> = ({
    isOpen,
    onClose,
    document,
    upload,
    onSubmit
}) => {
    const [extractedData, setExtractedData] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState(true);
    const [originalData, setOriginalData] = useState<Record<string, any>>({});
    const [editedData, setEditedData] = useState<Record<string, any>>({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        if (isOpen && upload) {
            const extractData = async () => {
                setIsLoading(true);
                try {
                    const { data: urlData, error: urlError } = await supabase
                        .storage
                        .from('kyc-documents')
                        .createSignedUrl(upload.filepath, 60);

                    if (urlError) throw urlError;

                    const extracted = await performExtraction(urlData.signedUrl, document);
                    setOriginalData(extracted);
                    setEditedData(extracted);
                    setExtractedData(extracted);
                } catch (error) {
                    console.error('Error during extraction:', error);
                    toast.error('Failed to extract details');
                } finally {
                    setIsLoading(false);
                }
            };

            extractData();
        }
    }, [isOpen, upload, document]);

    const handleFieldEdit = (fieldName: string, value: any) => {
        setEditedData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const handleSave = () => {
        const hasChanges = Object.keys(editedData).some(
            key => editedData[key] !== originalData[key]
        );

        if (hasChanges) {
            setShowConfirmDialog(true);
        } else {
            onSubmit(editedData);
        }
    };

    const handleConfirmSave = async () => {
        try {
            await onSubmit(editedData);
            setShowConfirmDialog(false);
        } catch (error) {
            console.error('Error saving changes:', error);
            toast.error('Failed to save changes');
        }
    };

    const handleReset = () => {
        setEditedData(originalData);
        toast.success('Reset to original values');
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-5xl h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="flex justify-between items-center">
                            <span>Document Details Extraction</span>
                            {!isLoading && (
                                <div className="flex space-x-2">
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
                                </div>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <p className="text-sm text-gray-600">Extracting document details...</p>
                        </div>
                    ) : (
                        <div className="space-y-4 overflow-y-auto max-h-[calc(80vh-8rem)] p-4">
                            {previewMode ? (
                                <div className="space-y-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-medium mb-4">Extracted Details Preview</h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            {document.fields?.map((field) => (
                                                <div key={field.id} className="space-y-1">
                                                    <Label>{field.name}</Label>
                                                    <div className="p-2 bg-white rounded border">
                                                        {editedData[field.name] || '-'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setPreviewMode(false)}>
                                            Edit Details
                                        </Button>
                                        <Button onClick={handleSave}>Save Details</Button>
                                    </DialogFooter>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-sm font-medium">Edit Extracted Details</h3>
                                            <Button variant="outline" size="sm" onClick={handleReset}>
                                                Reset to Original
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            {document.fields?.map((field) => (
                                                <div key={field.id} className="space-y-2">
                                                    <Label>{field.name}</Label>
                                                    <Input
                                                        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                                                        value={editedData[field.name] || ''}
                                                        onChange={(e) => handleFieldEdit(field.name, e.target.value)}
                                                        className={
                                                            editedData[field.name] !== originalData[field.name]
                                                                ? 'border-yellow-500'
                                                                : ''
                                                        }
                                                    />
                                                    {editedData[field.name] !== originalData[field.name] && (
                                                        <p className="text-xs text-yellow-600">
                                                            Original: {originalData[field.name] || '-'}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <div className="flex justify-between w-full">
                                            <Button variant="outline" onClick={() => setPreviewMode(true)}>
                                                Back to Preview
                                            </Button>
                                            <div className="space-x-2">
                                                <Button variant="outline" onClick={handleReset}>
                                                    Reset Changes
                                                </Button>
                                                <Button onClick={handleSave}>Save Details</Button>
                                            </div>
                                        </div>
                                    </DialogFooter>
                                </div>
                            )}
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
                            {Object.keys(editedData).map(key => {
                                if (editedData[key] !== originalData[key]) {
                                    return (
                                        <div key={key} className="text-sm">
                                            <span className="font-medium">{key}:</span>
                                            <div className="grid grid-cols-2 gap-2 ml-4">
                                                <div className="text-gray-500">
                                                    Original: {originalData[key] || '-'}
                                                </div>
                                                <div className="text-blue-600">
                                                    New: {editedData[key] || '-'}
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
                        <Button onClick={handleConfirmSave}>
                            Confirm & Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

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
        type: 'text'
    }]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (!isOpen) {
            setFields([{
                id: crypto.randomUUID(),
                name: '',
                type: 'text'
            }]);
            setErrors({});
        }
    }, [isOpen]);

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

    const addField = () => {
        setFields(prev => [...prev, {
            id: crypto.randomUUID(),
            name: '',
            type: 'text'
        }]);
    };

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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add Fields for {document.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {fields.map((field) => (
                            <div key={field.id} className="flex gap-2 items-start p-4 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <Label>Field Name</Label>
                                    <Input
                                        value={field.name}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value, 'name')}
                                        placeholder="Enter field name"
                                        className={errors[field.id] ? 'border-red-500' : ''}
                                    />
                                    {errors[field.id] && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {errors[field.id]}
                                        </p>
                                    )}
                                </div>
                                <div className="w-1/3">
                                    <Label>Type</Label>
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
                                    </select>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeField(field.id)}
                                    className="mt-6"
                                    disabled={fields.length === 1}
                                >
                                    <Trash2 className={fields.length === 1 ? 'text-gray-300' : 'text-red-500'} />
                                </Button>
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

export type {
    UploadModalProps,
    ViewModalProps,
    ExtractDetailsModalProps,
    AddFieldsDialogProps,
    Director,
    Company,
    Document,
    Upload
};