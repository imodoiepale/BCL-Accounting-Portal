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

export function EmployeeList() {
  const [employees, setEmployees] = useState([])
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    id_number: '',
    company_id: '',
    kra_pin: '',
    email: '',
    mobile: '',
    nhif: '',
    mnssf: '',
    startdate: '',
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('acc_portal_employees')
      .select('*')
      .order('id', { ascending: true });
    if (error) console.error('Error fetching employees:', error)
    else setEmployees(data)
  }

  const handleInputChange = (e) => {
    setNewEmployee({ ...newEmployee, [e.target.id]: e.target.value })
    console.log(e.target.value)
  }

  const handleSubmit = async () => {
    const { data, error } = await supabase
      .from('acc_portal_employees')
      .insert([newEmployee])
    if (error) console.error('Error adding employee:', error)
    else {
      fetchEmployees()
      setNewEmployee({
        name: '',
        id_number: '',
        company_id: '',
        kra_pin: '',
        email: '',
        mobile: '',
        nhif: '',
        mnssf: '',
        startdate: '',
      })
    }
  }

  return (
    <div className="flex w-full bg-gray-100">
      <main className="flex-1 p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Employees List</h1>
          <div className="flex items-center space-x-2">
            <Input type="search" placeholder="search" className="w-48" />
            <Button variant="outline" className="flex items-center" onClick={fetchEmployees}>
              <RefreshCwIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button className="bg-blue-600 text-white">Add New Employee</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Add Employee</SheetTitle>
                  <SheetDescription>
                    This section includes adding all the details of an employee to the system
                  </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col pt-4 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="John Doe" value={newEmployee.name} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="id_number">ID Number</Label>
                    <Input id="id_number" placeholder="12345678" value={newEmployee.id_number} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="company_id">Company ID</Label>
                    <Input id="company_id" placeholder="1" value={newEmployee.company_id} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="kra_pin">KRA PIN</Label>
                    <Input id="kra_pin" placeholder="K1234567890" value={newEmployee.kra_pin} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" placeholder="john@example.com" value={newEmployee.email} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input id="mobile" placeholder="+25471234567" value={newEmployee.mobile} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nhif">NHIF Number</Label>
                    <Input id="nhif" placeholder="123456789" value={newEmployee.nhif} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="mnssf">MNSSF Number</Label>
                    <Input id="mnssf" placeholder="987654321" value={newEmployee.mnssf} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="startdate">Start Date</Label>
                    <Input id="startdate" type="date" value={newEmployee.startdate} onChange={handleInputChange} />
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
                <TableHead>EMP ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>ID Number</TableHead>
                {/* <TableHead>Company ID</TableHead> */}
                <TableHead>KRA PIN</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>NHIF</TableHead>
                <TableHead>NSSF</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Approved by BCL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>EMP-{employee.id}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.id_number}</TableCell>
                  {/* <TableCell>{employee.company_id}</TableCell> */}
                  <TableCell>{employee.kra_pin}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.mobile}</TableCell>
                  <TableCell>{employee.nhif}</TableCell>
                  <TableCell>{employee.mnssf}</TableCell>
                  <TableCell>{formatDate(employee.startdate)}</TableCell>
                  <TableCell className='text-center'>
                    <Badge variant={employee.status ? "success" : "destructive"}>
                      {employee.status ? "✔️" : "❌"}
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