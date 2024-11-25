import React from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Company {
  id: number;
  name: string;
}

interface Document {
  id: number;
  name: string;
  department: string;
  subcategory: string;
}

interface UploadModalProps {
  selectedCompany: Company | null;
  selectedDocument: Document | null;
  selectedDirector: string | null;  // Added selectedDirector prop
  uploadData: {
    issueDate: string;
    expiryDate: string;
    file: File | null;
  };
  setUploadData: React.Dispatch<React.SetStateAction<{
    issueDate: string;
    expiryDate: string;
    file: File | null;
  }>>;
  handleUpload: (e: React.FormEvent) => void;
  setShowUploadModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  selectedCompany,
  selectedDocument,
  selectedDirector,  // Added selectedDirector
  uploadData,
  setUploadData,
  handleUpload,
  setShowUploadModal,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 relative">
        <button 
          onClick={() => setShowUploadModal(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
        {selectedCompany && selectedDocument && selectedDirector && (
          <p className="text-sm text-gray-600 mb-4">
            Uploading for {selectedCompany.name} - {selectedDirector} - {selectedDocument.name}
          </p>
        )}

        {/* Rest of the form remains the same */}
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Issue Date
            </label>
            <input 
              id="issueDate"
              type="date" 
              required
              className="w-full px-3 py-2 border rounded-md"
              value={uploadData.issueDate}
              onChange={(e) => setUploadData(prev => ({ ...prev, issueDate: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input 
              id="expiryDate"
              type="date"
              required
              className="w-full px-3 py-2 border rounded-md"
              value={uploadData.expiryDate}
              min={uploadData.issueDate}
              onChange={(e) => setUploadData(prev => ({ ...prev, expiryDate: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-1">
              Upload File
            </label>
            <input 
              id="fileUpload"
              type="file"
              required
              className="w-full px-3 py-2 border rounded-md"
              onChange={(e) => {
                const file = e.target.files ? e.target.files[0] : null;
                if (file && !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
                  toast.error('Please upload a valid document or image file');
                  return;
                }
                setUploadData(prev => ({ ...prev, file }));
              }}
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            Upload Document
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;