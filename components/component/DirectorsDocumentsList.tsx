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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { RefreshCwIcon, PlusIcon, UploadIcon, EyeIcon } from 'lucide-react'

const key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing"
const url="https://zyszsqgdlrpnunkegipk.supabase.co"

// Initialize Supabase client
const supabase = createClient(url, key)

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

export function DirectorsDocumentsList() {
  const [oneOffDocs, setOneOffDocs] = useState([])
  const [renewalDocs, setRenewalDocs] = useState([])
  const [newDocument, setNewDocument] = useState({
    name: '',
    type: 'one-off',
    status: 'pending',
    expiry_date: '',
    description: '',
    file_path: '',
    director_id: '', // Added director_id field
  })
  const [isAddingOneOff, setIsAddingOneOff] = useState(false)
  const [isAddingRenewal, setIsAddingRenewal] = useState(false)
  const [file, setFile] = useState(null)
  const [directors, setDirectors] = useState([]) // State to store directors list

  useEffect(() => {
    fetchDocuments()
    fetchDirectors()
  }, [])

  const fetchDocuments = async () => {
    const { data: oneOffData, error: oneOffError } = await supabase
      .from('directors_documents')
      .select('*')
      .eq('type', 'one-off')
      .order('id', { ascending: true });

    const { data: renewalData, error: renewalError } = await supabase
      .from('directors_documents')
      .select('*')
      .eq('type', 'renewal')
      .order('id', { ascending: true });

    if (oneOffError) console.error('Error fetching one-off documents:', oneOffError)
    else setOneOffDocs(oneOffData)

    if (renewalError) console.error('Error fetching renewal documents:', renewalError)
    else setRenewalDocs(renewalData)
  }

  const fetchDirectors = async () => {
    const { data, error } = await supabase
      .from('directors')
      .select('id, full_name')
      .order('full_name', { ascending: true });

    if (error) console.error('Error fetching directors:', error)
    else setDirectors(data)
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

  const handleSubmit = async () => {
    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('directors-documents')
        .upload(fileName, file)

      if (error) {
        console.error('Error uploading file:', error)
        return
      }

      newDocument.file_path = data.path
    }

    const { data, error } = await supabase
      .from('directors_documents')
      .insert([newDocument])
    if (error) console.error('Error adding document:', error)
    else {
      fetchDocuments()
      setNewDocument({
        name: '',
        type: 'one-off',
        status: 'pending',
        expiry_date: '',
        description: '',
        file_path: '',
        director_id: '',
      })
      setFile(null)
      setIsAddingOneOff(false)
      setIsAddingRenewal(false)
    }
  }

  const handleViewUpload = async (doc) => {
    if (doc.file_path) {
      const { data, error } = await supabase.storage
        .from('directors-documents')
        .createSignedUrl(doc.file_path, 60)

      if (error) {
        console.error('Error creating signed URL:', error)
        return
      }

      window.open(data.signedUrl, '_blank')
    } else {
      // Open file upload dialog
      document.getElementById(`file-upload-${doc.id}`).click()
    }
  }

  const handleFileUpload = async (e, doc) => {
    const file = e.target.files[0]
    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('directors-documents')
        .upload(fileName, file)

      if (error) {
        console.error('Error uploading file:', error)
        return
      }

      const { error: updateError } = await supabase
        .from('directors_documents')
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
            <TableHead>Director</TableHead>
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
              <TableCell>{directors.find(d => d.id === doc.director_id)?.full_name || 'Unknown'}</TableCell>
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
              {!isOneOff && <TableCell>{doc.expiry_date ? formatDate(doc.expiry_date) : 'N/A'}</TableCell>}
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
          <SheetTitle>Add {isOneOff ? "One-off" : "Renewal"} Director Document</SheetTitle>
          <SheetDescription>
            Add a new {isOneOff ? "one-off" : "renewal"} document for a director
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col pt-4 gap-4">
          <div className="space-y-1">
            <Label htmlFor="director_id">Director</Label>
            <Select onValueChange={(value) => handleSelectChange(value, 'director_id')} value={newDocument.director_id}>
              <SelectTrigger>
                <SelectValue placeholder="Select director" />
              </SelectTrigger>
              <SelectContent>
                {directors.map((director) => (
                  <SelectItem key={director.id} value={director.id}>{director.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="name">Document Name</Label>
            <Input id="name" placeholder="e.g., Director's Name" value={newDocument.name} onChange={handleInputChange} required />
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
          <Button className="bg-blue-600 text-white" onClick={handleSubmit}>Submit</Button>
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <div className="flex w-full bg-gray-100">
      <main className="flex-1 p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Directors' Documents List</h1>
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