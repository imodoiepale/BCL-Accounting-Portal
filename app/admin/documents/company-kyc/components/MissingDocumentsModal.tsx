import React, { useState } from 'react';
import { X } from 'lucide-react';

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
  onUpload: (uploads: Array<{ doc: Document, file: File, issueDate?: string, expiryDate?: string }>) => void;
}

export const MissingDocumentsModal: React.FC<MissingDocumentsModalProps> = ({ 
  missingDocuments, 
  companyName,
  onClose, 
  onUpload 
}) => {
  const [uploadStates, setUploadStates] = useState<Record<string, {
    file: File | null;
    issueDate?: string;
    expiryDate?: string;
  }>>({});

  const handleFileChange = (docId: string, file: File) => {
    setUploadStates(prev => ({
      ...prev,
      [docId]: { ...prev[docId], file }
    }));
  };

  const handleDateChange = (docId: string, field: 'issueDate' | 'expiryDate', value: string) => {
    setUploadStates(prev => ({
      ...prev,
      [docId]: { ...prev[docId], [field]: value }
    }));
  };

  const handleSubmitAll = () => {
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
      onUpload(uploads);
    }
  };

  const hasAnyFiles = Object.values(uploadStates).some(state => state.file !== null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl h-4/5 relative overflow-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Missing Documents</h2>
            <p className="text-gray-600 mt-1">For {companyName}</p>
          </div>
          <button
            onClick={handleSubmitAll}
            disabled={!hasAnyFiles}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Upload All Documents
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {missingDocuments.map(doc => (
            <div key={doc.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="font-medium">{doc.name}</h3>
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

              <div className="mt-4 space-y-4 bg-white p-4 rounded-lg border">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Document
                  </label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileChange(doc.id, file);
                      }
                    }}
                    className="w-full border rounded-md p-2"
                  />
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
                        className="w-full border rounded-md p-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};