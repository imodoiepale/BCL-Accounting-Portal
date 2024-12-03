// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/lib/supabaseClient';
import { Input } from "@/components/ui/input";
import {
  Eye,
  DownloadIcon,
  UploadIcon,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  Search
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import toast, { Toaster } from 'react-hot-toast';
import { DocumentActions } from './DocumentComponents';
import { UploadModal, ViewModal, AddFieldsDialog, ExtractDetailsModal } from './DocumentModals';
import {
  performExtraction,
  saveExtractedData,
  validateExtractedData
} from '@/lib/extractionUtils';

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
  category: string;
  fields?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  last_extracted_details?: Record<string, any>;
}

export default function CompanyKycDocumentDetails() {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [companySearch, setCompanySearch] = useState('');
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
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedCategories, setExpandedCategories] = useState({
    'general': false,
    'sheria-docs': false,
    'kra-docs': false,
  });

  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement>(null);

  // Debounced Search Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Data Fetching with React Query
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

  const { data: documents = {}, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acc_portal_kyc')
        .select('*')
        .eq('category', 'company-docs');

      if (error) throw error;

      // Group documents by subcategory
      const groupedDocs = data.reduce((acc, doc) => {
        const category = doc.subcategory === 'EMPTY' ? 'general' : doc.subcategory;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(doc);
        return acc;
      }, {});

      return groupedDocs;
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

  // Mutations
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
    mutationFn: async ({ companyId, documentId, file, extractOnUpload, onProgress }) => {
      try {
        onProgress?.('Uploading file...');
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

        const { data: uploadResult, error } = await supabase
          .from('acc_portal_kyc_uploads')
          .insert(uploadData)
          .select()
          .single();

        if (error) throw error;

        if (extractOnUpload) {
          setSelectedExtractDocument(Object.values(documents)
            .flat()
            .find(d => d.id === documentId));
          setSelectedExtractUpload(uploadResult);
          setShowExtractModal(true);
          return uploadResult;
        }

        return uploadResult;
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
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

  const extractionMutation = useMutation({
    mutationFn: async ({ uploadId, extractedData, documentId }) => {
      if (!uploadId || !documentId) {
        throw new Error('Upload ID or Document ID is undefined');
      }
  
      const sanitizedData = Object.entries(extractedData).reduce((acc, [key, value]) => {
        acc[key] = value === '' ? null : value;
        return acc;
      }, {});
  
      // Find date fields in extracted data
      let issueDate = null;
      let expiryDate = null;
  
      // Function to parse and validate date
      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        
        try {
          // First, try to parse as ISO date
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          }
          
          // If that fails, try different date formats
          const formats = [
            /(\d{2})[-/](\d{2})[-/](\d{4})/, // DD-MM-YYYY or DD/MM/YYYY
            /(\d{4})[-/](\d{2})[-/](\d{2})/, // YYYY-MM-DD or YYYY/MM/DD
            /(\d{2})[-/](\d{2})[-/](\d{2})/, // DD-MM-YY or DD/MM/YY
          ];
  
          for (const format of formats) {
            const match = dateStr.match(format);
            if (match) {
              const [_, first, second, third] = match;
              if (first.length === 4) { // YYYY-MM-DD
                const date = new Date(parseInt(first), parseInt(second) - 1, parseInt(third));
                return date.toISOString().split('T')[0];
              } else { // DD-MM-YYYY
                const date = new Date(parseInt(third), parseInt(second) - 1, parseInt(first));
                return date.toISOString().split('T')[0];
              }
            }
          }
        } catch (error) {
          console.error('Date parsing error:', error);
        }
        return null;
      };
  
      // Check for common date field names
      for (const [key, value] of Object.entries(sanitizedData)) {
        const lowerKey = key.toLowerCase();
        
        // Check for issue date variants
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
            issueDate = parsedDate;
          }
        }
        
        // Check for expiry date variants
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
          }
        }
      }
  
      const document = Object.values(documents)
        .flat()
        .find(d => d.id === documentId);
  
      if (document && !validateExtractedData(sanitizedData, document.fields || [])) {
        throw new Error('Invalid extracted data format');
      }
  
      // Log the dates being saved
      console.log('Saving dates:', { issueDate, expiryDate });
  
      // Update the upload with both extracted details and dates
      const [uploadUpdate, documentUpdate] = await Promise.all([
        supabase
          .from('acc_portal_kyc_uploads')
          .update({
            extracted_details: sanitizedData,
            issue_date: issueDate,
            expiry_date: expiryDate,
          })
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
  
      if (uploadUpdate.error) {
        console.error('Upload update error:', uploadUpdate.error);
        throw uploadUpdate.error;
      }
      if (documentUpdate.error) {
        console.error('Document update error:', documentUpdate.error);
        throw documentUpdate.error;
      }
  
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

  // Utility Functions
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const exportToExcel = () => {
    if (!selectedDocument || !companies.length) return;

    const headers = ['#', 'Company', ...selectedDocument.fields?.map(f => f.name) || []];
    const rows = getFilteredAndSortedCompanies().map((company, index) => {
      const upload = uploads.find(u =>
        u.kyc_document_id === selectedDocument?.id &&
        u.userid === company.id.toString()
      );

      return [
        index + 1,
        company.company_name,
        ...(selectedDocument.fields?.map(field =>
          upload?.extracted_details?.[field.name] || '-'
        ) || [])
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedDocument.name}_export.csv`;
    link.click();
  };

  const getFilteredAndSortedCompanies = () => {
    let filtered = companies.filter(company =>
      company.company_name.toLowerCase().includes(companySearch.toLowerCase())
    );

    if (sortColumn === '#') {
      filtered = [...filtered].sort((a, b) => {
        const aIndex = companies.indexOf(a);
        const bIndex = companies.indexOf(b);
        return sortDirection === 'asc' ? aIndex - bIndex : bIndex - aIndex;
      });
    } else if (sortColumn === 'Company') {
      filtered = [...filtered].sort((a, b) => {
        const comparison = a.company_name.localeCompare(b.company_name);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  };

  // Event Handlers
  const handleExtractComplete = async (extractedData: any) => {
    try {
      if (!selectedExtractDocument || !selectedExtractUpload) return;

      await extractionMutation.mutateAsync({
        uploadId: selectedExtractUpload.id,
        documentId: selectedExtractDocument.id,
        extractedData
      });

      setShowUploadModal(false);
      setShowExtractModal(false);

    } catch (error) {
      console.error('Error saving extracted data:', error);
      toast.error('Failed to save extracted data');
    }
  };

  const handleCancelExtraction = () => {
    setShowExtractModal(false);
    if (uploadMutation.isSuccess && selectedExtractUpload) {
      supabase.storage
        .from('kyc-documents')
        .remove([selectedExtractUpload.filepath])
        .then(() => {
          supabase
            .from('acc_portal_kyc_uploads')
            .delete()
            .eq('id', selectedExtractUpload.id)
            .then(() => {
              queryClient.invalidateQueries(['uploads']);
              toast.success('Upload cancelled');
            });
        });
    }
  };

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

  // Sidebar Component
  const DocumentItem = ({ document, isSelected, onSelect, onAddField, onUpdateFields }) => (
    <li
      className={`px-2 py-1 rounded flex items-center justify-between text-xs ${isSelected
        ? 'bg-primary text-primary-foreground'
        : 'hover:bg-gray-100'
        }`}
    >
      <span
        className="cursor-pointer flex-1"
        onClick={onSelect}
      >
        {document.name}
      </span>
      <DocumentActions
        document={document}
        onAddField={onAddField}
        onUpdateFields={(documentId, fields) => {
          onUpdateFields({ documentId, fields });
        }}
      />
    </li>
  );

  const renderSidebar = () => (
    <div className="w-1/5 min-w-[200px] border-r overflow-hidden flex flex-col">
      <div className="p-2">
        <h2 className="text-sm font-bold mb-2">Documents </h2>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2 h-8 text-xs pl-8"
          />
          <Search className="h-4 w-4 absolute left-2 top-2 text-gray-400" />
        </div>
      </div>

      <div ref={parentRef} className="overflow-y-auto flex-1">
        {isLoadingDocuments ? (
          <div className="p-2 text-xs">Loading documents...</div>
        ) : (
          <div className="space-y-2">
            {/* General Documents */}
            {documents['general'] && documents['general'].length > 0 && (
              <div className="border-b last:border-b-0">
                <div
                  className="flex items-center px-2 py-1 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleCategory('general')}
                >
                  {expandedCategories['general'] ? (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-xs font-semibold">General Documents</span>
                </div>
                {expandedCategories['general'] && (
                  <ul className="pl-6">
                    {documents['general'].map((doc) => (
                      <DocumentItem
                        key={doc.id}
                        document={doc}
                        isSelected={selectedDocument?.id === doc.id}
                        onSelect={() => setSelectedDocument(doc)}
                        onAddField={() => {
                          setSelectedDocument(doc);
                          setIsAddFieldOpen(true);
                        }}
                        onUpdateFields={updateFieldsMutation.mutate}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Sheria Documents */}
            {documents['sheria-docs'] && documents['sheria-docs'].length > 0 && (
              <div className="border-b last:border-b-0">
                <div
                  className="flex items-center px-2 py-1 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleCategory('sheria-docs')}
                >
                  {expandedCategories['sheria-docs'] ? (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-xm font-semibold text-blue-800">
                    Sheria Documents
                  </span>
                </div>
                {expandedCategories['sheria-docs'] && (
                  <ul className="pl-6">
                    {documents['sheria-docs'].map((doc) => (
                      <DocumentItem
                        key={doc.id}
                        document={doc}
                        isSelected={selectedDocument?.id === doc.id}
                        onSelect={() => setSelectedDocument(doc)}
                        onAddField={() => {
                          setSelectedDocument(doc);
                          setIsAddFieldOpen(true);
                        }}
                        onUpdateFields={updateFieldsMutation.mutate}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* KRA Documents */}
            {documents['kra-docs'] && documents['kra-docs'].length > 0 && (
              <div className="border-b last:border-b-0">
                <div
                  className="flex items-center px-2 py-1 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleCategory('kra-docs')}
                >
                  {expandedCategories['kra-docs'] ? (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-xm font-semibold text-blue-800">
                    KRA Documents
                  </span>
                </div>
                {expandedCategories['kra-docs'] && (
                  <ul className="pl-6">
                    {documents['kra-docs'].map((doc) => (
                      <DocumentItem
                        key={doc.id}
                        document={doc}
                        isSelected={selectedDocument?.id === doc.id}
                        onSelect={() => setSelectedDocument(doc)}
                        onAddField={() => {
                          setSelectedDocument(doc);
                          setIsAddFieldOpen(true);
                        }}
                        onUpdateFields={updateFieldsMutation.mutate}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Main Component Render
  return (
    <div className="flex overflow-hidden">
      <Toaster position="top-right" />

      {renderSidebar()}

      <div className="flex-1 flex flex-col h-[800px] overflow-hidden">
        {selectedDocument ? (
          <div className="flex flex-col h-full">
            <div className="p-2 border-b space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">
                  {selectedDocument.name} - Details
                  <span className="ml-2 text-xs font-normal text-gray-500 capitalize">
                    ({selectedDocument.category.replace('-docs', ' Documents')})
                  </span>
                </h2>

                {/* Compact Document Statistics */}
                <div className="flex gap-3">
                  <div className="flex items-center text-xs">
                    <div className="bg-blue-50 px-2 py-1 rounded">
                      <span className="text-blue-600 font-medium">Total Company Documents: </span>
                      <span className="text-blue-700 font-bold">{companies.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="bg-green-50 px-2 py-1 rounded">
                      <span className="text-green-600 font-medium">Total Uploaded Company Documents: </span>
                      <span className="text-green-700 font-bold">
                        {uploads.filter(u => u.kyc_document_id === selectedDocument.id).length}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="bg-orange-50 px-2 py-1 rounded">
                      <span className="text-orange-600 font-medium">Missing Company Documents: </span>
                      <span className="text-orange-700 font-bold">
                        {companies.length - uploads.filter(u => u.kyc_document_id === selectedDocument.id).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Export controls */}
              <div className="flex justify-between items-center gap-2">
                <div className="relative flex-1 max-w-xs">
                  <Input
                    type="text"
                    placeholder="Search companies..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="pl-8"
                  />
                  <Search className="h-4 w-4 absolute left-2 top-2 text-gray-400" />
                </div>
                <Button
                  variant="outline"
                  onClick={exportToExcel}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export to Excel
                </Button>
              </div>
            </div>

            <div className="overflow-auto flex-1">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow className="text-[11px] bg-blue-100">
                      <TableHead
                        className="sticky top-0 left-0 bg-blue-100 z-10 cursor-pointer"
                        onClick={() => handleSort('#')}
                      >
                        <div className="flex items-center">
                        ⇅#
                          {sortColumn === '#' && (
                            sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="sticky top-0 left-0 bg-blue-100 z-10 cursor-pointer"
                        onClick={() => handleSort('Company')}
                      >
                        <div className="flex items-center">
                          ⇅ Company
                          {sortColumn === 'Company' && (
                            sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="sticky top-0 bg-blue-100 z-10">Actions</TableHead>
                      {selectedDocument.fields?.map((field) => (
                        <TableHead
                          key={field.id}
                          className="text-center sticky top-0 bg-blue-100 z-10"
                        >
                          {field.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-[11px]">
                    {getFilteredAndSortedCompanies().map((company, index) => (
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
                                onClick={() => handleUploadClick(company.id, selectedDocument.id)}
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
          onClose={handleCancelExtraction}
          document={selectedExtractDocument}
          upload={selectedExtractUpload}
          onSubmit={handleExtractComplete}
        />
      )}
    </div>
  );
}