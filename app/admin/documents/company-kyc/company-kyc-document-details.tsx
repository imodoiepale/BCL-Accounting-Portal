// @ts-nocheck
'use client'

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/lib/supabaseClient';
import { Input } from "@/components/ui/input";
import { Eye, Upload, MoreVertical, Plus, Edit2, Settings, Trash2, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useVirtualizer } from '@tanstack/react-virtual';
import toast, { Toaster } from 'react-hot-toast';

// Interfaces
interface Upload {
  id: string;
  userid: string;
  kyc_document_id: string;
  filepath: string;
  issue_date: string;
  expiry_date?: string;
  value?: string;
}

interface Company {
  id: number;
  company_name: string;
}

interface Document {
  id: string;
  name: string;
  fields?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

// Utility function to generate unique IDs
const generateId = () => crypto.randomUUID();

// Document Actions Component
const DocumentActions = ({ document, onAddField, onUpdateFields }) => {
  const [isManageFieldsOpen, setIsManageFieldsOpen] = useState(false);
  const [fields, setFields] = useState(document.fields || []);

  const handleFieldChange = (id, key, value) => {
    setFields(prevFields =>
      prevFields.map(field => (field.id === id ? { ...field, [key]: value } : field))
    );
  };

  const handleDeleteField = (id) => {
    setFields(prevFields => prevFields.filter(field => field.id !== id));
  };

  const handleSaveChanges = () => {
    onUpdateFields(document.id, fields);
    setIsManageFieldsOpen(false);
    toast.success('Fields updated successfully');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-transparent">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={onAddField}>
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsManageFieldsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Manage Fields
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Document
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Manage Fields Dialog */}
      <Dialog open={isManageFieldsOpen} onOpenChange={setIsManageFieldsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Fields for {document.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {fields.map((field) => (
              <div key={field.id} className="flex gap-2 items-start p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="text-sm font-medium">Field Name</label>
                  <Input
                    value={field.name}
                    onChange={(e) => handleFieldChange(field.id, 'name', e.target.value)}
                    placeholder="Enter field name"
                    className="mt-1"
                  />
                </div>
                <div className="w-1/3">
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => handleFieldChange(field.id, 'type', e.target.value)}
                    className="w-full mt-1 border rounded-md p-2"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="file">File</option>
                  </select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6"
                  onClick={() => handleDeleteField(field.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter className="flex justify-end items-center">
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Document Action Cell Component
const DocumentActionCell = ({ company, document, upload, onView, onUpload }) => {
  return (
    <div className="flex items-center justify-center">
      {upload && (
        <CheckCircle className="text-green-500 h-4 w-4 mr-2" /> // Render the icon if the document exists
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-6 w-6 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {upload ? (
            <DropdownMenuItem onClick={() => onView(document, company)}>
              <Eye className="mr-2 h-4 w-4" />
              View Document
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onUpload(company.id, document.id)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </DropdownMenuItem>
          )}
          <DropdownMenuItem>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Details
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Eye className="mr-2 h-4 w-4" />
            Extract Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Add Fields Dialog Component
const AddFieldsDialog = ({ isOpen, onClose, document, onSubmit }) => {
  const [fields, setFields] = useState([{ id: generateId(), name: '', type: 'text' }]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validFields = fields.filter(field => field.name.trim() !== '');
    
    if (validFields.length === 0) {
      toast.error('Please add at least one field');
      return;
    }

    onSubmit(document.id, validFields);
  };

  const addField = () => {
    setFields(prev => [...prev, { id: generateId(), name: '', type: 'text' }]);
  };

  const removeField = (id) => {
    if (fields.length === 1) return;
    setFields(prev => prev.filter(field => field.id !== id));
  };

  const updateField = (id, key, value) => {
    setFields(prev => prev.map(field => 
      field.id === id ? { ...field, [key]: value } : field
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Fields for {document?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {fields.map((field) => (
              <div key={field.id} className="flex gap-2 items-start p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="text-sm font-medium">Field Name</label>
                  <Input
                    value={field.name}
                    onChange={(e) => updateField(field.id, 'name', e.target.value)}
                    placeholder="Enter field name"
                    className="mt-1"
                  />
                </div>
                <div className="w-1/3">
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(field.id, 'type', e.target.value)}
                    className="w-full mt-1 border rounded-md p-2"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="file">File</option>
                  </select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6"
                  onClick={() => removeField(field.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={addField}
              className="ml-auto mr-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Another Field
            </Button>
            <Button type="submit">Save Fields</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Upload Modal Component
const UploadModal = ({ isOpen, onClose, onUpload, company, document }) => {
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file || !issueDate) {
      toast.error('Please fill all required fields');
      return;
    }
    onUpload({
      companyId: company.id,
      documentId: document.id,
      file,
      issueDate,
      expiryDate: expiryDate || undefined
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document for {company?.company_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Document File</label>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0])}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Issue Date</label>
            <Input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expiry Date (Optional)</label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">Upload</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// View Modal Component
const ViewModal = ({ url, onClose }) => {
  if (!url) return null;

  return (
    <Dialog open={!!url} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Document Preview</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-[500px]">
          <iframe src={url} className="w-full h-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
export default function CompanyKycDocumentDetails() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewUrl, setViewUrl] = useState(null);
  const [selectedUploadCompany, setSelectedUploadCompany] = useState(null);
  const queryClient = useQueryClient();
  const parentRef = useRef();

  // Debounce search updates
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Companies Query
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

  // Documents Query
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acc_portal_kyc')
        .select('*')
        .eq('category', 'company-docs');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Uploads Query
  const { data: uploads = [], isLoading: isLoadingUploads } = useQuery({
    queryKey: ['uploads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acc_portal_kyc_uploads')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Update Fields Mutation
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

  // Upload Document Mutation
  const uploadMutation = useMutation({
    mutationFn: async ({
      companyId,
      documentId,
      file,
      issueDate,
      expiryDate
    }) => {
      try {
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
          issue_date: issueDate,
          expiry_date: expiryDate || null
        };

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
      queryClient.invalidateQueries(['uploads']);
      setShowUploadModal(false);
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      toast.error('Failed to upload document');
      console.error('Upload error:', error);
    }
  });

  // Handlers
  const handleViewDocument = async (document, company) => {
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

  const handleUploadClick = (companyId, documentId) => {
    setSelectedUploadCompany(companies.find(c => c.id === companyId));
    setShowUploadModal(true);
  };

  // Virtual list for documents
  const rowVirtualizer = useVirtualizer({
    count: documents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Left sidebar - Documents List */}
      <div className="w-1/5 min-w-[200px] border-r overflow-hidden flex flex-col">
        <div className="p-2">
          <h2 className="text-sm font-bold mb-2">Documents</h2>
          <Input 
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2 h-8 text-xs"
          />
        </div>
        
        <div ref={parentRef} className="overflow-y-auto flex-1">
          {isLoadingDocuments ? (
            <div className="p-2 text-xs">Loading documents...</div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const doc = documents[virtualRow.index];
                return (
                  <div
                    key={doc.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <li
                      className={`px-2 py-1 rounded flex items-center justify-between text-xs ${
                        selectedDocument?.id === doc.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span 
                        className="cursor-pointer flex-1"
                        onClick={() => setSelectedDocument(doc)}
                      >
                        {doc.name}
                      </span>
                      <DocumentActions 
                        document={doc}
                        onAddField={() => {
                          setSelectedDocument(doc);
                          setIsAddFieldOpen(true);
                        }}
                        onUpdateFields={(documentId, fields) => {
                          updateFieldsMutation.mutate({ documentId, fields });
                        }}
                      />
                    </li>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Company Fields Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedDocument ? (
          <div className="flex flex-col h-full">
            <h2 className="text-sm font-bold p-2 border-b">
              {selectedDocument.name} - Details
            </h2>
            
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="text-[11px]">
                    <TableHead className="sticky top-0 bg-white z-10">Fields</TableHead>
                    {companies.map((company) => (
                      <TableHead key={company.id} className="text-center whitespace-nowrap sticky top-0 bg-white z-10">
                        <div className="relative group">
                          <span>{company.company_name.split(' ')[0]}</span>
                          <span className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-gray-800 text-white p-1 rounded text-[10px] whitespace-nowrap z-50">
                            {company.company_name}
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="text-[11px]">
                  {/* File row */}
                  <TableRow>
                    <TableCell className="font-medium sticky left-0 bg-white">
                      File
                    </TableCell>
                    {companies.map((company) => {
                      const upload = uploads.find(u => 
                        u.kyc_document_id === selectedDocument.id && 
                        u.userid === company.id.toString()
                      );
                      return (
                        <TableCell key={company.id} className="text-center">
                          <DocumentActionCell
                            company={company}
                            document={selectedDocument}
                            upload={upload}
                            onView={handleViewDocument}
                            onUpload={handleUploadClick}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  
                  {/* Fields rows */}
                  {selectedDocument.fields?.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell className="font-medium sticky left-0 bg-white">
                        {field.name}
                      </TableCell>
                      {companies.map((company) => {
                        const upload = uploads.find(u => 
                          u.kyc_document_id === selectedDocument.id && 
                          u.userid === company.id.toString()
                        );
                        return (
                          <TableCell key={company.id} className="text-center">
                            <span>{upload?.value || '-'}</span>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
    </div>
  );
}