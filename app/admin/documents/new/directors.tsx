// @ts-nocheck
"use client"
import React, { Fragment, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { X, ArrowUpDown, Settings } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

const defaultColumns = {
  issueDate: true,
  expiryDate: true,
  daysToExpire: true
}

// Generate random number of directors (3-6)
const getRandomDirectors = () => {
  const count = Math.floor(Math.random() * 4) + 3 // 3-6 directors
  return Array(count).fill(null).map((_, index) => ({
    id: index + 1,
    name: `Director ${index + 1}`
  }))
}

export default function DirectorsDocs() {
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
    { id: 3, name: "doc 3" },
    { id: 6, name: "doc 6" },
    { id: 7, name: "doc 7" },
    { id: 8, name: "doc 8" },
  ]

  // Enhanced companies data with directors
  const companies = Array(10).fill({ name: "company A", id: 0 }).map((company, index) => {
    const directors = getRandomDirectors();
    return {
      ...company,
      id: index + 1,
      name: `Company ${String.fromCharCode(65 + index)}`,
      directors: directors,
      // Create documents for each director with proper dates
      directorDocuments: directors.reduce((acc, director) => ({
        ...acc,
        [director.id]: documents.reduce((docAcc, doc) => ({
          ...docAcc,
          [doc.id]: {
            issueDate: new Date(2024, 0, index + director.id).toISOString(),
            expiryDate: new Date(2025, 6, index + director.id).toISOString()
          }
        }), {})
      }), {})
    };
  });

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
  
      <div className="flex-grow overflow-hidden border border-gray-200 rounded-lg">
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow className="border-b border-gray-200">
                <TableHead 
                  className="w-[50px] border-r border-gray-200 py-2 cursor-pointer bg-gray-50"
                  rowSpan={3}
                >
                  #
                </TableHead>
                <TableHead 
                  className="w-[150px] border-r border-gray-200 py-2 cursor-pointer bg-gray-50"
                  onClick={() => handleSort("name")}
                  rowSpan={3}
                >
                  Company <ArrowUpDown className="inline h-4 w-4" />
                </TableHead>
                <TableHead 
                  className="w-[200px] border-r border-gray-200 py-2 bg-gray-50"
                  rowSpan={3}
                >
                  Director
                </TableHead>
                {documents.filter(doc => !visibleDocs.includes(doc.id)).map((doc) => (
                  <TableHead 
                    key={doc.id} 
                    className="text-center border-r-2 border-gray-300 py-2 bg-gray-50 font-medium"
                    colSpan={Object.values(showColumns).filter(Boolean).length + 2} // +2 for Upload and Status
                  >
                    {doc.name}
                  </TableHead>
                ))}
              </TableRow>
             
              <TableRow className="border-b border-gray-200">
                {documents.filter(doc => !visibleDocs.includes(doc.id)).map((doc) => (
                  <Fragment key={`columns-${doc.id}`}>
                    <TableHead 
                      className="text-center border-r border-gray-200 py-2 px-2 text-xs bg-gray-50"
                      onClick={() => handleSort(`upload-${doc.id}`)}
                    >
                      Upload <ArrowUpDown className="inline h-3 w-3" />
                    </TableHead>
                    {showColumns.issueDate && (
                      <TableHead 
                        className="text-center border-r border-gray-200 py-2 px-2 text-xs bg-gray-50"
                        onClick={() => handleSort(`issueDate-${doc.id}`)}
                      >
                        Issue Date <ArrowUpDown className="inline h-3 w-3" />
                      </TableHead>
                    )}
                    {showColumns.expiryDate && (
                      <TableHead 
                        className="text-center border-r border-gray-200 py-2 px-2 text-xs bg-gray-50"
                        onClick={() => handleSort(`expiryDate-${doc.id}`)}
                      >
                        Expiry Date <ArrowUpDown className="inline h-3 w-3" />
                      </TableHead>
                    )}
                    {showColumns.daysToExpire && (
                      <TableHead 
                        className="text-center border-r border-gray-200 py-2 px-2 text-xs bg-gray-50"
                        onClick={() => handleSort(`daysToExpire-${doc.id}`)}
                      >
                        Days Left <ArrowUpDown className="inline h-3 w-3" />
                      </TableHead>
                    )}
                    <TableHead 
                      className="text-center border-r border-gray-200 py-2 px-2 text-xs bg-gray-50"
                      onClick={() => handleSort(`status-${doc.id}`)}
                    >
                      Status <ArrowUpDown className="inline h-3 w-3" />
                    </TableHead>
                  </Fragment>
                ))}
              </TableRow>
              <TableRow className="border-b border-gray-200">
                {documents.filter(doc => !visibleDocs.includes(doc.id)).map((doc) => {
                  // Calculate statistics for each document
                  const total = sortedCompanies.reduce((sum, company) => 
                    sum + company.directors.length, 0);
                  const completed = sortedCompanies.reduce((sum, company) => 
                    sum + company.directors.reduce((dSum, director) => 
                      dSum + (company.directorDocuments[director.id][doc.id]?.issueDate ? 1 : 0), 0), 0);
                  const pending = total - completed;
                  
                  return (
                    <TableHead 
                      key={`stats-${doc.id}`}
                      className="text-center border-r-2 border-gray-300 py-1 bg-gray-50"
                      colSpan={Object.values(showColumns).filter(Boolean).length + 2}
                    >
                      <div className="flex justify-around text-xs">
                        <span>Total: {total}</span>
                        <span className="text-green-600">Complete: {completed}</span>
                        <span className="text-red-600">Pending: {pending}</span>
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCompanies.map((company) => (
                <Fragment key={`company-${company.id}`}>
                  {company.directors.map((director, idx) => (
                    <TableRow 
                      key={`director-${company.id}-${director.id}`} 
                      className={`
                        border-b border-gray-200 
                        ${idx === 0 ? 'border-t-2 border-t-gray-300' : ''}
                        ${idx === company.directors.length - 1 ? 'border-b-2 border-b-gray-300' : ''}
                      `}
                    >
                      {idx === 0 ? (
                        <>
                          <TableCell 
                            className="border-r border-gray-200 py-2 text-center font-medium"
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
                      ) : null}
                      <TableCell className="border-r border-gray-200 py-2 pl-4">
                        {director.name}
                      </TableCell>
                      {documents.filter(doc => !visibleDocs.includes(doc.id)).map((doc) => (
                        <Fragment key={`doc-${doc.id}-${director.id}`}>
                          <TableCell className="text-center border-r border-gray-200 py-2 px-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-blue-500 hover:text-blue-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          {showColumns.issueDate && (
                            <TableCell className="text-center border-r border-gray-200 py-2 px-2">
                              {company.directorDocuments[director.id][doc.id]?.issueDate && 
                                new Date(company.directorDocuments[director.id][doc.id].issueDate)
                                  .toLocaleDateString()}
                            </TableCell>
                          )}
                          {showColumns.expiryDate && (
                            <TableCell className="text-center border-r border-gray-200 py-2 px-2">
                              {company.directorDocuments[director.id][doc.id]?.expiryDate && 
                                new Date(company.directorDocuments[director.id][doc.id].expiryDate)
                                  .toLocaleDateString()}
                            </TableCell>
                          )}
                          {showColumns.daysToExpire && (
                            <TableCell className="text-center border-r border-gray-200 py-2 px-2">
                              {company.directorDocuments[director.id][doc.id]?.expiryDate && (
                                <span className={
                                  calculateDaysToExpire(company.directorDocuments[director.id][doc.id].expiryDate) < 30 
                                    ? 'text-red-500 font-medium' 
                                    : ''
                                }>
                                  {calculateDaysToExpire(company.directorDocuments[director.id][doc.id].expiryDate)}
                                </span>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="text-center border-r border-gray-200 py-2 px-2">
                            {company.directorDocuments[director.id][doc.id]?.issueDate ? (
                              <span className="text-green-500 font-medium">Complete</span>
                            ) : (
                              <span className="text-red-500 font-medium">Pending</span>
                            )}
                          </TableCell>
                        </Fragment>
                      ))}
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
  
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
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
    </div>
  )
}