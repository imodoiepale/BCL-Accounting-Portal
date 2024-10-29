// @ts-nocheck
"use client"
import React, { Fragment, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { X, ArrowUpDown, Search, Settings, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"

export default function DocsTable() {
  // State management
  const [visibleDocs, setVisibleDocs] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedCell, setSelectedCell] = useState({ companyId: null, directorId: null, docId: null })
  const [documentData, setDocumentData] = useState({})
  const [showExpired, setShowExpired] = useState(true)
  const [showInactive, setShowInactive] = useState(true)

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null,
    issueDate: "",
    expiryDate: "",
  })

  // Static data
  const documents = [
    { id: 1, name: "doc 1" },
    { id: 2, name: "doc 2" },
    { id: 4, name: "doc 4" },
    { id: 5, name: "doc 5" },
  ]

  // Generate directors
  const generateDirectors = () => {
    return Array(4).fill(null).map((_, idx) => ({
      id: idx + 1,
      name: `Director ${idx + 1}`
    }))
  }

  // Generate companies with directors
  const companies = Array(4).fill(null).map((_, idx) => ({
    id: idx + 1,
    name: `Company ${String.fromCharCode(65 + idx)}`,
    directors: generateDirectors()
  }))

  // Utility function for document background colors
  const getDocumentBackgroundColor = (docIndex) => {
    const colors = [
      'bg-blue-50/50',
      'bg-purple-50/50',
      'bg-orange-50/50',
      'bg-emerald-50/50'
    ]
    return colors[docIndex % colors.length]
  }

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem("documentData")
    if (savedData) {
      setDocumentData(JSON.parse(savedData))
    }
  }, [])

  // Save data when it changes
  useEffect(() => {
    localStorage.setItem("documentData", JSON.stringify(documentData))
  }, [documentData])

  // Utility functions
  const calculateDaysToExpire = (expiryDate) => {
    if (!expiryDate) return null
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const handleUpload = () => {
    if (!uploadForm.file || !uploadForm.issueDate || !uploadForm.expiryDate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    const { companyId, directorId, docId } = selectedCell
    const key = `${companyId}-${directorId}-${docId}`
    const daysToExpire = calculateDaysToExpire(uploadForm.expiryDate)
    
    setDocumentData(prev => ({
      ...prev,
      [key]: {
        ...uploadForm,
        fileName: uploadForm.file.name,
        daysToExpire,
        status: daysToExpire > 0 ? 'active' : 'inactive'
      }
    }))
    
    setUploadDialogOpen(false)
    setUploadForm({ file: null, issueDate: "", expiryDate: "" })
    
    toast({
      title: "Success",
      description: "Document uploaded successfully"
    })
  }

  const getTotalCounts = () => {
    const totalDirectors = companies.reduce((sum, company) => sum + company.directors.length, 0)
    let complete = 0
    let pending = totalDirectors

    companies.forEach(company => {
      company.directors.forEach(director => {
        const isComplete = documents.every(doc => {
          const key = `${company.id}-${director.id}-${doc.id}`
          const data = documentData[key]
          return data && data.daysToExpire > 0
        })
        if (isComplete) {
          complete++
          pending--
        }
      })
    })

    return { total: totalDirectors, complete, pending }
  }

  const getDocumentCounts = (docId) => {
    let uploadCount = 0
    let activeCount = 0
    let pendingCount = 0
    const totalCount = companies.reduce((sum, company) => sum + company.directors.length, 0)

    companies.forEach(company => {
      company.directors.forEach(director => {
        const key = `${company.id}-${director.id}-${docId}`
        const data = documentData[key]
        if (data) {
          uploadCount++
          if (data.daysToExpire > 0) {
            activeCount++
          } else {
            pendingCount++
          }
        }
      })
    })

    pendingCount = totalCount - activeCount
    return { uploadCount, activeCount, pendingCount }
  }

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-screen flex flex-col p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Document Management</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[200px]"
          />
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-grow overflow-hidden border border-gray-200 rounded-lg">
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow className="border-b border-gray-200">
                <TableHead className="w-[50px] border-r border-gray-200 py-2" rowSpan={5}>
                  #
                </TableHead>
                <TableHead className="w-[150px] border-r border-gray-200 py-2" rowSpan={5}>
                  Company
                </TableHead>
                <TableHead className="w-[200px] border-r border-gray-200 py-2" rowSpan={5}>
                  Director
                </TableHead>
                <TableHead className="w-[100px] border-r border-gray-200 py-2" rowSpan={2}>
                  Metrics
                </TableHead>
                {documents.map(doc => (
                  <TableHead 
                    key={doc.id} 
                    colSpan={5} 
                    className="text-center border-r border-gray-400 py-2 font-bold bg-gray-50"
                  >
                    {doc.name}
                  </TableHead>
                ))}
              </TableRow>

              <TableRow className="border-b border-gray-200">
                {documents.map((doc, docIndex) => (
                  <Fragment key={`header-${doc.id}`}>
                    <TableHead className={`
                      text-center border-r py-2 px-2 text-xs font-bold
                      ${docIndex === 0 ? 'border-l-2 border-l-gray-400' : ''}
                      ${getDocumentBackgroundColor(docIndex)}
                    `}>
                      Upload
                    </TableHead>
                    <TableHead className={`
                      text-center border-r py-2 px-2 text-xs font-bold
                      ${getDocumentBackgroundColor(docIndex)}
                    `}>
                      Issue Date
                    </TableHead>
                    <TableHead className={`
                      text-center border-r py-2 px-2 text-xs font-bold
                      ${getDocumentBackgroundColor(docIndex)}
                    `}>
                      Expiry Date
                    </TableHead>
                    <TableHead className={`
                      text-center border-r py-2 px-2 text-xs font-bold
                      ${getDocumentBackgroundColor(docIndex)}
                    `}>
                      Days Left
                    </TableHead>
                    <TableHead className={`
                      text-center border-r py-2 px-2 text-xs font-bold
                      ${getDocumentBackgroundColor(docIndex)}
                      ${docIndex === documents.length - 1 ? '' : 'border-r-2 border-r-gray-400'}
                    `}>
                      Status
                    </TableHead>
                  </Fragment>
                ))}
              </TableRow>

              {/* Total Row */}
              <TableRow className="border-b border-gray-200">
                <TableHead className="text-center border-r border-gray-200 py-1 text-xs bg-gray-100 font-bold">
                  Total: {getTotalCounts().total}
                </TableHead>
                {documents.map((doc, docIndex) => {
                  const counts = getDocumentCounts(doc.id);
                  return (
                    <Fragment key={`total-${doc.id}`}>
                      <TableHead className={`
                        text-center border-r py-1 text-xs font-bold
                        ${docIndex === 0 ? 'border-l-2 border-l-gray-400' : ''}
                        ${getDocumentBackgroundColor(docIndex)}
                      `}>
                        {counts.uploadCount}
                      </TableHead>
                      <TableHead colSpan={3} className={`border-r ${getDocumentBackgroundColor(docIndex)}`} />
                      <TableHead className={`
                        text-center border-r py-1 text-xs font-bold
                        ${getDocumentBackgroundColor(docIndex)}
                        ${docIndex === documents.length - 1 ? '' : 'border-r-2 border-r-gray-400'}
                      `}>
                        {counts.activeCount + counts.pendingCount}
                      </TableHead>
                    </Fragment>
                  );
                })}
              </TableRow>

              {/* Complete Row */}
              <TableRow className="border-b border-gray-200">
                <TableHead className="text-center border-r border-gray-200 py-1 text-xs bg-green-100 font-bold text-green-700">
                  Complete: {getTotalCounts().complete}
                </TableHead>
                {documents.map((doc, docIndex) => {
                  const counts = getDocumentCounts(doc.id);
                  return (
                    <Fragment key={`complete-${doc.id}`}>
                      <TableHead className={`
                        text-center border-r py-1 text-xs font-bold text-green-700
                        ${docIndex === 0 ? 'border-l-2 border-l-gray-400' : ''}
                        ${getDocumentBackgroundColor(docIndex)}
                      `}>
                        {counts.uploadCount}
                      </TableHead>
                      <TableHead colSpan={3} className={`border-r ${getDocumentBackgroundColor(docIndex)}`} />
                      <TableHead className={`
                        text-center border-r py-1 text-xs font-bold text-green-700
                        ${getDocumentBackgroundColor(docIndex)}
                        ${docIndex === documents.length - 1 ? '' : 'border-r-2 border-r-gray-400'}
                      `}>
                        {counts.activeCount}
                      </TableHead>
                    </Fragment>
                  );
                })}
              </TableRow>

              {/* Pending Row */}
              <TableRow className="border-b-2 border-gray-300">
                <TableHead className="text-center border-r border-gray-200 py-1 text-xs bg-red-100 font-bold text-red-700">
                  Pending: {getTotalCounts().pending}
                </TableHead>
                {documents.map((doc, docIndex) => {
                  const counts = getDocumentCounts(doc.id);
                  return (
                    <Fragment key={`pending-${doc.id}`}>
                      <TableHead className={`
                        text-center border-r py-1 text-xs font-bold text-red-700
                        ${docIndex === 0 ? 'border-l-2 border-l-gray-400' : ''}
                        ${getDocumentBackgroundColor(docIndex)}
                      `}>
                        {counts.pendingCount}
                      </TableHead>
                      <TableHead colSpan={3} className={`border-r ${getDocumentBackgroundColor(docIndex)}`} />
                      <TableHead className={`
                        text-center border-r py-1 text-xs font-bold text-red-700
                        ${getDocumentBackgroundColor(docIndex)}
                        ${docIndex === documents.length - 1 ? '' : 'border-r-2 border-r-gray-400'}
                      `}>
                        {counts.pendingCount}
                      </TableHead>
                    </Fragment>
                  );
                })}
              </TableRow>
            </TableHeader>
<TableBody>
              {filteredCompanies.map(company => (
                <Fragment key={company.id}>
                  {company.directors.map((director, idx) => (
                    <TableRow 
                      key={`${company.id}-${director.id}`}
                      className={`
                        border-b border-gray-200
                        ${idx === 0 ? 'border-t-2 border-t-gray-300' : ''}
                        ${idx === company.directors.length - 1 ? 'border-b-2 border-b-gray-300' : ''}
                      `}
                    >
                      {idx === 0 && (
                        <>
                          <TableCell 
                            className="border-r border-gray-200 py-2 text-center"
                            rowSpan={company.directors.length}
                          >
                            {company.id}
                          </TableCell>
                          <TableCell 
                            className="border-r border-gray-200 py-2 font-medium"
                            rowSpan={company.directors.length}
                          >
                            {company.name}
                          </TableCell>
                        </>
                      )}
                      <TableCell className="border-r border-gray-200 py-2">
                        {director.name}
                      </TableCell>
                      <TableCell className="border-r border-gray-300 py-2 text-center">
                        {/* Empty cell for metrics column */}
                      </TableCell>
                      {documents.map((doc, docIndex) => {
                        const key = `${company.id}-${director.id}-${doc.id}`
                        const data = documentData[key]
                        
                        return (
                          <Fragment key={`cell-${key}`}>
                            <TableCell className={`
                              text-center border-r py-2 px-2
                              ${docIndex === 0 ? 'border-l-2 border-l-gray-400' : ''}
                              ${getDocumentBackgroundColor(docIndex)}
                            `}>
                              {!data ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    setSelectedCell({ companyId: company.id, directorId: director.id, docId: doc.id })
                                    setUploadDialogOpen(true)
                                  }}
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                              ) : (
                                <div className="text-xs text-blue-600 truncate max-w-[100px] hover:text-blue-800">
                                  {data.fileName}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className={`
                              text-center border-r py-2 px-2 text-xs
                              ${getDocumentBackgroundColor(docIndex)}
                            `}>
                              {data?.issueDate && new Date(data.issueDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className={`
                              text-center border-r py-2 px-2 text-xs
                              ${getDocumentBackgroundColor(docIndex)}
                            `}>
                              {data?.expiryDate && new Date(data.expiryDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className={`
                              text-center border-r py-2 px-2 text-xs
                              ${getDocumentBackgroundColor(docIndex)}
                            `}>
                              {data?.daysToExpire}
                            </TableCell>
                            <TableCell className={`
                              text-center border-r py-2 px-2 text-xs
                              ${getDocumentBackgroundColor(docIndex)}
                              ${docIndex === documents.length - 1 ? '' : 'border-r-2 border-r-gray-400'}
                            `}>
                              {data && (
                                <span className={`font-medium ${data.daysToExpire > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {data.daysToExpire > 0 ? 'Active' : 'Inactive'}
                                </span>
                              )}
                            </TableCell>
                          </Fragment>
                        )
                      })}
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Upload File</Label>
              <Input
                type="file"
                onChange={(e) => setUploadForm(prev => ({ 
                  ...prev, 
                  file: e.target.files?.[0] || null 
                }))}
                accept=".pdf,.doc,.docx"
                className="cursor-pointer"
              />
              {uploadForm.file && (
                <div className="text-sm text-gray-500">
                  Selected: {uploadForm.file.name}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={uploadForm.issueDate}
                onChange={(e) => setUploadForm(prev => ({ 
                  ...prev, 
                  issueDate: e.target.value 
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={uploadForm.expiryDate}
                onChange={(e) => setUploadForm(prev => ({ 
                  ...prev, 
                  expiryDate: e.target.value 
                }))}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false)
                setUploadForm({ file: null, issueDate: "", expiryDate: "" })
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!uploadForm.file || !uploadForm.issueDate || !uploadForm.expiryDate}
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Display Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Visible Documents</Label>
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={!visibleDocs.includes(doc.id)}
                    onCheckedChange={(checked) => {
                      setVisibleDocs(prev => 
                        checked 
                          ? prev.filter(id => id !== doc.id)
                          : [...prev, doc.id]
                      )
                    }}
                    id={`doc-${doc.id}`}
                  />
                  <Label htmlFor={`doc-${doc.id}`} className="cursor-pointer">
                    {doc.name}
                  </Label>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold">Additional Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-expired" 
                  checked={showExpired}
                  onCheckedChange={setShowExpired}
                />
                <Label htmlFor="show-expired" className="cursor-pointer">
                  Show expired documents
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-inactive" 
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label htmlFor="show-inactive" className="cursor-pointer">
                  Show inactive documents
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setSettingsOpen(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    
    </div>
  )
}

            