// @ts-nocheck
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

  // const handleTemplateChange = async (value: string) => {
  //   setLocalSelectedTemplate(value)

  //   const response = await fetch(`/admin/template/api/templates/${value}`)
  //   if (response.ok) {
  //     const templateData = await response.json()
  //     setSelectedTemplate(templateData)
  //   }
  // }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Select a Template</h2>
      {/* <Select onValueChange={handleTemplateChange} value={localSelectedTemplate}> */}
      <Select value={localSelectedTemplate}>
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
