/* eslint-disable react/no-unescaped-entities */
// @ts-nocheck
"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { PlusIcon, RefreshCwIcon } from 'lucide-react'
import { Badge } from '../ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
  const [directors, setDirectors] = useState([])
  const [newDirector, setNewDirector] = useState({})
  const [isAddingDirector, setIsAddingDirector] = useState(false)
  const [selectedDirector, setSelectedDirector] = useState(null)
  const [isEditingMissingFields, setIsEditingMissingFields] = useState(false)

  const fields = Object.values(directorFields).flatMap(category => category.map(field => field.id))

  useEffect(() => {
    const fetchDirectors = async () => {
      const { data, error } = await supabase.from('acc_portal_directors').select('*')
      if (error) {
        console.error('Error fetching directors:', error)
      } else {
        setDirectors(data)
      }
    }
    fetchDirectors()
  }, [])

  const handleInputChange = (e, directorId = null) => {
    if (directorId) {
      setDirectors(directors.map(director => 
        director.id === directorId ? { ...director, [e.target.id]: e.target.value } : director
      ))
    } else {
      setNewDirector({ ...newDirector, [e.target.id]: e.target.value })
    }
  }

  const handleSubmit = async () => {
    const { error } = await supabase.from('acc_portal_directors').insert([
      {
        first_name: newDirector.first_name,
        middle_name: newDirector.middle_name,
        last_name: newDirector.last_name,
        other_names: newDirector.other_names,
        full_name: newDirector.full_name,
        gender: newDirector.gender,
        place_of_birth: newDirector.place_of_birth,
        country_of_birth: newDirector.country_of_birth,
        nationality: newDirector.nationality,
        marital_status: newDirector.marital_status,
        date_of_birth: newDirector.date_of_birth,
        passport_number: newDirector.passport_number,
        passport_place_of_issue: newDirector.passport_place_of_issue,
        passport_issue_date: newDirector.passport_issue_date,
        passport_expiry_date: newDirector.passport_expiry_date,
        passport_file_number: newDirector.passport_file_number,
        id_number: newDirector.id_number,
        tax_pin: newDirector.tax_pin,
        eye_color: newDirector.eye_color,
        hair_color: newDirector.hair_color,
        height: newDirector.height,
        special_marks: newDirector.special_marks,
        mobile_number: newDirector.mobile_number,
        email_address: newDirector.email_address,
        alternative_email: newDirector.alternative_email,
        building_name: newDirector.building_name,
        floor_number: newDirector.floor_number,
        block_number: newDirector.block_number,
        road_name: newDirector.road_name,
        area_name: newDirector.area_name,
        town: newDirector.town,
        country: newDirector.country,
        full_residential_address: newDirector.full_residential_address,
        residential_county: newDirector.residential_county,
        sub_county: newDirector.sub_county,
        postal_address: newDirector.postal_address,
        postal_code: newDirector.postal_code,
        postal_town: newDirector.postal_town,
        full_postal_address: newDirector.full_postal_address,
        university_name: newDirector.university_name,
        course_name: newDirector.course_name,
        course_start_date: newDirector.course_start_date,
        course_end_date: newDirector.course_end_date,
        job_position: newDirector.job_position,
        job_description: newDirector.job_description,
        shares_held: newDirector.shares_held,
        other_directorships: newDirector.other_directorships,
        dependents: newDirector.dependents,
        annual_income: newDirector.annual_income,
        languages_spoken: newDirector.languages_spoken,
      },
    ])
    if (error) {
      console.error('Error adding director:', error)
    } else {
      setDirectors([...directors, { ...newDirector, id: directors.length + 1 }])
      setNewDirector({})
      setIsAddingDirector(false)
    }
  }

  const handleMissingFieldsSubmit = async () => {
    const { error } = await supabase
      .from('acc_portal_directors')
      .update({
        first_name: selectedDirector.first_name,
        middle_name: selectedDirector.middle_name,
        last_name: selectedDirector.last_name,
        other_names: selectedDirector.other_names,
        full_name: selectedDirector.full_name,
        gender: selectedDirector.gender,
        place_of_birth: selectedDirector.place_of_birth,
        country_of_birth: selectedDirector.country_of_birth,
        nationality: selectedDirector.nationality,
        marital_status: selectedDirector.marital_status,
        date_of_birth: selectedDirector.date_of_birth,
        passport_number: selectedDirector.passport_number,
        passport_place_of_issue: selectedDirector.passport_place_of_issue,
        passport_issue_date: selectedDirector.passport_issue_date,
        passport_expiry_date: selectedDirector.passport_expiry_date,
        passport_file_number: selectedDirector.passport_file_number,
        id_number: selectedDirector.id_number,
        tax_pin: selectedDirector.tax_pin,
        eye_color: selectedDirector.eye_color,
        hair_color: selectedDirector.hair_color,
        height: selectedDirector.height,
        special_marks: selectedDirector.special_marks,
        mobile_number: selectedDirector.mobile_number,
        email_address: selectedDirector.email_address,
        alternative_email: selectedDirector.alternative_email,
        building_name: selectedDirector.building_name,
        floor_number: selectedDirector.floor_number,
        block_number: selectedDirector.block_number,
        road_name: selectedDirector.road_name,
        area_name: selectedDirector.area_name,
        town: selectedDirector.town,
        country: selectedDirector.country,
        full_residential_address: selectedDirector.full_residential_address,
        residential_county: selectedDirector.residential_county,
        sub_county: selectedDirector.sub_county,
        postal_address: selectedDirector.postal_address,
        postal_code: selectedDirector.postal_code,
        postal_town: selectedDirector.postal_town,
        full_postal_address: selectedDirector.full_postal_address,
        university_name: selectedDirector.university_name,
        course_name: selectedDirector.course_name,
        course_start_date: selectedDirector.course_start_date,
        course_end_date: selectedDirector.course_end_date,
        job_position: selectedDirector.job_position,
        job_description: selectedDirector.job_description,
        shares_held: selectedDirector.shares_held,
        other_directorships: selectedDirector.other_directorships,
        dependents: selectedDirector.dependents,
        annual_income: selectedDirector.annual_income,
        languages_spoken: selectedDirector.languages_spoken,
      })
      .eq('id', selectedDirector.id)
    if (error) {
      console.error('Error updating director:', error)
    } else {
      setIsEditingMissingFields(false)
      setSelectedDirector(null)
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
                  <Select>
                    <SelectTrigger className="w-full p-2 border rounded">
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map(option => (
                        <SelectItem
                          key={option}
                          className="hover:bg-gray-100"
                          value={option}
                          onClick={() => handleInputChange({ target: { id: field.id, value: option } }, directorId)}
                        >
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

  return (
    <div className="flex w-full bg-gray-100">
      <main className="flex-1 p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Directors List</h1>
          <div className="flex items-center space-x-2">
            <Input type="search" placeholder="Search directors" className="w-48" />
            <Button variant="outline" className="flex items-center">
              <RefreshCwIcon className="w-4 h-4 mr-1" />
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
                  <Button onClick={handleSubmit}>Add Director</Button>
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
                    {directors.map((director, index) => (
                      <TableHead key={director.id} className="text-center border">Director {index + 1}</TableHead>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableHead className="sticky left-0 z-20 bg-white border">Status</TableHead>
                    {directors.map((director) => {
                      const { status, missingCount } = getDirectorStatus(director)
                      return (
                        <TableHead key={director.id} className="text-center border">
                          <Badge 
                            className={`cursor-pointer ${status === 'complete' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                            onClick={() => {
                              if (status === 'pending') {
                                setSelectedDirector(director)
                                setIsEditingMissingFields(true)
                              }
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
                      {directors.map((director) => (
                        <TableCell key={director.id} className="border">{director[field] || '-'}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody></Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>

        <Dialog open={isEditingMissingFields} onOpenChange={setIsEditingMissingFields}>
          <DialogContent className="max-w-[95vw] w-[1400px]">
            <DialogHeader>
              <DialogTitle>Fill Missing Fields for Director {selectedDirector?.id}</DialogTitle>
              <DialogDescription>
                Complete the missing information for this director.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[80vh] px-4">
              {selectedDirector && renderFormFields(selectedDirector, handleInputChange, selectedDirector.id)}
            </ScrollArea>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleMissingFieldsSubmit}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}