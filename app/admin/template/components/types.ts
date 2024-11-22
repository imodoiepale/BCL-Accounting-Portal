export interface Field {
    id: string
    name: string
    type: 'text' | 'select' | 'number' | 'date' | 'nested'
    label: string
    defaultValue?: string
    options?: string[]
    required: boolean
    validation?: {
        pattern?: string
        min?: number
        max?: number
    }
    index?: number
}

export interface Section {
    id: string
    name: string
    label: string
    description?: string
    order: number
    fields: Field[]
}

export interface SectionFormData {
    name: string
    label: string
    description?: string
}

export interface FieldConfigurationProps {
    isOpen: boolean
    onClose: () => void
    onSave: (fieldConfig: Partial<Field>, sectionId: string) => void
    field: Partial<Field>
    sections: Section[]
}

export interface SectionDialogProps {
    isOpen: boolean
    onClose: () => void
    onSave: (sectionData: SectionFormData) => void
    section?: Section
}