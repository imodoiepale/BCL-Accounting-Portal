import React, { useState, useEffect } from 'react';
import { Mail, Phone, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface Document {
    id: number;
    name: string;
    filepath?: string;
    kyc_document_id?: string;
}

interface Company {
    id: number;
    company_name: string;
    current_communication_email?: string;
    phone?: string;
}

interface SendDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    documents: Document[];
    company: Company | null;
    previewUrl?: string;
}

export const SendDocumentModal: React.FC<SendDocumentModalProps> = ({
    isOpen,
    onClose,
    documents,
    company,
    previewUrl
}) => {
    const [sendingMethod, setSendingMethod] = useState<'email' | 'whatsapp'>('email');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [documentStatus, setDocumentStatus] = useState<{ [key: number]: boolean }>({});


    const getDocumentFromDatabase = async (documentId: number) => {
        console.log('Fetching document:', documentId);
        try {
          // First get the company's document ID
          const { data: kycData, error: kycError } = await supabase
            .from('acc_portal_kyc')
            .select('id')
            .eq('id', documentId)
            .single();
      
          if (kycError) {
            console.error('Error fetching KYC document:', kycError);
            return null;
          }
      
          // Then get the uploaded document
          const { data, error } = await supabase
            .from('acc_portal_kyc_uploads')
            .select('filepath')
            .eq('kyc_document_id', kycData.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1);
      
          if (error) {
            console.error('Database fetch error:', error.message);
            return null;
          }
      
          if (!data || data.length === 0) {
            console.log('No document found in database for ID:', documentId);
            return null;
          }
      
          console.log('Found document:', data[0]);
          return data[0].filepath;
        } catch (error) {
          console.error('Database check failed:', error);
          return null;
        }
      };

      const verifyDocumentInStorage = async (filepath: string): Promise<boolean> => {
        if (!filepath) return false;
      
        try {
          // Clean up the filepath
          const path = filepath.startsWith('/') ? filepath.slice(1) : filepath;
      
          // Try to get signed URL
          const { data, error } = await supabase.storage
            .from('kyc-documents')
            .createSignedUrl(path, 60);
      
          if (error) {
            console.error('Storage verification error:', error);
            return false;
          }
      
          return !!data;
        } catch (error) {
          console.error('Storage check failed:', error);
          return false;
        }
      };

    useEffect(() => {
        if (isOpen && company) {
            setEmail(company.current_communication_email || '');
            setPhone(company.phone || '');
            setError(null);
        }
    }, [isOpen, company]);

    useEffect(() => {
        if (isOpen && documents.length > 0) {
          const checkDocuments = async () => {
            try {
              const statuses = await Promise.all(
                documents.map(async (doc) => {
                  console.log('Checking document:', doc.name, 'ID:', doc.id);
      
                  // Get filepath from database
                  const filepath = await getDocumentFromDatabase(doc.id);
                  if (!filepath) {
                    console.log('No filepath found for document:', doc.name);
                    return false;
                  }
      
                  // Store the filepath in document for later use
                  doc.filepath = filepath;
      
                  const exists = await verifyDocumentInStorage(filepath);
                  console.log(`Document ${doc.name} exists in storage:`, exists);
                  return exists;
                })
              );
      
              const statusMap = documents.reduce((acc, doc, index) => {
                acc[doc.id] = statuses[index];
                return acc;
              }, {} as { [key: number]: boolean });
      
              console.log('Final document status map:', statusMap);
              setDocumentStatus(statusMap);
            } catch (error) {
              console.error('Error checking documents:', error);
              toast.error('Error checking document availability');
            }
          };
      
          checkDocuments();
        }
      }, [isOpen, documents]);

    const getDocumentName = (doc: Document): string => {
        if (!doc.name) return 'Unnamed Document';
        return doc.name;
    };

    const validateInput = () => {
        if (sendingMethod === 'email') {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        } else {
            return /^\+?[\d\s-]{10,}$/.test(phone);
        }
    };

    const handleSend = async () => {
        if (!validateInput()) {
            setError(`Please enter a valid ${sendingMethod === 'email' ? 'email address' : 'phone number'}`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Get latest document data and verify storage
            const verifiedDocuments = await Promise.all(
                documents.map(async (doc) => {
                    let filepath = doc.filepath;
                    if (!filepath) {
                        filepath = await getDocumentFromDatabase(doc.id);
                    }

                    const exists = filepath ? await verifyDocumentInStorage(filepath) : false;
                    return {
                        ...doc,
                        filepath,
                        verified: exists
                    };
                })
            );

            const availableDocuments = verifiedDocuments.filter(doc => doc.verified);
            const missingDocuments = verifiedDocuments.filter(doc => !doc.verified);

            if (missingDocuments.length > 0) {
                const missingNames = missingDocuments.map(doc => doc.name).join(', ');
                setError(`The following documents are not available: ${missingNames}`);
                return;
            }

            if (availableDocuments.length === 0) {
                setError('No documents are available for sending');
                return;
            }

            const endpoint = sendingMethod === 'email' ? '/api/send-email' : '/api/send-whatsapp';
            const recipient = sendingMethod === 'email' ? email : phone.replace(/\D/g, '');

            const payload = {
                to: recipient,
                documents: availableDocuments.map(doc => ({
                    name: getDocumentName(doc),
                    filepath: doc.filepath
                })),
                companyName: company?.company_name,
                subject: `Documents for ${company?.company_name}`,
                html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Documents for ${company?.company_name}</h2>
            <p>Please find the attached documents:</p>
            <ul>
              ${availableDocuments.map(doc => `<li>${getDocumentName(doc)}</li>`).join('')}
            </ul>
          </div>
        `
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send documents');
            }

            toast.success(`Documents sent successfully via ${sendingMethod}`);
            onClose();
        } catch (error) {
            console.error('Error sending documents:', error);
            setError(error instanceof Error ? error.message : 'Failed to send documents');
            toast.error('Failed to send documents');
        } finally {
            setLoading(false);
        }
    };

    if (!company) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Send Documents</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6">
                    {/* Left side - Document preview and info */}
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-slate-900 mb-2">Selected Documents</h3>
                            <div className="space-y-2">
                                {documents.map((doc, index) => (
                                    <div key={doc.id} className="flex items-center justify-between text-sm text-slate-600 p-2 bg-white rounded-md">
                                        <div className="flex items-center space-x-2">
                                            <span className="w-5 text-slate-400">{index + 1}.</span>
                                            <span>{getDocumentName(doc)}</span>
                                        </div>
                                        <div className="flex items-center">
                                            {documentStatus[doc.id] === undefined ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                            ) : documentStatus[doc.id] ? (
                                                <span className="text-green-500 text-xs">Available</span>
                                            ) : (
                                                <span className="text-red-500 text-xs">Not Found</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {previewUrl && (
                            <div className="border rounded-lg overflow-hidden h-[400px]">
                                <iframe src={previewUrl} className="w-full h-full" title="Document Preview" />
                            </div>
                        )}
                    </div>

                    {/* Right side - Sending options */}
                    <div className="space-y-6">
                        <Tabs defaultValue="email" onValueChange={(value) => setSendingMethod(value as 'email' | 'whatsapp')}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="email">Email</TabsTrigger>
                                <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                            </TabsList>

                            <TabsContent value="email" className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-9"
                                            placeholder="email@company.com"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="whatsapp" className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="pl-9"
                                            placeholder="+1234567890"
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSend} disabled={loading || !validateInput()}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>Send {documents.length} document{documents.length !== 1 ? 's' : ''}</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};