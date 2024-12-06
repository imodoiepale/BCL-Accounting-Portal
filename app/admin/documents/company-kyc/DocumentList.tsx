// @ts-nocheck
"use client"
import React, { useState, useMemo } from 'react';
import { 
  Eye, Download, Search, SortAsc, SortDesc, Upload, RefreshCw, Calendar, 
  Building2, Phone, Mail, MapPin, Globe, Info
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper function for document status
const getDocumentStatus = (daysLeft) => {
  if (daysLeft === null) {
    return { label: 'No Expiry', color: 'bg-gray-100 text-gray-800' };
  }
  if (daysLeft < 0) {
    return { label: 'Expired', color: 'bg-red-100 text-red-800' };
  }
  if (daysLeft <= 30) {
    return { label: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-800' };
  }
  return { label: 'Valid', color: 'bg-green-100 text-green-800' };
};
// Company Info Card Component
const CompanyInfoCard = ({ company }) => {
  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{company.company_name}</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                <span>{company.email || 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                <span>{company.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{company.address || 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Globe className="h-4 w-4 mr-2" />
                <span>{company.website || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DocumentList = () => {
  // State management
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [viewUrl, setViewUrl] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [documentSearch, setDocumentSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc' });

  // Fetch companies
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acc_portal_company_duplicate')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // Add documents query BEFORE filteredDocuments
  const { data: documents = [], isLoading: isLoadingDocuments, error: documentsError } = useQuery({
    queryKey: ['documents', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany?.id) return [];
      
      const { data, error } = await supabase
        .from('acc_portal_company_documents')
        .select('*')
        .eq('company_id', selectedCompany.id);
        
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany?.id
  });
  
  // Add error handling in the UI
  {documentsError && (
    <div className="text-center p-4 text-red-500">
      Error loading documents: {documentsError.message}
    </div>
  )}
  

  // Memoized values
  const filteredCompanies = useMemo(() => {
    return companies.filter(company =>
      company.company_name.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [companies, companySearch]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(documentSearch.toLowerCase());
      const matchesTab = activeTab === 'All' || doc.category === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [documents, documentSearch, activeTab]);
  


  const { data: documentUploads = [], isLoading: isLoadingUploads } = useQuery({
    queryKey: ['document-uploads', selectedDocument?.id],
    queryFn: async () => {
      if (!selectedDocument?.id) return [];
      
      const { data, error } = await supabase
        .from('acc_portal_document_uploads')
        .select('*')
        .eq('document_id', selectedDocument.id);
        
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDocument?.id
  });



  const processedDocumentUploads = useMemo(() => {
    return documentUploads.map(upload => {
      const daysLeft = upload.expiry_date 
        ? differenceInDays(new Date(upload.expiry_date), new Date())
        : null;
      
      return {
        ...upload,
        daysLeft,
        status: getDocumentStatus(daysLeft)
      };
    });
  }, [documentUploads]);


  return (
    <div className="flex h-screen bg-gray-100">
      {/* Companies List - Styled with white background */}
      <div className="w-72 border-r bg-white flex flex-col">
        <div className="p-4 border-b bg-blue-50">
          <h2 className="font-semibold text-blue-900 mb-2 flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Companies
          </h2>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search companies..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              className="w-full pl-9 border-gray-200 focus:ring-blue-500"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {filteredCompanies.map((company) => (
              <button
                key={company.id}
                onClick={() => {
                  setSelectedCompany(company);
                  setSelectedDocument(null);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                  selectedCompany?.id === company.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                  {company.company_name}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Documents List - Styled with white background */}
      <div className="w-80 border-r bg-white flex flex-col">
        {selectedCompany ? (
          <>
            <div className="p-4 border-b bg-green-50">
              <div className="flex flex-col space-y-4">
                <h2 className="font-semibold text-green-900 flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Documents
                </h2>
                <div className="flex space-x-2">
                  {['All', 'KRA', 'Sheria'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setSelectedDocument(null);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'text-green-800 hover:bg-green-100'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search documents..."
                    value={documentSearch}
                    onChange={(e) => setDocumentSearch(e.target.value)}
                    className="w-full pl-9 border-gray-200 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {isLoadingDocuments ? (
                  <div className="text-center p-4 text-gray-500">Loading documents...</div>
                ) : (
                  <div className="space-y-2">
                    {filteredDocuments.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDocument(doc)}
                        className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                          selectedDocument?.id === doc.id
                            ? 'bg-green-50 border border-green-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <span className={`font-medium ${
                            selectedDocument?.id === doc.id ? 'text-green-700' : 'text-gray-700'
                          }`}>
                            {doc.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {doc.department || 'No Department'} • {doc.category || 'No Category'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 p-4 text-center">
            <div>
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              Select a company to view documents
            </div>
          </div>
        )}
      </div>

      {/* Document Uploads View - Styled with white background */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedCompany && selectedDocument ? (
          <>
            <div className="p-6 bg-white border-b">
              <CompanyInfoCard company={selectedCompany} />
              <Separator className="my-6" />
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  {selectedDocument.name} - Uploads
                </h2>
                <div className="flex gap-4">
                  <Badge variant="outline" className="px-3 py-1">
                    {selectedDocument.department || 'No Department'}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    {selectedDocument.category || 'No Category'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {isLoadingUploads ? (
                <div className="text-center p-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                  Loading uploads...
                </div>
              ) : (
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-4 text-gray-600">Upload Date</th>
                          <th className="text-left p-4 text-gray-600">Validity Period</th>
                          <th className="text-left p-4 text-gray-600">Days Left</th>
                          <th className="text-left p-4 text-gray-600">Status</th>
                          <th className="text-center p-4 text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedDocumentUploads.map(upload => (
                          <tr key={upload.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">
                              {format(new Date(upload.created_at), 'dd/MM/yyyy')}
                            </td>
                            <td className="p-4">
                              {upload.issue_date && upload.expiry_date ? (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-blue-500" />
                                  {format(new Date(upload.issue_date), 'dd/MM/yyyy')} - 
                                  {format(new Date(upload.expiry_date), 'dd/MM/yyyy')}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="p-4">
                              {upload.daysLeft !== null ? (
                                <span className={`
                                  ${upload.daysLeft < 0 ? 'text-red-600' : 
                                    upload.daysLeft <= 30 ? 'text-yellow-600' : 
                                    'text-green-600'} font-medium
                                `}>
                                  {upload.daysLeft} days
                                </span>
                              ) : 'N/A'}
                            </td>
                            <td className="p-4">
                              <Badge className={`${upload.status.color}`}>
                                {upload.status.label}
                              </Badge>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleView(upload.filepath)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownload(upload.filepath, selectedDocument.name)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
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
          <div className="h-full flex items-center justify-center text-gray-500 p-4 text-center">
            <div>
              <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              Select a document to view uploads
            </div>
          </div>
        )}
      </div>

      {/* Document Viewer Dialog - Enhanced styling */}
      {showViewer && (
        <Dialog open={showViewer} onOpenChange={setShowViewer}>
          <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] h-[800px]">
            <div className="h-full flex flex-col bg-white rounded-lg overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <h2 className="font-semibold text-lg text-gray-900">Document Preview</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowViewer(false)}
                  className="text-gray-600 hover:text-gray-700"
                >
                  Close
                </Button>
              </div>
              <div className="flex-1 relative">
              <iframe
                  src={viewUrl}
                  className="w-full h-full absolute inset-0 border-0"
                  title="Document Viewer"
                />
                {/* Add document info sidebar */}
                <div className="absolute top-0 right-0 w-80 h-full bg-white border-l shadow-lg p-4 overflow-y-auto">
                  <div className="space-y-6">
                    {/* Company Info Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Company Details</h3>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedCompany.company_name}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedCompany.email || 'N/A'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedCompany.phone || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Document Info Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Document Details</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-500">Name</span>
                          <p className="text-sm text-gray-900">{selectedDocument.name}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Department</span>
                          <p className="text-sm text-gray-900">{selectedDocument.department || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Category</span>
                          <p className="text-sm text-gray-900">{selectedDocument.category || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Quick Actions */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleDownload(viewUrl, selectedDocument.name)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Document
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Update Document
                        </Button>
                      </div>
                    </div>

                    {/* Document Status */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Status Information</h3>
                      <div className="space-y-2">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Upload Date</span>
                            <span className="text-sm font-medium text-gray-900">
                              {format(new Date(), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </div>
                        {selectedDocument.expiry_date && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Expiry Date</span>
                              <span className="text-sm font-medium text-gray-900">
                                {format(new Date(selectedDocument.expiry_date), 'dd/MM/yyyy')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DocumentList;