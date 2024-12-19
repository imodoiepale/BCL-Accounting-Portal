import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  directorName: string;
  documentName: string;
  companyId: number;
  directorId: number;
  documentId: string;
  onDelete: () => Promise<void>;
}

interface DocumentVersion {
  id: number;
  file_path: string;
  issue_date: string | null;
  expiry_date: string | null;
  created_at: string;
}

const ViewModal: React.FC<ViewModalProps> = ({
  isOpen,
  onClose,
  companyName,
  directorName,
  documentName,
  companyId,
  directorId,
  documentId,
  onDelete,
}) => {
  const [documents, setDocuments] = useState<DocumentVersion[]>([]);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen, companyId, directorId, documentId]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('acc_portal_directors_documents')
        .select('*')
        .eq('company_id', companyId)
        .eq('director_id', directorId)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const doc = documents.find(d => d.id === docId);
      if (!doc) return;

      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('acc_portal_directors_documents')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      await onDelete();
      toast.success('Document deleted successfully');
      
      // Remove from local state
      setDocuments(documents.filter(d => d.id !== docId));
      if (selectedDocIndex >= documents.length - 1) {
        setSelectedDocIndex(Math.max(0, documents.length - 2));
      }

      if (documents.length <= 1) {
        onClose();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-5xl h-[90vh] relative flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold">{documentName}</h2>
            <p className="text-sm text-gray-600">
              {companyName} - {directorName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <div className="flex-1 grid grid-cols-4 gap-4">
              {/* Document list */}
              <div className="border rounded-lg p-4 space-y-2 overflow-y-auto">
                {documents.map((doc, index) => (
                  <div
                    key={doc.id}
                    className={`p-2 rounded-lg cursor-pointer ${
                      selectedDocIndex === index
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedDocIndex(index)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">Version {documents.length - index}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                        {doc.issue_date && (
                          <p className="text-xs text-gray-500">
                            Issue Date: {formatDate(doc.issue_date)}
                          </p>
                        )}
                        {doc.expiry_date && (
                          <p className="text-xs text-gray-500">
                            Expiry Date: {formatDate(doc.expiry_date)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Document preview */}
              <div className="col-span-3 border rounded-lg overflow-hidden">
                {documents[selectedDocIndex] && (
                  <iframe
                    src={supabase.storage
                      .from('documents')
                      .getPublicUrl(documents[selectedDocIndex].file_path).data.publicUrl}
                    className="w-full h-full"
                    title="Document Preview"
                  />
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => window.open(
                  supabase.storage
                    .from('documents')
                    .getPublicUrl(documents[selectedDocIndex].file_path).data.publicUrl,
                  '_blank'
                )}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Open in New Tab
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewModal;