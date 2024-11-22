// templateStore.ts
import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient'

interface TemplateStore {
  templates: Template[]
  selectedTemplate: Template | null
  formData: Record<string, any> | null
  loadTemplates: () => Promise<void>
  setSelectedTemplate: (template: Template) => void
  setFormData: (data: Record<string, any>) => void
}

export const useTemplateStore = create<TemplateStore>((set) => ({
  templates: [],
  selectedTemplate: null,
  formData: null,
  loadTemplates: async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ templates: data })
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  },
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  setFormData: (data) => set({ formData: data })
}))