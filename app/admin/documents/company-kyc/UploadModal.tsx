import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';

interface UploadFile {
  file: File;
  issueDate?: string;
  expiryDate?: string;
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      issueDate: '',
      expiryDate: ''
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error('Please add at least one file');
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

  const updateDates = (index: number, field: 'issueDate' | 'expiryDate', value: string) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, [field]: value } : file
    ));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {selectedCompany && selectedDocument && (
            <p className="text-sm text-gray-600">
              Uploading for {selectedCompany.company_name} - {selectedDocument.name}
            </p>
          )}

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              {isDragActive
                ? "Drop the files here"
                : "Drag & drop files here, or click to select"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: PDF, JPG, PNG
            </p>
          </div>

          <div className="max-h-[40vh] overflow-y-auto space-y-4">
            {files.map((file, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium truncate">{file.file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Issue Date (Optional)
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-md"
                      value={file.issueDate}
                      onChange={(e) => updateDates(index, 'issueDate', e.target.value)}
                    />
                  </div>
                  {selectedDocument?.document_type === 'renewal' && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border rounded-md"
                        value={file.expiryDate}
                        onChange={(e) => updateDates(index, 'expiryDate', e.target.value)}
                        min={file.issueDate}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || files.length === 0}>
              {isUploading ? 'Uploading...' : `Upload ${files.length} Document${files.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};