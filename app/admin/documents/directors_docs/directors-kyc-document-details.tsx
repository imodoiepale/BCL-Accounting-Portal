// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/lib/supabaseClient';
import { Input } from "@/components/ui/input";
import { Eye, DownloadIcon, UploadIcon, Search, ArrowUpDown } from 'lucide-react';
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

interface AdvancedSearchFields {
  company_name?: string;
  director_name?: string;
  status?: 'missing' | 'completed' | '';
}

export default function DirectorsKycDocumentDetails() {
  // Basic state
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
  const [sortConfig, setSortConfig] = useState({ key: 'company_name', direction: 'asc' });
  const [isLoading, setIsLoading] = useState(false);

  // Advanced search state
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearchFields, setAdvancedSearchFields] = useState<AdvancedSearchFields>({
    company_name: '',
    director_name: '',
    status: ''
  });

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

  // Query for documents and uploads
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acc_portal_kyc')
        .select('*')
        .eq('category', 'directors-docs');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: uploads = [], isLoading: isLoadingUploads } = useQuery({
    queryKey: ['uploads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acc_portal_directors_documents')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  // Status counting function
  const getStatusCounts = () => {
    let missing = 0;
    let completed = 0;

    Object.values(directorsByCompany).flat().forEach(director => {
      const hasUpload = uploads.some(u =>
        u.kyc_document_id === selectedDocument?.id &&
        u.userid === director.id.toString()
      );
      
      if (hasUpload) {
        completed++;
      } else {
        missing++;
      }
    });

    return { missing, completed };
  };

  // Enhanced filter function
  const filterCompanies = (companies: any[]) => {
    return companies.filter(company => {
      const companyDirectors = directorsByCompany[company.id] || [];
      const hasMatchingDirector = companyDirectors.some(director => {
        const directorName = `${director.first_name || ''} ${director.last_name || ''}`.toLowerCase();
        return directorName.includes((advancedSearchFields.director_name || '').toLowerCase());
      });

      // Status filtering
      let matchesStatus = true;
      if (advancedSearchFields.status) {
        const directorStatuses = companyDirectors.map(director => {
          const hasUpload = uploads.some(u =>
            u.kyc_document_id === selectedDocument?.id &&
            u.userid === director.id.toString()
          );
          return hasUpload ? 'completed' : 'missing';
        });

        matchesStatus = directorStatuses.includes(advancedSearchFields.status);
      }

      return (
        company.company_name.toLowerCase().includes((advancedSearchFields.company_name || '').toLowerCase()) &&
        hasMatchingDirector &&
        matchesStatus
      );
    });
  };

  // Sort function
  const sortCompanies = (companies: any[]) => {
    return [...companies].sort((a, b) => {
      const aValue = a[sortConfig.key]?.toString().toLowerCase() || '';
      const bValue = b[sortConfig.key]?.toString().toLowerCase() || '';
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Mutations
  const updateFieldsMutation = useMutation({
    mutationFn: async ({ documentId, fields }) => {
      const { error } = await supabase
        .from('acc_portal_kyc')
        .update({ fields })
        .eq('id', documentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      toast.success('Fields updated successfully');
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ directorId, documentId, file, extractOnUpload, onProgress }) => {
      setIsLoading(true);
      try {
        const timestamp = new Date().getTime();
        const fileName = `directors/${directorId}/${documentId}/${timestamp}_${file.name}`;
        
        onProgress?.('Uploading file...');
        
        const { data: fileData, error: uploadError } = await supabase.storage
          .from('kyc-documents')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;

        const uploadData = {
          userid: directorId.toString(),
          kyc_document_id: documentId,
          filepath: fileData.path,
          issue_date: new Date().toISOString()
        };

        const { data: uploadResult, error: insertError } = await supabase
          .from('acc_portal_directors_documents')
          .insert(uploadData)
          .select()
          .single();

        if (insertError) throw insertError;

        if (extractOnUpload) {
          setSelectedExtractDocument(documents.find(d => d.id === documentId) || null);
          setSelectedExtractUpload(uploadResult);
          setShowExtractModal(true);
        }

        return uploadResult;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['uploads']);
      setShowUploadModal(false);
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      toast.error('Upload failed');
      console.error('Upload error:', error);
    }
  });

  // Loading state
  if (isLoadingDirectors || isLoadingCompanies || isLoadingDocuments || isLoadingUploads) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  const filteredAndSortedCompanies = sortCompanies(filterCompanies(companies));
  const statusCounts = getStatusCounts();



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
  
  // Handle upload button click
  const handleUploadClick = (director: Director, documentId: string) => {
    if (!director || !documentId) {
      toast.error('Invalid upload parameters');
      return;
    }
    setSelectedDirectorUpload(director);
    setSelectedDocument(documents.find(d => d.id === documentId) || null);
    setShowUploadModal(true);
  };
  
  // Handle extraction button click
  const handleExtractClick = (document: Document, upload: Upload) => {
    if (!document || !upload) {
      toast.error('Invalid extraction parameters');
      return;
    }
    setSelectedExtractDocument(document);
    setSelectedExtractUpload(upload);
    setShowExtractModal(true);
  };
  
  // Handle extraction completion
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
      setSelectedExtractDocument(null);
      setSelectedExtractUpload(null);
      toast.success('Details extracted successfully');
    } catch (error) {
      console.error('Extraction error:', error);
      toast.error('Failed to save extracted details');
    }
  };
  
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
        </div>
      </div>

      {/* Right side - Table */}
      <div className="flex-1 flex flex-col h-[800px] overflow-hidden">
        {selectedDocument ? (
          <div className="flex flex-col h-full">
            <div className="p-2 border-b space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">
                  {selectedDocument.name} - Details
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  className="text-xs"
                >
                  <Search className="h-3 w-3 mr-1" />
                  {showAdvancedSearch ? 'Hide Search' : 'Advanced Search'}
                </Button>
              </div>

              {showAdvancedSearch && (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Company Name..."
                    className="text-xs"
                    value={advancedSearchFields.company_name}
                    onChange={(e) => setAdvancedSearchFields(prev => ({
                      ...prev,
                      company_name: e.target.value
                    }))}
                  />
                  <Input
                    type="text"
                    placeholder="Director Name..."
                    className="text-xs"
                    value={advancedSearchFields.director_name}
                    onChange={(e) => setAdvancedSearchFields(prev => ({
                      ...prev,
                      director_name: e.target.value
                    }))}
                  />
                  <select
                    className="text-xs border rounded px-2"
                    value={advancedSearchFields.status}
                    onChange={(e) => setAdvancedSearchFields(prev => ({
                      ...prev,
                      status: e.target.value as 'missing' | 'completed' | ''
                    }))}
                  >
                    <option value="">All Status</option>
                    <option value="missing">Missing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}

              {/* Status Count Row - continued */}
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded">
                  <span className="font-medium">Missing Directors Documents:</span>
                  <span className="text-red-500 font-bold">{statusCounts.missing}</span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded">
                  <span className="font-medium">Uploaded Directors Documents:</span>
                  <span className="text-green-500 font-bold">{statusCounts.completed}</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded">
                  <span className="font-medium">Total Directors Documents:</span>
                  <span className="text-blue-500 font-bold">{statusCounts.missing + statusCounts.completed}</span>
                </div>
              </div>
            </div>

            <div className="overflow-auto flex-1">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow className="text-[11px] bg-blue-50 border-b border-gray-300">
                      <TableHead className="sticky top-0 left-0 bg-blue-50 z-10 border-r border-gray-300 w-[50px]">#</TableHead>
                      <TableHead
                        className="sticky top-0 left-0 bg-blue-50 z-10 cursor-pointer border-r border-gray-300"
                        onClick={() => setSortConfig({
                          key: 'company_name',
                          direction: sortConfig.key === 'company_name' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                        })}
                      >
                        <div className="flex items-center">
                          Company
                          <ArrowUpDown className={`ml-1 h-3 w-3 transition-transform ${
                            sortConfig.key === 'company_name' && sortConfig.direction === 'desc' ? 'rotate-180' : ''
                          }`} />
                        </div>
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
                    {filteredAndSortedCompanies.map((company, index) => {
                      const companyDirectors = directorsByCompany[company.id] || [];
                      return companyDirectors.map((director, directorIndex) => {
                        const hasUpload = uploads.some(u =>
                          u.kyc_document_id === selectedDocument?.id &&
                          u.userid === director.id.toString()
                        );

                        return (
                          <TableRow
                            key={`${company.id}-${director.id}`}
                            className={`${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            } border-b border-gray-300 ${
                              hasUpload ? 'bg-green-50/30' : 'bg-red-50/20'
                            }`}
                          >
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
                            
                            <TableCell className="border-r border-gray-300">
                              {director.full_name || `${director.first_name || ''} ${director.last_name || ''}`}
                            </TableCell>

                            <TableCell className="border-r border-gray-300 text-center">
                              <div className="flex justify-center space-x-1">
                                {hasUpload ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleViewDocument(selectedDocument, director)}
                                      disabled={isLoading}
                                    >
                                      <Eye className="h-3 w-3 text-blue-500" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => {
                                        const upload = uploads.find(u =>
                                          u.kyc_document_id === selectedDocument.id &&
                                          u.userid === director.id.toString()
                                        );
                                        if (upload) {
                                          handleExtractClick(selectedDocument, upload);
                                        }
                                      }}
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
                                    disabled={isLoading}
                                  >
                                    <UploadIcon className="h-3 w-3 text-orange-500" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>

                            {selectedDocument.fields?.map((field) => {
                              const upload = uploads.find(u =>
                                u.kyc_document_id === selectedDocument.id &&
                                u.userid === director.id.toString()
                              );
                              return (
                                <TableCell
                                  key={field.id}
                                  className="text-center border-l border-gray-300"
                                >
                                  <span className="truncate">
                                    {upload?.extracted_details?.[field.name] || '-'}
                                  </span>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      });
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
          onClose={() => {
            setShowExtractModal(false);
            setSelectedExtractDocument(null);
            setSelectedExtractUpload(null);
          }}
          document={selectedExtractDocument}
          upload={selectedExtractUpload}
          onSubmit={handleExtractComplete}
        />
      )}
    </div>
  );
}