// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/lib/supabaseClient';
import { Input } from "@/components/ui/input";
import { Eye, Upload, MoreVertical, Plus, Edit2, Settings, Trash2, CheckCircle, DownloadIcon, UploadIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useVirtualizer } from '@tanstack/react-virtual';
import toast, { Toaster } from 'react-hot-toast';
import { Card } from '@/components/ui/card';

// Interfaces
interface Upload {
  id: string;
  userid: string;
  kyc_document_id: string;
  filepath: string;
  issue_date: string;
  expiry_date?: string;
  value?: Record<string, any>; // Change this to a more flexible type
  extracted_details?: Record<string, any>; // Add this new column
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
  last_extracted_details?: Record<string, any>; // New column for storing last extracted details
}

// Utility function to generate unique IDs
const generateId = () => crypto.randomUUID();

// Extract Details Modal Component
const ExtractDetailsModal = ({ isOpen, onClose, document, upload, onSubmit }) => {
  const [extractedData, setExtractedData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const extractDetails = async (imageUrl) => {
    setIsLoading(true);
    try {
      const url = 'https://api.hyperbolic.xyz/v1/chat/completions';

      // Create a prompt that specifically requests field values
      const fieldPrompt = document.fields?.map(f => f.name).join(', ');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJpamVwYWxlQGdtYWlsLmNvbSIsImlhdCI6MTczMTUxNDExMX0.DZf2t6fUGiVQN6FXCwLOnRG2Yx48aok1vIH00sKhWS4',
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2-VL-72B-Instruct',
          messages: [
            {
              role: 'system',
              content: `You are an advanced document analysis assistant capable of extracting specific information accurately and presenting it in structured JSON format. When given a prompt detailing required fields, you must ensure:
              - The document is carefully analyzed for completeness and accuracy.
              - Only the specified fields are extracted with no omissions or extra data.
              - The output is returned as a valid JSON object with keys matching the requested field names.`
            }
            ,
            {
              role: 'user',
              content: [
                {
                  type: "text",
                  text: `Analyze the provided document and extract the following fields (respond strictly in JSON format):
            
                  Fields to extract: ${fieldPrompt}
            
                  Ensure:
                  - Field names in the JSON match exactly with the provided list.
                  - Each field has a value extracted from the document or is explicitly marked as null if not found.
                  - The JSON output is properly formatted with no additional commentary or errors.
            
                  Example Response:
                  {
                    "field1": "value1",
                    "field2": "value2",
                    "field3": null
                  }`
                },
                {
                  type: "image_url",
                  image_url: { url: imageUrl }
                }
              ]
            }
          ],
          max_tokens: 512,
          temperature: 0.1,
          top_p: 0.01,
          stream: false
        }),
      });

      const json = await response.json();
      const output = json.choices[0].message.content;

      // Try to parse the response as JSON
      let parsedData = {};
      try {
        // First, try to find a JSON object in the response
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback to parsing line by line
          const lines = output.split('\n');
          lines.forEach(line => {
            const [key, value] = line.split(':').map(str => str.trim());
            if (key && value) {
              parsedData[key] = value;
            }
          });
        }
      } catch (error) {
        console.error('Error parsing extraction response:', error);
        toast.error('Error parsing extracted data');
      }

      // Map the parsed data to fields
      const mappedData = {};
      document.fields?.forEach(field => {
        mappedData[field.name] = parsedData[field.name] || '';
      });

      console.log('Extracted and mapped data:', mappedData); // Debug log
      setExtractedData(mappedData);

    } catch (error) {
      console.error('Extraction error:', error);
      toast.error('Failed to extract details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && upload) {
      const getSignedUrl = async () => {
        try {
          const { data, error } = await supabase
            .storage
            .from('kyc-documents')
            .createSignedUrl(upload.filepath, 60);

          if (error) {
            throw error;
          }

          await extractDetails(data.signedUrl);
        } catch (error) {
          console.error('Error getting signed URL:', error);
          toast.error('Failed to access document');
        }
      };

      getSignedUrl();
    }
  }, [isOpen, upload]);



  // Helper function to format field value based on type
  const formatFieldValue = (value, type) => {
    switch (type) {
      case 'date':
        return value ? new Date(value).toISOString().split('T')[0] : '';
      case 'number':
        return value ? parseFloat(value) : '';
      default:
        return value || '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Extracted Details Preview</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {document.fields?.map((field) => (
              <div key={field.id} className="space-y-2">
                <label className="text-sm font-medium">{field.name}</label>
                {field.type === 'date' ? (
                  <Input
                    type="date"
                    value={formatFieldValue(extractedData[field.name], field.type)}
                    onChange={(e) => setExtractedData(prev => ({
                      ...prev,
                      [field.name]: e.target.value
                    }))}
                  />
                ) : field.type === 'number' ? (
                  <Input
                    type="number"
                    value={formatFieldValue(extractedData[field.name], field.type)}
                    onChange={(e) => setExtractedData(prev => ({
                      ...prev,
                      [field.name]: e.target.value
                    }))}
                  />
                ) : (
                  <Input
                    type="text"
                    value={extractedData[field.name] || ''}
                    onChange={(e) => setExtractedData(prev => ({
                      ...prev,
                      [field.name]: e.target.value
                    }))}
                  />
                )}
              </div>
            ))}

            <DialogFooter>
              <Button
                onClick={() => {
                  console.log('Submitting data:', extractedData); // Debug log
                  onSubmit(extractedData);
                }}
              >
                Save Details
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};


const handleExtractSubmit = (extractedData) => {
  console.log('Submitting data:', extractedData);
  if (!selectedExtractUpload?.id || !selectedExtractDocument?.id) {
    toast.error('Please select a document and upload');
    return;
  }

  extractionMutation.mutate({
    uploadId: selectedExtractUpload.id,
    documentId: selectedExtractDocument.id,
    extractedData
  });
};


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
          <DialogFooter>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Document Action Cell Component
const DocumentActionCell = ({ company, document, upload, onView, onUpload, onExtract }) => {
  return (
    <div className="flex items-center justify-center">
      {upload && (
        <CheckCircle className="text-green-500 h-4 w-4 mr-2" />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-6 w-6 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {upload ? (
            <>
              <DropdownMenuItem onClick={() => onView(document, company)}>
                <Eye className="mr-2 h-4 w-4" />
                View Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExtract(document, upload)}>
                <Eye className="mr-2 h-4 w-4" />
                Extract Details
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={() => onUpload(company.id, document.id)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
                    value={field.name} onChange={(e) => updateField(field.id, 'name', e.target.value)}
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
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [selectedExtractDocument, setSelectedExtractDocument] = useState(null);
  const [selectedExtractUpload, setSelectedExtractUpload] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
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

  // Extract Details Mutation
  const extractionMutation = useMutation({
    mutationFn: async ({ uploadId, extractedData, documentId }) => {
      // Validate inputs
      if (!uploadId || !documentId) {
        throw new Error('Upload ID or Document ID is undefined');
      }

      // Prepare the data for storage
      const sanitizedData = Object.entries(extractedData).reduce((acc, [key, value]) => {
        // Ensure all values are properly serialized
        acc[key] = value === '' ? null : value;
        return acc;
      }, {});

      // Update the upload record with the extracted details
      const uploadUpdateResult = await supabase
        .from('acc_portal_kyc_uploads')
        .update({
          extracted_details: sanitizedData
        })
        .eq('id', uploadId)
        .select()
        .single();

      if (uploadUpdateResult.error) throw uploadUpdateResult.error;

      // Update the document with last extracted details
      const documentUpdateResult = await supabase
        .from('acc_portal_kyc')
        .update({
          last_extracted_details: sanitizedData
        })
        .eq('id', documentId)
        .select()
        .single();

      if (documentUpdateResult.error) throw documentUpdateResult.error;

      return {
        upload: uploadUpdateResult.data,
        document: documentUpdateResult.data
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['uploads']);
      queryClient.invalidateQueries(['documents']);
      setShowExtractModal(false);
      toast.success('Details extracted and saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save extracted details');
      console.error('Extraction save error:', error);
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

  const handleExtractClick = (document, upload) => {
    setSelectedExtractDocument(document);
    setSelectedExtractUpload(upload);
    setShowExtractModal(true);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCompanies = React.useMemo(() => {
    if (!sortConfig.key) return companies;
    return [...companies].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [companies, sortConfig]);

  return (
    <div className="flex overflow-hidden">
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
            <ul>
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className={`px-2 py-1 rounded flex items-center justify-between text-xs ${selectedDocument?.id === doc.id
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
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right side - Company Fields Table */}
      <div className="flex-1 flex flex-col h-[800px] overflow-hidden">
        {selectedDocument ? (
          <div className="flex flex-col h-full">
            <h2 className="text-sm font-bold p-2 border-b">
              {selectedDocument.name} - Details
            </h2>

            <div className="overflow-auto flex-1">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow className="text-[11px] bg-blue-100">
                      <TableHead className="sticky top-0 left-0 bg-blue-100 z-10">#</TableHead>
                      <TableHead className="sticky top-0 left-0 bg-blue-100 z-10">Company</TableHead>
                      <TableHead className="sticky top-0 bg-blue-100 z-10">Actions</TableHead>
                      {selectedDocument.fields?.map((field) => (
                        <TableHead
                          key={field.id}
                          className="text-center sticky top-0 bg-blue-100 z-10 cursor-pointer"
                          onClick={() => handleSort(field.name)}
                        >
                          {field.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-[11px]">
                    {sortedCompanies.map((company, index) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium sticky left-0 bg-white">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium sticky left-0 bg-white">
                          {company.company_name}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-2">
                            {uploads.some(u => u.kyc_document_id === selectedDocument.id && u.userid === company.id.toString()) ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewDocument(selectedDocument, company)}
                                  title="View Document"
                                >
                                  <Eye className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleExtractClick(selectedDocument, uploads.find(u => u.kyc_document_id === selectedDocument.id && u.userid === company.id.toString()))}
                                  title="Extract Details"
                                >
                                  <DownloadIcon className="h-4 w-4 text-green-500" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUploadClick(company.id, selectedDocument.id)}
                                title="Upload Document"
                              >
                                <UploadIcon className="h-4 w-4 text-orange-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        {selectedDocument.fields?.map((field) => {
                          const upload = uploads.find(u =>
                            u.kyc_document_id === selectedDocument.id &&
                            u.userid === company.id.toString()
                          );
                          return (
                            <TableCell key={field.id} className="text-center">
                              <span>{upload?.extracted_details?.[field.name] || '-'}</span>
                            </TableCell>
                          );
                      
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
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

      {showExtractModal && selectedExtractDocument && selectedExtractUpload && (
        <ExtractDetailsModal
          isOpen={showExtractModal}
          onClose={() => setShowExtractModal(false)}
          document={selectedExtractDocument}
          upload={selectedExtractUpload}
          onSubmit={(extractedData) => {
            extractionMutation.mutate({
              uploadId: selectedExtractUpload.id,
              documentId: selectedExtractDocument.id,
              extractedData
            });
          }}
        />
      )}
    </div>
  );
}