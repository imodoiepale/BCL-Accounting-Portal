import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCompany: { id: number; company_name: string } | null;
  selectedDirector: { id: number; full_name: string } | null;
  selectedDocument: { id: string; name: string } | null;
  onUploadComplete: () => Promise<void>;
}

interface FileWithMeta {
  file: File;
  issueDate?: string;
  expiryDate?: string;
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  selectedCompany,
  selectedDirector,
  selectedDocument,
  onUploadComplete,
}) => {
  const [files, setFiles] = useState<FileWithMeta[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: true,
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map(file => ({
        file,
        issueDate: '',
        expiryDate: ''
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !selectedDirector || !selectedDocument) return;

    try {
      setIsUploading(true);

      for (const fileData of files) {
        const fileExt = fileData.file.name.split('.').pop();
        const filePath = `director-documents/${selectedCompany.id}/${selectedDirector.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, fileData.file);

        if (uploadError) throw uploadError;

        const { error: saveError } = await supabase
          .from('acc_portal_directors_documents')
          .insert({
            company_id: selectedCompany.id,
            director_id: selectedDirector.id,
            document_id: selectedDocument.id,
            issue_date: fileData.issueDate || null,
            expiry_date: fileData.expiryDate || null,
            file_path: filePath,
            status: 'pending'
          });

        if (saveError) throw saveError;
      }

      await onUploadComplete();
      toast.success('Documents uploaded successfully');
      onClose();
      setFiles([]);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload documents');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-semibold mb-4">Upload Documents</h2>
        {selectedCompany && selectedDocument && selectedDirector && (
          <p className="text-xs text-gray-600 mb-4">
            Uploading for {selectedCompany.company_name} - {selectedDirector.full_name} - {selectedDocument.name}
          </p>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          >
            <input {...getInputProps()} />
            <p className="text-sm text-gray-600">
              Drag & drop files here, or click to select files
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: PDF, JPEG, PNG
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {files.map((fileData, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm truncate">{fileData.file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, i) => i !== index))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Issue Date (Optional)
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-1.5 border rounded-md text-sm"
                        value={fileData.issueDate}
                        onChange={(e) => {
                          const newFiles = [...files];
                          newFiles[index].issueDate = e.target.value;
                          setFiles(newFiles);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-1.5 border rounded-md text-sm"
                        value={fileData.expiryDate}
                        min={fileData.issueDate}
                        onChange={(e) => {
                          const newFiles = [...files];
                          newFiles[index].expiryDate = e.target.value;
                          setFiles(newFiles);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm"
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Documents'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;