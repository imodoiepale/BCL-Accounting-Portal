/* eslint-disable react/no-unescaped-entities */
// @ts-nocheck
"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { PlusIcon, RefreshCwIcon, SearchIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from '@clerk/clerk-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const directorFields = {
  "1. Director's Personal Details": [
    { id: 'first_name', label: 'First Name', type: 'text' },
    { id: 'middle_name', label: 'Middle Name', type: 'text' },
    { id: 'last_name', label: 'Last Name', type: 'text' },
    { id: 'other_names', label: 'Other Names', type: 'text' },
    { id: 'full_name', label: 'Full Name', type: 'text' },
    { id: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
    { id: 'place_of_birth', label: 'Place of Birth', type: 'text' },
    { id: 'country_of_birth', label: 'Country of Birth', type: 'text' },
    { id: 'nationality', label: 'Nationality', type: 'text' },
    { id: 'marital_status', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'] },
    { id: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  ],
  "2. Director's Passport Details": [
    { id: 'passport_number', label: 'Passport Number', type: 'text' },
    { id: 'passport_place_of_issue', label: 'Place of Issue', type: 'text' },
    { id: 'passport_issue_date', label: 'Issue Date', type: 'date' },
    { id: 'passport_expiry_date', label: 'Expiry Date', type: 'date' },
    { id: 'passport_file_number', label: 'Passport File Number', type: 'text' },
  ],
  "3. Director's Identification Details": [
    { id: 'id_number', label: 'ID Number', type: 'text' },
    { id: 'tax_pin', label: 'KRA PIN', type: 'text' },
  ],
  "4. Director's Physical Attributes": [
    { id: 'eye_color', label: 'Eye Color', type: 'text' },
    { id: 'hair_color', label: 'Hair Color', type: 'text' },
    { id: 'height', label: 'Height', type: 'text' },
    { id: 'special_marks', label: 'Special Marks', type: 'text' },
  ],
  "5. Director's Contact Details": [
    { id: 'mobile_number', label: 'Mobile Number', type: 'tel' },
    { id: 'email_address', label: 'Email Address', type: 'email' },
    { id: 'alternative_email', label: 'Alternative Email', type: 'email' },
  ],
  "6. Director's Residential Address": [
    { id: 'building_name', label: 'Building Name', type: 'text' },
    { id: 'floor_number', label: 'Floor Number', type: 'text' },
    { id: 'block_number', label: 'Block Number', type: 'text' },
    { id: 'road_name', label: 'Road Name', type: 'text' },
    { id: 'area_name', label: 'Area Name', type: 'text' },
    { id: 'town', label: 'Town', type: 'text' },
    { id: 'country', label: 'Country', type: 'text' },
    { id: 'full_residential_address', label: 'Full Residential Address', type: 'text' },
    { id: 'residential_county', label: 'Residential County', type: 'text' },
    { id: 'sub_county', label: 'Sub-County', type: 'text' },
  ],
  "7. Director's Postal Address": [
    { id: 'postal_address', label: 'Postal Address', type: 'text' },
    { id: 'postal_code', label: 'Postal Code', type: 'text' },
    { id: 'postal_town', label: 'Postal Town', type: 'text' },
    { id: 'full_postal_address', label: 'Full Postal Address', type: 'text' },
  ],
  "8. Director's Qualification Details": [
    { id: 'university_name', label: 'University Name', type: 'text' },
    { id: 'course_name', label: 'Course Name', type: 'text' },
    { id: 'course_start_date', label: 'Course Start Date', type: 'date' },
    { id: 'course_end_date', label: 'Course End Date', type: 'date' },
  ],
  "9. Director's Professional Details": [
    { id: 'job_position', label: 'Job Position', type: 'text' },
    { id: 'job_description', label: 'Job Description', type: 'textarea' },
    { id: 'shares_held', label: 'Shares Held', type: 'number' },
    { id: 'other_directorships', label: 'Other Directorships', type: 'text' },
  ],
  "10. Additional Details": [
    { id: 'dependents', label: 'Number of Dependents', type: 'number' },
    { id: 'annual_income', label: 'Annual Income', type: 'number' },
    { id: 'languages_spoken', label: 'Languages Spoken', type: 'text' },
  ],
}

export function DirectorsList() {
  const { userId } = useAuth();

  const [directors, setDirectors] = useState([])
  const [newDirector, setNewDirector] = useState({})
  const [isAddingDirector, setIsAddingDirector] = useState(false)
  const [selectedDirector, setSelectedDirector] = useState(null)
  const [isEditingMissingFields, setIsEditingMissingFields] = useState(false)
  const [changedFields, setChangedFields] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const fields = Object.values(directorFields).flatMap(category => category.map(field => field.id))

  const fetchDirectors = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('acc_portal_directors')
      .select('*')
      .eq('userid', userId)
      .order('id', { ascending: true })
    setIsLoading(false)
    if (error) {
      console.error('Error fetching directors:', error)
      toast({
        title: "Error",
        description: "Failed to fetch directors. Please try again.",
        variant: "destructive",
      })
    } else {
      setDirectors(data)
    }
  }, [toast, userId])
  

  useEffect(() => {
    fetchDirectors()
  }, [fetchDirectors])

  const handleInputChange = (e, directorId = null) => {
    const { id, value } = e.target
    if (directorId) {
      setSelectedDirector(prevDirector => ({
        ...prevDirector,
        [id]: value
      }))
      setChangedFields(prevFields => ({
        ...prevFields,
        [id]: value
      }))
    } else {
      setNewDirector(prevDirector => ({
        ...prevDirector,
        [id]: value
      }))
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('acc_portal_directors')
      .insert([{ ...newDirector, userid: userId }])
      .select()
    setIsLoading(false)
    if (error) {
      console.error('Error adding director:', error)
      toast({
        title: "Error",
        description: "Failed to add director. Please try again.",
        variant: "destructive",
      })
    } else {
      setDirectors(prevDirectors => [...prevDirectors, data[0]])
      setNewDirector({})
      setIsAddingDirector(false)
      toast({
        title: "Success",
        description: "Director added successfully.",
      })
    }
  }

  const handleEdit = (director) => {
    setSelectedDirector(director)
    setIsEditingMissingFields(true)
    setChangedFields({})
  }

  const handleDelete = async (directorId) => {
    setIsLoading(true)
    const { error } = await supabase
      .from('acc_portal_directors')
      .delete()
      .eq('id', directorId)
      .eq('userid', userId)
    setIsLoading(false)
    if (error) {
      console.error('Error deleting director:', error)
      toast({
        title: "Error",
        description: "Failed to delete director. Please try again.",
        variant: "destructive",
      })
    } else {
      setDirectors(prevDirectors => prevDirectors.filter(d => d.id !== directorId))
      toast({
        title: "Success",
        description: "Director deleted successfully.",
      })
    }
  }
  

  const handleMissingFieldsSubmit = async () => {
    if (Object.keys(changedFields).length === 0) {
      toast({
        title: "No Changes",
        description: "No fields were changed.",
      })
      return
    }
  
    setIsLoading(true)
    const { data, error } = await supabase
      .from('acc_portal_directors')
      .update(changedFields)
      .eq('id', selectedDirector.id)
      .eq('userid', userId)
      .select()
    setIsLoading(false)
  
    if (error) {
      console.error('Error updating director:', error)
      toast({
        title: "Error",
        description: "Failed to update director. Please try again.",
        variant: "destructive",
      })
    } else {
      setDirectors(prevDirectors =>
        prevDirectors.map(director =>
          director.id === selectedDirector.id ? { ...director, ...data[0] } : director
        )
      )
      setIsEditingMissingFields(false)
      setSelectedDirector(null)
      setChangedFields({})
      toast({
        title: "Success",
        description: "Director updated successfully.",
      })
    }
  }
  

  const getDirectorStatus = (director) => {
    const missingFields = fields.filter(field => !director[field] || director[field] === '')
    return {
      status: missingFields.length === 0 ? 'complete' : 'pending',
      missingCount: missingFields.length
    }
  }

  const renderFormFields = (directorData, onChangeHandler, directorId = null) => (
    <div className="grid grid-cols-6 gap-4 px-4">
      {Object.entries(directorFields).map(([category, fields]) => (
        <div key={category} className="col-span-6 ">
          <h3 className="text-lg font-semibold mb-2">{category}</h3>
          <div className="grid grid-cols-4 gap-4 border rounded-lg p-4 mb-4 shadow-sm">
            {fields.map((field) => (
              <div key={field.id} className="col-span-1 space-y-1">
                <Label htmlFor={field.id} className="text-sm font-medium">{field.label}</Label>
                {field.type === 'select' ? (
                  <Select onValueChange={(value) => onChangeHandler({ target: { id: field.id, value } }, directorId)}>
                    <SelectTrigger className="w-full p-2 border rounded">
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={field.id}
                    value={directorData[field.id] || ''}
                    onChange={(e) => onChangeHandler(e, directorId)}
                    className="w-full p-2 border rounded"
                    rows={3}
                  />
                ) : (
                  <Input
                    id={field.id}
                    type={field.type}
                    value={directorData[field.id] || ''}
                    onChange={(e) => onChangeHandler(e, directorId)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  const filteredDirectors = directors.filter(director =>
    Object.values(director).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <div className="flex w-full bg-gray-100">
      <main className="flex-1 p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Directors List</h1>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search directors"
                className="pl-8 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="flex items-center" onClick={fetchDirectors} disabled={isLoading}>
              <RefreshCwIcon className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={isAddingDirector} onOpenChange={setIsAddingDirector}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Director
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] w-[1200px]">
                <DialogHeader>
                  <DialogTitle>Add New Director</DialogTitle>
                  <DialogDescription>
                    Fill in the details for the new director.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[80vh] pr-4">
                  {renderFormFields(newDirector, handleInputChange)}
                </ScrollArea>
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add Director'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="mt-4">
          <ScrollArea className="h-[calc(100vh-200px)] w-full">
            <div className="relative">
              <Table className="border-collapse">
                <TableHeader className="sticky top-0 z-10 bg-white">
                  <TableRow>
                    <TableHead className="sticky left-0 z-20 bg-white border">Field</TableHead>
                    {filteredDirectors.map((director, index) => (
                      <TableHead key={director.id} className="text-center border">Director {index + 1}</TableHead>
                    ))}
                  </TableRow>
                  <TableRow>
                  <TableHead className="sticky left-0 z-20 bg-white border">Actions</TableHead>
                  {filteredDirectors.map((director) => (
                    <TableHead key={director.id} className="text-center border">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(director)} className="mr-2">
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(director.id)}>
                        Delete
                      </Button>
                    </TableHead>
                  ))}
                </TableRow>
                  <TableRow>
                    <TableHead className="sticky left-0 z-20 bg-white border">Status</TableHead>
                    {filteredDirectors.map((director) => {
                      const { status, missingCount } = getDirectorStatus(director)
                      return (
                        <TableHead key={director.id} className="text-center border">
                          <Badge 
                            className={`cursor-pointer ${status === 'complete' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                            onClick={() => {
                              setSelectedDirector(director)
                              setIsEditingMissingFields(true)
                              setChangedFields({})
                            }}
                          >
                            {status === 'complete' ? 'Complete' : `Pending (${missingCount})`}
                          </Badge>
                        </TableHead>
                      )
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, rowIndex) => (
                    <TableRow key={field} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <TableCell className="sticky left-0 z-10 bg-inherit font-medium border">
                        {Object.values(directorFields).flat().find(f => f.id === field)?.label || field}
                      </TableCell>
                      {filteredDirectors.map((director) => (
                        <TableCell key={director.id} className="border">{director[field] || '-'}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>

        <Dialog open={isEditingMissingFields} onOpenChange={setIsEditingMissingFields}>
          <DialogContent className="max-w-[95vw] w-[1400px]">
            <DialogHeader>
              <DialogTitle>Edit Director Information</DialogTitle>
              <DialogDescription>
                Update the information for this director. Only changed fields will be submitted.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[80vh] px-4">
              {selectedDirector && renderFormFields(selectedDirector, handleInputChange, selectedDirector.id)}
            </ScrollArea>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleMissingFieldsSubmit} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}