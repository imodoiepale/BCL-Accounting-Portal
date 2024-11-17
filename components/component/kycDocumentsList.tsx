// @ts-nocheck
"use client"
import React, { useState, useEffect } from 'react'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCwIcon, UploadIcon, EyeIcon, ArrowUpDown, Edit2Icon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '@/lib/supabaseClient'

const Dialog = dynamic(() => import("@/components/ui/dialog").then(mod => mod.Dialog), { ssr: false })
const DialogContent = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogContent), { ssr: false })
const DialogHeader = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogHeader), { ssr: false })
const DialogTitle = dynamic(() => import("@/components/ui/dialog").then(mod => mod.DialogTitle), { ssr: false })

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

const getDaysToExpiryColor = (days) => {
  if (days === 'N/A') return 'text-gray-500';
  const daysNum = parseInt(days);
  if (daysNum <= 0) return 'text-red-500 font-bold';
  if (daysNum <= 90) return 'text-blue-500';
  return 'text-green-500';
};

const FileViewer = ({ url, onClose }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90%] sm:max-h-[90%]">
        <DialogHeader>
          <DialogTitle>Document Viewer</DialogTitle>
        </DialogHeader>
        <iframe src={url} className="w-full h-[80vh]" title="Document Viewer" />
      </DialogContent>
    </Dialog>
  )
}

export function KYCDocumentsList({ category, subcategory }) {
  const { user } = useUser()

  const [documents, setDocuments] = useState([])
  const [isUploadingDocument, setIsUploadingDocument] = useState(false)
  const [uploadingDocumentId, setUploadingDocumentId] = useState(null)
  const [file, setFile] = useState(null)
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewerUrl, setViewerUrl] = useState(null)
  const [editingDocument, setEditingDocument] = useState(null)
  const [noExpiryDate, setNoExpiryDate] = useState(false)

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user, category, subcategory, fetchDocuments])

  const fetchDocuments = useCallback(async () => {
    const { data: baseDocuments, error: baseError } = await supabase
      .from('acc_portal_kyc')
      .select('*')
      .eq('listed', true)
      .eq('category', category)
      .eq('subcategory', subcategory);

    if (baseError) {
      console.error('Error fetching base documents:', baseError)
      toast.error('Failed to fetch documents. Please try again.')
      return
    }

    const { data: uploadedDocuments, error: uploadError } = await supabase
      .from('acc_portal_kyc_uploads')
      .select('*')
      .eq('userid', user.id);

    if (uploadError) {
      console.error('Error fetching uploaded documents:', uploadError)
      toast.error('Failed to fetch uploaded documents. Please try again.')
      return
    }

    const mergedDocuments = baseDocuments.map(baseDoc => {
      const uploadedDoc = uploadedDocuments.find(upDoc => upDoc.kyc_id === baseDoc.id);
      return {
        ...baseDoc,
        ...uploadedDoc,
        isUploaded: !!uploadedDoc
      };
    });

    setDocuments(mergedDocuments);
  })

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setNoExpiryDate(checked);
      if (checked) {
        setEditingDocument({ ...editingDocument, expiry_date: null });
      }
    } else {
      setEditingDocument({ ...editingDocument, [id]: value });
    }
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleViewUpload = async (doc) => {
    if (doc.filepath) {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(doc.filepath, 60)

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

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(`${user.id}/${fileName}`, file)

      if (error) {
        throw new Error(`File upload failed: ${error.message}`)
      }

      const uploadData = {
        userid: user.id,
        kyc_id: editingDocument.id,
        filepath: data.path,
        issue_date: editingDocument.issue_date,
        expiry_date: noExpiryDate ? null : editingDocument.expiry_date,
        reminder_days: noExpiryDate ? null : calculateRemainingDays(editingDocument.issue_date, editingDocument.expiry_date).toString()
      };

      const { error: insertError } = await supabase
        .from('acc_portal_kyc_uploads')
        .insert(uploadData)

      if (insertError) {
        throw new Error(`Document insert failed: ${insertError.message}`)
      }

      toast.success("Document uploaded and inserted successfully")

      fetchDocuments()
      setIsUploadingDocument(false)
      setEditingDocument(null)
      setFile(null)
      setNoExpiryDate(false)
    } catch (error) {
      console.error('Error in handleFileUpload:', error)
      toast.error(error.message)
    }
  }

  const handleEdit = (doc) => {
    setEditingDocument({
      id: doc.id,
      issue_date: doc.issue_date || '',
      expiry_date: doc.expiry_date || '',
    })
    setNoExpiryDate(!doc.expiry_date)
  }

  const handleUpdate = async () => {
    try {
      const updateData = {
        issue_date: editingDocument.issue_date,
        expiry_date: noExpiryDate ? null : editingDocument.expiry_date,
        reminder_days: noExpiryDate ? null : calculateRemainingDays(editingDocument.issue_date, editingDocument.expiry_date).toString()
      };

      const { error } = await supabase
        .from('acc_portal_kyc_uploads')
        .update(updateData)
        .eq('kyc_id', editingDocument.id)
        .eq('userid', user.id)

      if (error) {
        throw new Error(`Document update failed: ${error.message}`)
      }

      toast.success("Document updated successfully")

      fetchDocuments()
      setEditingDocument(null)
      setNoExpiryDate(false)
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
      doc.department.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  return (
    <div className="flex w-full bg-gray-100">

      <main className="flex-1 p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">KYC Documents - {category} {subcategory && `- ${subcategory}`}</h1>
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

        <Card className="h-full overflow-auto shadow-lg rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] bg-gray-100 text-gray-700 font-semibold">No.</TableHead>
                <TableHead onClick={() => handleSort('name')} className="cursor-pointer bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200">
                  Document Name {sortColumn === 'name' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead onClick={() => handleSort('department')} className="cursor-pointer bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200">
                  Department {sortColumn === 'department' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead onClick={() => handleSort('issue_date')} className="cursor-pointer bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200">
                  Issue Date {sortColumn === 'issue_date' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead onClick={() => handleSort('expiry_date')} className="cursor-pointer bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200">
                  Expiry Date {sortColumn === 'expiry_date' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead onClick={() => handleSort('reminder_days')} className="cursor-pointer bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200">
                  Days To Expiry {sortColumn === 'reminder_days' && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                </TableHead>
                <TableHead className="bg-gray-100 text-gray-700 font-semibold">Status</TableHead>
                <TableHead className="bg-gray-100 text-gray-700 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filterDocuments(sortDocuments(documents)).map((doc, index) => (
                <TableRow key={doc.id} className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}>
                  <TableCell className="font-medium text-gray-900">{index + 1}</TableCell>
                  <TableCell className="text-gray-800">{doc.name}</TableCell>
                  <TableCell className="text-gray-800">{doc.department}</TableCell>
                  <TableCell className="text-gray-800">{doc.isUploaded ? formatDate(doc.issue_date) : 'Pending'}</TableCell>
                  <TableCell className="text-gray-800">{doc.isUploaded ? (doc.expiry_date ? formatDate(doc.expiry_date) : 'One-off') : 'Pending'}</TableCell>
                  <TableCell className={`font-medium ${getDaysToExpiryColor(doc.reminder_days)}`}>
                    {doc.reminder_days || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge className={doc.isUploaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {doc.isUploaded ? 'Uploaded' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" onClick={() => handleViewUpload(doc)} className="mr-2 hover:bg-blue-50 text-blue-600 border-blue-200">
                      {doc.isUploaded ? <EyeIcon className="w-4 h-4 mr-2" /> : <UploadIcon className="w-4 h-4 mr-2" />}
                      {doc.isUploaded ? "View" : "Upload"}
                    </Button>
                    {doc.isUploaded && (
                      <Button variant="outline" onClick={() => handleEdit(doc)} className="hover:bg-green-50 text-green-600 border-green-200">
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
          <Dialog open={isUploadingDocument} onOpenChange={(open) => {
            setIsUploadingDocument(open)
            if (!open) {
              setEditingDocument(null)
              setFile(null)
              setNoExpiryDate(false)
            }
          }}>
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
                <div className="flex items-center">
                  <input 
                    id="noExpiryDateUpload" 
                    type="checkbox" 
                    checked={noExpiryDate}
                    onChange={handleInputChange}
                    className="mr-2"
                    aria-label="No Expiry Date"
                  />
                  <Label htmlFor="noExpiryDateUpload">No Expiry Date</Label>
                </div>
                {!noExpiryDate && (
                  <div>
                    <Label htmlFor="expiry_date">Expiry Date</Label>
                    <Input 
                      id="expiry_date" 
                      type="date" 
                      value={editingDocument?.expiry_date || ''} 
                      onChange={handleInputChange} 
                      required 
                      aria-label="Expiry Date"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="file">Upload Document</Label>
                  <Input 
                    id="file" 
                    type="file" 
                    onChange={handleFileChange} 
                    required 
                    aria-label="Upload Document"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button className="bg-blue-600 text-white mr-2" onClick={handleFileUpload}>Upload</Button>
                <Button variant="outline" onClick={() => {
                  setIsUploadingDocument(false)
                  setEditingDocument(null)
                  setFile(null)
                  setNoExpiryDate(false)
                }}>Cancel</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {editingDocument && !isUploadingDocument && (
          <Dialog open={!!editingDocument} onOpenChange={() => {
            setEditingDocument(null)
            setNoExpiryDate(false)
          }}>
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
                <div className="flex items-center">
                  <input
                    id="noExpiryDate"
                    type="checkbox"
                    checked={noExpiryDate}
                    onChange={handleInputChange}
                    className="mr-2"
                    aria-label="No Expiry Date"
                  />
                  <Label htmlFor="noExpiryDateEdit">No Expiry Date</Label>
                </div>
                {!noExpiryDate && (
                  <div>
                    <Label htmlFor="expiry_date">Expiry Date</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={editingDocument.expiry_date || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <Button className="bg-blue-600 text-white mr-2" onClick={handleUpdate}>Update</Button>
                <Button variant="outline" onClick={() => {
                  setEditingDocument(null)
                  setNoExpiryDate(false)
                }}>Cancel</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {viewerUrl && <FileViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />}
      </main>
    </div>
  )
}