"use client"
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, FileText, ClipboardList, Upload } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface UploadedDocument {
  file: File;
  name: string;
  url: string;
  base64: string;  // Added base64 property
}

const KYCDocumentsPage = () => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<UploadedDocument | null>(null);
  const [extractFields, setExtractFields] = useState('');
  const [extractedData, setExtractedData] = useState<Record<string, any> | null>(null);
  const [isExtractionDialogOpen, setIsExtractionDialogOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newDocuments: UploadedDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await fileToBase64(file);
        const url = URL.createObjectURL(file);
        
        newDocuments.push({
          file,
          name: file.name,
          url,
          base64
        });
      } catch (error) {
        console.error('Error converting file to base64:', error);
        toast({
          title: "Error",
          description: `Failed to process file: ${file.name}`,
          variant: "destructive"
        });
      }
    }

    setDocuments(prevDocs => [...prevDocs, ...newDocuments]);
  };

  const handleViewDocument = (doc: UploadedDocument) => {
    setSelectedDocument(doc);
  };

  const handleExtractDetails = async () => {
    if (!selectedDocument) {
      toast({
        title: "Error",
        description: "Please select a document first",
        variant: "destructive"
      });
      return;
    }

    if (!extractFields.trim()) {
      toast({
        title: "Error",
        description: "Please enter fields to extract",
        variant: "destructive"
      });
      return;
    }

    setIsExtracting(true);

    try {
      const extractionFields = extractFields.split(',').map(field => field.trim());
      const url = 'https://api.hyperbolic.xyz/v1/chat/completions';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJpamVwYWxlQGdtYWlsLmNvbSIsImlhdCI6MTczMTUxNDExMX0.DZf2t6fUGiVQN6FXCwLOnRG2Yx48aok1vIH00sKhWS4',
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2-VL-7B-Instruct',
          messages: [
            {
              role: 'user',
              content: [
                { 
                  type: "text", 
                  text: `Extract the following details from the document: ${extractFields}. 
                  Please return the result as a JSON object where the keys are the requested fields.`
                },
                { 
                  type: "image_url", 
                  image_url: { 
                    url: selectedDocument.base64  // Use base64 string instead of blob URL
                  } 
                }
              ]
            }
          ],
          max_tokens: 2048,
          temperature: 0.7,
          top_p: 0.9,
          stream: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      const json = await response.json();
      
      if (!json.choices || !json.choices[0] || !json.choices[0].message) {
        throw new Error('Invalid API response format');
      }

      const extractedContent = json.choices[0].message.content;
      
      try {
        const parsedData = JSON.parse(extractedContent);
        setExtractedData(parsedData);
      } catch (parseError) {
        console.error('Failed to parse extracted data:', parseError);
        setExtractedData({ raw: extractedContent });
      }

    } catch (error) {
      console.error('Document extraction error:', error);
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : "Failed to extract document details",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const renderExtractedData = () => {
    if (!extractedData) return null;

    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center mb-4 border-b pb-2">
          <ClipboardList className="mr-2 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Extracted Document Details</h3>
        </div>
        
        {Object.entries(extractedData).map(([key, value]) => (
          <div 
            key={key} 
            className="grid grid-cols-3 border-b last:border-b-0 py-2 hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-600 capitalize">
              {key.replace(/_/g, ' ')}
            </div>
            <div className="col-span-2 text-gray-800">
              {typeof value === 'object' 
                ? JSON.stringify(value, null, 2) 
                : String(value || 'N/A')}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleUploadToSupabase = async (doc: UploadedDocument) => {
    try {
      const fileName = `kyc_documents/${Date.now()}_${doc.file.name}`;

      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, doc.file);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document uploaded successfully!",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document to storage",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4 flex items-center space-x-4">
        <Input 
          type="file" 
          accept=".pdf,.jpg,.jpeg,.png" 
          multiple 
          onChange={handleFileUpload} 
          className="hidden" 
          id="file-upload"
        />
        <label 
          htmlFor="file-upload" 
          className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Upload className="mr-2 h-4 w-4" /> Upload Documents
        </label>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Name</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc, index) => (
            <TableRow key={index}>
              <TableCell>{doc.name}</TableCell>
              <TableCell className="flex space-x-2">
                <Dialog>
                  <DialogTrigger 
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                    onClick={() => handleViewDocument(doc)}
                  >
                    <Eye className="mr-1 h-4 w-4" /> View
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{doc.name}</DialogTitle>
                    </DialogHeader>
                    <div className="w-full h-[70vh]">
                      <iframe 
                        src={doc.url} 
                        width="100%" 
                        height="100%" 
                        title={doc.name}
                      />
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  className="text-green-600 hover:text-green-800 flex items-center"
                  onClick={() => {
                    handleViewDocument(doc);
                    setIsExtractionDialogOpen(true);
                  }}
                >
                  <FileText className="mr-1 h-4 w-4" /> Extract
                </Button>

                <Button 
                  variant="outline" 
                  className="text-purple-600 hover:text-purple-800 flex items-center"
                  onClick={() => handleUploadToSupabase(doc)}
                >
                  <Upload className="mr-1 h-4 w-4" /> Upload to Storage
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog 
        open={isExtractionDialogOpen} 
        onOpenChange={setIsExtractionDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Extract Document Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDocument && (
              <div>
                <Input 
                  placeholder="Enter fields to extract (comma-separated)"
                  value={extractFields}
                  onChange={(e) => setExtractFields(e.target.value)}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Example: name, address, date of birth
                </p>
              </div>
            )}

            {extractedData && renderExtractedData()}
          </div>

          <DialogFooter>
            <Button 
              onClick={handleExtractDetails}
              disabled={!extractFields || isExtracting}
            >
              {isExtracting ? 'Extracting...' : 'Extract Details'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KYCDocumentsPage;