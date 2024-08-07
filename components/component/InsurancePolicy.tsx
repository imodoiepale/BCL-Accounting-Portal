// @ts-nocheck
"use client"
import React, { useState } from 'react'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { PlusIcon, RefreshCwIcon, FileIcon, TrashIcon } from 'lucide-react'
import { format } from 'date-fns'

const MAX_DOCUMENTS = 10;

export function InsurancePolicy() {
  const [policies, setPolicies] = useState([
    {
      id: 1,
      policyNumber: 'POL-12345',
      insuredName: 'John Doe',
      startDate: '2023-01-01',
      endDate: '2024-01-01',
      premium: 5000,
      coverageAmount: 1000000,
      status: 'Active',
      documents: [
        { id: 1, name: 'Policy Document.pdf', type: 'application/pdf', size: 1024000, uploadDate: new Date() },
        { id: 2, name: 'Terms and Conditions.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 512000, uploadDate: new Date() }
      ]
    },
    {
      id: 1,
      policyNumber: 'POL-12345',
      insuredName: 'John Doe',
      startDate: '2023-01-01',
      endDate: '2024-01-01',
      premium: 5000,
      coverageAmount: 1000000,
      status: 'Active',
      documents: [
        { id: 1, name: 'Policy Document.pdf', type: 'application/pdf', size: 1024000, uploadDate: new Date() },
        { id: 2, name: 'Terms and Conditions.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 512000, uploadDate: new Date() },
        { id: 3, name: 'Policy Document.pdf', type: 'application/pdf', size: 1024000, uploadDate: new Date() },
        { id: 4, name: 'Terms and Conditions.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 512000, uploadDate: new Date() }
      ]
    },
    // Add more policy objects as needed
  ]);

  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);

  const handleFileUpload = (policyId, event) => {
    const file = event.target.files[0];
    if (file) {
      setPolicies(policies.map(policy => {
        if (policy.id === policyId) {
          const newDocument = {
            id: Date.now(),
            name: file.name,
            type: file.type,
            size: file.size,
            uploadDate: new Date(),
          };
          return {
            ...policy,
            documents: [...policy.documents, newDocument].slice(0, MAX_DOCUMENTS)
          };
        }
        return policy;
      }));
    }
  };

  const handleDocumentDelete = (policyId, documentId) => {
    setPolicies(policies.map(policy => {
      if (policy.id === policyId) {
        return {
          ...policy,
          documents: policy.documents.filter(doc => doc.id !== documentId)
        };
      }
      return policy;
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col w-full bg-gray-100 p-6 space-y-6">
      <h1 className="text-2xl font-bold">Insurance Policies</h1>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy Number</TableHead>
              <TableHead>Insured Name</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead>Coverage Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Documents</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={policy.id}>
                <TableCell>{policy.policyNumber}</TableCell>
                <TableCell>{policy.insuredName}</TableCell>
                <TableCell>{policy.startDate}</TableCell>
                <TableCell>{policy.endDate}</TableCell>
                <TableCell>${policy.premium}</TableCell>
                <TableCell>${policy.coverageAmount}</TableCell>
                <TableCell>{policy.status}</TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedPolicy(policy);
                      setIsDocumentDialogOpen(true);
                    }}
                  >
                    View Documents ({policy.documents.length})
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="max-w-[1400px]">
          <DialogHeader>
            <DialogTitle>Documents for Policy: {selectedPolicy?.policyNumber}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedPolicy?.documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.name}</TableCell>
                    <TableCell>{doc.type}</TableCell>
                    <TableCell>{formatFileSize(doc.size)}</TableCell>
                    <TableCell>{format(doc.uploadDate, 'yyyy-MM-dd HH:mm')}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <FileIcon className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDocumentDelete(selectedPolicy.id, doc.id)}
                        >
                          <TrashIcon className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <div className="mt-4">
            <Input
                className='w-1/5 bg-blue-700/70 '
              type="file"
              onChange={(e) => handleFileUpload(selectedPolicy?.id, e)}
              disabled={selectedPolicy?.documents.length >= MAX_DOCUMENTS}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}