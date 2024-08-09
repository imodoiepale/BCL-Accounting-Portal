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
import { useUser } from '@clerk/clerk-react'

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

export function BankList() {
  const { user } = useUser();

  const [banks, setBanks] = useState([])
  const [newBank, setNewBank] = useState({
    name: '',
    account_number: '',
    currency: '',
    branch: '',
    relationship_manager_name: '',
    relationship_manager_mobile: '',
    relationship_manager_email: '',
  })

  useEffect(() => {
    fetchBanks()
  }, [])

  const fetchBanks = async () => {
    const { data, error } = await supabase
      .from('acc_portal_banks')
      .select('*')
      .eq('userid', user?.id)
      .order('id', { ascending: true });
    if (error) console.error('Error fetching banks:', error)
    else setBanks(data)
  }
  

  const handleInputChange = (e) => {
    setNewBank({ ...newBank, [e.target.id]: e.target.value })
  }

  const handleSelectChange = (value) => {
    setNewBank({ ...newBank, currency: value })
  }

  const handleSubmit = async () => {
    const { data, error } = await supabase
      .from('acc_portal_banks')
      .insert([{ ...newBank, userid: user?.id }])
    if (error) console.error('Error adding bank:', error)
    else {
      fetchBanks()
      setNewBank({
        name: '',
        account_number: '',
        currency: '',
        branch: '',
        relationship_manager_name: '',
        relationship_manager_mobile: '',
        relationship_manager_email: '',
      })
    }
  }

  const updateBank = async (id, updatedData) => {
    const { data, error } = await supabase
      .from('acc_portal_banks')
      .update(updatedData)
      .eq('id', id)
      .eq('userid', user?.id)
    if (error) console.error('Error updating bank:', error)
    else fetchBanks()
  }
  
  const deleteBank = async (id) => {
    const { data, error } = await supabase
      .from('acc_portal_banks')
      .delete()
      .eq('id', id)
      .eq('userid', user?.id)
    if (error) console.error('Error deleting bank:', error)
    else fetchBanks()
  }
  
  
  return (
    <div className="flex w-full bg-gray-100">
      <main className="flex-1 p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Bank Accounts List</h1>
          <div className="flex items-center space-x-2">
            <Input type="search" placeholder="search" className="w-48" />
            <Button variant="outline" className="flex items-center" onClick={fetchBanks}>
              <RefreshCwIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>

            <Sheet>
              <SheetTrigger asChild>
              <Button className="bg-blue-600 text-white">Add New Bank Account</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Add Bank Account</SheetTitle>
                  <SheetDescription>
                    This section includes adding all the details of a bank account to the system
                  </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col pt-4 gap-4">
                  <div className="space-y-1">
                      <Label htmlFor="name">Bank Name</Label>
                      <Input id="name" placeholder="XYZ Bank" value={newBank.name} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input id="account_number" placeholder="011110001122" value={newBank.account_number} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="currency">Currency</Label>
                    <Select onValueChange={handleSelectChange} value={newBank.currency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KES">KES</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="branch">Branch</Label>
                    <Input id="branch" placeholder="Main Branch" value={newBank.branch} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="relationship_manager_name">Relationship Manager Name</Label>
                    <Input id="relationship_manager_name" placeholder="John Doe" value={newBank.relationship_manager_name} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="relationship_manager_mobile">Relationship Manager Mobile</Label>
                    <Input id="relationship_manager_mobile" placeholder="+25471234567" value={newBank.relationship_manager_mobile} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="relationship_manager_email">Relationship Manager Email</Label>
                    <Input id="relationship_manager_email" placeholder="john@example.com" value={newBank.relationship_manager_email} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="pt-4"><Button className="bg-blue-600 text-white" onClick={handleSubmit}>Submit</Button></div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
              <TableHead>BANK ACC ID</TableHead>
                <TableHead>Bank Name</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>RM Name</TableHead>
                <TableHead>RM Mobile</TableHead>
                <TableHead>RM Email</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Approved by BCL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banks.map((bank) => (
                <TableRow key={bank.id}>
                  <TableCell>BANK-ACC-{bank.id}</TableCell>
                  <TableCell>{bank.name}</TableCell>
                  <TableCell>{bank.account_number}</TableCell>
                  <TableCell>{bank.currency}</TableCell>
                  <TableCell>{bank.branch}</TableCell>
                  <TableCell>{bank.relationship_manager_name}</TableCell>
                  <TableCell>{bank.relationship_manager_mobile}</TableCell>
                  <TableCell>{bank.relationship_manager_email}</TableCell>
                  <TableCell>{formatDate(bank.startdate)}</TableCell>
                  <TableCell className='text-center'>
                    <Badge variant={bank.status ? "success" : "destructive"}>
                      {bank.status ? "✔️" : "❌"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
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