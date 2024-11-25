import React, { useState } from 'react';
import { X, Loader2, Eye, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UploadModalProps {
    selectedCompany: { company_name: string } | null;
    selectedDocument: { name: string, document_type: string } | null;
    uploadData: { 
        issueDate: string; 
        expiryDate: string; 
        file: File | null;
        extractOnUpload?: boolean;
    };
    setUploadData: React.Dispatch<React.SetStateAction<any>>;
    handleUpload: (e: React.FormEvent) => Promise<void>;
    setShowUploadModal: React.Dispatch<React.SetStateAction<boolean>>;
    uploadMutation: { 
        isLoading: boolean;
        status?: string;
        progress?: string;
    };
}

export const UploadModal: React.FC<UploadModalProps> = ({
    selectedCompany,
    selectedDocument,
    uploadData,
    setUploadData,
    handleUpload,
    setShowUploadModal,
    uploadMutation,
}) => {
    const [showPreview, setShowPreview] = useState(false);
    const [extractedData, setExtractedData] = useState<any>(null);

    const handleSubmitWithExtraction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadData.file) {
            toast.error('Please select a file');
            return;
        }

        if (uploadData.extractOnUpload) {
            try {
                // Show preview first if extraction is enabled
                setShowPreview(true);
                const formData = new FormData();
                formData.append('file', uploadData.file);
                
                // Simulate extraction preview (replace with actual API call)
                setTimeout(() => {
                    setExtractedData({
                        // Sample extracted data structure
                        documentNumber: "ABC123",
                        issuedBy: "Sample Authority",
                        // Add other relevant fields
                    });
                }, 1500);
                
                return;
            } catch (error) {
                console.error('Preview extraction failed:', error);
                toast.error('Failed to preview extracted data');
            }
        }

        // If no extraction or preview confirmed, proceed with upload
        handleUpload(e);
    };

    const renderUploadForm = () => (
        <form onSubmit={handleSubmitWithExtraction} className="space-y-4">
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
                        min={uploadData.issueDate}
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

            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="extractOnUpload"
                    checked={uploadData.extractOnUpload}
                    onChange={(e) =>
                        setUploadData((prev: any) => ({
                            ...prev,
                            extractOnUpload: e.target.checked,
                        }))
                    }
                    className="rounded border-gray-300"
                />
                <label htmlFor="extractOnUpload" className="text-sm text-gray-600">
                    Extract details from document
                </label>
            </div>

            {uploadMutation.isLoading && (
                <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600">{uploadMutation.progress}</span>
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={uploadMutation.isLoading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
                {uploadMutation.isLoading ? 'Processing...' : 'Continue'}
            </button>
        </form>
    );

    const renderExtractionPreview = () => (
        <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium">Extracted Details Preview</h3>
                    <button
                        onClick={() => setShowPreview(false)}
                        className="text-blue-600 text-sm hover:text-blue-700"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                </div>
                {extractedData ? (
                    <div className="space-y-2">
                        {Object.entries(extractedData).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                                <span className="text-sm text-gray-600">{key}:</span>
                                <span className="text-sm font-medium">{value as string}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                )}
            </div>

            <div className="flex space-x-2">
                <button
                    onClick={() => setShowPreview(false)}
                    className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                    Back
                </button>
                <button
                    onClick={(e: any) => handleUpload(e)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    Confirm & Upload
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[500px] relative">
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

                {showPreview ? renderExtractionPreview() : renderUploadForm()}
            </div>
        </div>
    );
};