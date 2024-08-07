// @ts-nocheck
"use client"
import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,} from "@/components/ui/sheet"
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { ScrollArea } from '../ui/scroll-area'


const key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing"
const url="https://zyszsqgdlrpnunkegipk.supabase.co"

// Initialize Supabase client
const supabase = createClient(url, key)


// Utility function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export function SupplierList() {
  const [suppliers, setSuppliers] = useState([])
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    pin: '',
    contact_name: '',
    contact_mobile: '',
    contact_email: '',
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from('acc_portal_suppliers')
      .select('*')
      .order('id', { ascending: true });
    if (error) console.error('Error fetching suppliers:', error)
    else setSuppliers(data)
  }

  const handleInputChange = (e) => {
    setNewSupplier({ ...newSupplier, [e.target.id]: e.target.value })
    console.log(e.target.value)
  }

  const handleSubmit = async () => {
    const { data, error } = await supabase
      .from('acc_portal_suppliers')
      .insert([newSupplier])
    if (error) console.error('Error adding supplier:', error)
    else {
      fetchSuppliers()
      setNewSupplier({
        name: '',
        pin: '',
        contact_name: '',
        contact_mobile: '',
        contact_email: '',
      })
    }
  }

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
                    <TableCell className='text-center'>
                      <Badge variant={supplier.status ? "success" : "destructive"}>
                        {supplier.status ? "✔️" : "❌"}
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