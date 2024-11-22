'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTemplateStore } from '../store/templateStore'

const templates = [
  { id: 'bank-application', name: 'Bank Application Form' },
  { id: 'job-application', name: 'Job Application Form' },
  { id: 'loan-application', name: 'Loan Application Form' },
]

export default function TemplateSelector() {
  const { setSelectedTemplate } = useTemplateStore()
  const [localSelectedTemplate, setLocalSelectedTemplate] = useState('')

  const handleTemplateChange = async (value: string) => {
    setLocalSelectedTemplate(value)
    try {
      const response = await fetch(`/admin/template/api/templates/${value}`)
    if (!response.ok) {
      throw new Error('Failed to fetch template data')
    }
      const templateData = await response.json()
      setSelectedTemplate(templateData)
    } catch (error) {
      console.error('Error fetching template data:', error)
      // Handle error (e.g., show an error message to the user)
    }
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Select a Template</h2>
      <Select onValueChange={handleTemplateChange} value={localSelectedTemplate}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a template" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

