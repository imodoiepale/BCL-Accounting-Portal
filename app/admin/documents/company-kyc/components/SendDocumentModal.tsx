import React, { useState, useEffect } from 'react';
import { Mail, Phone, Loader2, AlertCircle, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import toast from 'react-hot-toast';

interface Document {
  id: number;
  filepath: string;
  created_at: string;
}

interface SendDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  company: {
    id: number;
    company_name: string;
    current_communication_email?: string;
    phone?: string;
  };
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
  const [email, setEmail] = useState(company.current_communication_email || '');
  const [phone, setPhone] = useState(company.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail(company.current_communication_email || '');
      setPhone(company.phone || '');
      setError(null);
    }
  }, [isOpen, company]);

  const getDocumentName = (filepath: string) => {
    const parts = filepath.split('/');
    return parts[parts.length - 1]
      .replace(/^\d+_/, '')
      .split('.')[0];
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
      if (sendingMethod === 'email') {
        const emailData = {
          to: email,
          subject: `Documents from ${company.company_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb; margin-bottom: 20px;">Documents from ${company.company_name}</h2>
              <p style="color: #475569; margin-bottom: 20px;">
                Please find the following documents attached to this email:
              </p>
              <ul style="list-style-type: none; padding: 0; margin: 0;">
                ${documents.map(doc => `
                  <li style="background-color: #f8fafc; padding: 12px; margin-bottom: 8px; border-radius: 6px; color: #475569;">
                    📄 ${getDocumentName(doc.filepath)}
                  </li>
                `).join('')}
              </ul>
              <p style="color: #64748b; margin-top: 20px; font-size: 14px;">
                Total documents: ${documents.length}
              </p>
            </div>
          `,
          documents: documents.map(doc => ({
            filepath: doc.filepath
          })),
          companyName: company.company_name
        };

        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to send email');
        }

        toast.success('Documents sent successfully via email');
      } else {
        let formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        }

        const response = await fetch('/api/send-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: formattedPhone,
            documents: documents,
            companyName: company.company_name,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to send via WhatsApp');
        }

        toast.success('Documents sent successfully via WhatsApp');
      }

      onClose();
    } catch (error) {
      console.error('Error sending documents:', error);
      setError(error instanceof Error ? error.message : 'Failed to send documents');
    } finally {
      setLoading(false);
    }
  };

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
                  <div key={doc.id} className="flex items-center text-sm text-slate-600">
                    <span className="w-5 text-slate-400">{index + 1}.</span>
                    {getDocumentName(doc.filepath)}
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