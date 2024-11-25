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

interface Company {
  id: number;
  company_name: string;
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

export default function CompanyKycDocumentDetails() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [selectedUploadCompany, setSelectedUploadCompany] = useState<Company | null>(null);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [selectedExtractDocument, setSelectedExtractDocument] = useState<Document | null>(null);
  const [selectedExtractUpload, setSelectedExtractUpload] = useState<Upload | null>(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies', debouncedSearch],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acc_portal_company_duplicate')
        .select('id, company_name')
        .ilike('company_name', `%${debouncedSearch}%`)
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acc_portal_kyc')
        .select('*')
        .eq('category', 'company-docs');

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: uploads = [], isLoading: isLoadingUploads } = useQuery({
    queryKey: ['uploads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acc_portal_kyc_uploads')
        .select('*');

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const updateFieldsMutation = useMutation({
    mutationFn: async ({ documentId, fields }) => {
      const { data, error } = await supabase
        .from('acc_portal_kyc')
        .update({ fields })
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      toast.success('Fields updated successfully');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ companyId, documentId, file }) => {
      try {
        const timestamp = new Date().getTime();
        const fileName = `${companyId}/${documentId}/${timestamp}_${file.name}`;
        
        const { data: fileData, error: fileError } = await supabase
          .storage
          .from('kyc-documents')
          .upload(fileName, file);

        if (fileError) throw fileError;

        const uploadData = {
          userid: companyId.toString(),
          kyc_document_id: documentId,
          filepath: fileData.path,
        };

        const { data, error } = await supabase
          .from('acc_portal_kyc_uploads')
          .insert(uploadData)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['uploads']);
      setShowUploadModal(false);
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      toast.error('Failed to upload document');
      console.error('Upload error:', error);
    }
  });

  const extractionMutation = useMutation({
    mutationFn: async ({ uploadId, extractedData, documentId }) => {
      if (!uploadId || !documentId) {
        throw new Error('Upload ID or Document ID is undefined');
      }

      const sanitizedData = Object.entries(extractedData).reduce((acc, [key, value]) => {
        acc[key] = value === '' ? null : value;
        return acc;
      }, {});

      const [uploadUpdate, documentUpdate] = await Promise.all([
        supabase
          .from('acc_portal_kyc_uploads')
          .update({ extracted_details: sanitizedData })
          .eq('id', uploadId)
          .select()
          .single(),

        supabase
          .from('acc_portal_kyc')
          .update({ last_extracted_details: sanitizedData })
          .eq('id', documentId)
          .select()
          .single()
      ]);

      if (uploadUpdate.error) throw uploadUpdate.error;
      if (documentUpdate.error) throw documentUpdate.error;

      return {
        upload: uploadUpdate.data,
        document: documentUpdate.data
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['uploads']);
      queryClient.invalidateQueries(['documents']);
      setShowExtractModal(false);
      toast.success('Details extracted and saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save extracted details');
      console.error('Extraction save error:', error);
    }
  });

  const handleViewDocument = async (document: Document, company: Company) => {
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
        .createSignedUrl(upload.filepath, 60);

      if (error) throw error;

      setViewUrl(data.signedUrl);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to view document');
    }
  };

  const handleUploadClick = (companyId: number, documentId: string) => {
    setSelectedUploadCompany(companies.find(c => c.id === companyId) || null);
    setShowUploadModal(true);
  };

  const handleExtractClick = (document: Document, upload: Upload) => {
    setSelectedExtractDocument(document);
    setSelectedExtractUpload(upload);
    setShowExtractModal(true);
  };

  const handleSort = (key: string) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

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
          {isLoadingDocuments ? (
            <div className="p-2 text-xs">Loading documents...</div>
          ) : (
            <ul>
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className={`px-2 py-1 rounded flex items-center justify-between text-xs ${
                    selectedDocument?.id === doc.id
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
          )}
        </div>
      </div>

      {/* Right side - Company Fields Table */}
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
                    <TableRow className="text-[11px] bg-blue-100">
                      <TableHead className="sticky top-0 left-0 bg-blue-100 z-10">#</TableHead>
                      <TableHead className="sticky top-0 left-0 bg-blue-100 z-10">Company</TableHead>
                      <TableHead className="sticky top-0 bg-blue-100 z-10">Actions</TableHead>
                      {selectedDocument.fields?.map((field) => (
                        <TableHead
                          key={field.id}
                          className="text-center sticky top-0 bg-blue-100 z-10 cursor-pointer"
                          onClick={() => handleSort(field.name)}
                        >
                          {field.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-[11px]">
                    {sortedCompanies.map((company, index) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium sticky left-0 bg-white">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium sticky left-0 bg-white">
                          {company.company_name}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-2">
                            {uploads.some(u =>
                              u.kyc_document_id === selectedDocument.id &&
                              u.userid === company.id.toString()
                            ) ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewDocument(selectedDocument, company)}
                                  title="View Document"
                                >
                                  <Eye className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleExtractClick(
                                      selectedDocument,
                                      uploads.find(
                                        u =>
                                          u.kyc_document_id === selectedDocument.id &&
                                          u.userid === company.id.toString()
                                      )
                                    )
                                  }
                                  title="Extract Details"
                                >
                                  <DownloadIcon className="h-4 w-4 text-green-500" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleUploadClick(company.id, selectedDocument.id)
                                }
                                title="Upload Document"
                              >
                                <UploadIcon className="h-4 w-4 text-orange-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        {selectedDocument.fields?.map((field) => {
                          const upload = uploads.find(
                            u =>
                              u.kyc_document_id === selectedDocument.id &&
                              u.userid === company.id.toString()
                          );
                          return (
                            <TableCell key={field.id} className="text-center">
                              <span>{upload?.extracted_details?.[field.name] || '-'}</span>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
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
      {showUploadModal && selectedUploadCompany && (
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={uploadMutation.mutate}
          company={selectedUploadCompany}
          document={selectedDocument}
        />
      )}

      {showViewModal && (
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
          onClose={() => setShowExtractModal(false)}
          document={selectedExtractDocument}
          upload={selectedExtractUpload}
          onSubmit={(extractedData) => {
            extractionMutation.mutate({
              uploadId: selectedExtractUpload.id,
              documentId: selectedExtractDocument.id,
              extractedData
            });
          }}
        />
      )}
    </div>
  );
}