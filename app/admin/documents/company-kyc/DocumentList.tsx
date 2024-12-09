// @ts-nocheck
"use client"

// Import necessary dependencies
import React, { useState, useMemo } from 'react';
import { Eye, Download, Search, SortAsc, SortDesc, Upload, RefreshCw, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

// Import UI components
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
interface Company {
  id: number;
  company_name: string;
}

interface Document {
  id: number;
  name: string;
  department?: string;
  category?: string;
  subcategory?: string;
}

interface Upload {
  id: number;
  created_at: string;
  filepath: string;
  issue_date?: string;
  expiry_date?: string;
  kyc_document_id: number;
}

// Helper function for document status
const getDocumentStatus = (daysLeft: number | null) => {
  if (daysLeft === null) {
    return { label: 'No Expiry', color: 'bg-slate-100 text-slate-800' };
  }
  if (daysLeft < 0) {
    return { label: 'Expired', color: 'bg-red-100 text-red-800 border border-red-300' };
  }
  if (daysLeft <= 30) {
    return { label: 'Expiring Soon', color: 'bg-amber-100 text-amber-800 border border-amber-300' };
  }
  return { label: 'Valid', color: 'bg-emerald-100 text-emerald-800 border border-emerald-300' };
};
const DocumentList = () => {
  // State management
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [documentSearch, setDocumentSearch] = useState('');

  // Fetch companies
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acc_portal_company_duplicate')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch documents based on active tab
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ['documents', activeTab, selectedCompany?.id],
    enabled: !!selectedCompany,
    queryFn: async () => {
      let query = supabase.from('acc_portal_kyc').select('*');

      if (activeTab === 'KRA') {
        query = query
          .eq('department', 'KRA')
          .eq('subcategory', 'kra-docs');
      } else if (activeTab === 'Sheria') {
        query = query
          .eq('department', 'Sheria House')
          .eq('subcategory', 'sheria-docs');
      } else if (activeTab === 'All') {
        query = query.eq('category', 'company-docs');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch document uploads
  const { data: documentUploads = [], isLoading: isLoadingUploads } = useQuery<Upload[]>({
    queryKey: ['uploads', selectedCompany?.id, selectedDocument?.id],
    enabled: !!selectedCompany && !!selectedDocument,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acc_portal_kyc_uploads')
        .select('*')
        .eq('userid', selectedCompany.id.toString())
        .eq('kyc_document_id', selectedDocument.id);

      if (error) throw error;
      return data || [];
    }
  });

  // Handlers
  const handleView = async (filepath: string) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('kyc-documents')
        .createSignedUrl(filepath, 60);

      if (error) throw error;
      setViewUrl(data.signedUrl);
      setShowViewer(true);
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to load document');
    }
  };

  const handleDownload = async (filepath: string, filename: string) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('kyc-documents')
        .download(filepath);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  // Memoized values
  const filteredCompanies = useMemo(() => {
    return companies.filter(company =>
      company.company_name.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [companies, companySearch]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc =>
      doc.name.toLowerCase().includes(documentSearch.toLowerCase())
    );
  }, [documents, documentSearch]);

  const processedDocumentUploads = useMemo(() => {
    return documentUploads.map(upload => {
      const expiryDate = upload?.expiry_date ? new Date(upload.expiry_date) : null;
      const daysLeft = expiryDate ? differenceInDays(expiryDate, new Date()) : null;

      return {
        ...upload,
        daysLeft,
        status: getDocumentStatus(daysLeft)
      };
    });
  }, [documentUploads]);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Companies List */}
      <div className="w-72 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800 text-sm mb-4">Companies</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              type="text"
              placeholder="Search companies..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              className="w-full pl-9 border-slate-200 focus:ring-blue-500 text-xs"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-0.5 p-3">
            {filteredCompanies.map((company, index) => (
              <button
                key={company.id}
                onClick={() => {
                  setSelectedCompany(company);
                  setSelectedDocument(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs transition-all ${selectedCompany?.id === company.id
                  ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5 text-[10px]">{(index + 1).toString().padStart(2, '0')}</span>
                  <span className="flex-1">{company.company_name}</span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Documents List */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
        {selectedCompany ? (
          <>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-slate-800 text-sm">Documents</h2>

                <div className="flex bg-slate-100 p-1 rounded-lg">
                  {['All', 'KRA', 'Sheria'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setSelectedDocument(null);
                      }}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${activeTab === tab
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search documents..."
                  value={documentSearch}
                  onChange={(e) => setDocumentSearch(e.target.value)}
                  className="w-full pl-9 border-slate-200 focus:ring-blue-500 text-xs"
                />

              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-0.5 p-3">
                {isLoadingDocuments ? (
                  <div className="flex items-center justify-center p-8 text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : (
                  filteredDocuments.map((doc, index) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocument(doc)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-xs transition-all ${selectedDocument?.id === doc.id
                        ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5 text-[10px]">{(index + 1).toString().padStart(2, '0')}</span>
                        <div className="flex-1">
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {doc.department || 'No Department'} • {doc.category || 'No Category'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-slate-500">
            <svg
              className="w-12 h-12 text-slate-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 48 48"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 8h32v32H8z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 16h16M16 24h16M16 32h8"
              />
            </svg>
            <p className="text-center">
              Select a company<br />to view documents
            </p>
          </div>
        )}
      </div>
      {/* Document Uploads View */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedDocument ? (
          <>
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-slate-800 text-sm">
                    <span className="text-blue-600">{selectedDocument.name}</span> <span className="text-slate-500">for</span> <span className="text-green-600">{selectedCompany?.company_name}</span></h2>                
                    <p className="text-slate-500 text-xs mt-0.5">Document Uploads</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  New Upload
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {isLoadingUploads ? (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  Loading uploads...
                </div>
              ) : (
                <Card className="border-slate-200">
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left p-4 font-medium text-slate-700">Upload Date</th>

                          <th className="text-center p-4 font-medium text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedDocumentUploads.map(upload => (
                          <tr key={upload.id} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="p-4 text-slate-600">
                              {format(new Date(upload.created_at), 'dd/MM/yyyy')}
                            </td>

                            <td className="p-4 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-600 hover:text-slate-900"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-40">
                                  <DropdownMenuItem
                                    onClick={() => handleView(upload.filepath)}
                                    className="text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                                  >
                                    <Eye className="w-4 h-4 mr-2" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDownload(upload.filepath, selectedDocument.name)}
                                    className="text-slate-600 focus:text-slate-700 focus:bg-slate-50"
                                  >
                                    <Download className="w-4 h-4 mr-2" /> Download
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-slate-500">
            <svg
              className="w-12 h-12 text-slate-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 48 48"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M24 8v32M8 24h32"
              />
            </svg>
            <p className="text-center">
              Select a document<br />to view uploads
            </p>
          </div>
        )}
      </div>

      {/* Document Viewer Dialog */}
      {showViewer && (
        <Dialog open={showViewer} onOpenChange={setShowViewer}>
          <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] h-[800px]">
            <div className="h-full flex flex-col bg-white">
              <div className="flex justify-between items-center p-4 border-b border-slate-200">
                <h2 className="font-semibold text-lg text-slate-800">Document Preview</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowViewer(false)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Close
                </Button>
              </div>
              <div className="flex-1 relative">
                <iframe
                  src={viewUrl}
                  className="w-full h-full absolute inset-0"
                  title="Document Viewer"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DocumentList;
