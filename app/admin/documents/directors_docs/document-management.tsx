'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileDown, Upload, X, ChevronUp, ChevronDown, MoreVertical, Eye } from 'lucide-react';
import { format, differenceInDays, isValid } from 'date-fns';
import { toast, Toaster } from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';

// Types
interface Company {
  id: number;
  company_name: string;
}

interface Director {
  id: number;
  company_id: number;
  full_name: string;
}

interface Document {
  id: string;
  name: string;
  category: string;
}

interface DirectorDocument {
  id: number;
  company_id: number;
  director_id: number;
  document_id: string;
  issue_date: string;
  expiry_date: string;
  file_path: string;
  status: 'pending' | 'complete' | 'missing';
  version?: number;
}

interface UploadData {
  issueDate: string;
  expiryDate: string;
  file: File | null;
}

type SortField = 'company' | 'issueDate' | 'expiryDate' | 'daysLeft' | 'status';
type SortDirection = 'asc' | 'desc';

interface VisibleColumnSettings {
  visible: boolean;
  subColumns: {
    upload: boolean;
    issueDate: boolean;
    expiryDate: boolean;
    daysLeft: boolean;
    status: boolean;
  };
}

interface VisibleColumns {
  [key: string]: VisibleColumnSettings;
}

interface Stats {
  total: number;
  missing: number;
  complete: number;
}

// DocumentActions Component
const DocumentActions: React.FC<{
  document: DirectorDocument;
  onView: () => void;
  onUpdate: () => void;
  onViewPrevious: () => void;
}> = ({ document, onView, onUpdate, onViewPrevious }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center justify-center space-x-1">
      <button
        onClick={onView}
        className="p-1 text-blue-600 hover:text-blue-800"
        title="View Document"
      >
        <Eye className="w-3 h-3" />
      </button>

      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 text-gray-600 hover:text-gray-800"
          title="More Options"
        >
          <MoreVertical className="w-3 h-3" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-50 border">
            <div className="py-1">
              <button
                onClick={() => {
                  onUpdate();
                  setShowMenu(false);
                }}
                className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
              >
                Update Document
              </button>
              <button
                onClick={() => {
                  onViewPrevious();
                  setShowMenu(false);
                }}
                className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
              >
                View Previous Versions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
const DocumentManagement: React.FC = () => {
  // State Management
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Fetch Data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchCompanies(),
        fetchDirectors(),
        fetchDocuments(),
        fetchDirectorDocuments(),
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    const { data: companiesData, error: companiesError } = await supabase
      .from('acc_portal_company_duplicate')
      .select('*')
      .order('company_name');

    if (companiesError) throw companiesError;
    setCompanies(companiesData);
  };

  const fetchDirectors = async () => {
    const { data: directorsData, error: directorsError } = await supabase
      .from('acc_portal_directors_duplicate')
      .select('*');

    if (directorsError) throw directorsError;

    const directorsByCompany = directorsData.reduce((acc, director) => {
      if (!acc[director.company_id]) {
        acc[director.company_id] = [];
      }
      acc[director.company_id].push(director);
      return acc;
    }, {});

    setDirectors(directorsByCompany);
  };

  const fetchDocuments = async () => {
    const { data: documentsData, error: documentsError } = await supabase
      .from('acc_portal_kyc')
      .select('*')
      .eq('category', 'directors-docs');

    if (documentsError) throw documentsError;

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

    setDocuments(documentsData);
    setVisibleColumns(initialVisibility);
  };

  const fetchDirectorDocuments = async () => {
    const { data: directorDocsData, error: directorDocsError } = await supabase
      .from('acc_portal_directors_documents')
      .select('*');

    if (directorDocsError) throw directorDocsError;
    setDirectorDocuments(directorDocsData);
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'MM/dd/yyyy') : '-';
  };

  const calculateDaysLeft = (expiryDateString: string | null | undefined): string | number => {
    if (!expiryDateString) return '-';
    const expiryDate = new Date(expiryDateString);
    if (!isValid(expiryDate)) return '-';
    return differenceInDays(expiryDate, new Date());
  };

  const handleViewDocument = async (document: DirectorDocument) => {
    try {
      const { data: { publicUrl } } = await supabase
        .storage
        .from('documents')
        .getPublicUrl(document.file_path);

      setPreviewUrl(publicUrl);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to view document');
    }
  };

  const handleUpdateDocument = (document: DirectorDocument) => {
    setSelectedDocument({ id: document.document_id, name: '', category: '' });
    setShowUploadModal(true);
  };

  const handleViewPreviousVersions = async (document: DirectorDocument) => {
    try {
      const { data, error } = await supabase
        .from('acc_portal_directors_documents')
        .select('*')
        .eq('company_id', document.company_id)
        .eq('director_id', document.director_id)
        .eq('document_id', document.document_id)
        .order('version', { ascending: false });

      if (error) throw error;

      console.log('Previous versions:', data);
      toast.success(`Found ${data.length} previous versions`);
    } catch (error) {
      console.error('Error fetching previous versions:', error);
      toast.error('Failed to fetch previous versions');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploadMutation({ isLoading: true });

      if (!uploadData.file || !selectedCompany || !selectedDirector || !selectedDocument) {
        throw new Error('Missing required data');
      }

      const fileExt = uploadData.file.name.split('.').pop();
      const filePath = `director-documents/${selectedCompany.id}/${selectedDirector.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadData.file);

      if (uploadError) throw uploadError;

      const { data: currentVersionData } = await supabase
        .from('acc_portal_directors_documents')
        .select('version')
        .eq('company_id', selectedCompany.id)
        .eq('director_id', selectedDirector.id)
        .eq('document_id', selectedDocument.id)
        .order('version', { ascending: false })
        .limit(1);

      const newVersion = currentVersionData?.length ? (currentVersionData[0].version + 1) : 1;

      const { error: saveError } = await supabase
        .from('acc_portal_directors_documents')
        .insert({
          company_id: selectedCompany.id,
          director_id: selectedDirector.id,
          document_id: selectedDocument.id,
          issue_date: uploadData.issueDate,
          expiry_date: uploadData.expiryDate,
          file_path: filePath,
          status: 'pending',
          version: newVersion
        });

      if (saveError) throw saveError;

      await fetchDirectorDocuments();
      setShowUploadModal(false);
      toast.success('Document uploaded successfully');

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploadMutation({ isLoading: false });
    }
  };

  const calculateStats = (documentId?: string): Stats => {
    const stats: Stats = {
      total: 0,
      missing: 0,
      complete: 0
    };

    getSortedCompanies().forEach(company => {
      const companyDirectors = directors[company.id] || [];

      if (documentId) {
        stats.total += companyDirectors.length;
        companyDirectors.forEach(director => {
          const status = getDocumentStatus(company.id, director.id, documentId);
          if (status === 'complete') {
            stats.complete += 1;
          } else {
            stats.missing += 1;
          }
        });
      } else {
        stats.total += companyDirectors.length * documents.length;
        documents.forEach(doc => {
          companyDirectors.forEach(director => {
            const status = getDocumentStatus(company.id, director.id, doc.id);
            if (status === 'complete') {
              stats.complete += 1;
            } else {
              stats.missing += 1;
            }
          });
        });
      }
    });

    return stats;
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

  const getDocumentStatus = (companyId: number, directorId: number, documentId: string) => {
    const doc = directorDocuments.find(d =>
      d.company_id === companyId &&
      d.director_id === directorId &&
      d.document_id === documentId
    );

    return doc?.status || 'missing';
  };

  const renderDocumentDetails = (companyId: number, directorId: number, documentId: string) => {
    const documentRecord = directorDocuments.find(doc =>
      doc.company_id === companyId &&
      doc.director_id === directorId &&
      doc.document_id === documentId
    );

    const status = documentRecord?.status || 'missing';
    const daysLeft = documentRecord ? calculateDaysLeft(documentRecord.expiry_date) : '-';

    return (
      <>
        <td className="p-2 border border-gray-300 text-center">
          {documentRecord ? (
            <DocumentActions
              document={documentRecord}
              onView={() => handleViewDocument(documentRecord)}
              onUpdate={() => handleUpdateDocument(documentRecord)}
              onViewPrevious={() => handleViewPreviousVersions(documentRecord)}
            />
          ) : (
            <button
              onClick={() => {
                setSelectedCompany(companies.find(c => c.id === companyId) || null);
                setSelectedDirector(directors[companyId]?.find(d => d.id === directorId) || null);
                setSelectedDocument(documents.find(d => d.id === documentId) || null);
                setUploadData({
                  issueDate: '',
                  expiryDate: '',
                  file: null
                });
                setShowUploadModal(true);
              }}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
            >
              Upload
            </button>
          )}
        </td>
        <td className="p-2 border border-gray-300 text-center text-xs text-gray-600">
          {formatDate(documentRecord?.issue_date)}
        </td>
        <td className="p-2 border border-gray-300 text-center text-xs text-gray-600">
          {formatDate(documentRecord?.expiry_date)}
        </td>
        <td className="p-2 border border-gray-300 text-center text-xs">
          {daysLeft}
        </td>
        <td className="p-2 border border-gray-300 text-center">
          <span className={`px-2 py-0.5 rounded-full text-xs ${
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

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen p-4 bg-white flex flex-col">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-md shadow-sm hover:bg-gray-50 transition-colors duration-200 text-gray-700 text-sm">
            <FileDown className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-md shadow-sm hover:bg-gray-50 transition-colors duration-200 text-gray-700 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm border-collapse min-w-[1500px]">
            {/* Table Header */}
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-gray-100 text-xs">
                <th className="p-2 border border-gray-300 font-semibold text-gray-700" rowSpan={2}>No.</th>
                <th className="p-2 border border-gray-300 font-semibold text-gray-700" rowSpan={2}>Companies</th>
                <th className="p-2 border border-gray-300 font-semibold text-gray-700" rowSpan={2}>Directors</th>
                <th className="p-2 border border-gray-300 font-semibold text-gray-700" rowSpan={2}>Summary</th>
                {documents.map(doc => (
                  visibleColumns[doc.id]?.visible && (
                    <th key={doc.id} className="p-2 border border-gray-300 font-semibold text-gray-700 text-center bg-blue-50"
                      colSpan={5}>
                      {doc.name}
                    </th>
                  )
                ))}
              </tr>
              <tr className="bg-gray-50 text-xs">
                {documents.map(doc => (
                  visibleColumns[doc.id]?.visible && (
                    <React.Fragment key={`header-${doc.id}`}>
                      <th className="p-2 border border-gray-300 font-medium text-gray-600">Action</th>
                      <th className="p-2 border border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                        onClick={() => {
                          if (sortField === 'issueDate') {
                            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                          }
                          setSortField('issueDate');
                        }}>
                        <div className="flex items-center justify-between">
                          Issue Date
                          {sortField === 'issueDate' && (
                            sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="p-2 border border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                        onClick={() => {
                          if (sortField === 'expiryDate') {
                            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                          }
                          setSortField('expiryDate');
                        }}>
                        <div className="flex items-center justify-between">
                          Expiry Date
                          {sortField === 'expiryDate' && (
                            sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="p-2 border border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                        onClick={() => {
                          if (sortField === 'daysLeft') {
                            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                          }
                          setSortField('daysLeft');
                        }}>
                        <div className="flex items-center justify-between">
                          Days Left
                          {sortField === 'daysLeft' && (
                            sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="p-2 border border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                        onClick={() => {
                          if (sortField === 'status') {
                            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                          }
                          setSortField('status');
                        }}>
                        <div className="flex items-center justify-between">
                          Status
                          {sortField === 'status' && (
                            sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                    </React.Fragment>
                  )
                ))}
              </tr>
            </thead>

            <tbody className="text-xs">
              {/* Stats rows */}
              <tr className="bg-gray-50">
                <td className="p-2 border border-gray-300" colSpan={2}></td>
                <td className="p-2 border border-gray-300" rowSpan={3}></td>
                <td className="p-2 border border-gray-300 font-semibold text-blue-600">Total</td>
                {documents.map(doc => (
                  visibleColumns[doc.id]?.visible && (
                    <React.Fragment key={`total-${doc.id}`}>
                      <td className="p-2 border border-gray-300 text-center font-medium" colSpan={5}>
                        {calculateStats(doc.id).total}
                      </td>
                    </React.Fragment>
                  )
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 border border-gray-300" colSpan={2}></td>
                <td className="p-2 border border-gray-300 font-semibold text-orange-600">Missing</td>
                {documents.map(doc => (
                  visibleColumns[doc.id]?.visible && (
                    <React.Fragment key={`missing-${doc.id}`}>
                      <td className="p-2 border border-gray-300 text-center font-medium" colSpan={5}>
                        {calculateStats(doc.id).missing}
                      </td>
                    </React.Fragment>
                  )
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 border border-gray-300" colSpan={2}></td>
                <td className="p-2 border border-gray-300 font-semibold text-green-600">Completed</td>
                {documents.map(doc => (
                  visibleColumns[doc.id]?.visible && (
                    <React.Fragment key={`complete-${doc.id}`}>
                      <td className="p-2 border border-gray-300 text-center font-medium" colSpan={5}>
                        {calculateStats(doc.id).complete}
                      </td>
                    </React.Fragment>
                  )
                ))}
              </tr>

              {/* Company rows */}
              {getSortedCompanies().map((company, index) => {
                const companyDirectors = directors[company.id] || [];
                return (
                  <React.Fragment key={company.id}>
                    {companyDirectors.map((director, dirIndex) => (
                      <tr key={`${company.id}-${director.id}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {dirIndex === 0 && (
                          <>
                            <td className="p-2 border border-gray-300 text-center" rowSpan={companyDirectors.length}>
                              {index + 1}
                            </td>
                            <td className="p-2 border border-gray-300" rowSpan={companyDirectors.length}>
                              {company.company_name}
                            </td>
                          </>
                        )}
                        <td className="p-2 border border-gray-300">{director.full_name}</td>
                        <td className="p-2 border border-gray-300"></td>
                        {documents.map((doc) => (
                          visibleColumns[doc.id]?.visible && (
                            <React.Fragment key={`${company.id}-${doc.id}-${director.id}`}>
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
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
            {selectedCompany && selectedDocument && selectedDirector && (
              <p className="text-xs text-gray-600 mb-4">
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
                  className="w-full px-3 py-1.5 border rounded-md text-sm"
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
                  className="w-full px-3 py-1.5 border rounded-md text-sm"
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
                    className="w-full px-3 py-1.5 border rounded-md text-sm"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setUploadData(prev => ({ ...prev, file }));
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Accepted formats: PDF, JPEG, PNG
                  </p>
                </div>
  
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                  disabled={!uploadData.file || uploadMutation.isLoading}
                >
                  {uploadMutation.isLoading ? 'Uploading...' : 'Upload Document'}
                </button>
              </form>
            </div>
          </div>
        )}
  
        {/* Preview Modal */}
        {showPreviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 w-full max-w-5xl h-[80vh] relative flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Document Preview</h2>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
  
              <div className="flex-1 overflow-hidden rounded-lg border border-gray-200">
                {previewUrl.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full"
                    title="Document Preview"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Document Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
              </div>
  
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => window.open(previewUrl, '_blank')}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Open in New Tab
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
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
                <X className="w-4 h-4" />
              </button>
  
              <h2 className="text-lg font-semibold mb-4">Column Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                {documents.map(doc => (
                  <div key={doc.id} className="border p-4 rounded-lg">
                    <div className="flex items-center mb-3">
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
                        className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300"
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
                              className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300"
                            />
                            <label className="text-xs font-medium text-gray-700 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
  
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
  
        <Toaster />
      </div>
    );
  };
  
  export default DocumentManagement;