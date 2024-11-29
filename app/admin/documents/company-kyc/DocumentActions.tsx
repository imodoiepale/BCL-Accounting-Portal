import React, { useState } from 'react';
import { MoreVertical, Eye, Plus, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from 'date-fns';

interface DocumentViewerProps {
  documents: Array<{
    id: string;
    file: File;
    issueDate?: string;
    expiryDate?: string;
    uploadDate: Date;
    url: string;
  }>;
  onClose: () => void;
}

// Document Viewer Component for multiple documents
const DocumentViewer: React.FC<DocumentViewerProps> = ({ documents, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sortedDocs = [...documents].sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Document Preview ({currentIndex + 1}/{documents.length})</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(prev => Math.min(documents.length - 1, prev + 1))}
                disabled={currentIndex === documents.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex-1 min-h-[500px]">
            <iframe src={sortedDocs[currentIndex].url} className="w-full h-full" />
          </div>
          <div className="grid grid-cols-4 gap-2 overflow-x-auto p-2">
            {sortedDocs.map((doc, index) => (
              <div
                key={doc.id}
                className={`cursor-pointer p-2 border rounded ${
                  index === currentIndex ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <div className="text-xs truncate">Document {index + 1}</div>
                <div className="text-xs text-gray-500">
                  {format(doc.uploadDate, 'dd/MM/yyyy')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Modified Document Actions Component
export const DocumentActions = ({ onView, onUpload, onDownload, documents = [] }: {
  onView: () => void;
  onUpload: () => void;
  onDownload: () => void;
  documents?: any[];
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => onView()} className="text-blue-600 hover:text-blue-800 mr-2">
        <Eye className="w-4 h-4" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="text-gray-600 hover:text-gray-800">
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onUpload}>
            <Plus className="w-4 h-4 mr-2" />
            Add Document
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
export const UploadModal = ({
  selectedCompany,
  selectedDocument,
  onUpload,
  existingDocuments = [],
  onClose
}: {
  selectedCompany: any;
  selectedDocument: any;
  onUpload: (uploads: { file: File; issueDate?: string; expiryDate?: string }[]) => Promise<void>;
  existingDocuments?: any[];
  onClose: () => void;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [dates, setDates] = useState<Array<{ issueDate?: string; expiryDate?: string }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const uploads = files.map((file, index) => ({
      file,
      issueDate: dates[index]?.issueDate,
      expiryDate: dates[index]?.expiryDate
    }));

    await onUpload(uploads);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
    setDates(prev => [...prev, ...newFiles.map(() => ({ issueDate: '', expiryDate: '' }))]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setDates(prev => prev.filter((_, i) => i !== index));
  };

  const updateDates = (index: number, field: 'issueDate' | 'expiryDate', value: string) => {
    setDates(prev => prev.map((date, i) => 
      i === index ? { ...date, [field]: value } : date
    ));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {selectedCompany && selectedDocument && (
              <p className="text-sm text-gray-600">
                Uploading for {selectedCompany.company_name} - {selectedDocument.name}
              </p>
            )}

            <div className="border-2 border-dashed rounded-lg p-4">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full"
              />
            </div>

            <div className="max-h-[40vh] overflow-y-auto space-y-4">
              {files.map((file, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Issue Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border rounded-md"
                        value={dates[index]?.issueDate || ''}
                        onChange={(e) => updateDates(index, 'issueDate', e.target.value)}
                      />
                    </div>
                    {selectedDocument?.document_type === 'renewal' && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Expiry Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border rounded-md"
                          value={dates[index]?.expiryDate || ''}
                          onChange={(e) => updateDates(index, 'expiryDate', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={files.length === 0}>
              Upload {files.length} Document{files.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};