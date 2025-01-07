import React, { useState, useCallback } from 'react';
import { X, Loader } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  department: string;
  subcategory: string;
  document_type: 'one-off' | 'renewal';
  issue_date?: string;
  expiry_date?: string;
  validity_days?: string;
}

interface MissingDocumentsModalProps {
  missingDocuments: Document[];
  companyName: string;
  onClose: () => void;
  onUpload: (uploads: Array<{ doc: Document, file: File, issueDate?: string, expiryDate?: string }>) => Promise<void>;
}

interface UploadState {
  file: File | null;
  issueDate?: string;
  expiryDate?: string;
}

export const MissingDocumentsModal: React.FC<MissingDocumentsModalProps> = ({ 
  missingDocuments, 
  companyName,
  onClose, 
  onUpload 
}) => {
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (docId: string, file: File) => {
    setUploadStates(prev => ({
      ...prev,
      [docId]: { ...prev[docId], file }
    }));
  };

  const handleDragOver = useCallback((e: React.DragEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(docId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(docId, file);
    }
  }, []);

  const handleDateChange = (docId: string, field: 'issueDate' | 'expiryDate', value: string) => {
    setUploadStates(prev => ({
      ...prev,
      [docId]: { ...prev[docId], [field]: value }
    }));
  };

  const handleSubmitAll = async () => {
    if (!hasAnyFiles){ 
      return;
    }

    setIsLoading(true);

    try {
      const uploads = Object.entries(uploadStates)
        .map(([docId, state]) => {
          const doc = missingDocuments.find(d => d.id === docId);
          if (doc && state.file) {
            return {
              doc,
              file: state.file,
              issueDate: state.issueDate,
              expiryDate: state.expiryDate
            };
          }
          return null;
        })
        .filter((upload): upload is NonNullable<typeof upload> => upload !== null);

      if (uploads.length > 0) {
        await onUpload(uploads);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasAnyFiles = Object.values(uploadStates).some(state => state.file !== null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-6xl h-4/5 relative overflow-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold">Missing Documents</h2>
            <p className="text-gray-600 mt-1">For {companyName}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          {missingDocuments.map(doc => (
            <div key={doc.id} className="bg-white rounded-lg p-4 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold">{doc.name}</h3>
                  <p className="text-sm text-gray-600">
                    {doc.department} - {doc.subcategory}
                  </p>
                </div>
                {uploadStates[doc.id]?.file && (
                  <span className="text-green-600 text-sm">
                    ✓ File selected
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                <div
                  onDragOver={(e) => handleDragOver(e, doc.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, doc.id)}
                  className={`
                    border-2 border-dashed rounded-md p-6 text-center transition-colors
                    ${dragOverId === doc.id ? 'border-blue-500' : 'border-gray-300'}
                    ${uploadStates[doc.id]?.file ? 'border-green-500' : ''}
                  `}
                >
                  {uploadStates[doc.id]?.file ? (
                    <div className="text-green-600">
                      <p className="font-medium">{uploadStates[doc.id]?.file?.name}</p>
                      <p className="text-sm">File selected - Click or drag to replace</p>
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      <p className="font-medium">Drag and drop your file here</p>
                      <p className="text-sm">or</p>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileChange(doc.id, file);
                      }
                    }}
                    className="w-full mt-2 cursor-pointer"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: PDF, DOC, DOCX, JPG, PNG
                  </p>
                </div>
                
                {doc.document_type === 'renewal' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Issue Date
                      </label>
                      <input
                        type="date"
                        onChange={(e) => handleDateChange(doc.id, 'issueDate', e.target.value)}
                        value={uploadStates[doc.id]?.issueDate || ''}
                        className="w-full border rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        onChange={(e) => handleDateChange(doc.id, 'expiryDate', e.target.value)}
                        value={uploadStates[doc.id]?.expiryDate || ''}
                        className="w-full border rounded-md p-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSubmitAll}
            disabled={!hasAnyFiles}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Upload All Documents
          </button>
        </div>
        
        {isLoading && (
          <div className="text-center mt-4">
            <Loader className="w-6 h-6 text-blue-500 animate-spin" />
            <p className="text-gray-600 mt-2">Uploading documents...</p>
          </div>
        )}
      </div>
    </div>
  );
};