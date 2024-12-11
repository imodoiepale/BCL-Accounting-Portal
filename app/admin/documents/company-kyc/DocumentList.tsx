// @ts-nocheck
"use client"
import React, { useEffect, useState, useMemo } from 'react';
import { Eye, Download, Search, Upload, RefreshCw, Mail, Phone, Send, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { SendDocumentModal } from './components/SendDocumentModal';
import toast, { Toaster } from 'react-hot-toast';

import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

import { DocumentViewer } from './Doc-viewer-list';

// Types
interface Company {
  id: number;
  company_name: string;
  current_communication_email?: string;
  phone?: string;
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
  selected?: boolean;
}

const DocumentList = () => {
  // State management
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [documentSearch, setDocumentSearch] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedUploads, setSelectedUploads] = useState<Upload[]>([]);
  const [showSendingStatus, setShowSendingStatus] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendingDetails, setSendingDetails] = useState({
    documentName: '',
    companyName: '',
    recipient: '',
    sendingMethod: ''
  });

  // Add this utility function near the top of the file
  const truncateFilename = (filename, maxLength = 20) => {
    if (filename.length <= maxLength) return filename;
    const extension = filename.split('.').pop();
    const nameWithoutExt = filename.slice(0, -(extension.length + 1));
    const truncatedName = nameWithoutExt.slice(0, maxLength - 3) + '...';
    return `${truncatedName}.${extension}`;
  };

  // Query Hooks
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acc_portal_company_duplicate')
        .select('id, company_name, current_communication_email, phone');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ['documents', activeTab, selectedCompany?.id],
    enabled: !!selectedCompany,
    queryFn: async () => {
      let query = supabase.from('acc_portal_kyc').select('*');

      if (activeTab === 'KRA') {
        query = query.eq('department', 'KRA').eq('subcategory', 'kra-docs');
      } else if (activeTab === 'Sheria') {
        query = query.eq('department', 'Sheria House').eq('subcategory', 'sheria-docs');
      } else if (activeTab === 'All') {
        query = query.eq('category', 'company-docs');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  const handleBulkSend = (method) => {
    if (method === 'email' && !selectedCompany?.current_communication_email) {
      toast.error('No email address available for this company');
      return;
    }
    if (method === 'whatsapp' && !selectedCompany?.phone) {
      toast.error('No phone number available for this company');
      return;
    }
  
    setSendingDetails({
      documentName: `${selectedUploads.length} documents`,
      companyName: selectedCompany.company_name,
      recipient: method === 'email' ? selectedCompany.current_communication_email : selectedCompany.phone,
      sendingMethod: method
    });
    setShowSendingStatus(true);
  };

  const handleEmailSend = async (documentName) => {
    // If documentName is null, we're sending multiple documents
    const docs = documentName ?
      documentUploads.filter(doc => doc.filepath.split('/').pop()?.split('.')[0] === documentName) :
      selectedUploads;

    setSendingDetails({
      documentName: documentName || `${docs.length} documents`,
      companyName: selectedCompany.company_name,
      recipient: selectedCompany.current_communication_email || '',
      sendingMethod: 'email'
    });
    setShowSendingStatus(true);
  };

  const handleWhatsAppSend = async (documentName) => {
    const docs = documentName ?
      documentUploads.filter(doc => doc.filepath.split('/').pop()?.split('.')[0] === documentName) :
      selectedUploads;

    setSendingDetails({
      documentName: documentName || `${docs.length} documents`,
      companyName: selectedCompany.company_name,
      recipient: selectedCompany.phone || '',
      sendingMethod: 'whatsapp'
    });
    setShowSendingStatus(true);
  };

  // Add new function to handle the actual sending
  const handleConfirmSend = async (recipient, newFileName, sendingMethod, documents) => {
    setIsSending(true);

    try {
      // Handle bulk sending by generating unique filenames for each document
      const documentsToSend = documents.map(doc => {
        const originalFileName = doc.filepath.split('/').pop();
        const extension = originalFileName.split('.').pop();
        // If sending multiple documents, use original filenames with company prefix
        const finalFileName = documents.length > 1
          ? `${selectedCompany.company_name}_${originalFileName}`
          : `${newFileName}.${extension}`;

        return {
          ...doc,
          filename: finalFileName
        };
      });

      const endpoint = sendingMethod === 'email' ? '/api/send-email' : '/api/send-whatsapp';
      const payload = sendingMethod === 'email' ? {
        to: recipient,
        subject: `Documents from ${selectedCompany.company_name}`,
        html: `<p>Please find attached the requested documents for ${selectedCompany.company_name}.</p>`,
        documents: documentsToSend,
        companyName: selectedCompany.company_name
      } : {
        phone: recipient,
        documents: documentsToSend,
        companyName: selectedCompany.company_name
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to send via ${sendingMethod}`);
      }
      toast.success(`Documents sent successfully via ${sendingMethod}`);
      setShowSendingStatus(false);
    } catch (error) {
      console.error(`Error sending ${sendingMethod}:`, error);
      toast.error(`Failed to send documents via ${sendingMethod}`);
    } finally {
      setIsSending(false);
    }
  };
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

  // Filter functions
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

  // Document handling functions
  const handleView = async (filepath: string) => {
    try {
      const { data, error } = await supabase.storage
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
      const { data, error } = await supabase.storage
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

  const toggleUploadSelection = (upload: Upload) => {
    setSelectedUploads(prev => {
      const isSelected = prev.some(u => u.id === upload.id);
      if (isSelected) {
        return prev.filter(u => u.id !== upload.id);
      }
      return [...prev, upload];
    });
  };

  // Updated document section render function
  const renderDocumentSection = (documents: Upload[]) => {
    const groupDocuments = () => {
      const groups: { [key: string]: { pdf?: Upload; image?: Upload } } = {};

      documents.forEach(doc => {
        const extension = doc.filepath.split('.').pop()?.toLowerCase() || '';
        const nameWithoutExt = doc.filepath.split('/').pop()?.split('.')[0] || '';

        if (!groups[nameWithoutExt]) {
          groups[nameWithoutExt] = {};
        }

        if (extension === 'pdf') {
          groups[nameWithoutExt].pdf = doc;
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
          groups[nameWithoutExt].image = doc;
        }
      });

      return groups;
    };

    const documentGroups = groupDocuments();

    return (
      <div className="mb-8">
        <Card className="border-slate-200">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="p-4 text-sm font-medium text-slate-700 w-10">
                    <Checkbox
                      checked={selectedUploads.length === documents.length && documents.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUploads(documents);
                        } else {
                          setSelectedUploads([]);
                        }
                      }}
                    />
                  </th>
                  <th className="p-4 text-sm font-medium text-slate-700">Document Name</th>
                  <th className="p-4 text-sm font-medium text-slate-700">PDF Document</th>
                  <th className="p-4 text-sm font-medium text-slate-700">Image Document</th>
                  <th className="text-center p-4 text-sm font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(documentGroups).map(([name, group], index) => {
                  const originalName = group.pdf?.filepath.split('/').pop() ||
                    group.image?.filepath.split('/').pop() || '';
                  const isSelected = selectedUploads.some(u =>
                    u.filepath.split('/').pop()?.split('.')[0] === name
                  );

                  return (
                    <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const docs = Object.values(group).filter(Boolean);
                            if (checked) {
                              setSelectedUploads(prev => [...prev, ...docs]);
                            } else {
                              setSelectedUploads(prev =>
                                prev.filter(u =>
                                  u.filepath.split('/').pop()?.split('.')[0] !== name
                                )
                              );
                            }
                          }}
                        />
                      </td>
                      <td className="p-4">
                        <div className="text-sm" title={originalName}>
                          {truncateFilename(originalName)}
                        </div>
                      </td>
                      <td className="p-4">
                        {group.pdf && (
                          <div className="flex justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(group.pdf.filepath)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title={group.pdf.filepath.split('/').pop()}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {group.image && (
                          <div className="flex justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(group.image.filepath)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title={group.image.filepath.split('/').pop()}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEmailSend(name)}
                            className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                            title="Send via Email"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWhatsAppSend(name)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Send via WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    );
  };



  const SendingStatusModal = ({
    isOpen,
    onClose,
    documentName,
    companyName,
    recipient,
    sendingMethod,
    onSend,
    isSending
  }) => {
    const [editedRecipient, setEditedRecipient] = useState(recipient);
    const [newFileName, setNewFileName] = useState('');
    const [showError, setShowError] = useState(false);
  
    useEffect(() => {
      if (isOpen) {
        setEditedRecipient(recipient);
        // Only set filename for single document sends
        if (!documentName.includes('documents')) {
          setNewFileName(`${companyName}_${documentName}`);
        }
        setShowError(false);
      }
    }, [isOpen, recipient, companyName, documentName]);
  
    const validateInput = () => {
      if (sendingMethod === 'email') {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedRecipient);
      } else {
        return /^\+?[\d\s-]{10,}$/.test(editedRecipient);
      }
    };
  
    const handleSend = () => {
      if (!editedRecipient || !validateInput()) {
        setShowError(true);
        return;
      }
      onSend(editedRecipient, newFileName);
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">
              {documentName.includes('documents') ? 'Send Multiple Documents' : 'Send Document'}
            </DialogTitle>
          </DialogHeader>
  
          <div className="space-y-6 py-4">
            {/* Company and Document Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-green-600">Company Name</Label>
                <div className="mt-1 text-sm text-slate-800 font-medium">{companyName}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-green-600">Documents</Label>
                <div className="mt-1 text-sm text-slate-800 font-medium">{documentName}</div>
              </div>
            </div>
  
            {/* Only show filename input for single document */}
            {!documentName.includes('documents') && (
              <div className="space-y-2">
                <Label htmlFor="newFileName" className="text-sm font-medium text-green-600">
                  New Filename
                </Label>
                <Input
                  id="newFileName"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            )}
  
            {/* Recipient Input */}
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-sm font-medium text-slate-700">
                {sendingMethod === 'email' ? 'Email Address' : 'Phone Number'}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {sendingMethod === 'email' ? (
                    <Mail className="h-4 w-4 text-blue-500" />
                  ) : (
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <Input
                  id="recipient"
                  type={sendingMethod === 'email' ? 'email' : 'tel'}
                  value={editedRecipient}
                  onChange={(e) => {
                    setEditedRecipient(e.target.value);
                    setShowError(false);
                  }}
                  className={`w-full pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500 ${
                    showError ? 'border-red-500 ring-red-200' : ''
                  }`}
                  placeholder={
                    sendingMethod === 'email' 
                      ? 'email@example.com' 
                      : '+254123456789'
                  }
                />
              </div>
              {showError && (
                <div className="text-sm text-red-600 mt-1">
                  Please enter a valid {sendingMethod === 'email' ? 'email address' : 'phone number'}
                </div>
              )}
            </div>
  
            {/* Send Instructions */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                {documentName.includes('documents') ? 'Bulk Send Information' : 'Send Information'}
              </h4>
              <ul className="text-sm text-slate-600 space-y-1">
                {documentName.includes('documents') ? (
                  <>
                    <li>• All documents will be prefixed with the company name</li>
                    <li>• Each document will maintain its original extension</li>
                    <li>• Documents will be sent as individual attachments</li>
                  </>
                ) : (
                  <>
                    <li>• Document will be renamed as specified above</li>
                    <li>• Original file extension will be preserved</li>
                  </>
                )}
                <li>• {sendingMethod === 'email' 
                  ? 'Document(s) will be sent as email attachment(s)' 
                  : 'Document(s) will be sent as WhatsApp message(s)'}</li>
              </ul>
            </div>
          </div>
  
          <DialogFooter className="sm:justify-between border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSending}
              className="text-slate-600 hover:text-slate-700 border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!validateInput() || isSending}
              className={`bg-blue-600 hover:bg-blue-700 text-white ${
                isSending ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSending ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </div>
              ) : (
                <>
                  Send via {sendingMethod === 'email' ? 'Email' : 'WhatsApp'}
                  {documentName.includes('documents') && ` (${documentName})`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };


  // Main render
  return (

    <div className="flex h-screen bg-slate-50">
      {/* Companies List Column */}
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
                  <span className="text-slate-400 mt-0.5 text-[10px]">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="flex-1">{company.company_name}</span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Documents List Column */}
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
                        <span className="text-slate-400 mt-0.5 text-[10px]">
                          {(index + 1).toString().padStart(2, '0')}
                        </span>
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
            <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 8h32v32H8z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 16h16M16 24h16M16 32h8" />
            </svg>
            <p className="text-center">Select a company<br />to view documents</p>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedDocument ? (
          <>
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-semibold text-slate-800 text-sm">
                    <span className="text-blue-600">{selectedDocument.name}</span>
                    <span className="text-slate-500"> for </span>
                    <span className="text-green-600">{selectedCompany?.company_name}</span>
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">Document Uploads</p>
                </div>
                <div className="flex space-x-3">
                  {selectedUploads.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSendModal(true)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Send Selected ({selectedUploads.length})
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    New Upload
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {isLoadingUploads ? (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  Loading uploads...
                </div>
              ) : (
                renderDocumentSection(documentUploads)
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-slate-500">
            <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M24 8v32M8 24h32" />
            </svg>
            <p className="text-center">Select a document<br />to view uploads</p>
          </div>
        )}

        <div className="flex space-x-3">
          {selectedUploads.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkSend('email')}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Selected ({selectedUploads.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkSend('whatsapp')}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp Selected ({selectedUploads.length})
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            New Upload
          </Button>
        </div>
      </div>

      {/* Modals */}
      {showViewer && viewUrl && (
        <Dialog open={true} onOpenChange={() => setShowViewer(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedDocument?.name || 'Document'} Preview
              </DialogTitle>
            </DialogHeader>
            <DocumentViewer url={viewUrl} onClose={() => setShowViewer(false)} />
          </DialogContent>
        </Dialog>
      )}


      <SendingStatusModal
        isOpen={showSendingStatus}
        onClose={() => setShowSendingStatus(false)}
        {...sendingDetails}
        isSending={isSending}
        onSend={(recipient, newFileName) =>
          handleConfirmSend(
            recipient,
            newFileName,
            sendingDetails.sendingMethod,
            documentUploads.filter(doc =>
              doc.filepath.split('/').pop()?.split('.')[0] === sendingDetails.documentName
            )
          )
        }
      />
    </div>
  );
};

export default DocumentList;