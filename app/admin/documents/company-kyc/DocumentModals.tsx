// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';

// Utility function
const generateId = () => crypto.randomUUID();

// Extract Details Modal Component
export const ExtractDetailsModal = ({ isOpen, onClose, document, upload, onSubmit }) => {
  const [extractedData, setExtractedData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const extractDetails = async (fileUrl) => {
    setIsLoading(true);
    try {
      const url = 'https://api.hyperbolic.xyz/v1/chat/completions';
      const fieldPrompt = document.fields?.map(f => f.name).join(', ');
      const fileType = fileUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
  
      let content = [];
      if (fileType === 'pdf') {
        const pdfResponse = await fetch(fileUrl);
        const pdfData = await pdfResponse.blob();
        content = [
          {
            type: "text",
            text: `Extract the following fields from the PDF document: ${fieldPrompt}`
          },
          {
            type: "file",
            file: pdfData
          }
        ];
      } else {
        content = [
          {
            type: "text",
            text: `Extract the following fields from the image: ${fieldPrompt}`
          },
          {
            type: "image_url",
            image_url: { url: fileUrl }
          }
        ];
      }
  
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer YOUR_API_KEY',
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2-VL-72B-Instruct',
          messages: [
            {
              role: 'system',
              content: `You are an advanced document analysis assistant. Extract information accurately and return it in JSON format.`
            },
            {
              role: 'user',
              content
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

      let parsedData = {};
      try {
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
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

      const mappedData = {};
      document.fields?.forEach(field => {
        mappedData[field.name] = parsedData[field.name] || '';
      });

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

          if (error) throw error;
          await extractDetails(data.signedUrl);
        } catch (error) {
          console.error('Error getting signed URL:', error);
          toast.error('Failed to access document');
        }
      };

      getSignedUrl();
    }
  }, [isOpen, upload]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Extracted Details Preview</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-[calc(80vh-8rem)] pr-4">
            <div className="grid grid-cols-2 gap-4">
              {document.fields?.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="text-sm font-medium">{field.name}</label>
                  <Input
                    type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                    value={extractedData[field.name] || ''}
                    onChange={(e) => setExtractedData(prev => ({
                      ...prev,
                      [field.name]: e.target.value
                    }))}
                  />
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button onClick={() => onSubmit(extractedData)}>
                Save Details
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Upload Modal Component
export const UploadModal = ({ isOpen, onClose, onUpload, company, document }) => {
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      await onUpload({
        companyId: company.id,
        documentId: document.id,
        file,
      });
      onClose();
    } catch (error) {
      console.error('Error during upload:', error);
      toast.error('An error occurred during upload');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit">Upload</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// View Modal Component
export const ViewModal = ({ url, onClose }) => {
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
export const AddFieldsDialog = ({ isOpen, onClose, document, onSubmit }) => {
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
                    onChange={(e) => {
                      const newFields = fields.map(f =>
                        f.id === field.id ? { ...f, name: e.target.value } : f
                      );
                      setFields(newFields);
                    }}
                    placeholder="Enter field name"
                    className="mt-1"
                  />
                </div>
                <div className="w-1/3">
                  <label htmlFor={`field-type-${field.id}`} className="text-sm font-medium">Type</label>
                  <select
                    id={`field-type-${field.id}`}
                    value={field.type}
                    onChange={(e) => {
                      const newFields = fields.map(f =>
                        f.id === field.id ? { ...f, type: e.target.value } : f
                      );
                      setFields(newFields);
                    }}
                    className="w-full mt-1 border rounded-md p-2"
                    aria-label={`Field type for ${field.name || 'unnamed field'}`}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                  </select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeField(field.id)}
                  className="mt-6"
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