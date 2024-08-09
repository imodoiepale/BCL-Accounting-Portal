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
import { RefreshCwIcon, PlusIcon, UploadIcon, EyeIcon } from 'lucide-react'

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


export function KYCDocumentsList() {
  const [oneOffDocs, setOneOffDocs] = useState([])
  const [renewalDocs, setRenewalDocs] = useState([])
  const [newDocument, setNewDocument] = useState({
    name: '',
    type: 'one-off',
    status: 'pending',
    expiry_date: '',
    description: '',
    file_path: '',
  })
  const [isAddingOneOff, setIsAddingOneOff] = useState(false)
  const [isAddingRenewal, setIsAddingRenewal] = useState(false)
  const [file, setFile] = useState(null)

  useEffect(() => {
    createBucketAndFolders().then(() => {
      fetchDocuments()
    })
  }, [])

  const createBucketAndFolders = async () => {
    // Create the main bucket
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('kyc-documents', {
      public: false,
      allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
      fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
    })

    if (bucketError && bucketError.message !== 'Bucket already exists') {
      console.error('Error creating bucket:', bucketError)
      return
    }

    // Create subfolders
    const folders = ['one-off', 'renewal']
    for (const folder of folders) {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(`${folder}/.keep`, new Blob([''])) // Create an empty file to ensure folder creation

      if (error && error.message !== 'The resource already exists') {
        console.error(`Error creating ${folder} folder:`, error)
      }
    }
  }

  const fetchDocuments = async () => {
    const { data: oneOffData, error: oneOffError } = await supabase
      .from('acc_portal_kyc_docs')
      .select('*')
      .eq('document_type', 'one_off')
      .order('id', { ascending: true });
  
    const { data: renewalData, error: renewalError } = await supabase
      .from('acc_portal_kyc_docs')
      .select('*')
      .eq('document_type', 'renewal')
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
      console.log('Current newDocument state:', newDocument);
  
      // Check if the table exists
      const { data: tableExists, error: tableCheckError } = await supabase
        .from('acc_portal_kyc_docs')
        .select('id')
        .limit(1);
  
      if (tableCheckError) {
        console.error('Error checking table existence:', tableCheckError);
        throw new Error(`Table check failed: ${tableCheckError.message || 'Unknown error'}`);
      }
  
      if (!tableExists) {
        console.error('acc_portal_kyc_docs table does not exist');
        throw new Error('acc_portal_kyc_docs table does not exist in the database');
      }
  
      let file_path = '';
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const { data, error } = await supabase.storage
          .from('kyc-documents')
          .upload(`${isOneOff ? 'one_off' : 'renewal'}/${fileName}`, file)
  
        if (error) {
          console.error('Error uploading file:', error)
          throw new Error(`File upload failed: ${error.message}`)
        }
  
        file_path = data.path;
      }
  
      const documentToInsert = {
        name: newDocument.name,
        category: newDocument.type, // Assuming 'type' in newDocument corresponds to 'category' in the table
        document_type: isOneOff ? 'one_off' : 'renewal',
        status: newDocument.status,
        description: newDocument.description,
        expiry_date: isOneOff ? null : newDocument.expiry_date,
        document_url: file_path,
        upload_date: new Date().toISOString(),
        // You need to provide these values:
        user_id: null, // Replace with actual user_id if available
        entity_id: null, // Replace with actual entity_id if available
        entity_type: '', // Replace with actual entity_type if available
      }
  
      console.log('Attempting to insert document:', documentToInsert);
  
      const { data, error } = await supabase
        .from('acc_portal_kyc_docs')
        .insert([documentToInsert])
        .select()
  
      if (error) {
        console.error('Supabase insertion error:', error)
        throw new Error(`Document insertion failed: ${error.message || 'Unknown error'}`)
      }
  
      if (!data || data.length === 0) {
        console.error('No data returned from insert operation')
        throw new Error('Document insertion failed: No data returned')
      }
  
      console.log('Document added successfully:', data)
      
      fetchDocuments()
      setNewDocument({
        name: '',
        type: '',
        status: 'pending',
        expiry_date: '',
        description: '',
      })
      setFile(null)
      setIsAddingOneOff(false)
      setIsAddingRenewal(false)
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      alert(`Failed to add document: ${error.message}`);
    }
  }

  const handleViewUpload = async (doc) => {
    if (doc.file_path) {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(doc.file_path, 60)

      if (error) {
        console.error('Error creating signed URL:', error)
        return
      }

      window.open(data.signedUrl, '_blank')
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
        .upload(`${doc.type}/${fileName}`, file)

      if (error) {
        console.error('Error uploading file:', error)
        return
      }

      const { error: updateError } = await supabase
        .from('kyc_documents')
        .update({ file_path: data.path })
        .eq('id', doc.id)

      if (updateError) {
        console.error('Error updating document:', updateError)
        return
      }

      fetchDocuments()
    }
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
            <TableHead>Document Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>View/Upload</TableHead>
            {!isOneOff && <TableHead>Expiry Date</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc, index) => (
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
                  {doc.file_path ? <EyeIcon className="w-4 h-4 mr-2" /> : <UploadIcon className="w-4 h-4 mr-2" />}
                  {doc.file_path ? "View" : "Upload"}
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
          <h1 className="text-xl font-semibold">KYC Documents List</h1>
          <div className="flex items-center space-x-2">
            <Input type="search" placeholder="Search documents" className="w-48" />
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
      </main>
    </div>
  )
}