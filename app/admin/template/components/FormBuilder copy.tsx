// @ts-ignore
// @ts-nocheck
'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useTemplateStore } from '../store/templateStore'
import SignatureUpload from './SignatureUpload'

interface FormField {
  id: string
  label: string
  type: string
  required?: boolean
}

interface FormValues {
  [key: string]: string | boolean | null
}

export default function FormBuilder() {
  const { selectedTemplate, setFormData } = useTemplateStore()
  
  // Initialize form with default empty values for all fields
  const defaultValues = selectedTemplate?.fields.reduce((acc, field) => ({
    ...acc,
    [field.id]: field.type === 'checkbox' ? false : ''
  }), {})

  const { control, handleSubmit, watch, reset } = useForm<FormValues>({
    defaultValues,
    mode: 'onChange'
  })

  // Reset form when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const initialValues = selectedTemplate.fields.reduce((acc, field) => ({
        ...acc,
        [field.id]: field.type === 'checkbox' ? false : ''
      }), {})
      reset(initialValues)
    }
  }, [selectedTemplate, reset])

  // Debounced form update
  useEffect(() => {
    const subscription = watch((value) => {
      const timeoutId = setTimeout(() => {
        if (Object.keys(value).length > 0) {
          setFormData(value)
        }
      }, 300)

      return () => clearTimeout(timeoutId)
    })

    return () => subscription.unsubscribe()
  }, [watch, setFormData])

  const onSubmit = (data: FormValues) => {
    setFormData(data)
  }

  if (!selectedTemplate) {
    return <div className="p-4 text-center text-gray-500">Please select a template to start.</div>
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {selectedTemplate.fields.map((field: FormField) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="block">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              defaultValue={field.type === 'checkbox' ? false : ''}
              rules={{ 
                required: field.required && 'This field is required'
              }}
              render={({ field: { onChange, value, ref } }) => (
                field.type === 'checkbox' ? (
                  <Checkbox
                    ref={ref}
                    id={field.id}
                    checked={!!value}
                    onCheckedChange={onChange}
                  />
                ) : (
                  <Input
                    type={field.type}
                    id={field.id}
                    value={value || ''}
                    onChange={onChange}
                    ref={ref}
                  />
                )
              )}
            />
          </div>
        ))}
      </div>
      <SignatureUpload />
      <Button type="submit">Update Preview</Button>
    </form>
  )
}