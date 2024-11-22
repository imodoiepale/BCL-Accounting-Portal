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

export default function FormBuilder() {
  const { selectedTemplate, setFormData } = useTemplateStore()
  const { control, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    if (selectedTemplate) {
      reset(selectedTemplate.defaultValues)
    }
  }, [selectedTemplate, reset])

  const onSubmit = (data: any) => {
    setFormData(data)
  }

  if (!selectedTemplate) {
    return <div>Please select a template to start.</div>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {selectedTemplate.fields.map((field) => (
        <div key={field.id}>
          <Label htmlFor={field.id} className="block mb-1">
            {field.label}
          </Label>
          <Controller
            name={field.id}
            control={control}
            rules={{ required: field.required }}
            render={({ field: { onChange, value } }) => (
              field.type === 'checkbox' ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Select Options</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{field.label}</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={field.id}
                        checked={value}
                        onCheckedChange={onChange}
                      />
                      <label htmlFor={field.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {field.label}
                      </label>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Input
                  type={field.type}
                  id={field.id}
                  value={value}
                  onChange={onChange}
                  className={errors[field.id] ? 'border-red-500' : ''}
                />
              )
            )}
          />
          {errors[field.id] && <span className="text-red-500 text-sm">This field is required</span>}
        </div>
      ))}
      <SignatureUpload />
      <Button type="submit">Update Preview</Button>
    </form>
  )
}

