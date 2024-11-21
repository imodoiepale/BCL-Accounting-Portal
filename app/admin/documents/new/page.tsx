// @ts-nocheck
"use client"
import React, { useState, useEffect } from 'react';
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
import { Eye, FileText, ClipboardList } from 'lucide-react';


const KYCDocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [extractFields, setExtractFields] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [isExtractionDialogOpen, setIsExtractionDialogOpen] = useState(false);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('acc_portal_kyc_uploads')
        .select(`
          id, 
          filepath,
          acc_portal_kyc:kyc_document_id (name)
        `);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleViewDocument = async (filepath) => {
    try {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(filepath, 60); // 60 seconds URL expiration

      if (error) throw error;

      setSelectedDocument({
        url: data.signedUrl,
        name: filepath.split('/').pop() || 'document.pdf',
        filepath: filepath
      });
    } catch (error) {
      console.error('View document error:', error);
      alert('Failed to view document');
    }
  };

  const handleExtractDetails = async () => {
    if (!selectedDocument) {
      alert('Please select a document first');
      return;
    }

    try {
      // Fetch the signed URL for the document
      const { data: urlData, error: urlError } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(selectedDocument.filepath, 60);

      if (urlError) throw urlError;

      // Prepare extraction request
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
                { type: "image_url", image_url: { url: urlData.signedUrl } }
              ]
            }
          ],
          max_tokens: 2048,
          temperature: 0.7,
          top_p: 0.9,
          stream: false
        }),
      });

      const json = await response.json();
      const extractedContent = json.choices[0].message.content;
      
      // Try to parse the response as JSON
      try {
        const parsedData = JSON.parse(extractedContent);
        setExtractedData(parsedData);
      } catch (parseError) {
        console.error('Failed to parse extracted data:', parseError);
        setExtractedData({ raw: extractedContent });
      }

      setIsExtractionDialogOpen(true);
    } catch (error) {
      console.error('Document extraction error:', error);
      alert('Failed to extract document details');
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
                : (value || 'N/A')}
            </div>
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Name</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>
                {doc['acc_portal_kyc']?.name || 'Unnamed Document'}
              </TableCell>
              <TableCell className="flex space-x-2">
                <Dialog>
                  <DialogTrigger 
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                    onClick={() => handleViewDocument(doc.filepath)}
                  >
                    <Eye className="mr-1 h-4 w-4" /> View
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>
                        {doc['acc_portal_kyc']?.name || 'Document'}
                      </DialogTitle>
                    </DialogHeader>
                    {selectedDocument ? (
                      <div className="w-full h-[70vh]">
                        <iframe 
                          src={selectedDocument.url} 
                          width="100%" 
                          height="100%" 
                          title={selectedDocument.name}
                        />
                      </div>
                    ) : (
                      <p>Loading document...</p>
                    )}
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  className="text-green-600 hover:text-green-800 flex items-center"
                  onClick={() => {
                    handleViewDocument(doc.filepath);
                    setIsExtractionDialogOpen(true);
                  }}
                >
                  <FileText className="mr-1 h-4 w-4" /> Extract
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
              disabled={!extractFields}
            >
              Extract Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KYCDocumentsPage;