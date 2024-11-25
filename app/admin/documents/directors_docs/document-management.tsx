// components/DocumentManagement.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FileDown, Upload, X, ChevronUp, ChevronDown } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';

// Types
interface Company {
  id: number;
  company_name: string;
  status: string;
}

interface Director {
  id: number;
  company_id: number;
  full_name: string;
}

interface Document {
  id: string;
  name: string;
  department: string;
  subcategory: string;
  category: string;
}

interface DirectorDocument {
  id: string;
  company_id: number;
  director_id: number;
  document_id: string;
  issue_date: string;
  expiry_date: string;
  file_path: string;
  status: string;
}

interface UploadData {
  issueDate: string;
  expiryDate: string;
  file: File | null;
}

interface VisibleColumnSubColumns {
  upload: boolean;
  issueDate: boolean;
  expiryDate: boolean;
  daysLeft: boolean;
  status: boolean;
}

interface VisibleColumn {
  visible: boolean;
  subColumns: VisibleColumnSubColumns;
}

interface VisibleColumns {
  [key: string]: VisibleColumn;
}

type SortField = 'company' | 'issueDate' | 'expiryDate' | 'daysLeft' | 'status';
type SortDirection = 'asc' | 'desc';

const DocumentManagement = () => {
  // State management
  const [companies, setCompanies] = useState<Company[]>([]);
  const [directors, setDirectors] = useState<{ [key: number]: Director[] }>({});
  const [documents, setDocuments] = useState<Document[]>([]);
  const [directorDocuments, setDirectorDocuments] = useState<DirectorDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null);
  const [sortField, setSortField] = useState<SortField>('company');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [uploadMutation, setUploadMutation] = useState({ isLoading: false });
  const [searchTerm, setSearchTerm] = useState('');

  const [uploadData, setUploadData] = useState<UploadData>({
    issueDate: '',
    expiryDate: '',
    file: null,
  });

  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('acc_portal_company_duplicate')
        .select('*');
      
      if (companiesError) throw companiesError;

      // Fetch directors
      const { data: directorsData, error: directorsError } = await supabase
        .from('acc_portal_directors_duplicate')
        .select('*');
      
      if (directorsError) throw directorsError;

      // Fetch KYC documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('acc_portal_kyc')
        .select('*')
        .eq('category', 'directors-docs');

      if (documentsError) throw documentsError;

      // Fetch director documents
      const { data: directorDocsData, error: directorDocsError } = await supabase
        .from('acc_portal_directors_documents')
        .select('*');

      if (directorDocsError) throw directorDocsError;

      // Group directors by company
      const directorsByCompany = directorsData.reduce((acc, director) => {
        if (!acc[director.company_id]) {
          acc[director.company_id] = [];
        }
        acc[director.company_id].push(director);
        return acc;
      }, {});

      // Initialize visible columns
      const initialVisibility = documentsData.reduce((acc, doc) => {
        acc[doc.id] = {
          visible: true,
          subColumns: {
            upload: true,
            issueDate: true,
            expiryDate: true,
            daysLeft: true,
            status: true,
          },
        };
        return acc;
      }, {});

      setCompanies(companiesData);
      setDirectors(directorsByCompany);
      setDocuments(documentsData);
      setDirectorDocuments(directorDocsData);
      setVisibleColumns(initialVisibility);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploadMutation({ isLoading: true });

      if (!uploadData.file || !selectedCompany || !selectedDirector || !selectedDocument) {
        throw new Error('Missing required data');
      }

      // Upload file to storage
      const fileExt = uploadData.file.name.split('.').pop();
      const filePath = `director-documents/${selectedCompany.id}/${selectedDirector.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadData.file);

      if (uploadError) throw uploadError;

      // Save document record
      const { error: saveError } = await supabase
        .from('acc_portal_directors_documents')
        .insert({
          company_id: selectedCompany.id,
          director_id: selectedDirector.id,
          document_id: selectedDocument.id,
          issue_date: uploadData.issueDate,
          expiry_date: uploadData.expiryDate,
          file_path: filePath,
          status: 'pending'
        });

      if (saveError) throw saveError;

      await fetchData();
      setShowUploadModal(false);
      toast.success('Document uploaded successfully');

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploadMutation({ isLoading: false });
    }
  };

  const getSortedCompanies = () => {
    let filteredCompanies = [...companies];
    
    if (searchTerm) {
      filteredCompanies = filteredCompanies.filter(company => 
        company.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filteredCompanies.sort((a, b) => {
      const modifier = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'company':
          return modifier * a.company_name.localeCompare(b.company_name);
        default:
          return 0;
      }
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getDocumentStatus = (companyId: number, directorId: number, documentId: string) => {
    const doc = directorDocuments.find(d => 
      d.company_id === companyId && 
      d.director_id === directorId && 
      d.document_id === documentId
    );

    return doc?.status || 'missing';
  };

  const calculateStats = () => {
    const stats = {
      total: 0,
      missing: 0,
      complete: 0
    };

    getSortedCompanies().forEach(company => {
      const companyDirectors = directors[company.id] || [];
      stats.total += companyDirectors.length;
      
      documents.forEach(doc => {
        const docStats = companyDirectors.reduce((acc, director) => {
          const status = getDocumentStatus(company.id, director.id, doc.id);
          if (status === 'complete') acc.complete += 1;
          else acc.missing += 1;
          return acc;
        }, { complete: 0, missing: 0 });
        
        stats.complete += docStats.complete;
        stats.missing += docStats.missing;
      });
    });

    return stats;
  };

  const renderDocumentDetails = (companyId: number, directorId: number, documentId: string) => {
    const documentRecord = directorDocuments.find(doc => 
      doc.company_id === companyId && 
      doc.director_id === directorId && 
      doc.document_id === documentId
    );

    const status = documentRecord?.status || 'missing';
    const daysLeft = documentRecord ? 
      differenceInDays(new Date(documentRecord.expiry_date), new Date()) : 
      0;

    return (
      <>
        <td className="p-3 border-2 border-gray-300 text-center text-gray-600">
          {documentRecord ? format(new Date(documentRecord.issue_date), 'MM/dd/yyyy') : '-'}
        </td>
        <td className="p-3 border-2 border-gray-300 text-center text-gray-600">
          {documentRecord ? format(new Date(documentRecord.expiry_date), 'MM/dd/yyyy') : '-'}
        </td>
        <td className="p-3 border-2 border-gray-300 text-center font-medium">
          {documentRecord ? daysLeft : '-'}
        </td>
        <td className="p-3 border-2 border-gray-300 text-center">
          <span className={`px-2 py-1 rounded-full text-xs ${
            status === 'complete' ? 'bg-green-100 text-green-700' :
            status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </td>
      </>
    );
  };
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-4 h-4 text-gray-300" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="w-full h-screen p-6 bg-white flex flex-col">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50 transition-colors duration-200 text-gray-700">
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

      {/* Table Section */}
      <div className="flex-1 border-2 rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm border-collapse min-w-[1500px]">
            {/* Table Header */}
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-gray-100">
                <th className="p-3 border-2 border-gray-300 font-semibold text-gray-700" rowSpan={2}>Companies</th>
                <th className="p-3 border-2 border-gray-300 font-semibold text-gray-700" rowSpan={2}>Directors</th>
                <th className="p-3 border-2 border-gray-300 font-semibold text-gray-700" rowSpan={2}>Summary</th>
                {documents.map(doc => (
                  visibleColumns[doc.id]?.visible && (
                    <th key={doc.id} className="p-3 border-2 border-gray-300 font-semibold text-gray-700 text-center bg-blue-50"
                      colSpan={5}>
                      {doc.name}
                    </th>
                  )
                ))}
              </tr>
              <tr className="bg-gray-50">
                {documents.map(doc => (
                  visibleColumns[doc.id]?.visible && (
                    <React.Fragment key={`header-${doc.id}`}>
                      <th className="p-3 border-2 border-gray-300 font-medium text-gray-600">Upload</th>
                      <th className="p-3 border-2 border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                        onClick={() => handleSort('issueDate')}>
                        <div className="flex items-center justify-between">
                          Issue Date
                          <SortIcon field="issueDate" />
                        </div>
                      </th>
                      <th className="p-3 border-2 border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                        onClick={() => handleSort('expiryDate')}>
                        <div className="flex items-center justify-between">
                          Expiry Date
                          <SortIcon field="expiryDate" />
                        </div>
                      </th>
                      <th className="p-3 border-2 border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                        onClick={() => handleSort('daysLeft')}>
                        <div className="flex items-center justify-between">
                          Days Left
                          <SortIcon field="daysLeft" />
                        </div>
                      </th>
                      <th className="p-3 border-2 border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                        onClick={() => handleSort('status')}>
                        <div className="flex items-center justify-between">
                          Status
                          <SortIcon field="status" />
                        </div>
                      </th>
                    </React.Fragment>
                  )
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Stats rows */}
              <tr className="bg-gray-50">
                <td className="p-3 border-2 border-gray-300 font-medium bg-gray-100" rowSpan={3}></td>
                <td className="p-3 border-2 border-gray-300" rowSpan={3}></td>
                <td className="p-3 border-2 border-gray-300 font-semibold text-blue-600">Total</td>
                {documents.map(doc => (
                  visibleColumns[doc.id]?.visible && (
                    <td key={`total-${doc.id}`} className="p-3 border-2 border-gray-300 text-center font-medium" colSpan={5}>
                      {stats.total}
                    </td>
                  )
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="p-3 border-2 border-gray-300 font-semibold text-orange-600">Missing</td>
                {documents.map(doc => (
                  visibleColumns[doc.id]?.visible && (
                    <td key={`missing-${doc.id}`} className="p-3 border-2 border-gray-300 text-center font-medium" colSpan={5}>
                      {stats.missing}
                    </td>
                  )
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="p-3 border-2 border-gray-300 font-semibold text-green-600">Completed</td>
                {documents.map(doc => (
                  visibleColumns[doc.id]?.visible && (
                    <td key={`complete-${doc.id}`} className="p-3 border-2 border-gray-300 text-center font-medium" colSpan={5}>
                      {stats.complete}
                    </td>
                  )
                ))}
              </tr>
              <tr className="h-2 bg-gray-200">
                <td colSpan={100} className="border-4 border-gray-300"></td>
              </tr>

              {/* Company rows */}
              {getSortedCompanies().map((company, index) => {
                const companyDirectors = directors[company.id] || [];
                return (
                  <React.Fragment key={company.id}>
                    {companyDirectors.map((director, dirIndex) => (
                      <tr key={`${company.id}-${director.id}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {dirIndex === 0 && (
                          <td className="p-3 border-2 border-gray-300 font-medium" rowSpan={companyDirectors.length}>
                            {company.company_name}
                          </td>
                        )}
                        <td className="p-3 border-2 border-gray-300 font-medium">{director.full_name}</td>
                        <td className="p-3 border-2 border-gray-300"></td>
                        {documents.map((doc) => (
                          visibleColumns[doc.id]?.visible && (
                            <React.Fragment key={`${company.id}-${doc.id}-${director.id}`}>
                              <td className="p-3 border-2 border-gray-300 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedCompany(company);
                                    setSelectedDocument(doc);
                                    setSelectedDirector(director);
                                    setUploadData({
                                      issueDate: '',
                                      expiryDate: '',
                                      file: null
                                    });
                                    setShowUploadModal(true);
                                  }}
                                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                                >
                                  Upload
                                </button>
                              </td>
                              {renderDocumentDetails(company.id, director.id, doc.id)}
                            </React.Fragment>
                          )
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 relative">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
            {selectedCompany && selectedDocument && selectedDirector && (
              <p className="text-sm text-gray-600 mb-4">
                Uploading for {selectedCompany.company_name} - {selectedDirector.full_name} - {selectedDocument.name}
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
                  min={uploadData.issueDate}
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
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-3 py-2 border rounded-md"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setUploadData(prev => ({ ...prev, file }));
                  }}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Accepted formats: PDF, JPEG, PNG
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                disabled={!uploadData.file || !uploadData.issueDate || !uploadData.expiryDate || uploadMutation.isLoading}
              >
                {uploadMutation.isLoading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold mb-4">Column Settings</h2>
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
                            visible: !prev[doc.id].visible,
                          },
                        }));
                      }}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">{doc.name}</label>
                  </div>
                  {visibleColumns[doc.id]?.visible && (
                    <div className="space-y-2 ml-6">
                      {Object.entries(visibleColumns[doc.id].subColumns).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={() => {
                              setVisibleColumns(prev => ({
                                ...prev,
                                [doc.id]: {
                                  ...prev[doc.id],
                                  subColumns: {
                                    ...prev[doc.id].subColumns,
                                    [key]: !value,
                                  },
                                },
                              }));
                            }}
                            className="mr-2"
                          />
                          <label className="text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagement;