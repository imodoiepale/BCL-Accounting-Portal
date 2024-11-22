import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Field {
    id: string
    name: string
    type: 'text' | 'select' | 'number' | 'date' | 'nested'
    label: string
    defaultValue?: string
    options?: string[]
    required: boolean
    index?: number
}

interface Section {
    id: string
    name: string
    label: string
    description?: string
    order: number
    fields: Field[]
}

interface FieldListProps {
    fields: string[]  // Rename from parsedFields to fields
    sections: Section[]
    onFieldSelect: (field: Partial<Field>) => void
}

export default function FieldList({
    fields,
    sections,
    onFieldSelect
}: FieldListProps) {
    if (fields.length === 0) return null

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Available Fields</h3>
            <div className="grid grid-cols-2 gap-2">
                {fields.map((field) => {
                    const fieldAllocations = sections.filter(section =>
                        section.fields.some(f => f.name === field)
                    )
                    const isAllocated = fieldAllocations.length > 0

                    return (
                        <div
                            key={field}
                            className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                            onClick={() => {
                                const existingField = sections.reduce((found, section) => {
                                    const sectionField = section.fields.find(f => f.name === field)
                                    return sectionField || found
                                }, null)

                                onFieldSelect(existingField || {
                                    name: field,
                                    label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                })
                            }}
                        >
                            <div className="flex items-center gap-2">
                                {isAllocated ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                <span>{field}</span>
                            </div>
                            <div className="flex gap-1">
                                {fieldAllocations.map(section => (
                                    <Badge key={section.id} variant="secondary">
                                        {section.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}