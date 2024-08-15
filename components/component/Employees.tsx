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
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon, UploadIcon, DownloadIcon } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'

const key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing"
const url="https://zyszsqgdlrpnunkegipk.supabase.co"

// Initialize Supabase client
const supabase = createClient(url, key)

// Utility function to format date
const formatDate = (dateString) => {
  let date;
  
  // Check if the date is in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('/');
    date = new Date(+year, +month - 1, +day);
  } else {
    date = new Date(dateString);
  }

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};


export function EmployeeList() {
  const { user } = useUser();
  const [employees, setEmployees] = useState([])
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    id_number: '',
    kra_pin: '',
    email: '',
    mobile: '',
    nhif: '',
    mnssf: '',
    startdate: '',
  })
  const [isUploading, setIsUploading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State to control the dialog


  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('acc_portal_employees')
      .select('*')
      .eq('userid', user?.id)
      .order('id', { ascending: true });
    if (error) console.error('Error fetching employees:', error)
    else setEmployees(data)
  }

  const handleInputChange = (e) => {
    setNewEmployee({ ...newEmployee, [e.target.id]: e.target.value })
  }

  const handleSubmit = async () => {
    const { data, error } = await supabase
      .from('acc_portal_employees')
      .insert([{ ...newEmployee, userid: user?.id }])
    if (error){
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee.');
    }else {
      fetchEmployees()
      setNewEmployee({
        name: '',
        id_number: '',
        kra_pin: '',
        email: '',
        mobile: '',
        nhif: '',
        mnssf: '',
        startdate: '',
      })
      toast.success('Employee added successfully!');
      setIsDialogOpen(false); // Close the dialog
    }
  }

  const handleCSVUpload = async (file) => {
    if (file) {
      setIsUploading(true)
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const rows = text.split('\n').filter(row => row.trim() !== '');
        const headers = rows[0].split(',').map(header => header.trim());
        const employees = rows.slice(1).map(row => {
          const rowData = row.split(',');
          const employee = {};
          headers.forEach((header, index) => {
            let value = rowData[index] ? rowData[index].trim() : '';
            if (['nhif', 'mnssf'].includes(header) && value === '') {
              value = null;
            }
            employee[header] = value;
          });
          return Object.values(employee).some(value => value !== '') ? employee : null;
        }).filter(employee => employee !== null);

        let successCount = 0;
        let errorCount = 0;

        for (const employee of employees) {
          try {
            const { data, error } = await supabase
              .from('acc_portal_employees')
              .insert([{ ...employee, userid: user?.id }])
              .select();

            if (error) {
              console.error('Error adding employee:', error);
              errorCount++;
            } else {
              successCount++;
            }
          } catch (error) {
            console.error('Unexpected error during insertion:', error);
            errorCount++;
          }
        }

        setIsUploading(false);
        fetchEmployees();

        if (successCount > 0) {
          toast.success(`Successfully added ${successCount} employee${successCount > 1 ? 's' : ''}.`);
        }
        if (errorCount > 0) {
          toast.error(`Failed to add ${errorCount} employee${errorCount > 1 ? 's' : ''}.`);
        }
      };
      reader.readAsText(file);
    }
  };

  const downloadCSVTemplate = () => {
    const headers = ['name', 'id_number', 'kra_pin', 'email', 'mobile', 'nhif', 'mnssf', 'startdate'];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'employee_template.csv');
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
          <h1 className="text-xl font-semibold">Employees List</h1>
          <div className="flex items-center space-x-2">
            <Input type="search" placeholder="search" className="w-48" />
            <Button variant="outline" className="flex items-center" onClick={fetchEmployees}>
              <RefreshCwIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button onClick={downloadCSVTemplate} className="flex items-center">
              <DownloadIcon className="w-4 h-4 mr-1" />
              Download CSV Template
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button className="bg-blue-600 text-white flex items-center">
                  <UploadIcon className="w-4 h-4 mr-1" />
                  Upload CSV
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Upload CSV</SheetTitle>
                  <SheetDescription>
                    Upload a CSV file with employee details
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col pt-4 gap-4">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleCSVUpload(e.target.files[0])}
                    disabled={isUploading}
                  />
                  {isUploading && <p>Uploading...</p>}
                </div>
              </SheetContent>
            </Sheet>

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
                <TableHead>KRA PIN</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>NHIF</TableHead>
                <TableHead>NSSF</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Approved by BCL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>EMP-{employee.id}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.id_number}</TableCell>
                  <TableCell>{employee.kra_pin}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.mobile}</TableCell>
                  <TableCell>{employee.nhif}</TableCell>
                  <TableCell>{employee.mnssf}</TableCell>
                  <TableCell>{formatDate(employee.startdate)}</TableCell>
                  <TableCell></TableCell>
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