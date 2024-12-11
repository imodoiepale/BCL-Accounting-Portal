// DocumentViewer.tsx
import React, { useState } from 'react';
import { 
  MoreVertical, 
  Eye, 
  Plus, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  FileIcon, 
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';

// Interfaces
interface Document {
  id: string;
  file: File;
  documentType: 'past' | 'recent';
  issueDate?: string;
  expiryDate?: string;
  uploadDate: Date;
  url: string;
}

interface DocumentViewerProps {
  documents: Document[];
  onClose: () => void;
}

interface DocumentActionsProps {
  onView: () => void;
  onUpload: () => void;
  onDownload: () => void;
  hasDocuments: boolean;
}

interface UploadModalProps {
  selectedCompany: { id: number; company_name: string };
  selectedDocument: { id: string; name: string; document_type: string };
  onUpload: (uploads: UploadFile[]) => Promise<void>;
  existingDocuments?: Document[];
  onClose: () => void;
}

interface UploadFile {
  file: File;
  documentType: 'past' | 'recent';
  issueDate?: string;
  expiryDate?: string;
}

// Document Viewer Component
export const DocumentViewer: React.FC<DocumentViewerProps> = ({ documents, onClose }) => {
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
                className="hover:bg-violet-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(prev => Math.min(documents.length - 1, prev + 1))}
                disabled={currentIndex === documents.length - 1}
                className="hover:bg-violet-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          <div className="flex-1 min-h-[500px] border rounded-lg">
            <iframe 
              src={sortedDocs[currentIndex].url} 
              className="w-full h-full rounded-lg"
              title={`Document ${currentIndex + 1}`}
            />
          </div>

          <ScrollArea className="w-full">
            <div className="flex space-x-2 p-2">
              {sortedDocs.map((doc, index) => (
                <div
                  key={doc.id}
                  className={`flex-shrink-0 cursor-pointer p-3 border rounded-lg transition-all min-w-[150px] ${
                    index === currentIndex ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-200'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileIcon className="h-4 w-4 text-violet-500" />
                    <span className="text-sm font-medium truncate">Document {index + 1}</span>
                  </div>
                  <div className="space-y-1">
                    <div className={`text-xs px-2 py-1 rounded-full w-fit ${
                      doc.documentType === 'recent' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {doc.documentType === 'recent' ? 'Recent' : 'Past'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(doc.uploadDate, 'dd/MM/yyyy')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
// Document Actions Component
export const DocumentActions: React.FC<DocumentActionsProps> = ({
  onView,
  onUpload,
  onDownload,
  hasDocuments
}) => {
  return (
    <div className="relative flex items-center space-x-2">
      {hasDocuments && (
        <button 
          onClick={onView} 
          className="text-violet-600 hover:text-violet-800 transition-colors p-2 rounded-full hover:bg-violet-50"
          title="View Documents"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-violet-50 rounded-full">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onUpload} className="hover:bg-violet-50">
            <Plus className="h-4 w-4 mr-2 text-violet-600" />
            Add Document
          </DropdownMenuItem>
          {hasDocuments && (
            <DropdownMenuItem onClick={onDownload} className="hover:bg-violet-50">
              <Download className="h-4 w-4 mr-2 text-violet-600" />
              Download All
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Upload Modal Component
export const UploadModal: React.FC<UploadModalProps> = ({
  selectedCompany,
  selectedDocument,
  onUpload,
  existingDocuments = [],
  onClose
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [documentData, setDocumentData] = useState<Array<{
    documentType: 'past' | 'recent';
    issueDate?: string;
    expiryDate?: string;
  }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const uploads: UploadFile[] = files.map((file, index) => ({
      file,
      documentType: documentData[index]?.documentType || 'recent',
      issueDate: documentData[index]?.issueDate,
      expiryDate: documentData[index]?.expiryDate
    }));

    try {
      await onUpload(uploads);
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
    setDocumentData(prev => [...prev, ...newFiles.map(() => ({ documentType: 'recent' as const }))]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setDocumentData(prev => prev.filter((_, i) => i !== index));
  };

  const updateDocumentData = (index: number, field: 'documentType' | 'issueDate' | 'expiryDate', value: string) => {
    setDocumentData(prev => prev.map((data, i) => 
      i === index ? { ...data, [field]: value } : data
    ));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Upload Documents</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {selectedCompany && selectedDocument && (
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-md bg-violet-100 text-violet-700 text-sm font-medium">
                {selectedCompany.company_name}
              </div>
              <div className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-sm">
                {selectedDocument.name}
              </div>
            </div>
          )}

          <div className="border-2 border-dashed border-violet-200 rounded-lg p-8 bg-violet-50/50 hover:bg-violet-50 transition-colors text-center">
            <Upload className="h-8 w-8 mx-auto mb-3 text-violet-500" />
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-2">
              Supported formats: PDF, JPG, PNG
            </p>
          </div>

          <ScrollArea className="max-h-[40vh]">
            <div className="space-y-4 pr-4">
              {files.map((file, index) => (
                <div key={index} className="border rounded-lg p-4 hover:border-violet-200 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileIcon className="h-4 w-4 text-violet-500" />
                        <span className="font-medium">{file.name}</span>
                      </div>
                      <select
                        className="text-sm px-2.5 py-1.5 rounded-md border border-gray-200 bg-gray-50 hover:border-violet-200 focus:border-violet-300 focus:ring-1 focus:ring-violet-200 outline-none"
                        value={documentData[index]?.documentType || 'recent'}
                        onChange={(e) => updateDocumentData(index, 'documentType', e.target.value as 'past' | 'recent')}
                      >
                        <option value="recent">Recent Document</option>
                        <option value="past">Past Document</option>
                      </select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {documentData[index]?.documentType === 'recent' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Issue Date *
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border rounded-md focus:border-violet-300 focus:ring-1 focus:ring-violet-200 outline-none"
                          value={documentData[index]?.issueDate || ''}
                          onChange={(e) => updateDocumentData(index, 'issueDate', e.target.value)}
                          required
                        />
                      </div>
                      {selectedDocument?.document_type === 'renewal' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Expiry Date *
                          </label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border rounded-md focus:border-violet-300 focus:ring-1 focus:ring-violet-200 outline-none"
                            value={documentData[index]?.expiryDate || ''}
                            onChange={(e) => updateDocumentData(index, 'expiryDate', e.target.value)}
                            min={documentData[index]?.issueDate}
                            required
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {files.length > 0 && documentData.some(d => d.documentType === 'recent') && (
            <div className="flex items-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 mr-2" />
              Recent documents require dates to be filled
            </div>
          )}

          <DialogFooter>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="hover:bg-violet-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={files.length === 0}
                className="bg-violet-600 hover:bg-violet-700 text-white min-w-[120px]"
              >
                Upload {files.length > 0 ? `(${files.length})` : ''}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};