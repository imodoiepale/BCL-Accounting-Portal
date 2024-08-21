// @ts-nocheck
"use client"
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCwIcon, UploadIcon, EyeIcon, ArrowUpDown, Edit2Icon } from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { useAuth } from '@clerk/clerk-react';

const Dialog = dynamic(() => import("@/components/ui/dialog").then(mod => mod.Dialog), { ssr: false });
const DialogContent = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogContent), { ssr: false });
const DialogHeader = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogHeader), { ssr: false });
const DialogTitle = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogTitle), { ssr: false });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

const FileViewer = ({ url, onClose }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90%] sm:max-h-[90%]">
        <DialogHeader>
          <DialogTitle>Document Viewer</DialogTitle>
        </DialogHeader>
        <iframe src={url} style={{ width: '100%', height: '80vh' }} />
      </DialogContent>
    </Dialog>
  );
};

export function KYCDocumentsList() {
  const { userId } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [newDocument, setNewDocument] = useState({
    name: '',
    department: '',
    issue_date: '',
    expiry_date: '',
    validity_days: 0,
    reminder_days: 0,
    filepath: '',
  });
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [uploadingDocumentId, setUploadingDocumentId] = useState(null);
  const [file, setFile] = useState(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewerUrl, setViewerUrl] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);

  useEffect(() => {
    createBucketAndFolders().then(() => {
      fetchDocuments();
    });
  }, [userId]);

  const createBucketAndFolders = async () => {
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('kyc-documents', {
      public: false,
      allowedMimeTypes: ['*'],      
      fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
    })

    if (bucketError && bucketError.message !== 'Bucket already exists') {
      console.error('Error creating bucket:', bucketError)
      return
    }
  }

  const fetchDocuments = async () => {
    const { data: documentData, error: documentError } = await supabase
      .from('acc_portal_kyc')
      .select('*')
      .eq('listed', true)
      .order('id', { ascending: true });

    if (documentError) console.error('Error fetching documents:', documentError)
    else setDocuments(documentData)
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    if (editingDocument) {
      setEditingDocument({ ...editingDocument, [id]: value });
    } else {
      setNewDocument({ ...newDocument, [id]: value });
    }
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleSubmit = async () => {
    try {
      let filepath = '';
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const { data, error } = await supabase.storage
          .from('kyc-documents')
          .upload(`${userId}/${fileName}`, file)

        if (error) {
          console.error('Error uploading file:', error)
          throw new Error(`File upload failed: ${error.message}`)
        }

        filepath = data.path;
      }

      const documentToInsert = {
        name: newDocument.name,
        department: newDocument.department,
        issue_date: newDocument.issue_date,
        expiry_date: newDocument.expiry_date,
        validity_days: newDocument.validity_days,
        reminder_days: newDocument.reminder_days,
        filepath: filepath,
        listed: true,
      }

      const { data, error } = await supabase
        .from('acc_portal_kyc')
        .insert([documentToInsert])
        .select()

      if (error) {
        throw new Error(`Document insertion failed: ${error.message || 'Unknown error'}`)
      }

      toast({
        title: "Success",
        description: "Document added successfully",
      })
      
      fetchDocuments()
      setNewDocument({
        name: '',
        department: '',
        issue_date: '',
        expiry_date: '',
        validity_days: 0,
        reminder_days: 0,
        filepath: '',
      })
      setFile(null)
      setIsAddingDocument(false)
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      toast({
        title: "Error",
        description: `Failed to add document: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const handleViewUpload = async (doc) => {
    if (doc.filepath) {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(doc.filepath, 60)

      if (error) {
        console.error('Error creating signed URL:', error)
        toast({
          title: "Error",
          description: "Failed to retrieve document. Please try again.",
          variant: "destructive",
        })
        return
      }

      setViewerUrl(data.signedUrl)
    } else {
      setIsUploadingDocument(true)
      setUploadingDocumentId(doc.id)
      setEditingDocument({
        id: doc.id,
        issue_date: doc.issue_date || '',
        expiry_date: doc.expiry_date || '',
      })
    }
  }

  const handleFileUpload = async () => {
    if (!file || !editingDocument) {
      toast({
        title: "Error",
        description: "Please select a file and fill in all fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(`${userId}/${fileName}`, file)

      if (error) {
        throw new Error(`File upload failed: ${error.message}`)
      }

      const { error: updateError } = await supabase
        .from('acc_portal_kyc')
        .update({ 
          filepath: data.path,
          issue_date: editingDocument.issue_date,
          expiry_date: editingDocument.expiry_date
        })
        .eq('id', editingDocument.id)
        .eq('listed', true)

      if (updateError) {
        throw new Error(`Document update failed: ${updateError.message}`)
      }

      toast({
        title: "Success",
        description: "Document uploaded and updated successfully",
      })

      fetchDocuments()
      setIsUploadingDocument(false)
      setEditingDocument(null)
      setFile(null)
    } catch (error) {
      console.error('Error in handleFileUpload:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (doc) => {
    setEditingDocument(doc)
  }

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from('acc_portal_kyc')
        .update(editingDocument)
        .eq('id', editingDocument.id)

      if (error) {
        throw new Error(`Document update failed: ${error.message}`)
      }

      toast({
        title: "Success",
        description: "Document updated successfully",
      })

      fetchDocuments()
      setEditingDocument(null)
    } catch (error) {
      console.error('Error in handleUpdate:', error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortDocuments = (docs) => {
    if (!sortColumn) return docs

    return [...docs].sort((a, b) => {
      let aValue = a[sortColumn]
      let bValue = b[sortColumn]

      if (sortColumn === 'issue_date' || sortColumn === 'expiry_date') {
        aValue = aValue ? new Date(aValue) : new Date(0)
        bValue = bValue ? new Date(bValue) : new Date(0)
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  const filterDocuments = (docs) => {
    if (!searchTerm) return docs
    return docs.filter(doc => 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  return (
    <div className="flex w-full bg-gray-100 h-screen">
      <main className="flex-1 p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">KYC Documents</h1>
          <div className="flex items-center space-x-2">
            <Input 
              type="search" 
              placeholder="Search documents" 
              className="w-48 bg-gray-200 border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline" className="flex items-center hover:bg-gray-200 text-gray-600" onClick={fetchDocuments}>
              <RefreshCwIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setIsAddingDocument(true)}>
              <RefreshCwIcon className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          </div>
        </div>

        <Card className="h-full overflow-auto shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] bg-gray-200 font-medium">No.</TableHead>
                <TableHead onClick={() => handleSort('name')} className="cursor-pointer bg-gray-200 font-medium">
                  Document Name {sortColumn === 'name' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead onClick={() => handleSort('department')} className="cursor-pointer bg-gray-200 font-medium">
                  Department {sortColumn === 'department' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead onClick={() => handleSort('issue_date')} className="cursor-pointer bg-gray-200 font-medium">
                  Issue Date {sortColumn === 'issue_date' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead onClick={() => handleSort('expiry_date')} className="cursor-pointer bg-gray-200 font-medium">
                  Expiry Date {sortColumn === 'expiry_date' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead className="bg-gray-200 font-medium">Status</TableHead>
                <TableHead className="bg-gray-200 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filterDocuments(sortDocuments(documents)).map((doc, index) => (
                <TableRow key={doc.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{doc.name}</TableCell>
                  <TableCell>{doc.department}</TableCell>
                  <TableCell>{doc.filepath ? formatDate(doc.issue_date) : 'Pending'}</TableCell>
                  <TableCell>{doc.filepath ? formatDate(doc.expiry_date) : 'Pending'}</TableCell>
                  <TableCell>
                    <Badge className={doc.filepath ? 'bg-green-500' : 'bg-yellow-500'}>
                      {doc.filepath ? 'Uploaded' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" onClick={() => handleViewUpload(doc)} className="mr-2 hover:bg-gray-200 text-gray-600">
                      {doc.filepath ? <EyeIcon className="w-4 h-4 mr-2" /> : <UploadIcon className="w-4 h-4 mr-2" />}
                      {doc.filepath ? "View" : "Upload"}
                    </Button>
                    <Button variant="outline" onClick={() => handleEdit(doc)} className="hover:bg-gray-200 text-gray-600">
                      <Edit2Icon className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {isAddingDocument && (
          <Dialog open={isAddingDocument} onOpenChange={setIsAddingDocument}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add KYC Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Document Name</Label>
                  <Input id="name" placeholder="e.g., Tax Compliance Certificate" value={newDocument.name} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" placeholder="e.g., Finance" value={newDocument.department} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="validity_days">Validity (days)</Label>
                  <Input id="validity_days" type="number" value={newDocument.validity_days} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="reminder_days">Reminder (days)</Label>
                  <Input id="reminder_days" type="number" value={newDocument.reminder_days} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button className="bg-blue-600 text-white mr-2" onClick={handleSubmit}>Save</Button>
                <Button variant="outline" onClick={() => setIsAddingDocument(false)}>Cancel</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        
        {isUploadingDocument && (
          <Dialog open={isUploadingDocument} onOpenChange={setIsUploadingDocument}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input 
                    id="issue_date" 
                    type="date" 
                    value={editingDocument?.issue_date || ''} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input 
                    id="expiry_date" 
                    type="date" 
                    value={editingDocument?.expiry_date || ''} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="file">Upload Document</Label>
                  <Input id="file" type="file" onChange={handleFileChange} required />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button className="bg-blue-600 text-white mr-2" onClick={handleFileUpload}>Upload</Button>
                <Button variant="outline" onClick={() => {
                  setIsUploadingDocument(false);
                  setEditingDocument(null);
                  setFile(null);
                }}>Cancel</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {editingDocument && !isUploadingDocument && (
          <Dialog open={!!editingDocument} onOpenChange={() => setEditingDocument(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Document Name</Label>
                  <Input id="name" value={editingDocument.name} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" value={editingDocument.department} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input id="issue_date" type="date" value={editingDocument.issue_date} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input id="expiry_date" type="date" value={editingDocument.expiry_date} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="validity_days">Validity (days)</Label>
                  <Input id="validity_days" type="number" value={editingDocument.validity_days} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="reminder_days">Reminder (days)</Label>
                  <Input id="reminder_days" type="number" value={editingDocument.reminder_days} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button className="bg-blue-600 text-white mr-2" onClick={handleUpdate}>Update</Button>
                <Button variant="outline" onClick={() => setEditingDocument(null)}>Cancel</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        
        {viewerUrl && <FileViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />}
      </main>
    </div>
  )
}