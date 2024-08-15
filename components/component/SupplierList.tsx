// @ts-nocheck
"use client"
import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon, UploadIcon } from 'lucide-react'
import { ScrollArea } from '../ui/scroll-area'
import { useUser } from '@clerk/clerk-react'
import { toast } from 'react-hot-toast'

const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing"
const url = "https://zyszsqgdlrpnunkegipk.supabase.co"

const supabase = createClient(url, key)

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export function SupplierList() {
  const { user } = useUser();
  const [suppliers, setSuppliers] = useState([])
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    pin: '',
    contact_name: '',
    contact_mobile: '',
    contact_email: '',
    status: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from('acc_portal_suppliers')
      .select('*')
      .eq('userid', user?.id)
      .order('id', { ascending: true });
    if (error) console.error('Error fetching suppliers:', error)
    else setSuppliers(data)
  }

  const handleInputChange = (e) => {
    setNewSupplier({ ...newSupplier, [e.target.id]: e.target.value })
  }

  const handleSubmit = async () => {
    const { data, error } = await supabase
      .from('acc_portal_suppliers')
      .insert([{ ...newSupplier, userid: user?.id , status: 'true' }])
    if (error) console.error('Error adding supplier:', error)
    else {
      fetchSuppliers()
      setNewSupplier({
        name: '',
        pin: '',
        contact_name: '',
        contact_mobile: '',
        contact_email: '',
        status: ""
      })
    }
  }

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleCSVUpload = async () => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const rows = text.split('\n').filter(row => row.trim() !== '');
        const headers = rows[0].split(',').map(header => header.trim());
        const suppliers = rows.slice(1).map(row => {
          const rowData = row.split(',');
          const supplier = {};

          headers.forEach((header, index) => {
            let value = rowData[index] ? rowData[index].trim() : '';
            supplier[header] = value;
          });

          return Object.values(supplier).some(value => value !== '') ? supplier : null;
        }).filter(supplier => supplier !== null);

        setIsLoading(true);
        let successCount = 0;
        let errorCount = 0;

        for (const supplier of suppliers) {
          try {
            const { data, error } = await supabase
              .from('acc_portal_suppliers')
              .insert([{ ...supplier, userid: user?.id }])
              .select();

            if (error) {
              console.error('Error adding supplier:', error);
              errorCount++;
            } else {
              successCount++;
              setSuppliers(prevSuppliers => [...prevSuppliers, data[0]]);
            }
          } catch (error) {
            console.error('Unexpected error during insertion:', error);
            errorCount++;
          }
        }

        setIsLoading(false);

        if (successCount > 0) {
          toast.success(`Successfully added ${successCount} supplier${successCount > 1 ? 's' : ''}.`);
        }
        if (errorCount > 0) {
          toast.error(`Failed to add ${errorCount} supplier${errorCount > 1 ? 's' : ''}.`);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const downloadCSVTemplate = () => {
    const headers = ['name', 'pin', 'contact_name', 'contact_mobile', 'contact_email'];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'supplier_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex w-full bg-gray-100">
      <main className="flex-1 p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Supplier List</h1>
          <div className="flex items-center space-x-2">
            <Input type="search" placeholder="search" className="w-48" />
            <Button variant="outline" className="flex items-center" onClick={fetchSuppliers}>
              <RefreshCwIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" className="flex items-center" onClick={downloadCSVTemplate}>
              <DownloadIcon className="w-4 h-4 mr-1" />
              Download CSV Template
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white">
                  <UploadIcon className="w-4 h-4 mr-1" />
                  Upload CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload CSV</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file containing supplier information.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <Input type="file" accept=".csv" onChange={handleFileChange} />
                  <Button onClick={handleCSVUpload} disabled={!selectedFile || isLoading}>
                    {isLoading ? 'Uploading...' : 'Submit'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild>
                <Button className="bg-blue-600 text-white">Add New Supplier</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Add Supplier</SheetTitle>
                  <SheetDescription>
                    This section includes adding all the details of a supplier to the system
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col pt-4 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="name">Supplier Name</Label>
                    <Input id="name" placeholder="XYZ Supplier" value={newSupplier.name} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pin">Supplier Pin</Label>
                    <Input id="pin" placeholder="P2288DNSK" value={newSupplier.pin} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contact_name">Supplier Contact Name</Label>
                    <Input id="contact_name" placeholder="John Doe" value={newSupplier.contact_name} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contact_mobile">Supplier Contact Mobile</Label>
                    <Input id="contact_mobile" placeholder="+25471234567" value={newSupplier.contact_mobile} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contact_email">Supplier Contact Email</Label>
                    <Input id="contact_email" placeholder="john@example.com" value={newSupplier.contact_email} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="pt-4"><Button className="bg-blue-600 text-white" onClick={handleSubmit}>Submit</Button></div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <Card>
          <Table>
            <ScrollArea className="h-[calc(100vh-200px)] w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>SUPP ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>PIN</TableHead>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Contact Mobile</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved by BCL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>SUPP-{supplier.id}</TableCell>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>{supplier.pin}</TableCell>
                    <TableCell>{supplier.contact_name}</TableCell>
                    <TableCell>{supplier.contact_mobile}</TableCell>
                    <TableCell>{supplier.contact_email}</TableCell>
                    <TableCell>{formatDate(supplier.startdate)}</TableCell>
                    <TableCell></TableCell>
                    <TableCell>
                    <span className={`font-bold capitalize ${supplier.status === 'true' ? 'text-green-600' : 'text-red-600'}`}>
                      {supplier.status === 'true' ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className='text-center'>
                    <Badge variant={supplier.verified ? "success" : "destructive"}>
                      {supplier.verified ? "✔️" : "❌"}
                    </Badge>
                  </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ScrollArea>
          </Table>
        </Card>
        <div className="flex justify-between items-center mt-4">
          <Button variant="outline" className="flex items-center">
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <span>1</span>
          <Button variant="outline" className="flex items-center">
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  )
}