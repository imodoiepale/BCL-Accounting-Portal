// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/lib/supabaseClient';
import { Input } from "@/components/ui/input";
import { Eye, DownloadIcon, UploadIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import toast, { Toaster } from 'react-hot-toast';
import { DocumentActions } from './DocumentComponents';
import { UploadModal, ViewModal, AddFieldsDialog, ExtractDetailsModal } from './DocumentModals';

interface Director {
  id: bigint;
  company_id: bigint;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  full_name: string | null;
}

interface Upload {
  id: string;
  userid: string;
  kyc_document_id: string;
  filepath: string;
  issue_date: string;
  expiry_date?: string;
  value?: Record<string, any>;
  extracted_details?: Record<string, any>;
}

interface Document {
  id: string;
  name: string;
  fields?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  last_extracted_details?: Record<string, any>;
}

interface ExtractedData {
  [key: string]: any;
}

export default function DirectorsKycDocumentDetails() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [selectedDirectorUpload, setSelectedDirectorUpload] = useState<Director | null>(null);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [selectedExtractDocument, setSelectedExtractDocument] = useState<Document | null>(null);
  const [selectedExtractUpload, setSelectedExtractUpload] = useState<Upload | null>(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isLoading, setIsLoading] = useState(false);

  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Query for directors
  const { data: directors = [], isLoading: isLoadingDirectors } = useQuery({
    queryKey: ['directors'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('acc_portal_directors_duplicate')
          .select(`
            id,
            company_id,
            first_name,
            middle_name,
            last_name,
            full_name
          `)
          .order('company_id');

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching directors:', error);
        toast.error('Failed to load directors');
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // Group directors by company
  const directorsByCompany = React.useMemo(() => {
    return directors.reduce((acc, director) => {
      if (!acc[director.company_id]) {
        acc[director.company_id] = [];
      }
      acc[director.company_id].push(director);
      return acc;
    }, {});
  }, [directors]);

  // Query for companies
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies', debouncedSearch],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('acc_portal_company_duplicate')
          .select('id, company_name')
          .ilike('company_name', `%${debouncedSearch}%`)
          .limit(100);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching companies:', error);
        toast.error('Failed to load companies');
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // Query for documents
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('acc_portal_kyc')
          .select('*')
          .eq('category', 'directors-docs');

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to load documents');
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // Query for uploads
  const { data: uploads = [], isLoading: isLoadingUploads } = useQuery({
    queryKey: ['uploads'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('acc_portal_directors_documents')
          .select('*');

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching uploads:', error);
        toast.error('Failed to load uploads');
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // Update fields mutation
  const updateFieldsMutation = useMutation({
    mutationFn: async ({ documentId, fields }) => {
      if (!documentId) throw new Error('Document ID is required');

      const { error } = await supabase
        .from('acc_portal_kyc')
        .update({ fields })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      toast.success('Fields updated successfully');
    },
    onError: (error) => {
      console.error('Error updating fields:', error);
      toast.error('Failed to update fields');
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ directorId, documentId, file, extractOnUpload, onProgress }) => {
      if (!directorId || !documentId) {
        throw new Error('Missing required parameters');
      }

      try {
        setIsLoading(true);
        onProgress?.('Uploading file...');

        const timestamp = new Date().getTime();
        const fileName = `directors/${directorId}/${documentId}/${timestamp}_${file.name}`;

        const { data: fileData, error: fileError } = await supabase
          .storage
          .from('kyc-documents')
          .upload(fileName, file);

        if (fileError) throw fileError;

        const uploadData = {
          userid: directorId.toString(),
          kyc_document_id: documentId,
          filepath: fileData.path,
          issue_date: new Date().toISOString(),
        };

        const { data: uploadResult, error } = await supabase
          .from('acc_portal_directors_documents')
          .insert(uploadData)
          .select()
          .single();

        if (error) throw error;

        if (extractOnUpload) {
          const selectedDoc = documents.find(d => d.id === documentId);
          if (!selectedDoc) {
            throw new Error('Document not found');
          }
          setSelectedExtractDocument(selectedDoc);
          setSelectedExtractUpload(uploadResult);
          setShowExtractModal(true);
        }

        return uploadResult;
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['uploads']);
      if (!data.extracted_details) {
        setShowUploadModal(false);
        toast.success('Document uploaded successfully');
      }
    },
    onError: (error) => {
      toast.error('Failed to upload document');
      console.error('Upload error:', error);
    }
  });

  // Handlers
  const handleCancelExtraction = () => {
    setShowExtractModal(false);
    setSelectedExtractDocument(null);
    setSelectedExtractUpload(null);
  };

  const handleExtractComplete = async (extractedData: ExtractedData) => {
    try {
      if (!selectedExtractUpload?.id) {
        throw new Error('No upload selected');
      }

      const { error } = await supabase
        .from('acc_portal_directors_documents')
        .update({ extracted_details: extractedData })
        .eq('id', selectedExtractUpload.id);

      if (error) throw error;

      queryClient.invalidateQueries(['uploads']);
      setShowExtractModal(false);
      toast.success('Details extracted successfully');
    } catch (error) {
      console.error('Extraction error:', error);
      toast.error('Failed to save extracted details');
    }
  };

  const handleUploadClick = (director: Director, documentId: string) => {
    if (!director || !documentId) {
      toast.error('Invalid upload parameters');
      return;
    }
    setSelectedDirectorUpload(director);
    setSelectedDocument(documents.find(d => d.id === documentId) || null);
    setShowUploadModal(true);
  };

  const handleViewDocument = async (document: Document, director: Director) => {
    try {
      const upload = uploads.find(u =>
        u.kyc_document_id === document.id &&
        u.userid === director.id.toString()
      );

      if (!upload) {
        toast.error('Document not found');
        return;
      }

      const { data, error } = await supabase
        .storage
        .from('kyc-documents')
        .createSignedUrl(upload.filepath, 60);

      if (error) throw error;

      setViewUrl(data.signedUrl);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to view document');
    }
  };

  const handleExtractClick = (document: Document, upload: Upload) => {
    if (!document || !upload) {
      toast.error('Invalid extraction parameters');
      return;
    }
    setSelectedExtractDocument(document);
    setSelectedExtractUpload(upload);
    setShowExtractModal(true);
  };

  const handleSort = (key: string) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  // Sorting companies
  const sortedCompanies = React.useMemo(() => {
    if (!sortConfig.key) return companies;

    return [...companies].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [companies, sortConfig]);

  // Loading state
  if (isLoadingDirectors || isLoadingCompanies || isLoadingDocuments || isLoadingUploads) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex overflow-hidden">
      <Toaster position="top-right" />

      {/* Left sidebar - Documents List */}
      <div className="w-1/5 min-w-[200px] border-r overflow-hidden flex flex-col">
        <div className="p-2">
          <h2 className="text-sm font-bold mb-2">Documents</h2>
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2 h-8 text-xs"
          />
        </div>

        <div ref={parentRef} className="overflow-y-auto flex-1">
          <ul>
            {documents.map((doc) => (
              <li
                key={doc.id}
                className={`px-2 py-1 rounded flex items-center justify-between text-xs ${selectedDocument?.id === doc.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-gray-100'
                  }`}
              >
                <span
                  className="cursor-pointer flex-1"
                  onClick={() => setSelectedDocument(doc)}
                >
                  {doc.name}
                </span>
                <DocumentActions
                  document={doc}
                  onAddField={() => {
                    setSelectedDocument(doc);
                    setIsAddFieldOpen(true);
                  }}
                  onUpdateFields={(documentId, fields) => {
                    updateFieldsMutation.mutate({ documentId, fields });
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right side - Table */}
      <div className="flex-1 flex flex-col h-[800px] overflow-hidden">
        {selectedDocument ? (
          <div className="flex flex-col h-full">
            <h2 className="text-sm font-bold p-2 border-b">
              {selectedDocument.name} - Details
            </h2>

            <div className="overflow-auto flex-1">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow className="text-[11px] bg-blue-50 border-b border-gray-300">
                      <TableHead className="sticky top-0 left-0 bg-blue-50 z-10 border-r border-gray-300 w-[50px]">#</TableHead>
                      <TableHead
                        className="sticky top-0 left-0 bg-blue-50 z-10 cursor-pointer border-r border-gray-300"
                        onClick={() => handleSort('company_name')}
                      >
                        Company
                        {sortConfig.key === 'company_name' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </TableHead>
                      <TableHead className="sticky top-0 bg-blue-50 z-10 border-r border-gray-300">Directors</TableHead>
                      <TableHead className="sticky top-0 bg-blue-50 z-10 border-r border-gray-300 text-center w-[100px]">
                        Actions
                      </TableHead>
                      {selectedDocument.fields?.map((field) => (
                        <TableHead
                          key={field.id}
                          className="text-center sticky top-0 bg-blue-50 z-10 border-l border-gray-300"
                        >
                          {field.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-[11px]">
                    {sortedCompanies.map((company, index) => {
                      const companyDirectors = directorsByCompany[company.id] || [];

                      return companyDirectors.map((director, directorIndex) => (
                        <TableRow
                          key={`${company.id}-${director.id}`}
                          className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-300`}
                        >
                          {/* Render row number and company name only for first director */}
                          {directorIndex === 0 && (
                            <>
                              <TableCell
                                className="font-medium sticky left-0 bg-inherit border-r border-gray-300 text-center"
                                rowSpan={companyDirectors.length}
                              >
                                {index + 1}
                              </TableCell>
                              <TableCell
                                className="font-medium sticky left-0 bg-inherit border-r border-gray-300"
                                rowSpan={companyDirectors.length}
                              >
                                {company.company_name}
                              </TableCell>
                            </>
                          )}

                          {/* Director Cell */}
                          <TableCell className="border-r border-gray-300 text-center">
                            <div className="flex items-center justify-between p-1">
                              <span className="text-left">
                                {director.full_name || `${director.first_name || ''} ${director.last_name || ''}`}
                              </span>
                            </div>
                          </TableCell>

                          {/* Actions Cell */}
                          <TableCell className="border-r border-gray-300 text-center">
                            <div className="flex justify-center space-x-1 text-[10px]">
                              {uploads.some(u =>
                                u.kyc_document_id === selectedDocument?.id &&
                                u.userid === director.id.toString()
                              ) ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleViewDocument(selectedDocument, director)}
                                    title="View Document"
                                    disabled={isLoading}
                                  >
                                    <Eye className="h-3 w-3 text-blue-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      handleExtractClick(
                                        selectedDocument,
                                        uploads.find(
                                          u =>
                                            u.kyc_document_id === selectedDocument.id &&
                                            u.userid === director.id.toString()
                                        )!
                                      )
                                    }
                                    title="Extract Details"
                                    disabled={isLoading}
                                  >
                                    <DownloadIcon className="h-3 w-3 text-green-500" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleUploadClick(director, selectedDocument?.id)}
                                  title="Upload Document"
                                  disabled={isLoading}
                                >
                                  <UploadIcon className="h-3 w-3 text-orange-500" />
                                </Button>
                              )}
                            </div>
                          </TableCell>

                          {/* Extracted Details Cells */}
                          {selectedDocument.fields?.map((field) => (
                            <TableCell
                              key={field.id}
                              className="text-center border-l border-gray-300"
                            >
                              {(() => {
                                const upload = uploads.find(
                                  u =>
                                    u.kyc_document_id === selectedDocument.id &&
                                    u.userid === director.id.toString()
                                );
                                return (
                                  <span>{upload?.extracted_details?.[field.name] || '-'}</span>
                                );
                              })()}
                            </TableCell>
                          ))}
                        </TableRow>
                      ));
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Select a document to view details
          </div>
        )}
      </div>

      {/* Modals */}
      {showUploadModal && selectedDirectorUpload && (
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedDirectorUpload(null);
          }}
          onUpload={(file, extractOnUpload, onProgress) =>
            uploadMutation.mutate({
              directorId: selectedDirectorUpload.id,
              documentId: selectedDocument?.id,
              file,
              extractOnUpload,
              onProgress
            })
          }
          director={selectedDirectorUpload}
          document={selectedDocument}
          isUploading={isLoading}
        />
      )}


      {showViewModal && viewUrl && (
        <ViewModal
          url={viewUrl}
          onClose={() => {
            setShowViewModal(false);
            setViewUrl(null);
          }}
        />
      )}

      {isAddFieldOpen && selectedDocument && (
        <AddFieldsDialog
          isOpen={isAddFieldOpen}
          onClose={() => setIsAddFieldOpen(false)}
          document={selectedDocument}
          onSubmit={(documentId, fields) => {
            const existingFields = selectedDocument.fields || [];
            const updatedFields = [...existingFields, ...fields];
            updateFieldsMutation.mutate({ documentId, fields: updatedFields });
            setIsAddFieldOpen(false);
          }}
        />
      )}

      {showExtractModal && selectedExtractDocument && selectedExtractUpload && (
        <ExtractDetailsModal
          isOpen={showExtractModal}
          onClose={handleCancelExtraction}
          document={selectedExtractDocument}
          upload={selectedExtractUpload}
          onSubmit={handleExtractComplete}
        />
      )}
    </div>
  );
}