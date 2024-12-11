// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/lib/supabaseClient';
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

  // Render Field Value Helper
 
const renderFieldValue = (field: any, value: any) => {
  // If value is array
  if (field.type === 'array' && Array.isArray(value)) {
    return (
      <div className="min-w-[200px] max-w-[400px]">
        <div className="border rounded-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                {field.arrayConfig?.fields?.map((subField: any) => (
                  <th 
                    key={subField.id} 
                    className="text-[8px] font-medium text-gray-600 p-1 border-r last:border-r-0"
                  >
                    {subField.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.length === 0 ? (
                <tr>
                  <td 
                    colSpan={field.arrayConfig?.fields?.length || 1}
                    className="text-[9px] text-gray-500 text-center p-1"
                  >
                    No items
                  </td>
                </tr>
              ) : (
                value.map((item, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    {field.arrayConfig?.fields?.map((subField: any) => (
                      <td 
                        key={subField.id} 
                        className="text-[9px] p-1 border-r last:border-r-0 text-center"
                      >
                        <div className="truncate max-w-[100px]" title={item[subField.name] || '-'}>
                          {item[subField.name] || '-'}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // For simple values
  return (
    <div className="text-[9px] min-w-[150px] max-w-[200px] px-2">
      <div className="line-clamp-2 text-left break-words">
        {value ? String(value) : '-'}
      </div>
    </div>
  );
};

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
  // Add this with other mutations near the top of the component after the query hooks
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

  // Also add the uploadMutation if it's not already defined
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

  // Add the extraction mutation if not already defined
  const extractionMutation = useMutation({
    mutationFn: async ({ uploadId, documentId, extractedData }) => {
      const { data, error } = await supabase
        .from('acc_portal_kyc_uploads')
        .update({ extracted_details: extractedData })
        .eq('id', uploadId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['uploads']);
      setShowExtractModal(false);
      toast.success('Details extracted successfully');
    },
    onError: (error) => {
      toast.error('Failed to save extracted details');
      console.error('Extraction error:', error);
    }
  });


  const exportToExcel = () => {
    if (!selectedDocument || !companies.length) return;

    try {
      // Create headers for the CSV
      const headers = ['#', 'Company'];
      if (selectedDocument.fields) {
        headers.push(...selectedDocument.fields.map(f => f.name));
      }

      // Get filtered and sorted companies
      const filteredCompanies = getFilteredAndSortedCompanies();

      // Create rows for the CSV
      const rows = filteredCompanies.map((company, index) => {
        // Get all uploads for this company
        const companyUploads = uploads.filter(u =>
          u.kyc_document_id === selectedDocument?.id &&
          u.userid === company.id.toString()
        );

        // If company has no uploads, create a row with empty values
        if (companyUploads.length === 0) {
          return [
            index + 1,
            company.company_name,
            ...Array(selectedDocument.fields?.length || 0).fill('-')
          ];
        }

        // Create rows for each upload
        return companyUploads.map((upload, uploadIndex) => [
          index + 1,
          `${company.company_name}${companyUploads.length > 1 ? ` (v${uploadIndex + 1})` : ''}`,
          ...(selectedDocument.fields?.map(field => {
            const value = upload.extracted_details?.[field.name];
            if (Array.isArray(value)) {
              return JSON.stringify(value);
            }
            return value || '-';
          }) || [])
        ]);
      }).flat(); // Flatten the array to handle multiple uploads per company

      // Convert to CSV format
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
          // Handle cells that might contain commas or quotes
          const cellStr = String(cell).replace(/"/g, '""'); // Escape quotes
          return /[,"\n]/.test(cellStr) ? `"${cellStr}"` : cellStr;
        }).join(','))
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedDocument.name}_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  // Add this with other functions inside the CompanyKycDocumentDetails component
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
      // Filter to only include image files
      return (data || []).filter(upload => isImageFile(upload.filepath));
    },
    staleTime: 1000 * 60 * 5,
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


  const isImageFile = (filepath: string) => {
    const extension = filepath.split('.').pop()?.toLowerCase();
    return extension && ['jpg', 'jpeg', 'png'].includes(extension);
  };

  // Event Handlers
  const handleViewDocument = async (document: Document, company: Company) => {
    const upload = uploads.find(u =>
      u.kyc_document_id === document.id &&
      u.userid === company.id.toString() &&
      isImageFile(u.filepath)
    );
  
    if (!upload) {
      toast.error('Image not found');
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
      console.error('Error viewing image:', error);
      toast.error('Failed to view image');
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

                {/* Statistics */}
                <div className="flex gap-3">
                  <div className="flex items-center text-xs">
                    <div className="bg-blue-50 px-2 py-1 rounded">
                      <span className="text-blue-600 font-medium">Total Companies: </span>
                      <span className="text-blue-700 font-bold">{companies.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="bg-green-50 px-2 py-1 rounded">
                      <span className="text-green-600 font-medium">Total Documents: </span>
                      <span className="text-green-700 font-bold">
                        {uploads.filter(u => u.kyc_document_id === selectedDocument.id).length}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="bg-orange-50 px-2 py-1 rounded">
                      <span className="text-orange-600 font-medium">Companies Without Documents: </span>
                      <span className="text-orange-700 font-bold">
                        {companies.filter(company =>
                          !uploads.some(u =>
                            u.kyc_document_id === selectedDocument.id &&
                            u.userid === company.id.toString()
                          )
                        ).length}
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
                    className="pl-8 h-8 text-xs"
                  />
                  <Search className="h-4 w-4 absolute left-2 top-2 text-gray-400" />
                </div>
                <Button
                  variant="outline"
                  onClick={exportToExcel}
                  className="flex items-center gap-2 h-8 text-xs"
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
                    <TableRow className="text-[10px] bg-blue-100 border-b-2 border-blue-200">
                      <TableHead
                        className="sticky top-0 left-0 bg-blue-100 z-10 cursor-pointer border-r border-gray-200 w-12"
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
                        className="sticky top-0 left-0 bg-blue-100 z-10 cursor-pointer border-r border-gray-200 min-w-[200px]"
                        onClick={() => handleSort('Company')}
                      >
                        <div className="flex items-center">
                          ⇅ Company
                          {sortColumn === 'Company' && (
                            sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="sticky top-0 bg-blue-100 z-10 border-r border-gray-200 w-28">Actions</TableHead>
                      {selectedDocument.fields?.map((field) => (
                        <TableHead
                          key={field.id}
                          className="text-center sticky top-0 bg-blue-100 z-10 border-r border-gray-200 last:border-r-0 min-w-[150px] max-w-[200px] px-2"
                        >
                          <div className="truncate" title={field.name}>
                            {field.name}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody className="text-[11px]">
                    {getFilteredAndSortedCompanies().map((company, companyIndex) => {
                      const companyUploads = uploads.filter(u =>
                        u.kyc_document_id === selectedDocument?.id &&
                        u.userid === company.id.toString()
                      );

                      const rows = [];

                      // Main company row with first document or upload button
                      rows.push(
                        <TableRow
                          key={company.id}
                          className={`${companyUploads.length === 0 || companyUploads.length === 1 ? 'border-b-2 border-blue-200' : 'border-b border-gray-400'} hover:bg-gray-50`}
                        >
                          <TableCell
                            className="font-medium sticky left-0 bg-white border-r border-gray-100 w-12"
                            rowSpan={Math.max(1, companyUploads.length)}
                          >
                            {companyIndex + 1}
                          </TableCell>
                          <TableCell
                            className="font-medium sticky left-0 bg-white border-r border-gray-100 min-w-[200px]"
                            rowSpan={Math.max(1, companyUploads.length)}
                          >
                            <div className="text-[10px] line-clamp-2 break-words">
                              {company.company_name}
                            </div>
                          </TableCell>

                          {companyUploads.length === 0 ? (
                            <>
                              <TableCell className="text-center border-r border-gray-100 w-28">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleUploadClick(company.id, selectedDocument.id)}
                                  title="Upload Document"
                                >
                                  <UploadIcon className="h-4 w-4 text-orange-500" />
                                </Button>
                              </TableCell>
                              {selectedDocument.fields?.map((field) => (
                                <TableCell
                                  key={field.id}
                                  className="text-center border-r border-gray-100 min-w-[150px] max-w-[200px]"
                                >
                                  -
                                </TableCell>
                              ))}
                            </>
                          ) : (
                            <>
                              <TableCell className="text-center border-r border-gray-100 w-28">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-[9px] text-gray-500">v1</span>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleViewDocument(selectedDocument, company)}
                                      title="View Document"
                                      className="h-7 w-7"
                                    >
                                      <Eye className="h-3 w-3 text-blue-500" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleExtractClick(selectedDocument, companyUploads[0])}
                                      title="Extract Details"
                                      className="h-7 w-7"
                                    >
                                      <DownloadIcon className="h-3 w-3 text-green-500" />
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                              {selectedDocument.fields?.map((field) => (
                                <TableCell
                                  key={field.id}
                                  className="text-center border-r border-gray-100 min-w-[150px] max-w-[200px] px-2"
                                >
                                  {renderFieldValue(field, companyUploads[0]?.extracted_details?.[field.name])}
                                </TableCell>
                              ))}
                            </>
                          )}
                        </TableRow>
                      );

                      // Additional document rows
                      if (companyUploads.length > 1) {
                        companyUploads.slice(1).forEach((upload, index) => {
                          const isLastVersion = index === companyUploads.length - 2;
                          rows.push(
                            <TableRow
                              key={`${company.id}-${upload.id}`}
                              className={`${isLastVersion ? 'border-b-2 border-black' : 'border-b border-gray-100'} hover:bg-gray-50`}
                            >
                              <TableCell className="text-center border-r border-gray-100 w-28">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-[9px] text-gray-500">v{index + 2}</span>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleViewDocument(selectedDocument, company)}
                                      title="View Document"
                                      className="h-7 w-7"
                                    >
                                      <Eye className="h-3 w-3 text-blue-500" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleExtractClick(selectedDocument, upload)}
                                      title="Extract Details"
                                      className="h-7 w-7"
                                    >
                                      <DownloadIcon className="h-3 w-3 text-green-500" />
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                              {selectedDocument.fields?.map((field) => (
                                <TableCell
                                  key={field.id}
                                  className="text-center border-r border-gray-100 min-w-[150px] max-w-[200px] px-2"
                                >
                                  {renderFieldValue(field, upload?.extracted_details?.[field.name])}
                                </TableCell>
                              ))}
                            </TableRow>
                          );
                        });
                      }

                      return rows;
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

