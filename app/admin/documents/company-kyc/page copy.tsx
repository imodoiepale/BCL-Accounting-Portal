// @ts-nocheck
// @ts-ignore
'use client';

import React, { useState } from 'react';
import { FileDown, Upload, X, ChevronUp, ChevronDown } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface Company {
  name: string;
  id: number;
}

interface Document {
  id: number;
  name: string;
  department: string;
  subcategory: string;
}

type SortField = 'company' | 'issueDate' | 'expiryDate' | 'daysLeft' | 'status';
type SortDirection = 'asc' | 'desc';

const DocumentManagement = () => {
  const companies: Company[] = [
    { id: 1, name: 'Company A' },
    { id: 2, name: 'Company B' },
    { id: 3, name: 'Company C' },
    { id: 4, name: 'Company D' },
    { id: 5, name: 'Company E' },
    { id: 6, name: 'Company F' },
    { id: 7, name: 'Company G' },
  ];

  const documents: Document[] = [
    { id: 1, name: 'Document 1', department: 'KRA', subcategory: 'kra-docs' },
    { id: 2, name: 'Document 2', department: 'Sheria', subcategory: 'sheria-docs' },
    { id: 3, name: 'Document 3', department: 'KRA', subcategory: 'kra-docs' },
    { id: 4, name: 'Document 4', department: 'Sheria', subcategory: 'sheria-docs' },
    { id: 5, name: 'Document 5', department: 'KRA', subcategory: 'kra-docs' },
    { id: 6, name: 'Document 6', department: 'Sheria', subcategory: 'sheria-docs' },
    { id: 7, name: 'Document 7', department: 'KRA', subcategory: 'kra-docs' },
  ];

  const [activeTab, setActiveTab] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [sortField, setSortField] = useState<SortField>('company');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [uploadData, setUploadData] = useState({
    issueDate: '',
    expiryDate: '',
    file: null as File | null,
  });

  // State to manage visibility of documents and their sub-columns
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedCompanies = () => {
    return [...companies].sort((a, b) => {
      const aDate = new Date(2024, 0, a.id);
      const bDate = new Date(2024, 0, b.id);
      const aExpiryDate = new Date(2025, 6, a.id);
      const bExpiryDate = new Date(2025, 6, b.id);
      const aDaysLeft = differenceInDays(new Date(2025, 6, a.id), new Date());
      const bDaysLeft = differenceInDays(new Date(2025, 6, b.id), new Date());
      const aStatus = a.id % 3 === 0 ? 'Complete' : a.id % 3 === 1 ? 'Pending' : 'Expired';
      const bStatus = b.id % 3 === 0 ? 'Complete' : b.id % 3 === 1 ? 'Pending' : 'Expired';

      const modifier = sortDirection === 'asc' ? 1 : -1;

      switch (sortField) {
        case 'company':
          return modifier * a.name.localeCompare(b.name);
        case 'issueDate':
          return modifier * (aDate.getTime() - bDate.getTime());
        case 'expiryDate':
          return modifier * (aExpiryDate.getTime() - bExpiryDate.getTime());
        case 'daysLeft':
          return modifier * (aDaysLeft - bDaysLeft);
        case 'status':
          return modifier * aStatus.localeCompare(bStatus);
        default:
          return 0;
      }
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Uploading:', {
      company: selectedCompany,
      document: selectedDocument,
      ...uploadData,
    });
    setShowUploadModal(false);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-4 h-4 text-gray-300" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  const UploadModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 relative">
        <button 
          onClick={() => setShowUploadModal(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      
        <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
        {selectedCompany && selectedDocument && (
          <p className="text-sm text-gray-600 mb-4">
            Uploading for {selectedCompany.name} - {selectedDocument.name}
          </p>
        )}
      
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Issue Date
            </label>
            <input 
              id="issueDate"
              type="date" 
              required
              className="w-full px-3 py-2 border rounded-md"
              value={uploadData.issueDate}
              onChange={(e) => setUploadData(prev => ({ ...prev, issueDate: e.target.value }))}
            />
          </div>
        
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input 
              id="expiryDate"
              type="date"
              required
              className="w-full px-3 py-2 border rounded-md"
              value={uploadData.expiryDate}
              onChange={(e) => setUploadData(prev => ({ ...prev, expiryDate: e.target.value }))}
            />
          </div>
        
          <div>
            <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-1">
              Upload File
            </label>
            <input 
              id="fileUpload"
              type="file"
              required
              className="w-full px-3 py-2 border rounded-md"
              onChange={(e) => setUploadData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
            />
          </div>
        
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            Upload Document
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
          aria-label="Close"
          title="Close"
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
                  checked={visibleColumns[doc.id].visible}
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
              {visibleColumns[doc.id].visible && (
                <div className="space-y-2">
                  {Object.keys(visibleColumns[doc.id].subColumns).map(subColumn => (
                    <div key={subColumn} className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns[doc.id].subColumns[subColumn]}
                        onChange={() => {
                          setVisibleColumns(prev => ({
                            ...prev,
                            [doc.id]: {
                              ...prev[doc.id],
                              subColumns: {
                                ...prev[doc.id].subColumns,
                                [subColumn]: !prev[doc.id].subColumns[subColumn],
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

  const filteredDocuments = documents.filter(doc => {
    if (activeTab === 'All') return true;
    if (activeTab === 'KRA') return doc.department === 'KRA' && doc.subcategory === 'kra-docs';
    if (activeTab === 'Sheria') return doc.department === 'Sheria' && doc.subcategory === 'sheria-docs';
    return false;
  });

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Document Management</h1>
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            placeholder="Search companies..." 
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
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
              className={`px-4 py-2 rounded-md ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

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
                {filteredDocuments.map(doc => (
                  visibleColumns[doc.id].visible && (
                    <th key={`doc-${doc.id}`} className="p-3 border-2 border-gray-300 font-semibold text-gray-700 text-center bg-blue-50" colSpan={5}>
                      {doc.name}
                    </th>
                  )
                ))}
              </tr>
              <tr className="bg-gray-50">
                {filteredDocuments.map(doc => (
                  visibleColumns[doc.id].visible && (
                    <React.Fragment key={`doc-columns-${doc.id}`}>
                      {visibleColumns[doc.id].subColumns.upload && (
                        <th className="p-3 border-2 border-gray-300 font-medium text-gray-600">Upload</th>
                      )}
                      {visibleColumns[doc.id].subColumns.issueDate && (
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
                      {visibleColumns[doc.id].subColumns.expiryDate && (
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
                      {visibleColumns[doc.id].subColumns.daysLeft && (
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
                      {visibleColumns[doc.id].subColumns.status && (
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
                {filteredDocuments.map(doc => (
                  visibleColumns[doc.id].visible && (
                    <React.Fragment key={`total-${doc.id}`}>
                      {visibleColumns[doc.id].subColumns.upload && (
                        <td className="p-3 border-2 border-gray-300 text-center font-medium">4</td>
                      )}
                      {visibleColumns[doc.id].subColumns.issueDate && (
                        <td className="p-3 border-2 border-gray-300 text-center text-gray-400" colSpan={3}>-</td>
                      )}
                      {visibleColumns[doc.id].subColumns.status && (
                        <td className="p-3 border-2 border-gray-300 text-center font-medium">4</td>
                      )}
                    </React.Fragment>
                  )
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="p-3 border-2 border-gray-300 font-semibold text-orange-600">Pending</td>
                {filteredDocuments.map(doc => (
                  visibleColumns[doc.id].visible && (
                    <React.Fragment key={`pending-${doc.id}`}>
                      {visibleColumns[doc.id].subColumns.upload && (
                        <td className="p-3 border-2 border-gray-300 text-center font-medium">2</td>
                      )}
                      {visibleColumns[doc.id].subColumns.issueDate && (
                        <td className="p-3 border-2 border-gray-300 text-center text-gray-400" colSpan={3}>-</td>
                      )}
                      {visibleColumns[doc.id].subColumns.status && (
                        <td className="p-3 border-2 border-gray-300 text-center font-medium">2</td>
                      )}
                    </React.Fragment>
                  )
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="p-3 border-2 border-gray-300 font-semibold text-green-600">Complete</td>
                {filteredDocuments.map(doc => (
                  visibleColumns[doc.id].visible && (
                    <React.Fragment key={`complete-${doc.id}`}>
                      {visibleColumns[doc.id].subColumns.upload && (
                        <td className="p-3 border-2 border-gray-300 text-center font-medium">2</td>
                      )}
                      {visibleColumns[doc.id].subColumns.issueDate && (
                        <td className="p-3 border-2 border-gray-300 text-center text-gray-400" colSpan={3}>-</td>
                      )}
                      {visibleColumns[doc.id].subColumns.status && (
                        <td className="p-3 border-2 border-gray-300 text-center font-medium">2</td>
                      )}
                    </React.Fragment>
                  )
                ))}
              </tr>
              
              {/* Separator row */}
              <tr className="h-2 bg-gray-200">
                <td colSpan={100} className="border-4 border-gray-300"></td>
              </tr>
              
              {/* Company rows - Now using sorted companies */}
              {getSortedCompanies().map((company, index) => {
                const date = new Date(2024, 0, company.id);
                const expiryDate = new Date(2025, 6, company.id);
                return (
                  <tr key={company.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 border-2 border-gray-300 font-medium">{company.id}</td>
                    <td className="p-3 border-2 border-gray-300 font-medium">{company.name}</td>
                    <td className="p-3 border-2 border-gray-300"></td>
                    {filteredDocuments.map((doc) => (
                      visibleColumns[doc.id].visible && (
                        <React.Fragment key={`${company.id}-${doc.id}`}>
                          {visibleColumns[doc.id].subColumns.upload && (
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
                          {visibleColumns[doc.id].subColumns.issueDate && (
                            <td className="p-3 border-2 border-gray-300 text-center text-gray-600">
                              {format(date, 'MM/dd/yyyy')}
                            </td>
                          )}
                          {visibleColumns[doc.id].subColumns.expiryDate && (
                            <td className="p-3 border-2 border-gray-300 text-center text-gray-600">
                              {format(expiryDate, 'MM/dd/yyyy')}
                            </td>
                          )}
                          {visibleColumns[doc.id].subColumns.daysLeft && (
                            <td className="p-3 border-2 border-gray-300 text-center font-medium">
                              {differenceInDays(expiryDate, new Date())}
                            </td>
                          )}
                          {visibleColumns[doc.id].subColumns.status && (
                            <td className="p-3 border-2 border-gray-300 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                company.id % 3 === 0 ? 'bg-green-100 text-green-700' :
                                company.id % 3 === 1 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {company.id % 3 === 0 ? 'Complete' : company.id % 3 === 1 ? 'Pending' : 'Expired'}
                              </span>
                            </td>
                          )}
                        </React.Fragment>
                      )
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>      
      {showUploadModal && <UploadModal />}
      {showSettingsModal && <SettingsModal />}
    </div>
  );
};

export default DocumentManagement;