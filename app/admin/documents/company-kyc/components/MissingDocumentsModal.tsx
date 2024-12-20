import React from 'react';
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
    onClose: () => void;
    onUpload: (doc: Document) => void;
  }
  
interface MissingDocumentsModalProps {
  missingDocuments: Document[];
  onClose: () => void;
  onUpload: (doc: Document) => void;
}

export const MissingDocumentsModal: React.FC<MissingDocumentsModalProps> = ({ 
  missingDocuments, 
  onClose, 
  onUpload 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-11/12 h-5/6 relative overflow-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold mb-4">Missing Documents</h2>
        <div className="max-h-[70vh] overflow-y-auto">
          <ul>
            {missingDocuments.map(doc => (
              <li key={doc.id} className="flex justify-between items-center p-2 border-b">
                <span>{doc.name}</span>
                <button
                  onClick={() => onUpload(doc)}
                  className="px-2 py-1 bg-blue-500 text-white rounded-md"
                >
                  Upload
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
