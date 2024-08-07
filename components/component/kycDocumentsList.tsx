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
import { RefreshCwIcon, PlusIcon } from 'lucide-react'

const key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing"
const url="https://zyszsqgdlrpnunkegipk.supabase.co"

const supabase = createClient(url, key)

const formatDate = (dateString) => {
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
    requirement: '',
  })
  const [isAddingOneOff, setIsAddingOneOff] = useState(false)
  const [isAddingRenewal, setIsAddingRenewal] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    const { data: oneOffData, error: oneOffError } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('type', 'one-off')
      .order('id', { ascending: true });

    const { data: renewalData, error: renewalError } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('type', 'renewal')
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

  const handleSubmit = async () => {
    const { data, error } = await supabase
      .from('kyc_documents')
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
        requirement: '',
      })
      setIsAddingOneOff(false)
      setIsAddingRenewal(false)
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
            <TableHead>Requirement</TableHead>
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
              <TableCell>{doc.requirement}</TableCell>
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
            <Label htmlFor="requirement">Requirement</Label>
            <Input id="requirement" placeholder="Document requirement details" value={newDocument.requirement} onChange={handleInputChange} />
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