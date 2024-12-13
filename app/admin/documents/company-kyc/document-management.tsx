// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { FileDown, Upload, X, ChevronUp, ChevronDown, Loader2, ChevronLeft, Trash2, ChevronRight, Eye, Plus, Download, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileIcon } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast, Toaster } from 'react-hot-toast';
import { UploadModal } from './UploadModal';
import { SettingsModal } from './SettingsModal';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// Interfaces
interface Company {
  id: number;
  company_name: string;
  description?: string;
  registration_number?: string;
  date_established?: string;
}

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

interface Upload {
  id: number;
  userid: string;
  kyc_document_id: string;
  filepath: string;
  issue_date: Date;
  expiry_date?: Date;
  extracted_details?: Record<string, any>;
}

interface DocumentUpload {
  id: string;
  userid: string;
  kyc_document_id: string;
  filepath: string;
  issue_date?: string;
  expiry_date?: string;
  upload_date: string;
}

interface UploadFile {
  file: File;
  issueDate?: string;
  expiryDate?: string;
}

type SortField = 'company' | 'issueDate' | 'expiryDate' | 'daysLeft' | 'status' | '#';
type SortDirection = 'asc' | 'desc';

interface ViewModalProps {
  url: string | null;
  setShowViewModal: (show: boolean) => void;
}

// Utility function for date parsing
const parseDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;

  try {
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }

    if (typeof dateValue === 'string') {
      const isoDate = new Date(dateValue);
      if (!isNaN(isoDate.getTime())) {
        return isoDate;
      }

      const [day, month, year] = dateValue.split(/[/-]/);
      if (day && month && year) {
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
  } catch (e) {
    console.error('Date parsing error:', e);
  }

  return null;
};
// DocumentViewer Component
const DocumentViewer: React.FC<{
  documents: any[];
  onClose: () => void;
  onUpdateDocumentType?: (docId: string, type: 'recent' | 'past') => Promise<void>;
  onDelete?: (docId: string) => Promise<void>;
}> = ({ documents, onClose, onUpdateDocumentType, onDelete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedDocs = [...documents].sort((a, b) =>
    new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  );

  const getFilenameFromPath = (filepath: string) => {
    return filepath.split('/').pop() || 'Unnamed Document';
  };

  const handleDocumentTypeChange = async (docId: string, type: 'recent' | 'past') => {
    try {
      if (onUpdateDocumentType) {
        await onUpdateDocumentType(docId, type);
      }
    } catch (error) {
      toast.error('Failed to update document type');
    }
  };

  const handleDeleteClick = (docId: string) => {
    setDeletingDoc(docId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDoc || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(deletingDoc);

      if (documents.length === 1) {
        onClose();
      } else {
        setCurrentIndex(prev => prev === documents.length - 1 ? prev - 1 : prev);
      }
      toast.success('Document deleted successfully');
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingDoc(null);
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className={`max-w-[98vw] w-[1600px] max-h-[99vh] ${documents.length === 1 ? 'h-[99vh]' : 'h-[99vh]'}`}>
          <DialogHeader className="px-6 py-2">
            <DialogTitle className="flex justify-between items-center">
              <div className="flex flex-col">
                <span>Document Preview ({currentIndex + 1}/{documents.length})</span>
                <span className="text-sm text-gray-500 mt-1">
                  {getFilenameFromPath(sortedDocs[currentIndex].filepath)}
                </span>
              </div>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(sortedDocs[currentIndex].id)}
                  className="hover:bg-red-50 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 h-[calc(100%-60px)] p-2">
            <div className="w-[250px] flex flex-col border-r pr-3">
              <ScrollArea className="flex-1">
                <div className="space-y-3">
                  {sortedDocs.map((doc, index) => (
                    <div
                      key={doc.id}
                      className={`cursor-pointer p-3 border rounded-lg transition-all group ${index === currentIndex ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-200'
                        }`}
                      onClick={() => setCurrentIndex(index)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 relative">
                          <FileIcon className="h-4 w-4 text-violet-500 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {getFilenameFromPath(doc.filepath)}
                          </span>
                          <div className="absolute left-0 -bottom-8 hidden group-hover:block z-50">
                            <div className="bg-gray-900 text-white text-xs rounded-md py-1 px-2 whitespace-nowrap">
                              {getFilenameFromPath(doc.filepath)}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(doc.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Select
                          defaultValue={doc.documentType || 'recent'}
                          onValueChange={(value) => handleDocumentTypeChange(doc.id, value as 'recent' | 'past')}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recent" className="text-xs">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Recent Document
                              </span>
                            </SelectItem>
                            <SelectItem value="past" className="text-xs">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Past Document
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="space-y-1 mt-2">
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="font-medium">Uploaded:</span>
                            {format(new Date(doc.uploadDate), 'dd/MM/yyyy')}
                          </div>
                          {doc.issueDate && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <span className="font-medium">Issued:</span>
                              {format(new Date(doc.issueDate), 'dd/MM/yyyy')}
                            </div>
                          )}
                          {doc.expiryDate && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <span className="font-medium">Expires:</span>
                              {format(new Date(doc.expiryDate), 'dd/MM/yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex-1 border rounded-lg overflow-hidden bg-white">
              <iframe
                src={sortedDocs[currentIndex].url}
                className="w-full h-full"
                title={getFilenameFromPath(sortedDocs[currentIndex].filepath)}
                style={{ height: 'calc(99vh - 70px)' }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700">Are you sure you want to delete this document? This action cannot be undone.</p>
            <p className="text-sm text-gray-500 mt-2">
              {deletingDoc && sortedDocs.find(doc => doc.id === deletingDoc)?.filepath.split('/').pop()}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingDoc(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ViewModal Component
const ViewModal: React.FC<ViewModalProps> = ({ url, setShowViewModal }) => {
  if (!url) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-2 w-[98vw] h-[98vh] relative">
        <button
          onClick={() => setShowViewModal(false)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-full h-full">
          <iframe src={url} className="w-full h-full" title="Document Viewer" />
        </div>
      </div>
    </div>
  );
};

// DocumentActions Component
const DocumentActions = ({
  onView,
  onUpload,
  onDownload,
  documentCount = 0,
  company
}: {
  onView: () => void;
  onUpload: () => void;
  onDownload: () => void;
  documentCount?: number;
  company: Company;
}) => {
  return (
    <div className="relative">
      <button onClick={onView} className="text-blue-600 hover:text-blue-800 mr-2">
        <div className="relative">
          <Eye className="w-4 h-4" />
          {documentCount > 1 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {documentCount}
            </span>
          )}
        </div>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="text-gray-600 hover:text-gray-800">
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onUpload}>
            <Plus className="w-4 h-4 mr-2" />
            Add Document
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </DropdownMenuItem>

        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
// Document Handling Functions
const handleViewDocuments = async (document: Document, company: Company) => {
  const relevantUploads = uploads.filter(u =>
    u.kyc_document_id === document.id &&
    u.userid === company.id.toString()
  );

  if (relevantUploads.length === 0) {
    toast.error('No documents found');
    return;
  }

  try {
    const documentPreviews = await Promise.all(
      relevantUploads.map(async (upload) => {
        const { data, error } = await supabase
          .storage
          .from('kyc-documents')
          .createSignedUrl(upload.filepath, 60);

        if (error) throw error;

        return {
          id: upload.id,
          url: data.signedUrl,
          filename: upload.filepath.split('/').pop() || 'document',
          uploadDate: new Date(upload.created_at),
          issueDate: upload.issue_date ? new Date(upload.issue_date) : undefined,
          expiryDate: upload.expiry_date ? new Date(upload.expiry_date) : undefined,
        };
      })
    );

    setViewDocuments(documentPreviews);
    setShowViewModal(true);
  } catch (error) {
    console.error('Error viewing documents:', error);
    toast.error('Failed to load documents');
  }
};

const handleMultiUpload = async (files: UploadFile[]) => {
  if (!selectedCompany || !selectedDocument) {
    toast.error('Missing company or document information');
    return;
  }

  try {
    await Promise.all(
      files.map(async ({ file, issueDate, expiryDate }) => {
        const timestamp = new Date().getTime();
        const fileName = `${selectedCompany.id}/${selectedDocument.id}/${timestamp}_${file.name}`;

        const { data: fileData, error: fileError } = await supabase
          .storage
          .from('kyc-documents')
          .upload(fileName, file);

        if (fileError) throw fileError;

        const uploadData = {
          userid: selectedCompany.id.toString(),
          kyc_document_id: selectedDocument.id,
          filepath: fileData.path,
          issue_date: issueDate || null,
          expiry_date: expiryDate || null,
        };

        const { error } = await supabase
          .from('acc_portal_kyc_uploads')
          .insert(uploadData);

        if (error) throw error;
      })
    );

    queryClient.invalidateQueries({ queryKey: ['uploads'] });
    setShowUploadModal(false);
    toast.success('Documents uploaded successfully');
  } catch (error) {
    console.error('Upload error:', error);
    toast.error('Failed to upload documents');
  }
};

// MissingDocumentsModal Component
const MissingDocumentsModal = ({ missingDocuments, onClose, onUpload }) => {
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

// DocumentActionCell Component
const DocumentActionCell = ({
  company,
  document,
  uploads,
  onView,
  onUpload,
  onDownload
}) => {
  const documentUploads = uploads.filter(u =>
    u.kyc_document_id === document.id &&
    u.userid === company.id.toString()
  );

  return (
    <div className="flex items-center justify-center">
      {documentUploads.length > 0 ? (
        <DocumentActions
          onView={() => onView(document, company)}
          onUpload={() => onUpload(company, document)}
          onDownload={() => onDownload(document, company)}
          documentCount={documentUploads.length}
          company={company}
        />
      ) : (
        <button
          onClick={() => onUpload(company, document)}
          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm"
        >
          Upload
        </button>
      )}
    </div>
  );
};
const DocumentManagement = () => {
  const queryClient = useQueryClient();

  // State Management
  const [activeTab, setActiveTab] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [sortField, setSortField] = useState<SortField>('company');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadData, setUploadData] = useState({
    issueDate: '',
    expiryDate: '',
    file: null as File | null,
  });
  const [showMissingDocumentsModal, setShowMissingDocumentsModal] = useState(false);
  const [missingDocuments, setMissingDocuments] = useState<Document[]>([]);
  const [viewDocuments, setViewDocuments] = useState<Array<{
    id: string;
    url: string;
    uploadDate: Date;
    issueDate?: string;
    expiryDate?: string;
  }>>([]);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  // Data Fetching with React Query
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery<Company[]>({
    queryKey: ['companies', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acc_portal_company_duplicate')
        .select('*')
        .ilike('company_name', `%${searchTerm}%`);

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ['documents', activeTab],
    queryFn: async () => {
      let query = supabase.from('acc_portal_kyc').select('*');

      if (activeTab === 'KRA') {
        query = query
          .eq('department', 'KRA')
          .eq('subcategory', 'kra-docs');
      } else if (activeTab === 'Sheria') {
        query = query
          .eq('department', 'Sheria House')
          .eq('subcategory', 'sheria-docs');
      } else if (activeTab === 'All') {
        query = query.eq('category', 'company-docs');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: uploads = [] } = useQuery<Upload[]>({
    queryKey: ['uploads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acc_portal_kyc_uploads')
        .select('*');

      if (error) throw error;
      return data || [];
    }
  });

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async ({
      companyId,
      documentId,
      files
    }: {
      companyId: number;
      documentId: string;
      files: UploadFile[];
    }) => {
      const results = [];

      for (const fileData of files) {
        try {
          const timestamp = new Date().getTime();
          const fileName = `${companyId}/${documentId}/${timestamp}_${fileData.file.name}`;
          const { data: uploadedFile, error: fileError } = await supabase
            .storage
            .from('kyc-documents')
            .upload(fileName, fileData.file);

          if (fileError) throw fileError;

          const uploadData = {
            userid: companyId.toString(),
            kyc_document_id: documentId,
            filepath: uploadedFile.path,
            issue_date: fileData.issueDate || null,
            expiry_date: fileData.expiryDate || null,
            upload_date: new Date().toISOString()
          };

          const { data, error } = await supabase
            .from('acc_portal_kyc_uploads')
            .insert(uploadData)
            .select()
            .single();

          if (error) throw error;
          results.push(data);
        } catch (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${fileData.file.name}`);
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
      setShowUploadModal(false);
      toast.success('Documents uploaded successfully');
    },
    onError: (error) => {
      toast.error('Failed to upload one or more documents');
      console.error('Upload error:', error);
    }
  });
  // Utility Functions and Handlers
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initialVisibility = {};
    documents.forEach(doc => {
      (initialVisibility as any)[doc.id] = {
        visible: true,
        subColumns: {
          upload: true,
          issueDate: true,
          expiryDate: true,
          daysLeft: true,
          status: true,
        },
      };
    });
    return initialVisibility;
  });

  useEffect(() => {
    if (documents.length > 0) {
      setVisibleColumns(prev => {
        const newVisibility = { ...prev };
        documents.forEach(doc => {
          if (!(doc.id in newVisibility)) {
            (newVisibility as any)[doc.id] = {
              visible: true,
              subColumns: {
                upload: true,
                issueDate: true,
                expiryDate: true,
                daysLeft: true,
                status: true,
              },
            };
          }
        });
        return newVisibility;
      });
    }
  }, [documents]);

  // Calculate missing documents for each company
  const calculateMissingDocuments = (companyId) => {
    return documents.reduce((missingCount, doc) => {
      const hasUpload = uploads.some(
        (upload) => upload.kyc_document_id === doc.id && upload.userid === companyId.toString()
      );
      return hasUpload ? missingCount : missingCount + 1;
    }, 0);
  };

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };



  const handleDeleteDocument = async (docId: string) => {
    try {
      const upload = uploads.find(u => u.id === docId);
      if (!upload) return;

      // Delete from storage
      const { error: storageError } = await supabase
        .storage
        .from('kyc-documents')
        .remove([upload.filepath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('acc_portal_kyc_uploads')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['uploads'] });

    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };


  const handleUpdateDocumentType = async (docId: string, type: 'recent' | 'past') => {
    try {
      const { error } = await supabase
        .from('acc_portal_kyc_uploads')
        .update({ document_type: type })
        .eq('id', docId);

      if (error) throw error;

      // Update the local state
      setViewDocuments(prev =>
        prev.map(doc =>
          doc.id === docId ? { ...doc, documentType: type } : doc
        )
      );

      toast.success('Document type updated successfully');
    } catch (error) {
      console.error('Error updating document type:', error);
      toast.error('Failed to update document type');
      throw error;
    }
  };

  const handleViewDocument = async (document: Document, company: Company) => {
    const documentUploads = uploads.filter(u =>
      u.kyc_document_id === document.id &&
      u.userid === company.id.toString()
    );

    if (!documentUploads.length) {
      toast.error('No documents found');
      return;
    }

    try {
      const documentPreviews = await Promise.all(
        documentUploads.map(async (upload) => {
          const { data, error } = await supabase
            .storage
            .from('kyc-documents')
            .createSignedUrl(upload.filepath, 60);

          if (error) throw error;

          return {
            id: upload.id,
            url: data.signedUrl,
            filepath: upload.filepath,
            uploadDate: upload.upload_date,
            issueDate: upload.issue_date,
            expiryDate: upload.expiry_date,
            documentType: upload.document_type || 'recent'
          };
        })
      );

      setViewDocuments(documentPreviews);
      setShowDocumentViewer(true);
    } catch (error) {
      console.error('Error viewing documents:', error);
      toast.error('Failed to load documents');
    }
  };


  const handleDownloadDocument = async (document: Document, company: Company) => {
    const upload = uploads.find(u =>
      u.kyc_document_id === document.id &&
      u.userid === company.id.toString()
    );

    if (!upload) {
      toast.error('Document not found');
      return;
    }

    try {
      const { data, error } = await supabase
        .storage
        .from('kyc-documents')
        .download(upload.filepath);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = upload.filepath.split('/').pop() || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const getSortedCompanies = () => {
    return [...companies].sort((a, b) => {
      const modifier = sortDirection === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'company':
          return modifier * a.company_name.localeCompare(b.company_name);
        case '#':
          return modifier * (a.id - b.id);
        default:
          return 0;
      }
    });
  };

  // Calculate stats
  const calculateStats = (documents: Document[]) => {
    return documents.map(doc => {
      const total = companies.length;
      const complete = uploads.filter(u =>
        u.kyc_document_id === doc.id
      ).length;
      const pending = total - complete;

      return { total, pending, complete };
    });
  };

  const documentStats = calculateStats(documents);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-4 h-4 text-gray-300" />;
    return sortDirection === 'asc' ?
      <ChevronUp className="w-4 h-4 text-blue-600" /> :
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };
  // Begin render return
  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-sm">
      <Toaster />
      {/* Tabs */}
      <div className="mb-2">
        <div className="flex space-x-2">
          {['All', 'KRA', 'Sheria'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm ${activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex justify-between items-center mb-4 text-sm">
        <input
          type="text"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <div className="flex items-center space-x-2">
          <button className="flex items-center gap-1 px-3 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50 transition-colors duration-200 text-gray-700 text-sm">
            <FileDown className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1 px-3 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50 transition-colors duration-200 text-gray-700 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </button>
        </div>
      </div>

      {/* Loading State */}
      {(isLoadingCompanies || isLoadingDocuments) ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-auto max-h-[70vh] max-w-full">
            <table className="w-full text-sm border-collapse min-w-[1500px]">
              {/* Table Header */}
              <thead className="sticky top-0 bg-white z-20">
                <tr className="bg-gray-100">
                  <th
                    className="p-2 border border-gray-300 font-semibold text-gray-700 sticky left-0 bg-gray-100 z-30 text-sm cursor-pointer"
                    style={{ minWidth: '50px' }}
                    rowSpan={2}
                    onClick={() => handleSort('#')}
                  >
                    <div className="flex items-center justify-between">
                      #
                      <SortIcon field="#" />
                    </div>
                  </th>

                  <th
                    className="p-2 border border-gray-300 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 sticky left-[50px] bg-gray-100 z-30 text-sm"
                    style={{ minWidth: '200px' }}
                    rowSpan={2}
                    onClick={() => handleSort('company')}
                  >
                    <div className="flex items-center justify-between">
                      Company
                      <span className="relative group">
                        <span className="ml-1 text-xs text-gray-500">({companies.length})</span>
                      </span>
                      <SortIcon field="company" />
                    </div>
                  </th>

                  {/* Summary and Missing Documents Columns */}
                  <th className="p-2 border border-gray-300 font-semibold text-gray-700 text-sm" rowSpan={2}>
                    Summary
                  </th>
                  <th className="p-2 border border-gray-300 font-semibold text-gray-700 text-sm" rowSpan={2}>
                    Missing Documents
                  </th>

                  {/* Document Columns */}
                  {documents.map((doc) => (
                    visibleColumns[doc.id]?.visible && (
                      <th
                        key={`doc-${doc.id}`}
                        className="p-2 border border-gray-300 font-semibold text-gray-700 text-sm text-center bg-blue-50"
                        colSpan={Object.values(visibleColumns[doc.id]?.subColumns || {}).filter(Boolean).length}
                      >
                        {doc.name}
                      </th>
                    )
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  {documents.map((doc) => (
                    visibleColumns[doc.id]?.visible && (
                      <React.Fragment key={`cols-${doc.id}`}>
                        {/* Document Subcolumns */}
                        {visibleColumns[doc.id]?.subColumns.upload && (
                          <th className="p-2 border border-gray-300 font-medium text-gray-600 text-sm">
                            Documents
                          </th>
                        )}
                        {visibleColumns[doc.id]?.subColumns.issueDate && (
                          <th
                            className="p-2 border border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200 text-sm"
                            onClick={() => handleSort('issueDate')}
                          >
                            <div className="flex items-center justify-between">
                              Issue Date
                              <SortIcon field="issueDate" />
                            </div>
                          </th>
                        )}
                        {visibleColumns[doc.id]?.subColumns.expiryDate && (
                          <th
                            className="p-2 border border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200 text-sm"
                            onClick={() => handleSort('expiryDate')}
                          >
                            <div className="flex items-center justify-between">
                              Expiry Date
                              <SortIcon field="expiryDate" />
                            </div>
                          </th>
                        )}
                        {visibleColumns[doc.id]?.subColumns.daysLeft && (
                          <th
                            className="p-2 border border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200 text-sm"
                            onClick={() => handleSort('daysLeft')}
                          >
                            <div className="flex items-center justify-between">
                              Days Left
                              <SortIcon field="daysLeft" />
                            </div>
                          </th>
                        )}
                        {visibleColumns[doc.id]?.subColumns.status && (
                          <th
                            className="p-2 border border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200 text-sm"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center justify-between">
                              Status
                              <SortIcon field="status" />
                            </div>
                          </th>
                        )}
                      </React.Fragment>
                    )
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-300">
                {/* Stats Rows */}
                <tr className="bg-gray-50">
                  <td className="p-2 border border-gray-300 font-medium sticky left-0 bg-inherit z-10 text-sm" rowSpan={3}>Stats</td>
                  <td className="p-2 border border-gray-300 sticky left-[50px] bg-inherit z-10 text-sm" rowSpan={3}></td>
                  <td className="p-2 border border-gray-300 font-semibold text-blue-600 text-sm">Total</td>
                  <td className="p-2 border border-gray-300 text-center font-medium text-sm">-</td>
                  {documentStats.map((stat, index) => (
                    <React.Fragment key={`stats-${index}`}>
                      {visibleColumns[documents[index].id]?.visible && (
                        <>
                          {visibleColumns[documents[index].id]?.subColumns.upload && (
                            <td className="p-2 border border-gray-300 text-center font-medium text-sm">
                              {stat.total}
                            </td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.issueDate && (
                            <td className="p-2 border border-gray-300 text-center text-gray-400 text-sm">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.expiryDate && (
                            <td className="p-2 border border-gray-300 text-center text-gray-400 text-sm">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.daysLeft && (
                            <td className="p-2 border border-gray-300 text-center text-gray-400 text-sm">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.status && (
                            <td className="p-2 border border-gray-300 text-center font-medium text-sm">
                              {stat.total}
                            </td>
                          )}
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </tr>

                {/* Missing Stats Row */}
                <tr className="bg-gray-50">
                  <td className="p-2 border border-gray-300 font-semibold text-orange-600 text-sm">Missing</td>
                  <td className="p-2 border border-gray-300 text-center font-medium text-sm">-</td>
                  {documentStats.map((stat, index) => (
                    <React.Fragment key={`pending-${index}`}>
                      {visibleColumns[documents[index].id]?.visible && (
                        <>
                          {visibleColumns[documents[index].id]?.subColumns.upload && (
                            <td className="p-2 border border-gray-300 text-center font-medium text-sm">
                              {stat.pending}
                            </td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.issueDate && (
                            <td className="p-2 border border-gray-300 text-center text-gray-400 text-sm">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.expiryDate && (
                            <td className="p-2 border border-gray-300 text-center text-gray-400 text-sm">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.daysLeft && (
                            <td className="p-2 border border-gray-300 text-center text-gray-400 text-sm">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.status && (
                            <td className="p-2 border border-gray-300 text-center font-medium text-sm">
                              {stat.pending}
                            </td>
                          )}
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </tr>
                {/* Complete Stats Row */}
                <tr className="bg-gray-50">
                  <td className="p-2 border border-gray-300 font-semibold text-green-600 text-sm">Complete</td>
                  <td className="p-2 border border-gray-300 text-center font-medium text-sm">-</td>
                  {documentStats.map((stat, index) => (
                    <React.Fragment key={`complete-${index}`}>
                      {visibleColumns[documents[index].id]?.visible && (
                        <>
                          {visibleColumns[documents[index].id]?.subColumns.upload && (
                            <td className="p-2 border border-gray-300 text-center font-medium text-sm">
                              {stat.complete}
                            </td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.issueDate && (
                            <td className="p-2 border border-gray-300 text-center text-gray-400 text-sm">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.expiryDate && (
                            <td className="p-2 border border-gray-300 text-center text-gray-400 text-sm">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.daysLeft && (
                            <td className="p-2 border border-gray-300 text-center text-gray-400 text-sm">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.status && (
                            <td className="p-2 border border-gray-300 text-center font-medium text-sm">
                              {stat.complete}
                            </td>
                          )}
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </tr>

                {/* Company Rows */}
                {getSortedCompanies().map((company, index) => (
                  <tr key={company.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2 border border-gray-300 font-medium sticky left-0 bg-inherit z-10 text-sm">
                      {company.id}
                    </td>
                    <td className="p-2 border border-gray-300 font-medium sticky left-[50px] bg-inherit z-10 text-sm">
                      <div className="relative group">
                        <span>
                          {company.company_name.split(' ')[0]}
                        </span>
                        <span className="absolute left-0 w-auto p-2 m-2 min-w-max rounded-md shadow-md text-white bg-gray-800 text-xs font-bold transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                          {company.company_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 border border-gray-300 text-sm"></td>
                    <td className="p-2 border border-gray-300 text-center font-medium text-sm">
                      <button
                        onClick={() => {
                          const missingDocs = documents.filter(doc =>
                            !uploads.some(upload =>
                              upload.kyc_document_id === doc.id && upload.userid === company.id.toString()
                            )
                          );
                          setMissingDocuments(missingDocs);
                          setShowMissingDocumentsModal(true);
                        }}
                        className="px-3 py-1 bg-white text-red-600 rounded-md hover:bg-blue-100 text-sm"
                      >
                        {calculateMissingDocuments(company.id)}
                      </button>
                    </td>

                    {/* Document Columns for each company */}
                    {documents.map((doc) => (
                      visibleColumns[doc.id]?.visible && (
                        <React.Fragment key={`${company.id}-${doc.id}`}>
                          {visibleColumns[doc.id]?.subColumns.upload && (
                            <td className="p-2 border border-gray-300 text-center text-sm">
                              <DocumentActionCell
                                company={company}
                                document={doc}
                                uploads={uploads}
                                onView={handleViewDocument}
                                onUpload={() => {
                                  setSelectedCompany(company);
                                  setSelectedDocument(doc);
                                  setShowUploadModal(true);
                                }}
                                onDownload={handleDownloadDocument}
                              />
                            </td>
                          )}

                          {/* Issue Date */}
                          {visibleColumns[doc.id]?.subColumns.issueDate && (
                            <td className="p-2 border border-gray-300 text-center text-gray-600 text-sm">
                              {(() => {
                                const upload = uploads.find(u =>
                                  u.kyc_document_id === doc.id &&
                                  u.userid === company.id.toString()
                                );

                                if (!upload) return '-';

                                // First check extracted_details
                                if (upload.extracted_details) {
                                  for (const [key, value] of Object.entries(upload.extracted_details)) {
                                    const lowerKey = key.toLowerCase();
                                    if (
                                      lowerKey.includes('issue') ||
                                      lowerKey.includes('start') ||
                                      lowerKey === 'w.i.f' ||
                                      lowerKey === 'wif' ||
                                      lowerKey === 'date_of_issue' ||
                                      lowerKey === 'issue_date' ||
                                      lowerKey === 'registration_date'
                                    ) {
                                      const parsedDate = parseDate(value);
                                      if (parsedDate) {
                                        return format(parsedDate, 'dd/MM/yyyy');
                                      }
                                    }
                                  }
                                }

                                // Fallback to regular issue_date
                                const parsedIssueDate = parseDate(upload.issue_date);
                                return parsedIssueDate ? format(parsedIssueDate, 'dd/MM/yyyy') : '-';
                              })()}
                            </td>
                          )}

                          {/* Expiry Date */}
                          {visibleColumns[doc.id]?.subColumns.expiryDate && (
                            <td className="p-2 border border-gray-300 text-center text-gray-600 text-sm">
                              {(() => {
                                if (doc.document_type === 'one-off') return 'No Expiry';

                                const upload = uploads.find(u =>
                                  u.kyc_document_id === doc.id &&
                                  u.userid === company.id.toString()
                                );

                                if (!upload) return '?';

                                // First check extracted_details
                                if (upload.extracted_details) {
                                  for (const [key, value] of Object.entries(upload.extracted_details)) {
                                    const lowerKey = key.toLowerCase();
                                    if (
                                      lowerKey.includes('expiry') ||
                                      lowerKey.includes('expiration') ||
                                      lowerKey.includes('end') ||
                                      lowerKey === 'w.i.t' ||
                                      lowerKey === 'wit' ||
                                      lowerKey === 'valid_until' ||
                                      lowerKey === 'valid_to' ||
                                      lowerKey === 'expiry_date'
                                    ) {
                                      const parsedDate = parseDate(value);
                                      if (parsedDate) {
                                        return format(parsedDate, 'dd/MM/yyyy');
                                      }
                                    }
                                  }
                                }

                                // Fallback to regular expiry_date
                                const parsedExpiryDate = parseDate(upload.expiry_date);
                                return parsedExpiryDate ? format(parsedExpiryDate, 'dd/MM/yyyy') : '?';
                              })()}
                            </td>
                          )}

                          {/* Days Left */}
                          {visibleColumns[doc.id]?.subColumns.daysLeft && (
                            <td className="p-2 border border-gray-300 text-center text-gray-600 text-sm">
                              {(() => {
                                if (doc.document_type === 'one-off') return 'N/A';

                                const upload = uploads.find(u =>
                                  u.kyc_document_id === doc.id &&
                                  u.userid === company.id.toString()
                                );

                                if (!upload) return '-';

                                // First check extracted_details
                                let expiryDate = null;
                                if (upload.extracted_details) {
                                  for (const [key, value] of Object.entries(upload.extracted_details)) {
                                    const lowerKey = key.toLowerCase();
                                    if (
                                      lowerKey.includes('expiry') ||
                                      lowerKey.includes('expiration') ||
                                      lowerKey.includes('end') ||
                                      lowerKey === 'w.i.t' ||
                                      lowerKey === 'wit' ||
                                      lowerKey === 'valid_until' ||
                                      lowerKey === 'valid_to' ||
                                      lowerKey === 'expiry_date'
                                    ) {
                                      const parsedDate = parseDate(value);
                                      if (parsedDate) {
                                        expiryDate = parsedDate;
                                        break;
                                      }
                                    }
                                  }
                                }

                                // Fallback to regular expiry_date
                                if (!expiryDate) {
                                  expiryDate = parseDate(upload.expiry_date);
                                }

                                return expiryDate ? differenceInDays(expiryDate, new Date()) : '-';
                              })()}
                            </td>
                          )}

                          {/* Status */}
                          {visibleColumns[doc.id]?.subColumns.status && (
                            <td className="p-2 border border-gray-300 text-center text-sm">
                              {(() => {
                                const upload = uploads.find(u =>
                                  u.kyc_document_id === doc.id &&
                                  u.userid === company.id.toString()
                                );

                                if (!upload) {
                                  return (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                                      Pending
                                    </span>
                                  );
                                }

                                if (doc.document_type === 'one-off') {
                                  return (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                      Valid
                                    </span>
                                  );
                                }

                                // Check extracted_details first for expiry date
                                let expiryDate = null;
                                if (upload.extracted_details) {
                                  for (const [key, value] of Object.entries(upload.extracted_details)) {
                                    const lowerKey = key.toLowerCase();
                                    if (
                                      lowerKey.includes('expiry') ||
                                      lowerKey.includes('expiration') ||
                                      lowerKey.includes('end') ||
                                      lowerKey === 'w.i.t' ||
                                      lowerKey === 'wit' ||
                                      lowerKey === 'valid_until' ||
                                      lowerKey === 'valid_to' ||
                                      lowerKey === 'expiry_date'
                                    ) {
                                      const parsedDate = parseDate(value);
                                      if (parsedDate) {
                                        expiryDate = parsedDate;
                                        break;
                                      }
                                    }
                                  }
                                }

                                // Fallback to regular expiry_date
                                if (!expiryDate) {
                                  expiryDate = parseDate(upload.expiry_date);
                                }

                                if (!expiryDate)
                                  return '-';

                                const daysLeft = differenceInDays(expiryDate, new Date());

                                if (daysLeft < 0) {
                                  return (
                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                      Expired
                                    </span>
                                  );
                                }

                                if (daysLeft <= 30) {
                                  return (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                                      Expiring Soon
                                    </span>
                                  );
                                }

                                return (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                    Valid
                                  </span>
                                );
                              })()}
                            </td>
                          )}
                        </React.Fragment>
                      )
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showDocumentViewer && (
        <DocumentViewer
          documents={viewDocuments}
          onClose={() => {
            setShowDocumentViewer(false);
            setViewDocuments([]);
          }}
          onUpdateDocumentType={handleUpdateDocumentType}
          onDelete={handleDeleteDocument}
        />
      )}

      {showUploadModal && (
        <UploadModal
          selectedCompany={selectedCompany}
          selectedDocument={selectedDocument}
          onUpload={async (files) => {
            if (!selectedCompany || !selectedDocument) return;
            await uploadMutation.mutateAsync({
              companyId: selectedCompany.id,
              documentId: selectedDocument.id,
              files
            });
          }}
          onClose={() => setShowUploadModal(false)}
          isUploading={uploadMutation.isLoading}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          documents={documents}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          setShowSettingsModal={setShowSettingsModal}
        />
      )}

      {showMissingDocumentsModal && (
        <MissingDocumentsModal
          missingDocuments={missingDocuments}
          onClose={() => setShowMissingDocumentsModal(false)}
          onUpload={(doc) => {
            setSelectedDocument(doc);
            setShowUploadModal(true);
            setShowMissingDocumentsModal(false);
          }}
        />
      )}
    </div>
  );
};

export default DocumentManagement;