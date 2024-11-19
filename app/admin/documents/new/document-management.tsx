// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { FileDown, Upload, X, ChevronUp, ChevronDown } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

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
  expiry_date: Date;
}

type SortField = 'company' | 'issueDate' | 'expiryDate' | 'daysLeft' | 'status';
type SortDirection = 'asc' | 'desc';

const DocumentManagement = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
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
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
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
      console.log('Fetched documents:', data); // Debug log
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
  // State for column visibility
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initialVisibility = {};
    documents.forEach(doc => {
      initialVisibility[doc.id] = {
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

  // Update visible columns when documents change
  useEffect(() => {
    if (documents.length > 0) {
      setVisibleColumns(prev => {
        const newVisibility = { ...prev };
        documents.forEach(doc => {
          if (!newVisibility[doc.id]) {
            newVisibility[doc.id] = {
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
      expiryDate: string;
    }) => {
      try {
        // Upload file to storage
        const fileName = `${companyId}/${documentId}/${file.name}`;
        const { data: fileData, error: fileError } = await supabase
          .storage
          .from('kyc-documents')
          .upload(fileName, file);

        if (fileError) throw fileError;

        // Create upload record
        const { data, error } = await supabase
          .from('acc_portal_kyc_uploads')
          .insert({
            userid: companyId.toString(),
            kyc_document_id: documentId,
            filepath: fileData.path,
            issue_date: issueDate,
            expiry_date: expiryDate
          })
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

    await uploadMutation.mutateAsync({
      companyId: selectedCompany.id,
      documentId: selectedDocument.id,
      file: uploadData.file,
      issueDate: uploadData.issueDate,
      expiryDate: uploadData.expiryDate
    });
  };

  const getSortedCompanies = () => {
    return [...companies].sort((a, b) => {
      const modifier = sortDirection === 'asc' ? 1 : -1;

      switch (sortField) {
        case 'company':
          return modifier * a.company_name.localeCompare(b.company_name);
        // Add other sort cases if needed
        default:
          return 0;
      }
    });
  };

  // Calculate stats
  const calculateStats = (documents) => {
    const stats = documents.map(doc => {
      const total = companies.length; // Assuming each company should have a document
      const pending = companies.filter(company => {
        // Logic to determine if a document is pending
        return !doc.expiry_date || isNaN(new Date(doc.expiry_date).getTime());
      }).length;
      const complete = total - pending;

      return { total, pending, complete };
    });

    return stats;
  };

  const documentStats = calculateStats(documents);

  // Helper Components
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-4 h-4 text-gray-300" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  // Modal Components
  const UploadModal = () => (
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
              onChange={(e) => setUploadData(prev => ({ ...prev, issueDate: e.target.value }))}
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
              onChange={(e) => setUploadData(prev => ({ ...prev, expiryDate: e.target.value }))}
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
              onChange={(e) => setUploadData(prev => ({
                ...prev,
                file: e.target.files ? e.target.files[0] : null
              }))}
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
  const SettingsModal = () => (
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
          {documents.map(doc => (
            <div key={doc.id} className="border p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={visibleColumns[doc.id]?.visible}
                  onChange={() => {
                    setVisibleColumns(prev => ({
                      ...prev,
                      [doc.id]: {
                        ...prev[doc.id],
                        visible: !prev[doc.id]?.visible,
                      },
                    }));
                  }}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">{doc.name}</label>
              </div>
              {visibleColumns[doc.id]?.visible && (
                <div className="space-y-2">
                  {Object.keys(visibleColumns[doc.id]?.subColumns || {}).map(subColumn => (
                    <div key={subColumn} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={visibleColumns[doc.id]?.subColumns[subColumn]}
                        onChange={() => {
                          setVisibleColumns(prev => ({
                            ...prev,
                            [doc.id]: {
                              ...prev[doc.id],
                              subColumns: {
                                ...prev[doc.id]?.subColumns,
                                [subColumn]: !prev[doc.id]?.subColumns[subColumn],
                              },
                            },
                          }));
                        }}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700 capitalize">{subColumn}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-sm">
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
        <div className="border-2 rounded-lg overflow-hidden">
          <div className="overflow-auto max-h-[70vh] max-w-full">
            <table className="w-full text-sm border-collapse min-w-[1500px]">
              <thead className="sticky top-0 bg-white">
                <tr className="bg-gray-100">
                  <th className="p-3 border-2 border-gray-300 font-semibold text-gray-700" rowSpan={2}>#</th>
                  <th
                    className="p-3 border-2 border-gray-300 font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                    rowSpan={2}
                    onClick={() => handleSort('company')}
                  >
                    <div className="flex items-center justify-between">
                      Company
                      <SortIcon field="company" />
                    </div>
                  </th>
                  <th className="p-3 border-2 border-gray-300 font-semibold text-gray-700" rowSpan={2}>Summary</th>
                  {documents.map(doc => (
                    visibleColumns[doc.id]?.visible && (
                      <th
                        key={`doc-${doc.id}`}
                        className="p-3 border-2 border-gray-300 font-semibold text-gray-700 text-center bg-blue-50"
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
                          <th className="p-3 border-2 border-gray-300 font-medium text-gray-600">Upload</th>
                        )}
                        {visibleColumns[doc.id]?.subColumns.issueDate && (
                          <th
                            className="p-3 border-2 border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
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
                            className="p-3 border-2 border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
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
                            className="p-3 border-2 border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
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
                            className="p-3 border-2 border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
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
              <tbody>
                {/* Stats rows */}
                <tr className="bg-gray-50">
                  <td className="p-3 border-2 border-gray-300 font-medium bg-gray-100" rowSpan={3}>Stats</td>
                  <td className="p-3 border-2 border-gray-300" rowSpan={3}></td>
                  <td className="p-3 border-2 border-gray-300 font-semibold text-blue-600">Total</td>
                  {documentStats.map((stat, index) => (
                    <React.Fragment key={`total-${index}`}>
                      {visibleColumns[documents[index].id]?.subColumns.upload && (
                        <td className="p-3 border-2 border-gray-300 text-center font-medium">
                          {stat.total}
                        </td>
                      )}
                      {visibleColumns[documents[index].id]?.subColumns.issueDate && (
                        <td className="p-3 border-2 border-gray-300 text-center text-gray-400">-</td>
                      )}
                      {visibleColumns[documents[index].id]?.subColumns.expiryDate && (
                        <td className="p-3 border-2 border-gray-300 text-center text-gray-400">-</td>
                      )}
                      {visibleColumns[documents[index].id]?.subColumns.daysLeft && (
                        <td className="p-3 border-2 border-gray-300 text-center text-gray-400">-</td>
                      )}
                      {visibleColumns[documents[index].id]?.subColumns.status && (
                        <td className="p-3 border-2 border-gray-300 text-center font-medium">
                          {stat.total}
                        </td>
                      )}
                    </React.Fragment>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-3 border-2 border-gray-300 font-semibold text-orange-600">Pending</td>
                  {documentStats.map((stat, index) => (
                    <React.Fragment key={`pending-${index}`}>
                      {visibleColumns[documents[index].id]?.subColumns.upload && (
                        <td className="p-3 border-2 border-gray-300 text-center font-medium">
                          {stat.pending}
                        </td>
                      )}
                      {visibleColumns[documents[index].id]?.subColumns.issueDate && (
                        <td className="p-3 border-2 border-gray-300 text-center text-gray-400">-</td>
                      )}
                      {visibleColumns[documents[index].id]?.subColumns.expiryDate && (
                        <td className="p-3 border-2 border-gray-300 text-center text-gray-400">-</td>
                      )}
                      {visibleColumns[documents[index].id]?.subColumns.daysLeft && (
                        <td className="p-3 border-2 border-gray-300 text-center text-gray-400">-</td>
                      )}
                      {visibleColumns[documents[index].id]?.subColumns.status && (
                        <td className="p-3 border-2 border-gray-300 text-center font-medium">
                          {stat.pending}
                        </td>
                      )}
                    </React.Fragment>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-3 border-2 border-gray-300 font-semibold text-green-600">Complete</td>
                  {documentStats.map((stat, index) => (
                    <React.Fragment key={`complete-${index}`}>
                      {visibleColumns[documents[index].id]?.subColumns.upload && (
                        <td className="p-3 border-2 border-gray-300 text-center font-medium">
                          {stat.complete}
                        </td>
                      )}
                      {visibleColumns[documents[index].id]?.subColumns.issueDate && (
                        <td className="p-3 border-2 border-gray-300 text-center text-gray-400">-</td>
                      )}
                      {visibleColumns[documents[index].id]?.subColumns.expiryDate && (
                        <td className="p-3 border-2 border-gray-300 text-center text-gray-400">-</td>
                      )}
                      {visibleColumns[documents[index].id]?.subColumns.daysLeft && (
                        <td className="p-3 border-2 border-gray-300 text-center text-gray-400">-</td>
                      )}
                      {visibleColumns[documents[index].id]?.subColumns.status && (
                        <td className="p-3 border-2 border-gray-300 text-center font-medium">
                          {stat.complete}
                        </td>
                      )}
                    </React.Fragment>
                  ))}
                </tr>

                {/* Company rows */}
                {getSortedCompanies().map((company, index) => (
                  <tr key={company.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 border-2 border-gray-300 font-medium">{company.id}</td>
                    <td className="p-3 border-2 border-gray-300 font-medium">{company.company_name}</td>
                    <td className="p-3 border-2 border-gray-300"></td>
                    {documents.map((doc) => (
                      visibleColumns[doc.id]?.visible && (
                        <React.Fragment key={`${company.id}-${doc.id}`}>
                          {visibleColumns[doc.id]?.subColumns.upload && (
                            <td className="p-3 border-2 border-gray-300 text-center">
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
                            </td>
                          )}
                          {visibleColumns[doc.id]?.subColumns.issueDate && (
                            <td className="p-3 border-2 border-gray-300 text-center text-gray-600">
                              {doc.issue_date && !isNaN(new Date(doc.issue_date).getTime()) 
                                ? format(new Date(doc.issue_date), 'MM/dd/yyyy') 
                                : '-'}
                            </td>
                          )}
                          {visibleColumns[doc.id]?.subColumns.expiryDate && (
                            <td className="p-3 border-2 border-gray-300 text-center text-gray-600">
                              {doc.expiry_date && !isNaN(new Date(doc.expiry_date).getTime()) 
                                ? format(new Date(doc.expiry_date), 'MM/dd/yyyy') 
                                : '-'}
                            </td>
                          )}
                          {visibleColumns[doc.id]?.subColumns.daysLeft && (
                            <td className="p-3 border-2 border-gray-300 text-center font-medium">
                              {doc.expiry_date && !isNaN(new Date(doc.expiry_date).getTime()) 
                                ? differenceInDays(new Date(doc.expiry_date), new Date()) 
                                : '-'}
                            </td>
                          )}
                          {visibleColumns[doc.id]?.subColumns.status && (
                            <td className="p-3 border-2 border-gray-300 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                !doc.expiry_date || isNaN(new Date(doc.expiry_date).getTime()) ? 'bg-yellow-100 text-yellow-700' :
                                differenceInDays(new Date(doc.expiry_date), new Date()) > 30 ?
                                  'bg-green-100 text-green-700' :
                                differenceInDays(new Date(doc.expiry_date), new Date()) < 0 ?
                                  'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                              }`}>
                                {!doc.expiry_date || isNaN(new Date(doc.expiry_date).getTime()) ? 'Pending' :
                                  differenceInDays(new Date(doc.expiry_date), new Date()) > 30 ?
                                    'Valid' :
                                  differenceInDays(new Date(doc.expiry_date), new Date()) < 0 ?
                                    'Expired' :
                                    'Expiring Soon'
                                }
                              </span>
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

      {showUploadModal && <UploadModal />}
      {showSettingsModal && <SettingsModal />}
    </div>
  );
};

export default DocumentManagement;