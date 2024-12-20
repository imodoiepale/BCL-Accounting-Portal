
// @ts-nocheck
"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon, UploadIcon, DownloadIcon } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast';
import { PencilIcon, TrashIcon } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'



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

interface EmployeeList {
  selectedUserId: string;
}

export function EmployeeList({ selectedUserId }: EmployeeList) {
  const { user } = useUser();
  const [employees, setEmployees] = useState([])
  const [newEmployee, setNewEmployee] = useState({
    employee_name: '',
    employee_id_number: '',
    employee_kra_pin: '',
    employee_email: '',
    employee_mobile: '',
    employee_nhif: '',
    employee_nssf: '',
    employee_startdate: '',
    employee_enddate: '',
  })
  const [isUploading, setIsUploading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const userIdentifier = selectedUserId || user?.id;

  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from('acc_portal_employees')
      .select('*')
      .eq('userid', userIdentifier)
      .order('id', { ascending: true });
    if (error) console.error('Error fetching employees:', error)
    else setEmployees(data)
  }, [userIdentifier])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleInputChange = (e) => {
    setNewEmployee({ ...newEmployee, [e.target.id]: e.target.value })
  }

  const handleSubmit = async () => {
    const { data, error } = await supabase
      .from('acc_portal_employees')
      .insert([{ ...newEmployee, userid: userIdentifier, status: 'true' }])
    if (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee.');
    } else {
      fetchEmployees()
      setNewEmployee({
employee_name: '',
employee_id_number: '',
employee_kra_pin: '',
employee_email: '',
employee_mobile: '',
employee_nhif: '',
employee_nssf: '',
employee_startdate: '',
employee_enddate: '',
      })
      toast.success('Employee added successfully!');
      setIsDialogOpen(false);
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
            if (['nhif', 'nssf'].includes(header) && value === '') {
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
              .insert([{ ...employee, userid: userIdentifier }])
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
    const headers = ['employee_name', 'id_number', 'employee_kra_pin', 'employee_email', 'employee_mobile', 'employee_nhif', 'employee_nssf', 'employee_startdate', 'employee_enddate'];
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

  const handleEdit = (employee) => {
    setEditingEmployee(employee)
    setIsEditDialogOpen(true)
  }

  const handleEditInputChange = (e) => {
    setEditingEmployee({ ...editingEmployee, [e.target.id]: e.target.value })
  }

  const handleEditSubmit = async () => {
    const { data, error } = await supabase
      .from('acc_portal_employees')
      .update(editingEmployee)
      .eq('id', editingEmployee.id)
      .select()

    if (error) {
      console.error('Error updating employee:', error)
      toast.error('Failed to update employee.')
    } else {
      fetchEmployees()
      toast.success('Employee updated successfully!')
      setIsEditDialogOpen(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this employee?')
    if (confirmDelete) {
      const { data, error } = await supabase
        .from('acc_portal_employees')
        .delete()
        .eq('id', id)
        .select()

      if (error) {
        console.error('Error deleting employee:', error)
        toast.error('Failed to delete employee.')
      } else {
        fetchEmployees()
        toast.success('Employee deleted successfully!')
      }
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
                    <Input id="name" placeholder="John Doe" value={newEmployee.employee_name} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="id_number">ID Number</Label>
                    <Input id="id_number" placeholder="12345678" value={newEmployee.id_number} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="kra_pin">KRA PIN</Label>
                    <Input id="kra_pin" placeholder="K1234567890" value={newEmployee.employee_kra_pin} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" placeholder="john@example.com" value={newEmployee.employee_email} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input id="mobile" placeholder="+25471234567" value={newEmployee.employee_mobile} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nhif">NHIF Number</Label>
                    <Input id="nhif" placeholder="123456789" value={newEmployee.employee_nhif} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nssf">NSSF Number</Label>
                    <Input id="nssf" placeholder="987654321" value={newEmployee.employee_nssf} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="startdate">Start Date</Label>
                    <Input id="startdate" type="date" value={newEmployee.employee_startdate} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="enddate">End Date</Label>
                    <Input id="enddate" type="date" value={newEmployee.employee_enddate} onChange={handleInputChange} />
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
                <TableHead>Status</TableHead>
                <TableHead>Approved by BCL</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee, index) => (
                <TableRow key={employee.id}>
                  <TableCell>EMP-{index + 1}</TableCell>
                  <TableCell>{employee.employee_name}</TableCell>
                  <TableCell>{employee.id_number}</TableCell>
                  <TableCell>{employee.employee_kra_pin}</TableCell>
                  <TableCell>{employee.employee_email}</TableCell>
                  <TableCell>{employee.employee_mobile}</TableCell>
                  <TableCell>{employee.employee_nhif}</TableCell>
                  <TableCell>{employee.employee_nssf}</TableCell>
                  <TableCell>{formatDate(employee.startdate)}</TableCell>
                  <TableCell>{employee.employee_enddate ? formatDate(employee.employee_enddate) : ''}</TableCell>
                  <TableCell>
                    <span className={`font-bold capitalize ${employee.employee_status ? 'text-green-600' : 'text-red-600'}`}>
                      {employee.employee_status ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className='text-center'>
                    <Badge variant={employee.employee_verified ? "success" : "destructive"}>
                      {employee.employee_verified ? "✔️" : "❌"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center space-x-2">
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)}>
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Employee</DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col gap-4">
                            <div className="space-y-1">
                              <Label htmlFor="name">Name</Label>
                              <Input id="name" value={editingEmployee?.employee_name || ''} onChange={handleEditInputChange} />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="id_number">ID Number</Label>
                              <Input id="id_number" value={editingEmployee?.id_number || ''} onChange={handleEditInputChange} />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="kra_pin">KRA PIN</Label>
                              <Input id="kra_pin" value={editingEmployee?.employee_kra_pin || ''} onChange={handleEditInputChange} />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="email">Email</Label>
                              <Input id="email" value={editingEmployee?.employee_email || ''} onChange={handleEditInputChange} />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="mobile">Mobile</Label>
                              <Input id="mobile" value={editingEmployee?.employee_mobile || ''} onChange={handleEditInputChange} />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="nhif">NHIF Number</Label>
                              <Input id="nhif" value={editingEmployee?.employee_nhif || ''} onChange={handleEditInputChange} />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="nssf">MNSSF Number</Label>
                              <Input id="nssf" value={editingEmployee?.employee_nssf || ''} onChange={handleEditInputChange} />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="startdate">Start Date</Label>
                              <Input id="startdate" type="date" value={editingEmployee?.employee_startdate || ''} onChange={handleEditInputChange} />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="enddate">End Date</Label>
                              <Input id="enddate" type="date" value={editingEmployee?.employee_enddate || ''} onChange={handleEditInputChange} />
                            </div>
                            <Button onClick={handleEditSubmit}>Save Changes</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(employee.id)}>
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
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