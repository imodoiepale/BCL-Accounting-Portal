// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Upload, AlertCircle, FileIcon, Settings2, Inbox } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";


interface UploadFile {
  file: File;
  documentType: 'past' | 'recent';
  expiryDate?: string;
  validityDays?: number;
  reminderDays?: string;
  status?: string;
}

interface UploadModalProps {
  selectedCompany: { id: number; company_name: string } | null;
  selectedDocument: { id: string; name: string; document_type: string } | null;
  onUpload: (files: UploadFile[]) => Promise<void>;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  selectedCompany,
  selectedDocument,
  onUpload,
  onClose
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'settings'>('upload');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      documentType: 'recent',
      validityDays: 365,
      reminderDays: '30,15,7',
      status: 'active'
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error('Please add at least one file');
      return;
    }

    // Validate expiry date for renewal documents
    const invalidFiles = files.filter(file => {
      return selectedDocument?.document_type === 'renewal' && 
             file.documentType === 'recent' && 
             !file.expiryDate;
    });

    if (invalidFiles.length > 0) {
      toast.error('Please add expiry dates for recent renewal documents');
      return;
    }

    try {
      setIsUploading(true);
      await onUpload(files);
      onClose();
      toast.success('Documents uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload documents');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileField = (index: number, field: keyof UploadFile, value: any) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, [field]: value } : file
    ));
  };

  const bulkUpdateDocumentType = (type: 'past' | 'recent') => {
    setFiles(prev => prev.map(file => ({
      ...file,
      documentType: type,
      validityDays: type === 'past' ? undefined : 365,
      reminderDays: type === 'past' ? undefined : '30,15,7'
    })));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-semibold">Upload Documents</DialogTitle>
                {selectedCompany && selectedDocument && (
                  <div className="flex gap-2 items-center">
                    <Badge variant="secondary" className="px-2 py-1">
                      {selectedCompany.company_name}
                    </Badge>
                    <span className="text-gray-400">•</span>
                    <Badge variant="outline" className="px-2 py-1">
                      {selectedDocument.name}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkUpdateDocumentType('past')}
                  className="text-xs"
                >
                  Set All as Past
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkUpdateDocumentType('recent')}
                  className="text-xs"
                >
                  Set All as Recent
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Separator />

          <div className="flex-1 flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="flex-1">
              <div className="px-6 border-b">
                <TabsList className="h-12">
                  <TabsTrigger value="upload" className="flex gap-2">
                    <Inbox className="h-4 w-4" />
                    Upload Files
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex gap-2">
                    <Settings2 className="h-4 w-4" />
                    Document Settings
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 p-6 min-h-0">
                <TabsContent value="upload" className="h-full m-0">
                  <div className="grid grid-cols-2 gap-6 h-full">
                    <div className="space-y-4">
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}
                      >
                        <input {...getInputProps()} />
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <p className="font-medium text-gray-700">
                          {isDragActive ? "Drop files here" : "Drag & drop files"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          or click to browse
                        </p>
                        <p className="text-xs text-gray-400 mt-4">
                          Supported formats: PDF, JPG, PNG
                        </p>
                      </div>
                    </div>

                    <ScrollArea className="h-[calc(100vh-350px)]">
                      <div className="space-y-4 pr-4">
                        {files.map((file, index) => (
                          <Card key={index} className="p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-gray-100">
                                <FileIcon className="h-5 w-5 text-gray-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium truncate">{file.file.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(index)}
                                    className="text-gray-400 hover:text-gray-500"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="mt-4 space-y-4">
                                  <Select
                                    value={file.documentType}
                                    onValueChange={(value) => updateFileField(index, 'documentType', value)}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select document type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="recent">Recent Document</SelectItem>
                                      <SelectItem value="past">Past Document</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  {file.documentType === 'recent' && selectedDocument?.document_type === 'renewal' && (
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">
                                        Expiry Date *
                                      </label>
                                      <input
                                        type="date"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                                        value={file.expiryDate}
                                        onChange={(e) => updateFileField(index, 'expiryDate', e.target.value)}
                                        required
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="m-0">
                  <ScrollArea className="h-[calc(100vh-350px)]">
                    <div className="space-y-4 pr-4">
                      {files.map((file, index) => (
                        <Card key={index} className="p-6">
                          <div className="flex items-center gap-3 mb-6">
                            <FileIcon className="h-5 w-5 text-gray-400" />
                            <h3 className="font-medium">{file.file.name}</h3>
                          </div>
                          {file.documentType === 'recent' && (
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Validity Days
                                </label>
                                <input
                                  type="number"
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                                  value={file.validityDays}
                                  onChange={(e) => updateFileField(index, 'validityDays', parseInt(e.target.value))}
                                  min="1"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Reminder Days
                                </label>
                                <input
                                  type="text"
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                                  value={file.reminderDays}
                                  onChange={(e) => updateFileField(index, 'reminderDays', e.target.value)}
                                  placeholder="e.g., 30,15,7"
                                />
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <div className="border-t">
            <DialogFooter className="p-6">
              <div className="flex justify-between w-full items-center">
                {files.some(f => f.documentType === 'recent' && selectedDocument?.document_type === 'renewal') && (
                  <div className="flex items-center text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4 mr-1.5" />
                    Recent renewal documents require expiry dates
                  </div>
                )}
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isUploading || files.length === 0}
                    className="min-w-[140px]"
                  >
                    {isUploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};