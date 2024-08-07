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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusIcon, RefreshCwIcon } from 'lucide-react'

const key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing"
const url="https://zyszsqgdlrpnunkegipk.supabase.co"

const supabase = createClient(url, key)

const directorFields = [
  { id: 'full_name', label: 'Full Name', type: 'text' },
  { id: 'nationality', label: 'Nationality', type: 'text' },
  { id: 'id_passport_number', label: 'ID/Passport Number', type: 'text' },
  { id: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { id: 'phone_number', label: 'Phone Number', type: 'tel' },
  { id: 'email', label: 'Email', type: 'email' },
  { id: 'physical_address', label: 'Physical Address', type: 'text' },
  { id: 'postal_address', label: 'Postal Address', type: 'text' },
  { id: 'tax_pin', label: 'Tax PIN', type: 'text' },
  { id: 'shares_held', label: 'Shares Held', type: 'number' },
]

export function DirectorsList() {
  const [directors, setDirectors] = useState([])
  const [newDirector, setNewDirector] = useState(Object.fromEntries(directorFields.map(field => [field.id, ''])))
  const [isAddingDirector, setIsAddingDirector] = useState(false)

  useEffect(() => {
    fetchDirectors()
  }, [])

  const fetchDirectors = async () => {
    const { data, error } = await supabase
      .from('directors')
      .select('*')
      .order('id', { ascending: true });

    if (error) console.error('Error fetching directors:', error)
    else setDirectors(data)
  }

  const handleInputChange = (e) => {
    setNewDirector({ ...newDirector, [e.target.id]: e.target.value })
  }

  const handleSubmit = async () => {
    const { data, error } = await supabase
      .from('directors')
      .insert([newDirector])
    if (error) console.error('Error adding director:', error)
    else {
      fetchDirectors()
      setNewDirector(Object.fromEntries(directorFields.map(field => [field.id, ''])))
      setIsAddingDirector(false)
    }
  }

  const renderDirectorCard = (director, index) => (
    <Card key={director.id} className="w-72 p-4 m-2">
      <h3 className="text-lg font-semibold mb-2">Director {index + 1}</h3>
      {directorFields.map(field => (
        <div key={field.id} className="mb-2">
          <Label className="text-sm font-medium">{field.label}</Label>
          <div className="text-sm">{director[field.id]}</div>
        </div>
      ))}
    </Card>
  )

  return (
    <div className="flex w-full bg-gray-100">
      <main className="flex-1 p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Directors List</h1>
          <div className="flex items-center space-x-2">
            <Input type="search" placeholder="Search directors" className="w-48" />
            <Button variant="outline" className="flex items-center" onClick={fetchDirectors}>
              <RefreshCwIcon className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button 
              className="bg-blue-600 text-white" 
              onClick={() => setIsAddingDirector(true)}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Director
            </Button>
          </div>
        </div>

        <ScrollArea className="w-full" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex flex-nowrap overflow-x-auto pb-4">
            {directors.map((director, index) => renderDirectorCard(director, index))}
          </div>
        </ScrollArea>

        <Sheet open={isAddingDirector} onOpenChange={setIsAddingDirector}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add New Director</SheetTitle>
              <SheetDescription>
                Add a new director's details
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col pt-4 gap-4">
              {directorFields.map(field => (
                <div key={field.id} className="space-y-1">
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <Input
                    id={field.id}
                    type={field.type}
                    value={newDirector[field.id]}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              ))}
            </div>
            <div className="pt-4">
              <Button className="bg-blue-600 text-white" onClick={handleSubmit}>Submit</Button>
            </div>
          </SheetContent>
        </Sheet>
      </main>
    </div>
  )
}