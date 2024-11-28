// FormBuilder.tsx
// @ts-nocheck
'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTemplateStore } from '../store/templateStore'

export default function FormBuilder() {
  const { selectedTemplate, setFormData } = useTemplateStore()
  
  const { control, reset, watch } = useForm({
    defaultValues: selectedTemplate?.config?.page_1 
      ? Object.entries(selectedTemplate.config.page_1).reduce((acc, [section, data]) => ({
          ...acc,
          ...Object.keys(data.fields).reduce((fields, field) => ({
            ...fields,
            [`${section}.${field}`]: data.defaultValues?.[field] || ''
          }), {})
        }), {})
      : {}
  })

  useEffect(() => {
    const subscription = watch((value) => {
      if (Object.keys(value).length > 0) {
        setFormData(value)
      }
    })

    return () => subscription.unsubscribe()
  }, [watch, setFormData])

  if (!selectedTemplate?.config) {
    return <div>Please select a template</div>
  }

  return (
    <div className="space-y-8">
      {Object.entries(selectedTemplate.config.page_1).map(([sectionKey, section]) => (
        <div key={sectionKey} className="space-y-4">
          <h3 className="text-lg font-semibold">{section.label}</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(section.fields).map(field => (
              <div key={field}>
                <Label>{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                <Controller
                  name={`${sectionKey}.${field}`}
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    section.options?.[field] ? (
                      <Select onValueChange={onChange} value={value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {section.options[field].map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={value}
                        onChange={onChange}
                        placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                      />
                    )
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}