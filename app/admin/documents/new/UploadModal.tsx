import React from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UploadModalProps {
    selectedCompany: { company_name: string } | null;
    selectedDocument: { name: string, document_type: string } | null;
    uploadData: { issueDate: string; expiryDate: string; file: File | null };
    setUploadData: React.Dispatch<React.SetStateAction<any>>;
    handleUpload: (e: React.FormEvent) => Promise<void>;
    setShowUploadModal: React.Dispatch<React.SetStateAction<boolean>>;
    uploadMutation: { isLoading: boolean };
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

                {selectedDocument?.document_type === 'renewal' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expiry Date
                        </label>
                        <input
                            type="date"
                            required
                            className="w-full px-3 py-2 border rounded-md"
                            value={uploadData.expiryDate}
                            min={uploadData.issueDate} // Prevent expiry date before issue date
                            onChange={(e) =>
                                setUploadData((prev: any) => ({ ...prev, expiryDate: e.target.value }))
                            }
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload File
                    </label>
                    <input
                        type="file"
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        onChange={(e) => {
                            const file = e.target.files ? e.target.files[0] : null;
                            if (file && !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
                                toast.error('Please upload a valid document or image file');
                                return;
                            }
                            setUploadData((prev: any) => ({
                                ...prev,
                                file: file,
                            }));
                        }}
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