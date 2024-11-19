// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { FileDown, Upload, X, ChevronUp, ChevronDown, Eye, Download, MoreVertical } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast, Toaster } from 'react-hot-toast';
import { UploadModal } from './UploadModal';
import { SettingsModal } from './SettingsModal';

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
}

type SortField = 'company' | 'issueDate' | 'expiryDate' | 'daysLeft' | 'status';
type SortDirection = 'asc' | 'desc';

interface ViewModalProps {
  url: string | null;
  setShowViewModal: (show: boolean) => void;
}

const ViewModal: React.FC<ViewModalProps> = ({ url, setShowViewModal }) => {
  if (!url) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-11/12 h-5/6 relative">
        <button
          onClick={() => setShowViewModal(false)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-full h-full">
          <iframe src={url} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};

const DocumentActions = ({ onView, onUpdate, onDownload }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  return (
    <div className="relative">
      <button onClick={() => onView()} className="text-blue-600 hover:text-blue-800 mr-2">
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="text-gray-600 hover:text-gray-800"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => {
                onUpdate();
                setShowDropdown(false);
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Update
            </button>
            <button
              onClick={() => {
                onDownload();
                setShowDropdown(false);
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DocumentManagement = () => {
  const queryClient = useQueryClient();
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
  // Fetch Companies
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

  // Fetch Documents
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
          .eq('department', 'Sheria')
          .eq('subcategory', 'sheria-docs');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch Uploads
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
      file,
      issueDate,
      expiryDate
    }: {
      companyId: number;
      documentId: string;
      file: File;
      issueDate: string;
      expiryDate?: string;
    }) => {
      try {
        // Upload file with timestamp to ensure uniqueness
        const timestamp = new Date().getTime();
        const fileName = `${companyId}/${documentId}/${timestamp}_${file.name}`;
        const { data: fileData, error: fileError } = await supabase
          .storage
          .from('kyc-documents')
          .upload(fileName, file);

        if (fileError) throw fileError;

        // Create upload record
        const uploadData = {
          userid: companyId.toString(),
          kyc_document_id: documentId,
          filepath: fileData.path,
          issue_date: issueDate,
          expiry_date: expiryDate || null
        };

        // Insert new record
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
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
      setShowUploadModal(false);
      toast.success('Document uploaded successfully');
      setUploadData({
        issueDate: '',
        expiryDate: '',
        file: null,
      });
    },
    onError: (error) => {
      toast.error('Failed to upload document');
      console.error('Upload error:', error);
    }
  });

  // Document Actions Handlers
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
  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !selectedDocument || !uploadData.file) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!uploadData.issueDate) {
      toast.error('Issue Date is required');
      return;
    }

    const expiryDate = selectedDocument.document_type === 'renewal' ? uploadData.expiryDate : null;

    if (selectedDocument.document_type === 'renewal' && !expiryDate) {
      toast.error('Expiry Date is required for renewal documents');
      return;
    }

    await uploadMutation.mutateAsync({
      companyId: selectedCompany.id,
      documentId: selectedDocument.id,
      file: uploadData.file,
      issueDate: uploadData.issueDate,
      expiryDate
    });
  };

  const getSortedCompanies = () => {
    return [...companies].sort((a, b) => {
      const modifier = sortDirection === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'company':
          return modifier * a.company_name.localeCompare(b.company_name);
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

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-sm">
      <Toaster />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Company KYC Documents</h1>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <button
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50 transition-colors duration-200 text-gray-700"
          >
            <FileDown className="w-5 h-5" />
            Export
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50 transition-colors duration-200 text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex space-x-4">
          {['All', 'KRA', 'Sheria'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      {(isLoadingCompanies || isLoadingDocuments) ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-auto max-h-[70vh] max-w-full">
            <table className="w-full text-sm border-collapse min-w-[1500px]">
              <thead className="sticky top-0 bg-white">
                <tr className="bg-gray-100">
                  <th className="p-3 border border-gray-300 font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10" rowSpan={2}>#</th>
                  <th
                    className="p-3 border border-gray-300 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 sticky left-[50px] bg-gray-100 z-10"
                    rowSpan={2}
                    onClick={() => handleSort('company')}
                  >
                    <div className="flex items-center justify-between">
                      Company
                      <SortIcon field="company" />
                    </div>
                  </th>
                  <th className="p-3 border border-gray-300 font-semibold text-gray-700" rowSpan={2}>Summary</th>
                  {documents.map(doc => (
                    visibleColumns[doc.id]?.visible && (
                      <th
                        key={`doc-${doc.id}`}
                        className="p-3 border border-gray-300 font-semibold text-gray-700 text-center bg-blue-50"
                        colSpan={Object.values(visibleColumns[doc.id]?.subColumns || {}).filter(Boolean).length}
                      >
                        {doc.name}
                      </th>
                    )
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  {documents.map(doc => (
                    visibleColumns[doc.id]?.visible && (
                      <React.Fragment key={`cols-${doc.id}`}>
                        {visibleColumns[doc.id]?.subColumns.upload && (
                          <th className="p-3 border border-gray-300 font-medium text-gray-600">
                            Documents
                          </th>
                        )}
                        {visibleColumns[doc.id]?.subColumns.issueDate && (
                          <th
                            className="p-3 border border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
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
                            className="p-3 border border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
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
                            className="p-3 border border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
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
                            className="p-3 border border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
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

              <tbody className="divide-y divide-gray-300">
                {/* Stats rows */}
                <tr className="bg-gray-50">
                  <td className="p-3 border border-gray-300 font-medium sticky left-0 bg-gray-50 z-10" rowSpan={3}>Stats</td>
                  <td className="p-3 border border-gray-300 sticky left-[50px] bg-gray-50 z-10" rowSpan={3}></td>
                  <td className="p-3 border border-gray-300 font-semibold text-blue-600">Total</td>
                  {documentStats.map((stat, index) => (
                    <React.Fragment key={`stats-${index}`}>
                      {visibleColumns[documents[index].id]?.visible && (
                        <>
                          {visibleColumns[documents[index].id]?.subColumns.upload && (
                            <td className="p-3 border border-gray-300 text-center font-medium">
                              {stat.total}
                            </td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.issueDate && (
                            <td className="p-3 border border-gray-300 text-center text-gray-400">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.expiryDate && (
                            <td className="p-3 border border-gray-300 text-center text-gray-400">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.daysLeft && (
                            <td className="p-3 border border-gray-300 text-center text-gray-400">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.status && (
                            <td className="p-3 border border-gray-300 text-center font-medium">
                              {stat.total}
                            </td>
                          )}
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </tr>
                
{/* Pending Stats Row */}
<tr className="bg-gray-50">
                  <td className="p-3 border border-gray-300 font-semibold text-orange-600">Missing</td>
                  {documentStats.map((stat, index) => (
                    <React.Fragment key={`pending-${index}`}>
                      {visibleColumns[documents[index].id]?.visible && (
                        <>
                          {visibleColumns[documents[index].id]?.subColumns.upload && (
                            <td className="p-3 border border-gray-300 text-center font-medium">
                              {stat.pending}
                            </td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.issueDate && (
                            <td className="p-3 border border-gray-300 text-center text-gray-400">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.expiryDate && (
                            <td className="p-3 border border-gray-300 text-center text-gray-400">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.daysLeft && (
                            <td className="p-3 border border-gray-300 text-center text-gray-400">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.status && (
                            <td className="p-3 border border-gray-300 text-center font-medium">
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
                  <td className="p-3 border border-gray-300 font-semibold text-green-600">Complete</td>
                  {documentStats.map((stat, index) => (
                    <React.Fragment key={`complete-${index}`}>
                      {visibleColumns[documents[index].id]?.visible && (
                        <>
                          {visibleColumns[documents[index].id]?.subColumns.upload && (
                            <td className="p-3 border border-gray-300 text-center font-medium">
                              {stat.complete}
                            </td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.issueDate && (
                            <td className="p-3 border border-gray-300 text-center text-gray-400">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.expiryDate && (
                            <td className="p-3 border border-gray-300 text-center text-gray-400">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.daysLeft && (
                            <td className="p-3 border border-gray-300 text-center text-gray-400">-</td>
                          )}
                          {visibleColumns[documents[index].id]?.subColumns.status && (
                            <td className="p-3 border border-gray-300 text-center font-medium">
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
                    <td className="p-3 border border-gray-300 font-medium sticky left-0 bg-inherit z-10">
                      {company.id}
                    </td>
                    <td className="p-3 border border-gray-300 font-medium sticky left-[50px] bg-inherit z-10">
                      <div className="relative group">
                        <span>{company.company_name}</span>
                        <span className="absolute left-0 w-auto p-2 m-2 min-w-max rounded-md shadow-md text-white bg-gray-800 text-xs font-bold transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                          {company.company_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 border border-gray-300"></td>
                    
                    {documents.map((doc) => (
                      visibleColumns[doc.id]?.visible && (
                        <React.Fragment key={`${company.id}-${doc.id}`}>
                          {visibleColumns[doc.id]?.subColumns.upload && (
                            <td className="p-3 border border-gray-300 text-center">
                              {uploads.find(u => 
                                u.kyc_document_id === doc.id && 
                                u.userid === company.id.toString()
                              ) ? (
                                <DocumentActions
                                  onView={() => handleViewDocument(doc, company)}
                                  onUpdate={() => {
                                    setSelectedCompany(company);
                                    setSelectedDocument(doc);
                                    setShowUploadModal(true);
                                  }}
                                  onDownload={() => handleDownloadDocument(doc, company)}
                                />
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedCompany(company);
                                    setSelectedDocument(doc);
                                    setShowUploadModal(true);
                                  }}
                                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                                >
                                  Upload
                                </button>
                              )}
                            </td>
                          )}

                          {visibleColumns[doc.id]?.subColumns.issueDate && (
                            <td className="p-3 border border-gray-300 text-center text-gray-600">
                              {(() => {
                                const upload = uploads.find(u => 
                                  u.kyc_document_id === doc.id && 
                                  u.userid === company.id.toString()
                                );
                                return upload?.issue_date ? 
                                  format(new Date(upload.issue_date), 'dd/MM/yyyy') : 
                                  '-';
                              })()}
                            </td>
                          )}

                          {visibleColumns[doc.id]?.subColumns.expiryDate && (
                            <td className="p-3 border border-gray-300 text-center text-gray-600">
                              {(() => {
                                if (doc.document_type === 'one-off') {
                                  return 'No Expiry';
                                }
                                const upload = uploads.find(u => 
                                  u.kyc_document_id === doc.id && 
                                  u.userid === company.id.toString()
                                );
                                return upload?.expiry_date ? 
                                  format(new Date(upload.expiry_date), 'dd/MM/yyyy') : 
                                  '-';
                              })()}
                            </td>
                          )}

                          {visibleColumns[doc.id]?.subColumns.daysLeft && (
                            <td className="p-3 border border-gray-300 text-center text-gray-600">
                              {(() => {
                                if (doc.document_type === 'one-off') {
                                  return 'N/A';
                                }
                                const upload = uploads.find(u => 
                                  u.kyc_document_id === doc.id && 
                                  u.userid === company.id.toString()
                                );
                                return upload?.expiry_date ? 
                                  differenceInDays(new Date(upload.expiry_date), new Date()) : 
                                  '-';
                              })()}
                            </td>
                          )}
                          {visibleColumns[doc.id]?.subColumns.status && (
                            <td className="p-3 border border-gray-300 text-center">
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

                                const daysLeft = upload.expiry_date ? 
                                  differenceInDays(new Date(upload.expiry_date), new Date()) : 
                                  null;

                                if (daysLeft === null) return '-';

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

      {/* View Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-11/12 h-5/6 relative">
            <button
              onClick={() => {
                setShowViewModal(false);
                setViewUrl(null);
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full h-full">
              {viewUrl && <iframe src={viewUrl} className="w-full h-full" />}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          selectedCompany={selectedCompany}
          selectedDocument={selectedDocument}
          uploadData={uploadData}
          setUploadData={setUploadData}
          handleUpload={handleUpload}
          setShowUploadModal={setShowUploadModal}
          uploadMutation={uploadMutation}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          documents={documents}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          setShowSettingsModal={setShowSettingsModal}
        />
      )}

      {/* Toast Container */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
};

export default DocumentManagement;