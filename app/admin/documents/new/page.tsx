
"use client"
import React, { Fragment, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { X, ArrowUpDown, Search, Settings } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

const defaultColumns = {
  issueDate: true,
  expiryDate: true,
  daysToExpire: true
}

export default function Component() {
  // State management
  const [visibleDocs, setVisibleDocs] = useState<number[]>([])
  const [showColumns, setShowColumns] = useState(defaultColumns)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" })
  const [uploadType, setUploadType] = useState<"specific" | "all" | null>(null)
  const [selectedDocForUpload, setSelectedDocForUpload] = useState<number | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tempSettings, setTempSettings] = useState({
    columns: { ...defaultColumns },
    docs: [] as number[]
  })

  // Document form state
  const [formData, setFormData] = useState({
    file: null,
    issueDate: "",
    expiryDate: ""
  })

  const documents = [
    { id: 1, name: "doc 1" },
    { id: 2, name: "doc 2" },
    { id: 4, name: "doc 4" },
    { id: 5, name: "doc 5" },
  ]

  const companies = Array(7).fill({ name: "company A", id: 0 }).map((company, index) => ({
    ...company,
    id: index + 1,
    name: `Company ${String.fromCharCode(65 + index)}`,
    documents: documents.reduce((acc, doc) => ({
      ...acc,
      [doc.id]: {
        issueDate: new Date(2024, 0, index + 1).toISOString(),
        expiryDate: new Date(2024, 6, index + 1).toISOString()
      }
    }), {})
  }))

  // Load saved settings from localStorage
  useEffect(() => {
    const savedColumns = localStorage.getItem("documentColumns")
    const savedDocs = localStorage.getItem("visibleDocs")
    
    if (savedColumns) {
      setShowColumns(JSON.parse(savedColumns))
    }
    if (savedDocs) {
      setVisibleDocs(JSON.parse(savedDocs))
    }
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("documentColumns", JSON.stringify(showColumns))
    localStorage.setItem("visibleDocs", JSON.stringify(visibleDocs))
  }, [showColumns, visibleDocs])

  const calculateDaysToExpire = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }))
  }

  const applySettings = () => {
    setShowColumns(tempSettings.columns)
    setVisibleDocs(tempSettings.docs)
    setSettingsOpen(false)
  }

  const resetSettings = () => {
    const newSettings = {
      columns: { ...defaultColumns },
      docs: []
    }
    setTempSettings(newSettings)
    setShowColumns(newSettings.columns)
    setVisibleDocs(newSettings.docs)
    localStorage.removeItem("documentColumns")
    localStorage.removeItem("visibleDocs")
    setSettingsOpen(false)
  }

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    if (!sortConfig.key) return 0
    const direction = sortConfig.direction === "asc" ? 1 : -1
    
    if (["issueDate", "expiryDate"].includes(sortConfig.key)) {
      const docId = parseInt(sortConfig.key.split("-")[1])
      const dateA = new Date(a.documents[docId][sortConfig.key.split("-")[0]])
      const dateB = new Date(b.documents[docId][sortConfig.key.split("-")[0]])
      return direction * (dateA.getTime() - dateB.getTime())
    }
    
    if (sortConfig.key.startsWith("daysToExpire")) {
      const docId = parseInt(sortConfig.key.split("-")[1])
      const daysA = calculateDaysToExpire(a.documents[docId].expiryDate)
      const daysB = calculateDaysToExpire(b.documents[docId].expiryDate)
      return direction * (daysA - daysB)
    }
    
    return direction * (String(a[sortConfig.key as keyof typeof a]) > String(b[sortConfig.key as keyof typeof b]) ? 1 : -1)
  })

  return (
    <div className="h-screen flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Document Management </h1>
        <div className="flex gap-2">
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[200px]"
          />
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Display Settings</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Columns</Label>
                  {Object.keys(defaultColumns).map((column) => (
                    <div key={column} className="flex items-center space-x-2">
                      <Checkbox
                        checked={tempSettings.columns[column as keyof typeof defaultColumns]}
                        onCheckedChange={(checked) => {
                          setTempSettings(prev => ({
                            ...prev,
                            columns: {
                              ...prev.columns,
                              [column]: checked
                            }
                          }))
                        }}
                      />
                      <Label>{column}</Label>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Documents</Label>
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={!tempSettings.docs.includes(doc.id)}
                        onCheckedChange={(checked) => {
                          setTempSettings(prev => ({
                            ...prev,
                            docs: checked 
                              ? prev.docs.filter(id => id !== doc.id)
                              : [...prev.docs, doc.id]
                          }))
                        }}
                      />
                      <Label>{doc.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={resetSettings}>
                  Reset
                </Button>
                <Button onClick={applySettings}>
                  Apply Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-gray-200 hover:bg-gray-300">
                Batch Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Batch Upload Documents</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Upload Type</Label>
                    <select 
                      className="w-full p-2 border rounded"
                      onChange={(e) => setUploadType(e.target.value as "specific" | "all")}
                    >
                      <option value="">Select upload type</option>
                      <option value="specific">Specific Document</option>
                      <option value="all">All Documents</option>
                    </select>
                  </div>

                  {uploadType === "specific" && (
                    <div className="space-y-2">
                      <Label>Select Document</Label>
                      <select 
                        className="w-full p-2 border rounded"
                        onChange={(e) => setSelectedDocForUpload(parseInt(e.target.value))}
                      >
                        <option value="">Select document</option>
                        {documents.map(doc => (
                          <option key={doc.id} value={doc.id}>{doc.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Upload File</Label>
                    <Input type="file" />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-grow overflow-hidden border border-gray-200 rounded-lg">
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow className="border-b border-gray-200">
                <TableHead 
                  className="w-[50px] border-r border-gray-200 py-2 cursor-pointer"
                  onClick={() => handleSort("id")}
                >
                  # <ArrowUpDown className="inline h-4 w-4" />
                </TableHead>
                <TableHead 
                  className="w-[150px] border-r border-gray-200 py-2 cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  Company <ArrowUpDown className="inline h-4 w-4" />
                </TableHead>
                {documents.map((doc, index) => !visibleDocs.includes(doc.id) && (
                  <TableHead key={doc.id} className="text-center border-r-2 border-gray-300 py-2" colSpan={3}>
                    {doc.name}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow className="border-b border-gray-200">
                <TableHead className="border-r border-gray-200" />
                <TableHead className="border-r border-gray-200" />
                {documents.map((doc, docIndex) => !visibleDocs.includes(doc.id) && (
                  <Fragment key={doc.id}>
                    {showColumns.issueDate && (
                      <TableHead 
                        className="text-center border-r-2 border-gray-300 py-2 px-1 text-xs cursor-pointer"
                        onClick={() => handleSort(`issueDate-${doc.id}`)}
                      >
                        issue date <ArrowUpDown className="inline h-3 w-3" />
                      </TableHead>
                    )}
                    {showColumns.expiryDate && (
                      <TableHead 
                        className="text-center border-r-2 border-gray-300 py-2 px-1 text-xs cursor-pointer"
                        onClick={() => handleSort(`expiryDate-${doc.id}`)}
                      >
                        expiry date <ArrowUpDown className="inline h-3 w-3" />
                      </TableHead>
                    )}
                    {showColumns.daysToExpire && (
                      <TableHead 
                        className={`text-center py-2 px-1 text-xs cursor-pointer ${
                          docIndex !== documents.length - 1 ? 'border-r-2 border-gray-300' : ''
                        }`}
                        onClick={() => handleSort(`daysToExpire-${doc.id}`)}
                      >
                        days to expire <ArrowUpDown className="inline h-3 w-3" />
                      </TableHead>
                    )}
                  </Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCompanies.map((company) => (
                <TableRow key={company.id} className="border-b border-gray-200">
                  <TableCell className="border-r border-gray-200 py-2 text-center">
                    {company.id}
                  </TableCell>
                  <TableCell className="border-r border-gray-200 py-2">
                    {company.name}
                  </TableCell>
                  {documents.map((doc, docIndex) => !visibleDocs.includes(doc.id) && (
                    <Fragment key={doc.id}>
                      {showColumns.issueDate && (
                        <TableCell className="text-center border-r-2 border-gray-300 py-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <X className="inline text-red-500 cursor-pointer" />
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Upload Document</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Upload File</Label>
                                  <Input type="file" onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    setFormData(prev => ({ ...prev, file: file || null }))
                                  }} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Issue Date</Label>
                                  <Input type="date" onChange={(e) => {
                                    setFormData(prev => ({ ...prev, issueDate: e.target.value }))
                                  }} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Expiry Date</Label>
                                  <Input type="date" onChange={(e) => {
                                    setFormData(prev => ({ ...prev, expiryDate: e.target.value }))
                                  }} />
                                </div>
                                <Button className="w-full mt-4" onClick={() => {
                                  // Handle form submission
                                  console.log('Uploading document:', formData)
                                }}>
                                  Upload
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {company.documents[doc.id]?.issueDate && (
                            <span className="ml-2">
                              {new Date(company.documents[doc.id].issueDate).toLocaleDateString()}
                            </span>
                          )}
                        </TableCell>
                      )}
                      {showColumns.expiryDate && (
                        <TableCell className="text-center border-r-2 border-gray-300 py-2">
                          {company.documents[doc.id]?.expiryDate && (
                            new Date(company.documents[doc.id].expiryDate).toLocaleDateString()
                          )}
                        </TableCell>
                      )}
                      {showColumns.daysToExpire && (
                        <TableCell className={`text-center py-2 ${
                          docIndex !== documents.length - 1 ? 'border-r-2 border-gray-300' : ''
                        }`}>
                          {company.documents[doc.id]?.expiryDate && (
                            <span className={`${
                              calculateDaysToExpire(company.documents[doc.id].expiryDate) < 30 
                                ? 'text-red-500 font-semibold' 
                                : ''
                            }`}>
                              {calculateDaysToExpire(company.documents[doc.id].expiryDate)}
                            </span>
                          )}
                        </TableCell>
                      )}
                    </Fragment>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

