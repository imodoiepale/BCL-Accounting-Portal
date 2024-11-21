import { create } from 'zustand'

interface Field {
  id: string
  label: string
  type: string
  required: boolean
}

interface Template {
  id: string
  name: string
  fields: Field[]
  defaultValues: Record<string, any>
}

interface TemplateStore {
  selectedTemplate: Template | null
  formData: Record<string, any> | null
  setSelectedTemplate: (template: Template) => void
  setFormData: (data: Record<string, any>) => void
}

export const useTemplateStore = create<TemplateStore>((set) => ({
  selectedTemplate: null,
  formData: null,
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  setFormData: (data) => set({ formData: data }),
}))

