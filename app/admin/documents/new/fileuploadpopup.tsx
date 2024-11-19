import React from 'react';
import { X } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

interface UploadModalProps {
  selectedCompany: { company_name: string } | null;
  selectedDocument: { name: string } | null;
  uploadData: { issueDate: string; expiryDate: string; file: File | null };
  setUploadData: React.Dispatch<React.SetStateAction<any>>;
  handleUpload: (e: React.FormEvent) => Promise<void>;
  setShowUploadModal: React.Dispatch<React.SetStateAction<boolean>>;
  uploadMutation: { isLoading: boolean };
}

interface SettingsModalProps {
  documents: any[];
  visibleColumns: any;
  setVisibleColumns: React.Dispatch<React.SetStateAction<any>>;
  setShowSettingsModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  selectedCompany,
  selectedDocument,
  uploadData,
  setUploadData,
  handleUpload,
  setShowUploadModal,
  uploadMutation,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-96 relative">
      <button
        onClick={() => setShowUploadModal(false)}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        <X className="w-5 h-5" />
      </button>

      <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
      {selectedCompany && selectedDocument && (
        <p className="text-sm text-gray-600 mb-4">
          Uploading for {selectedCompany.company_name} - {selectedDocument.name}
        </p>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Issue Date
          </label>
          <input
            type="date"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={uploadData.issueDate}
            onChange={(e) =>
              setUploadData((prev: any) => ({ ...prev, issueDate: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date
          </label>
          <input
            type="date"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={uploadData.expiryDate}
            onChange={(e) =>
              setUploadData((prev: any) => ({ ...prev, expiryDate: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload File
          </label>
          <input
            type="file"
            required
            className="w-full px-3 py-2 border rounded-md"
            onChange={(e) =>
              setUploadData((prev: any) => ({
                ...prev,
                file: e.target.files ? e.target.files[0] : null,
              }))
            }
          />
        </div>

        <button
          type="submit"
          disabled={uploadMutation.isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploadMutation.isLoading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>
    </div>
  </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({
  documents,
  visibleColumns,
  setVisibleColumns,
  setShowSettingsModal,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-4xl relative">
      <button
        onClick={() => setShowSettingsModal(false)}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        <X className="w-5 h-5" />
      </button>

      <h2 className="text-xl font-semibold mb-4">Settings</h2>
      <div className="grid grid-cols-2 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="border p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={visibleColumns[doc.id]?.visible}
                onChange={() => {
                  setVisibleColumns((prev: { [x: string]: { visible: any; }; }) => {
                      return ({
                          ...prev,
                          [doc.id]: {
                              ...prev[doc.id],
                              visible: !prev[doc.id]?.visible,
                          },
                      });
                  });
                }}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">
                {doc.name}
              </label>
            </div>
            {visibleColumns[doc.id]?.visible && (
              <div className="space-y-2">
                {Object.keys(visibleColumns[doc.id]?.subColumns || {}).map(
                  (subColumn) => (
                    <div key={subColumn} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={visibleColumns[doc.id]?.subColumns[subColumn]}
                        onChange={() => {
                          setVisibleColumns((prev: { [x: string]: { subColumns: { [x: string]: any; }; }; }) => ({
                            ...prev,
                            [doc.id]: {
                              ...prev[doc.id],
                              subColumns: {
                                ...prev[doc.id]?.subColumns,
                                [subColumn]: !prev[doc.id]?.subColumns[
                                  subColumn
                                ],
                              },
                            },
                          }));
                        }}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700 capitalize">
                        {subColumn}
                      </label>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);