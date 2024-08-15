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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { RefreshCwIcon, PlusIcon, UploadIcon, EyeIcon, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { useAuth } from '@clerk/clerk-react'

const Dialog = dynamic(() => import("@/components/ui/dialog").then(mod => mod.Dialog), { ssr: false })
const DialogContent = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogContent), { ssr: false })
const DialogHeader = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogHeader), { ssr: false })
const DialogTitle = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogTitle), { ssr: false })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing in environment variables.')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  )
}

export function KYCDocumentsList({ category }) {

  const {userId} = useAuth()

  const [oneOffDocs, setOneOffDocs] = useState([])
  const [renewalDocs, setRenewalDocs] = useState([])
  const [newDocument, setNewDocument] = useState({
    name: '',
    type: 'one-off',
    status: 'pending',
    expiry_date: '',
    description: '',
    file_path: '',
    category: category,
  })
  const [isAddingOneOff, setIsAddingOneOff] = useState(false)
  const [isAddingRenewal, setIsAddingRenewal] = useState(false)
  const [file, setFile] = useState(null)
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewerUrl, setViewerUrl] = useState(null)

  useEffect(() => {
    createBucketAndFolders().then(() => {
      fetchDocuments()
    })
  }, [category, userId])

  const createBucketAndFolders = async () => {
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('kyc-documents', {
      public: false,
      allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
      fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
    })

    if (bucketError && bucketError.message !== 'Bucket already exists') {
      console.error('Error creating bucket:', bucketError)
      return
    }

    const folders = ['one-off', 'renewal']
    for (const folder of folders) {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(`${folder}/.keep`, new Blob(['']))

      if (error && error.message !== 'The resource already exists') {
        console.error(`Error creating ${folder} folder:`, error)
      }
    }
  }

  const fetchDocuments = async () => {
    const { data: oneOffData, error: oneOffError } = await supabase
      .from('acc_portal_kyc_docs')
      .select('*')
      .eq('userid', userId)
      .eq('document_type', 'one_off')
      .eq('category', category)
      .order('id', { ascending: true });
  
    const { data: renewalData, error: renewalError } = await supabase
      .from('acc_portal_kyc_docs')
      .select('*')
      .eq('userid', userId)
      .eq('document_type', 'renewal')
      .eq('category', category)
      .order('id', { ascending: true });
  
    if (oneOffError) console.error('Error fetching one-off documents:', oneOffError)
    else setOneOffDocs(oneOffData)
  
    if (renewalError) console.error('Error fetching renewal documents:', renewalError)
    else setRenewalDocs(renewalData)
  }

  const handleInputChange = (e) => {
    setNewDocument({ ...newDocument, [e.target.id]: e.target.value })
  }

  const handleSelectChange = (value, field) => {
    setNewDocument({ ...newDocument, [field]: value })
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleSubmit = async (isOneOff) => {
    try {
      let file_path = '';
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const { data, error } = await supabase.storage
          .from('kyc-documents')
          .upload(`${category}/${isOneOff ? 'one_off' : 'renewal'}/${fileName}`, file)
  
        if (error) {
          console.error('Error uploading file:', error)
          throw new Error(`File upload failed: ${error.message}`)
        }
  
        file_path = data.path;
      }
  
      const documentToInsert = {
        name: newDocument.name,
        category: category,
        document_type: isOneOff ? 'one_off' : 'renewal',
        status: newDocument.status,
        description: newDocument.description,
        expiry_date: isOneOff ? null : newDocument.expiry_date,
        document_url: file_path,
        upload_date: new Date().toISOString(),
        userid: userId,
        entity_id: null,
        entity_type: '',
      }
  
      const { data, error } = await supabase
        .from('acc_portal_kyc_docs')
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
        type: '',
        status: 'pending',
        expiry_date: '',
        description: '',
        category: category,
      })
      setFile(null)
      setIsAddingOneOff(false)
      setIsAddingRenewal(false)
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
    if (doc.document_url) {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(doc.document_url, 60)

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
      document.getElementById(`file-upload-${doc.id}`).click()
    }
  }

  const handleFileUpload = async (e, doc) => {
    const file = e.target.files[0]
    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(`${doc.document_type}/${fileName}`, file)

      if (error) {
        console.error('Error uploading file:', error)
        toast({
          title: "Error",
          description: "Failed to upload file. Please try again.",
          variant: "destructive",
        })
        return
      }

      const { error: updateError } = await supabase
        .from('acc_portal_kyc_docs')
        .update({ document_url: data.path })
        .eq('id', doc.id)
        .eq('userid', userId)

      if (updateError) {
        console.error('Error updating document:', updateError)
        toast({
          title: "Error",
          description: "Failed to update document. Please try again.",
          variant: "destructive",
        })
        return
      }

      fetchDocuments()
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

      if (sortColumn === 'expiry_date') {
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
      doc.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const renderDocumentTable = (documents, title, isOneOff) => (
    <Card className="h-full overflow-auto">
      <div className="flex justify-between items-center p-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Button 
          className="bg-blue-600 text-white" 
          onClick={() => isOneOff ? setIsAddingOneOff(true) : setIsAddingRenewal(true)}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add {isOneOff ? "One-off" : "Renewal"} Document
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">No.</TableHead>
            <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
              Document Name {sortColumn === 'name' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
            </TableHead>
            <TableHead onClick={() => handleSort('status')} className="cursor-pointer">
              Status {sortColumn === 'status' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
            </TableHead>
            <TableHead onClick={() => handleSort('description')} className="cursor-pointer">
              Description {sortColumn === 'description' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
            </TableHead>
            <TableHead>View/Upload</TableHead>
            {!isOneOff && (
              <TableHead onClick={() => handleSort('expiry_date')} className="cursor-pointer">
                Expiry Date {sortColumn === 'expiry_date' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filterDocuments(sortDocuments(documents)).map((doc, index) => (
            <TableRow key={doc.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{doc.name}</TableCell>
              <TableCell>
                <Badge variant={doc.status === 'complete' ? "success" : "warning"}>
                  {doc.status === 'complete' ? "Complete" : "Pending"}
                </Badge>
              </TableCell>
              <TableCell>{doc.description}</TableCell>
              <TableCell>
                <Button variant="outline" onClick={() => handleViewUpload(doc)}>
                  {doc.document_url ? <EyeIcon className="w-4 h-4 mr-2" /> : <UploadIcon className="w-4 h-4 mr-2" />}
                  {doc.document_url ? "View" : "Upload"}
                </Button>
                <input
                  id={`file-upload-${doc.id}`}
                  type="file"
                  hidden
                  onChange={(e) => handleFileUpload(e, doc)}
                />
              </TableCell>
              {!isOneOff && <TableCell>{formatDate(doc.expiry_date)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )

  const renderAddDocumentSheet = (isOneOff) => (
    <Sheet open={isOneOff ? isAddingOneOff : isAddingRenewal} onOpenChange={isOneOff ? setIsAddingOneOff : setIsAddingRenewal}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add {isOneOff ? "One-off" : "Renewal"} KYC Document</SheetTitle>
          <SheetDescription>
            Add a new {isOneOff ? "one-off" : "renewal"} KYC document to the system
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col pt-4 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name">Document Name</Label>
            <Input id="name" placeholder="e.g., Tax Compliance Certificate" value={newDocument.name} onChange={handleInputChange} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value) => handleSelectChange(value, 'status')} value={newDocument.status}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="Brief description of the document" value={newDocument.description} onChange={handleInputChange} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="file">Upload Document</Label>
            <Input id="file" type="file" onChange={handleFileChange} />
          </div>
          {!isOneOff && (
            <div className="space-y-1">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input id="expiry_date" type="date" value={newDocument.expiry_date} onChange={handleInputChange} />
            </div>
          )}
        </div>
        <div className="pt-4">
          <Button className="bg-blue-600 text-white" onClick={() => handleSubmit(isOneOff)}>Submit</Button>
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <div className="flex w-full bg-gray-100">
      <main className="flex-1 p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">{category} KYC Documents</h1>
          <div className="flex items-center space-x-2">
            <Input 
              type="search" 
              placeholder="Search documents" 
              className="w-48" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline" className="flex items-center" onClick={fetchDocuments}>
              <RefreshCwIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="w-2/5">
            {renderDocumentTable(oneOffDocs, "One-off Documents", true)}
          </div>
          <div className="w-3/5">
            {renderDocumentTable(renewalDocs, "Renewal Documents", false)}
          </div>
        </div>

        {renderAddDocumentSheet(true)}
        {renderAddDocumentSheet(false)}
        
        {viewerUrl && <FileViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />}
      </main>
    </div>
  )
}