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