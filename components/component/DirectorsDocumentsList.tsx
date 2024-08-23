/* eslint-disable react/no-unescaped-entities */
// @ts-nocheck
"use client"
import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCwIcon, EyeIcon, UploadIcon, ArrowUpDown, Edit2Icon } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { useAuth } from '@clerk/clerk-react'

const Dialog = dynamic(() => import("@/components/ui/dialog").then(mod => mod.Dialog), { ssr: false })
const DialogContent = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogContent), { ssr: false })
const DialogHeader = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogHeader), { ssr: false })
const DialogTitle = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogTitle), { ssr: false })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const BUCKET_NAME = 'directors-documents'
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

const calculateRemainingDays = (issueDate, expiryDate) => {
  if (!issueDate || !expiryDate) return 'N/A';
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const remainingDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  
  return remainingDays > 0 ? remainingDays : 0;
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
  )
}

export function DirectorsDocumentsList() {
  const { userId } = useAuth()

  const [documents, setDocuments] = useState([])
  const [directors, setDirectors] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingDocument, setIsUploadingDocument] = useState(false)
  const [uploadingDocumentId, setUploadingDocumentId] = useState(null)
  const [file, setFile] = useState(null)
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewerUrl, setViewerUrl] = useState(null)
  const [editingDocument, setEditingDocument] = useState(null)

  useEffect(() => {
    initializeBucket()
    fetchDocuments()
    fetchDirectors()
  }, [userId])

  const initializeBucket = async () => {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('Error listing buckets:', error)
      return
    }

    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME)

    if (!bucketExists) {
      const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: MAX_FILE_SIZE
      })

      if (error) {
        console.error('Error creating bucket:', error)
        toast.error(`Failed to create storage bucket. Please contact support.`)
      } else {
        console.log('Bucket created successfully:', data)
      }
    }
  }

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('acc_portal_directors_documents')
      .select('*')
      .eq('userid', userId)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents. Please try again.')
    } else {
      setDocuments(data);
    }
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setEditingDocument({ ...editingDocument, [id]: value });
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleViewUpload = async (doc) => {
    if (doc.file_path) {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(doc.file_path, 60)

      if (error) {
        console.error('Error creating signed URL:', error)
        toast.error("Failed to retrieve document. Please try again.")
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
      toast.error("Please select a file and fill in all fields.")
      return
    }

    setIsLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${editingDocument.id}/${fileName}`
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file)

      if (error) {
        throw new Error(`File upload failed: ${error.message}`)
      }

      const { data: publicUrlData, error: publicUrlError } = supabase
        .storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path)

      if (publicUrlError) {
        throw new Error(`Error getting public URL: ${publicUrlError.message}`)
      }

      const { error: updateError } = await supabase
        .from('acc_portal_directors_documents')
        .update({ 
          file_path: publicUrlData.publicUrl,
          issue_date: editingDocument.issue_date,
          expiry_date: editingDocument.expiry_date,
          status: 'complete'
        })
        .eq('id', editingDocument.id)
        .eq('userid', userId)

      if (updateError) {
        throw new Error(`Error updating document: ${updateError.message}`)
      }

      toast.success("Document uploaded and updated successfully")

      fetchDocuments()
      setIsUploadingDocument(false)
      setEditingDocument(null)
      setFile(null)
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (doc) => {
    setEditingDocument({
      id: doc.id,
      issue_date: doc.issue_date || '',
      expiry_date: doc.expiry_date || '',
    })
  }

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from('acc_portal_directors_documents')
        .update({
          issue_date: editingDocument.issue_date,
          expiry_date: editingDocument.expiry_date,
        })
        .eq('id', editingDocument.id)
        .eq('userid', userId)

      if (error) {
        throw new Error(`Document update failed: ${error.message}`)
      }

      toast.success("Document updated successfully")

      fetchDocuments()
      setEditingDocument(null)
    } catch (error) {
      console.error('Error in handleUpdate:', error)
      toast.error(error.message)
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
      directors.find(d => d.id === doc.director_id)?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  return (
    <div className="flex w-full bg-gray-100">
      <Toaster position="top-right" />
      <main className="flex-1 p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Directors' Documents List</h1>
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
                <TableHead onClick={() => handleSort('director_id')} className="cursor-pointer bg-gray-200 font-medium">
                  Director {sortColumn === 'director_id' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead onClick={() => handleSort('type')} className="cursor-pointer bg-gray-200 font-medium">
                  Type {sortColumn === 'type' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead onClick={() => handleSort('issue_date')} className="cursor-pointer bg-gray-200 font-medium">
                  Issue Date {sortColumn === 'issue_date' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead onClick={() => handleSort('expiry_date')} className="cursor-pointer bg-gray-200 font-medium">
                  Expiry Date {sortColumn === 'expiry_date' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead className="bg-gray-200 font-medium">Reminder Days</TableHead>
                <TableHead className="bg-gray-200 font-medium">Status</TableHead>
                <TableHead className="bg-gray-200 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filterDocuments(sortDocuments(documents)).map((doc, index) => (
                <TableRow key={doc.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{doc.name}</TableCell>
                  <TableCell>{directors.find(d => d.id === doc.director_id)?.full_name || 'Unknown'}</TableCell>
                  <TableCell>{doc.type}</TableCell>
                  <TableCell>{formatDate(doc.issue_date)}</TableCell>
                  <TableCell>{formatDate(doc.expiry_date)}</TableCell>
                  <TableCell>{calculateRemainingDays(doc.issue_date, doc.expiry_date)}</TableCell>
                  <TableCell>
                    <Badge className={doc.status === 'complete' ? 'bg-green-500' : 'bg-yellow-500'}>
                      {doc.status === 'complete' ? 'Complete' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                  <Button variant="outline" onClick={() => handleViewUpload(doc)} className="mr-2 hover:bg-gray-200 text-gray-600">
                      {doc.file_path ? <EyeIcon className="w-4 h-4 mr-2" /> : <UploadIcon className="w-4 h-4 mr-2" />}
                      {doc.file_path ? "View" : "Upload"}
                    </Button>
                    {doc.file_path && (
                      <Button variant="outline" onClick={() => handleEdit(doc)} className="hover:bg-gray-200 text-gray-600">
                        <Edit2Icon className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        
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
                <Button className="bg-blue-600 text-white mr-2" onClick={handleFileUpload} disabled={isLoading}>
                  {isLoading ? 'Uploading...' : 'Upload'}
                </Button>
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
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input 
                    id="issue_date" 
                    type="date" 
                    value={editingDocument.issue_date} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input 
                    id="expiry_date" 
                    type="date" 
                    value={editingDocument.expiry_date} 
                    onChange={handleInputChange} 
                    required 
                  />
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



