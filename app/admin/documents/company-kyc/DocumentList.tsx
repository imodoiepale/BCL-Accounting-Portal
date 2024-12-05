// @ts-nocheck
"use client"
import React, { useState, useMemo } from 'react';
import { Eye, Download, Search, SortAsc, SortDesc, Upload, RefreshCw, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

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

// Helper function for document status
const getDocumentStatus = (daysLeft) => {
  if (daysLeft === null) return { label: 'No Expiry', color: 'bg-gray-100 text-gray-800' };
  if (daysLeft < 0) return { label: 'Expired', color: 'bg-red-100 text-red-800' };
  if (daysLeft <= 30) return { label: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Valid', color: 'bg-green-100 text-green-800' };
};

const DocumentList = () => {
  // State management
  const [selectedCompany, setSelectedCompany] = useState(null);
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

  // Fetch documents based on active tab
  const { data: documents = [] } = useQuery({
    queryKey: ['documents', activeTab],
    queryFn: async () => {
      let query = supabase.from('acc_portal_kyc').select('*');

      if (activeTab === 'KRA') {
        query = query.eq('department', 'KRA').eq('subcategory', 'kra-docs');
      } else if (activeTab === 'Sheria') {
        query = query.eq('department', 'Sheria House').eq('subcategory', 'sheria-docs');
      } else {
        query = query.eq('category', 'company-docs');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch uploads for the selected company
  const { data: uploads = [], refetch: refetchUploads } = useQuery({
    queryKey: ['uploads', selectedCompany?.id],
    enabled: !!selectedCompany,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acc_portal_kyc_uploads')
        .select('*')
        .eq('userid', selectedCompany.id.toString());
      if (error) throw error;
      return data;
    }
  });

  // Handlers
  const handleView = async (filepath) => {
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

  const handleDownload = async (filepath, filename) => {
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

  const handleSort = (field) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Memoized values
  const filteredCompanies = useMemo(() => {
    return companies.filter(company =>
      company.company_name.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [companies, companySearch]);

  const processedDocuments = useMemo(() => {
    let filtered = documents
      .filter(doc => {
        const hasUpload = uploads.some(u => u.kyc_document_id === doc.id);
        return hasUpload && doc.name.toLowerCase().includes(documentSearch.toLowerCase());
      })
      .map(doc => {
        const upload = uploads.find(u => u.kyc_document_id === doc.id);
        const expiryDate = upload?.expiry_date ? new Date(upload.expiry_date) : null;
        const daysLeft = expiryDate ? differenceInDays(expiryDate, new Date()) : null;
        
        return {
          ...doc,
          upload,
          daysLeft,
          status: getDocumentStatus(daysLeft)
        };
      });

    // Sort documents
    filtered.sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      switch (sortConfig.field) {
        case 'name':
          return direction * a.name.localeCompare(b.name);
        case 'uploadDate':
          return direction * (new Date(a.upload?.created_at || 0) - new Date(b.upload?.created_at || 0));
        case 'daysLeft':
          return direction * ((a.daysLeft || 0) - (b.daysLeft || 0));
        default:
          return 0;
      }
    });

    return filtered;
  }, [documents, uploads, documentSearch, sortConfig]);

  return (
    <div className="flex h-screen">
      {/* Companies List */}
      <div className="w-64 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-700 mb-2">Companies</h2>
          <Input
            type="text"
            placeholder="Search companies..."
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            className="w-full"
          />
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {filteredCompanies.map((company) => (
              <button
                key={company.id}
                onClick={() => setSelectedCompany(company)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedCompany?.id === company.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                {company.company_name}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Documents View */}
      <div className="flex-1 overflow-hidden">
        {selectedCompany ? (
          <div className="h-full flex flex-col">
            {/* Company Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold text-gray-800">
                  {selectedCompany.company_name}
                </h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetchUploads}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 pt-4 bg-white border-b">
              <div className="flex space-x-2">
                {['All', 'KRA', 'Sheria'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Controls */}
            <div className="p-4 bg-white border-b">
              <Input
                type="text"
                placeholder="Search documents..."
                value={documentSearch}
                onChange={(e) => setDocumentSearch(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* Documents Table */}
            <div className="flex-1 overflow-auto p-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">
                          <button
                            className="flex items-center gap-1 hover:text-blue-600"
                            onClick={() => handleSort('name')}
                          >
                            Document Name
                            {sortConfig.field === 'name' && 
                              (sortConfig.direction === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
                          </button>
                        </th>
                        <th className="text-left p-2">
                          <button
                            className="flex items-center gap-1 hover:text-blue-600"
                            onClick={() => handleSort('uploadDate')}
                          >
                            Upload Date
                            {sortConfig.field === 'uploadDate' && 
                              (sortConfig.direction === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
                          </button>
                        </th>
                        <th className="text-left p-2">Validity Period</th>
                        <th className="text-left p-2">
                          <button
                            className="flex items-center gap-1 hover:text-blue-600"
                            onClick={() => handleSort('daysLeft')}
                          >
                            Days Left
                            {sortConfig.field === 'daysLeft' && 
                              (sortConfig.direction === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
                          </button>
                        </th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-center p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedDocuments.map(doc => (
                        <tr key={doc.id} className="border-b">
                          <td className="p-2">{doc.name}</td>
                          <td className="p-2">
                            {doc.upload?.created_at ? 
                              format(new Date(doc.upload.created_at), 'dd/MM/yyyy') 
                              : '-'}
                          </td>
                          <td className="p-2">
                            {doc.upload?.issue_date && doc.upload?.expiry_date ? (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(doc.upload.issue_date), 'dd/MM/yyyy')} - {format(new Date(doc.upload.expiry_date), 'dd/MM/yyyy')}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-2">
                            {doc.daysLeft !== null ? `${doc.daysLeft} days` : 'N/A'}
                          </td>
                          <td className="p-2">
                            <Badge className={`${doc.status.color}`}>
                              {doc.status.label}
                            </Badge>
                          </td>
                          <td className="p-2 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleView(doc.upload?.filepath)}>
                                  <Eye className="w-4 h-4 mr-2" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(doc.upload?.filepath, doc.name)}>
                                  <Download className="w-4 h-4 mr-2" /> Download
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Upload className="w-4 h-4 mr-2" /> Update
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
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a company to view documents
          </div>
        )}
      </div>

      {/* Document Viewer Dialog */}
      {showViewer && (
        <Dialog open={showViewer} onOpenChange={setShowViewer}>
          <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] h-[800px]">
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="font-semibold text-lg">Document Preview</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowViewer(false)}
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