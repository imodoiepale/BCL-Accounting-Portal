
// @ts-nocheck
"use client"
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Mail,
    Phone,
    Search,
    User,
    RefreshCw,
    FileText,
    ArrowLeft,
    CheckCircle2,
    Contact2
} from 'lucide-react';

import { 
    Dialog, 
    DialogContent, 
    DialogHeader,
    DialogTitle
  } from '@/components/ui/dialog';
import  { toast, Toaster } from 'react-hot-toast';

import { googleService } from '@/services/googleService';
import { format } from 'date-fns';

interface Contact {
    name: string;
    email: string;
    phone?: string;
}

interface Document {
    id: number;
    filepath: string;
    issue_date?: string;
    created_at: string;
}

interface SendDocumentModalProps {
    company: {
        company_name: string;
        current_communication_email?: string;
        phone?: string;
    };
    documents: Document[];
    onClose: () => void;
}

type SelectionMode = 'choose' | 'google' | 'manual';
type SendingMethod = 'email' | 'whatsapp';

export const SendDocumentModal: React.FC<SendDocumentModalProps> = ({
    company,
    documents,
    onClose,
}) => {
    // State management
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('choose');
    const [sendingMethod, setSendingMethod] = useState<SendingMethod>('email');
    const [email, setEmail] = useState(company.current_communication_email || '');
    const [phone, setPhone] = useState(company.phone || '');
    const [googleContacts, setGoogleContacts] = useState<Contact[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    // Load Google contacts
    const loadContacts = async () => {
        try {
            setLoadingContacts(true);
            const contacts = await googleService.loadContacts();
            setGoogleContacts(contacts);
            setSelectionMode('google');
        } catch (error) {
            console.error('Error loading contacts:', error);
            toast.error('Failed to load contacts. Please try again.');
            setSelectionMode('manual');
        } finally {
            setLoadingContacts(false);
        }
    };

    // Get document name from filepath
    const getDocumentName = (filepath: string) => {
        const parts = filepath.split('/');
        return parts[parts.length - 1]
            .replace(/^\d+_/, '')
            .split('.')[0];
    };

    // Handle document sending
    const handleSend = async () => {
        if (!email && sendingMethod === 'email') {
          toast.error('Please enter an email address');
          return;
        }
      
        if (!phone && sendingMethod === 'whatsapp') {
          toast.error('Please enter a phone number');
          return;
        }
      
        setLoading(true);
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
            if (formattedPhone.length <= 10) {
              formattedPhone = '+1' + formattedPhone;
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
                toast.success("message sent successfully")
                throw new Error(errorData.message || 'Failed to send via WhatsApp');
              }
            }
      
          onClose();
        } catch (error) {
          console.error('Error sending documents:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to send documents');
        } finally {
          setLoading(false);
        }
      };

    // Filter contacts based on search term
    const filteredContacts = googleContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone?.includes(searchTerm)
    );

    // Initial selection screen
    if (selectionMode === 'choose') {
        return (
          <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-800">
                  Send Documents
                </DialogTitle>
              </DialogHeader>
              <div className="p-6">
                <p className="text-sm text-slate-500 mb-6">
                  Choose how you want to select the recipient
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={() => loadContacts()}
                    className="w-full flex items-center p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-4 group-hover:bg-blue-100">
                      <Contact2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-medium text-slate-800">Choose from Google Contacts</h3>
                      <p className="text-sm text-slate-500">Import and select from your Google contacts</p>
                    </div>
                  </button>
      
                  <button
                    onClick={() => setSelectionMode('manual')}
                    className="w-full flex items-center p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-4 group-hover:bg-blue-100">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-medium text-slate-800">Enter Contact Details</h3>
                      <p className="text-sm text-slate-500">Manually enter email or phone number</p>
                    </div>
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      }

    // Main sending interface
    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] p-0">
                <div className="flex h-[600px]">
                    {/* Left Column - Document List */}
                    <div className="w-80 border-r border-slate-200 bg-white">
                        <div className="p-6 border-b border-slate-200">
                            <button
                                onClick={() => setSelectionMode('choose')}
                                className="mb-4 text-sm text-blue-600 hover:text-blue-700 flex items-center"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to selection
                            </button>
                            <h2 className="font-semibold text-slate-800 text-sm">Documents to Send</h2>
                            <p className="text-xs text-slate-500 mt-1">{company.company_name}</p>
                        </div>
                        <ScrollArea className="h-[calc(100%-5rem)]">
                            <div className="p-4 space-y-2">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center p-3 rounded-lg bg-slate-50 text-sm"
                                    >
                                        <FileText className="w-4 h-4 text-blue-500 mr-3 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="text-slate-700 font-medium truncate">
                                                {getDocumentName(doc.filepath)}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                Added {format(new Date(doc.created_at), 'MMM d, yyyy')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Center Column - Contact Selection */}
                    {selectionMode === 'google' && (
                        <div className="w-96 border-r border-slate-200 bg-white">
                            <div className="p-6 border-b border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-semibold text-slate-800 text-sm">Select Contact</h2>
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        {(['email', 'whatsapp'] as const).map((method) => (
                                            <button
                                                key={method}
                                                onClick={() => setSendingMethod(method)}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${sendingMethod === method
                                                        ? 'bg-white text-blue-600 shadow-sm'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                    }`}
                                            >
                                                {method === 'email' ? 'Email' : 'WhatsApp'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search contacts..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 border-slate-200 focus:ring-blue-500 text-xs"
                                    />
                                </div>
                            </div>
                            <ScrollArea className="h-[calc(100%-8.5rem)]">
                                {loadingContacts ? (
                                    <div className="flex items-center justify-center h-32">
                                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                                        <span className="text-sm text-slate-500">Loading contacts...</span>
                                    </div>
                                ) : (
                                    <div className="p-2">
                                        {filteredContacts.map((contact, index) => {
                                            const isSelected = selectedContact?.email === contact.email;
                                            const hasRequiredField = sendingMethod === 'email' ? contact.email : contact.phone;

                                            if (!hasRequiredField) return null;

                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        setSelectedContact(contact);
                                                        if (sendingMethod === 'email') {
                                                            setEmail(contact.email);
                                                        } else {
                                                            setPhone(contact.phone || '');
                                                        }
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-xs transition-all ${isSelected
                                                            ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                                                            : 'text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                                                            {isSelected ? (
                                                                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                                            ) : (
                                                                <User className="w-4 h-4 text-slate-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{contact.name}</div>
                                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                                {sendingMethod === 'email' ? contact.email : contact.phone}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    )}

                    {/* Right Column - Send Options */}
                    <div className={`${selectionMode === 'manual' ? 'flex-1' : 'w-96'} bg-white p-6`}>
                        <div className="max-w-md">
                            <h2 className="font-semibold text-slate-800 text-sm mb-4">
                                Recipient Details
                            </h2>

                            {selectionMode === 'manual' && (
                                <div className="mb-6">
                                    <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                                        {(['email', 'whatsapp'] as const).map((method) => (
                                            <button
                                                key={method}
                                                onClick={() => setSendingMethod(method)}
                                                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${sendingMethod === method
                                                        ? 'bg-white text-blue-600 shadow-sm'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                    }`}
                                            >
                                                {method === 'email' ? 'Email' : 'WhatsApp'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        {sendingMethod === 'email' ? 'Email Address' : 'Phone Number'}
                                    </label>
                                    <Input
                                        type={sendingMethod === 'email' ? 'email' : 'tel'}
                                        value={sendingMethod === 'email' ? email : phone}
                                        onChange={(e) => {
                                            if (sendingMethod === 'email') {
                                                setEmail(e.target.value);
                                            } else {
                                                setPhone(e.target.value);
                                            }
                                        }}
                                        className="w-full"
                                        placeholder={
                                            sendingMethod === 'email'
                                                ? 'Enter email address'
                                                : 'Enter phone number'
                                        }
                                    />
                                    {selectionMode === 'manual' && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            {sendingMethod === 'email'
                                                ? 'Enter the recipient\'s email address'
                                                : 'Enter the recipient\'s phone number with country code'}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <h3 className="text-xs font-medium text-slate-700 mb-2">Selected Documents</h3>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="space-y-2">
                                            {documents.map((doc) => (
                                                <div key={doc.id} className="flex items-center text-sm">
                                                    <FileText className="w-4 h-4 text-blue-500 mr-2" />
                                                    <span className="text-slate-600 truncate">
                                                        {getDocumentName(doc.filepath)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
                                            Total: {documents.length} document{documents.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 space-y-3">
                                    <Button
                                        onClick={handleSend}
                                        disabled={loading || (sendingMethod === 'email' ? !email : !phone)}
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                    >
                                        {loading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                {sendingMethod === 'email' ? (
                                                    <Mail className="w-4 h-4 mr-2" />
                                                ) : (
                                                    <Phone className="w-4 h-4 mr-2" />
                                                )}
                                                Send Documents
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                        disabled={loading}
                                        className="w-full"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="mt-6 border-t border-slate-200 pt-6">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-blue-800 mb-2">
                                    Sending to {company.company_name}
                                </h3>
                                <p className="text-xs text-blue-600">
                                    {sendingMethod === 'email' ? (
                                        <>
                                            Documents will be sent as email attachments. The recipient will receive
                                            an email from your company address.
                                        </>
                                    ) : (
                                        <>
                                            Documents will be shared via WhatsApp. The recipient will receive
                                            a message with the documents attached.
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};