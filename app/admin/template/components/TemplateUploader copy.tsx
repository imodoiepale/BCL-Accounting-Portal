'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { supabase } from '@/lib/supabaseClient'
import { Textarea } from '@/components/ui/textarea'
import dynamic from 'next/dynamic'

const DragDropContext = dynamic(
    () => import('@hello-pangea/dnd').then(mod => mod.DragDropContext),
    { ssr: false }
)
const Droppable = dynamic(() => import('@hello-pangea/dnd').then(mod => mod.Droppable), { ssr: false })
const Draggable = dynamic(() => import('@hello-pangea/dnd').then(mod => mod.Draggable), { ssr: false })

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface Field {
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

interface Section {
    id: string
    name: string
    label: string
    description?: string
    order: number
    fields: Field[]
}

// State management with reducer
interface State {
    templateName: string
    templateDescription: string
    sections: Section[]
    parsedFields: string[]
    dialogs: {
        showSection: boolean
        showFieldConfig: boolean
    }
    selected: {
        field: Partial<Field> | null
        section: Section | null
    }
}

type Action =
    | { type: 'SET_TEMPLATE_INFO'; payload: { name?: string; description?: string } }
    | { type: 'SET_SECTIONS'; payload: Section[] }
    | { type: 'SET_PARSED_FIELDS'; payload: string[] }
    | { type: 'TOGGLE_DIALOG'; dialog: 'section' | 'fieldConfig'; value: boolean }
    | { type: 'SELECT_FIELD'; payload: Partial<Field> | null }
    | { type: 'SELECT_SECTION'; payload: Section | null }

const initialState: State = {
    templateName: '',
    templateDescription: '',
    sections: [],
    parsedFields: [],
    dialogs: {
        showSection: false,
        showFieldConfig: false
    },
    selected: {
        field: null,
        section: null
    }
}

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_TEMPLATE_INFO':
            return {
                ...state,
                ...(action.payload.name && { templateName: action.payload.name }),
                ...(action.payload.description && { templateDescription: action.payload.description })
            }
        case 'SET_SECTIONS':
            return { ...state, sections: action.payload }
        case 'SET_PARSED_FIELDS':
            return { ...state, parsedFields: action.payload }
        case 'TOGGLE_DIALOG':
            return {
                ...state,
                dialogs: {
                    ...state.dialogs,
                    [action.dialog]: action.value
                }
            }
        case 'SELECT_FIELD':
            return {
                ...state,
                selected: { ...state.selected, field: action.payload }
            }
        case 'SELECT_SECTION':
            return {
                ...state,
                selected: { ...state.selected, section: action.payload }
            }
        default:
            return state
    }
}


const FieldConfigurationModal: React.FC<FieldConfigurationModalProps> = ({
    isOpen,
    onClose,
    onSave,
    field,
    sections
}) => {
    // Find all sections this field belongs to
    const existingSections = sections.filter(section =>
        section.fields.some(f => f.name === field.name)
    )

    const [fieldConfig, setFieldConfig] = useState<Partial<Field>>(field)
    const [options, setOptions] = useState<string[]>(field.options || [])
    // Initialize with all sections this field belongs to
    const [selectedSectionId, setSelectedSectionId] = useState<string>(
        existingSections.length > 0 ? existingSections[0].id : ''
    )
    const [newOption, setNewOption] = useState('')
    const [hasDefault, setHasDefault] = useState(!!field.defaultValue)

    useEffect(() => {
        setFieldConfig(field)
        setOptions(field.options || [])
        setHasDefault(!!field.defaultValue)
        // Update selected section when editing existing field
        if (existingSections.length > 0) {
            setSelectedSectionId(existingSections[0].id)
        }
    }, [field])

    const handleSave = () => {
        console.log('Saving with sectionId:', selectedSectionId)
        onSave({
            ...fieldConfig,
            options: fieldConfig.type === 'select' ? options : undefined,
            defaultValue: hasDefault ? fieldConfig.defaultValue : undefined
        }, selectedSectionId)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Configure Field: {field.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div>
                        <Label>Field Type</Label>
                        <Select
                            value={fieldConfig.type}
                            onValueChange={(value: Field['type']) =>
                                setFieldConfig({ ...fieldConfig, type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select field type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="select">Select</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                            </SelectContent>
                        </Select>
                        {fieldConfig.type === 'select' && (
                            <div className="space-y-4 border-t pt-4">
                                <Label>Select Options</Label>
                                <div className="flex space-x-2">
                                    <Input
                                        value={newOption}
                                        onChange={(e) => setNewOption(e.target.value)}
                                        placeholder="Add new option"
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (newOption) {
                                                setOptions([...options, newOption])
                                                setNewOption('')
                                            }
                                        }}
                                    >
                                        Add
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {options.map((option, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 bg-secondary rounded">
                                            <span>{option}</span>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    const newOptions = [...options]
                                                    newOptions.splice(index, 1)
                                                    setOptions(newOptions)
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <Label>Display Label</Label>
                        <Input
                            value={fieldConfig.label}
                            onChange={(e) =>
                                setFieldConfig({ ...fieldConfig, label: e.target.value })}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                checked={hasDefault}
                                onCheckedChange={(checked) => setHasDefault(checked as boolean)}
                            />
                            <Label>Has Default Value</Label>
                        </div>

                        {hasDefault && (
                            <div>
                                {fieldConfig.type === 'select' ? (
                                    <Select
                                        value={fieldConfig.defaultValue}
                                        onValueChange={(value) =>
                                            setFieldConfig({ ...fieldConfig, defaultValue: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select default value" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        value={fieldConfig.defaultValue}
                                        onChange={(e) =>
                                            setFieldConfig({ ...fieldConfig, defaultValue: e.target.value })}
                                        placeholder="Enter default value"
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <Label>Assign to Section</Label>
                        <Select
                            value={selectedSectionId}
                            onValueChange={setSelectedSectionId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(section => (
                                    <SelectItem key={section.id} value={section.id}>
                                        {section.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>


                </div>
                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Configuration</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}


export default function TemplateUploader() {
    const [templateName, setTemplateName] = useState('')
    const [templateDescription, setTemplateDescription] = useState('')
    const [sections, setSections] = useState<Section[]>([])
    const [parsedFields, setParsedFields] = useState<string[]>([])
    const [showSectionDialog, setShowSectionDialog] = useState(false)
    const [selectedField, setSelectedField] = useState<Partial<Field> | null>(null)
    const [showFieldConfig, setShowFieldConfig] = useState(false)
    const [selectedSection, setSelectedSection] = useState<Section | null>(null)
    const { toast } = useToast()

    const parseTemplate = async (file: File) => {
        try {
            const arrayBuffer = await file.arrayBuffer()
            const zip = new PizZip(arrayBuffer)
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true
            })

            const content = doc.getFullText()
            const variables = content.match(/\{([^}]+)\}/g) || []
            const uniqueFields = [...new Set(variables.map(v => v.replace(/[{}]/g, '')))]
            setParsedFields(uniqueFields)

        } catch (error) {
            console.error('Error parsing template:', error)
            toast({
                title: 'Error',
                description: 'Failed to parse template'
            })
        }
    }

    const addSection = (sectionData: Omit<Section, 'id' | 'order' | 'fields'>) => {
        const newSection: Section = {
            id: crypto.randomUUID(),
            order: sections.length,
            fields: [],
            ...sectionData
        }
        setSections([...sections, newSection])
    }

    const handleFieldConfiguration = (fieldConfig: Partial<Field>, sectionId: string) => {
        if (fieldConfig.name) {
            const updatedSections = sections.map(section => {
                if (section.id === sectionId) {
                    // Check if field already exists in this section
                    const existingFieldIndex = section.fields.findIndex(f => f.name === fieldConfig.name)

                    if (existingFieldIndex >= 0) {
                        // Update existing field
                        const updatedFields = [...section.fields]
                        updatedFields[existingFieldIndex] = {
                            ...updatedFields[existingFieldIndex],
                            ...fieldConfig,
                            type: fieldConfig.type || 'text',
                            label: fieldConfig.label || fieldConfig.name,
                            defaultValue: fieldConfig.defaultValue,
                            options: fieldConfig.options,
                            required: fieldConfig.required || false,
                        }
                        return {
                            ...section,
                            fields: updatedFields
                        }
                    } else {
                        // Add new field
                        return {
                            ...section,
                            fields: [...section.fields, {
                                id: crypto.randomUUID(),
                                name: fieldConfig.name,
                                type: fieldConfig.type || 'text',
                                label: fieldConfig.label || fieldConfig.name,
                                defaultValue: fieldConfig.defaultValue,
                                options: fieldConfig.options,
                                required: fieldConfig.required || false,
                                index: section.fields.length + 1
                            }]
                        }
                    }
                }
                return section
            })
            setSections(updatedSections)

            // Only remove from parsedFields if the field isn't used in any section
            const isFieldUsedInAnySections = updatedSections.some(section =>
                section.fields.some(f => f.name === fieldConfig.name)
            )
            if (!isFieldUsedInAnySections) {
                setParsedFields(parsedFields.filter(f => f !== fieldConfig.name))
            }
        }
    }

    const onDragEnd = (result: any) => {
        if (!result.destination) return

        const sourceSection = sections.find(s => s.id === result.source.droppableId)
        const destSection = sections.find(s => s.id === result.destination.droppableId)

        if (!sourceSection || !destSection) return

        const newSections = [...sections]
        const [movedField] = sourceSection.fields.splice(result.source.index, 1)
        destSection.fields.splice(result.destination.index, 0, movedField)

        setSections(newSections)
    }

    const saveTemplate = async () => {
        try {

            const { error } = await supabase.from('templates').insert({
                name: templateName,
                description: templateDescription,
                config: {
                    sections: sections.map(section => ({
                        ...section,
                        fields: section.fields.map(field => ({
                            ...field,
                            id: undefined
                        }))
                    }))
                },
                sections: sections,
                field_mappings: sections.reduce((acc, section) => ({
                    ...acc,
                    ...section.fields.reduce((fieldAcc, field) => ({
                        ...fieldAcc,
                        [field.name]: {
                            section: section.name,
                            type: field.type,
                            options: field.options,
                            defaultValue: field.defaultValue,
                            required: field.required
                        }
                    }), {})
                }), {})
            })

            if (error) throw error

            toast({
                title: 'Success',
                description: 'Template configuration saved successfully'
            })

        } catch (error) {
            console.error('Error saving template:', error)
            toast({
                title: 'Error',
                description: 'Failed to save template'
            })
        }
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-screen gap-4 p-4">
                {/* Left Panel - Available Fields */}
                <div className="w-1/3 space-y-4">
                    <Card className="p-4">
                        <h3 className="text-lg font-semibold mb-4">Template Information</h3>
                        <div className="space-y-4">
                            <div>
                                <Label>Template Name</Label>
                                <Input
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={templateDescription}
                                    onChange={(e) => setTemplateDescription(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <h3 className="text-lg font-semibold mb-4">Upload Template</h3>
                        <Input
                            type="file"
                            accept=".docx"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) parseTemplate(file)
                            }}
                        />
                    </Card>

                    {parsedFields.length > 0 && (
                        <Card className="p-4">
                            <h3 className="text-lg font-semibold mb-4">Available Fields</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {parsedFields.map((field) => {
                                    const fieldAllocations = sections.filter(section =>
                                        section.fields.some(f => f.name === field)
                                    );
                                    const isAllocated = fieldAllocations.length > 0;

                                    return (
                                        <div
                                            key={field}
                                            className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                                            onClick={() => {
                                                // Find existing field configuration if it exists in any section
                                                const existingField = sections.reduce((found, section) => {
                                                    const sectionField = section.fields.find(f => f.name === field)
                                                    return sectionField || found
                                                }, null)

                                                setSelectedField(existingField || {
                                                    name: field,
                                                    label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                                })
                                                setShowFieldConfig(true)
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
                        </Card>
                    )}

                </div>

                {/* Right Panel - Sections */}
                <div className="w-2/3 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Sections</h3>
                        <Button onClick={() => setShowSectionDialog(true)}>
                            Add Section
                        </Button>
                    </div>
                    <ScrollArea className="h-[850px]" >
                        {sections.map((section) => (
                            <Card key={section.id} className="p-4">
                                <CardHeader className="px-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl">{section.label}</CardTitle>
                                            <CardDescription>{section.description}</CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    Section Actions
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedSection(section)
                                                    setShowSectionDialog(true)
                                                }}>
                                                    Edit Section
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => {
                                                        setSections(sections.filter(s => s.id !== section.id))
                                                        setParsedFields([...parsedFields, ...section.fields.map(f => f.name)])
                                                    }}
                                                >
                                                    Delete Section
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>


                                <CardContent className="px-0">

                                    <Table>
                                        <TableHeader className="bg-blue-600">
                                            <TableRow>
                                                <TableHead className="font-bold text-white w-16">Index</TableHead>
                                                <TableHead className="font-bold text-white">Field Name</TableHead>
                                                <TableHead className="font-bold text-white">Type</TableHead>
                                                <TableHead className="font-bold text-white">Label</TableHead>
                                                <TableHead className="font-bold text-white">Default Value</TableHead>
                                                <TableHead className="font-bold text-white">Options</TableHead>
                                                <TableHead className="font-bold text-white">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <Droppable droppableId={section.id}>
                                            {(provided) => (
                                                <TableBody
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                >
                                                    {section.fields.map((field, index) => (
                                                        <Draggable
                                                            key={field.id}
                                                            draggableId={field.id}
                                                            index={index}
                                                        >
                                                            {(provided) => (
                                                                <TableRow
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                >
                                                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                                                    <TableCell>{field.name}</TableCell>
                                                                    <TableCell className="capitalize">{field.type}</TableCell>
                                                                    <TableCell>{field.label}</TableCell>
                                                                    <TableCell>{field.defaultValue || '-'}</TableCell>
                                                                    <TableCell>
                                                                        {field.options ? field.options.join(', ') : '-'}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex gap-2">
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    setSelectedField(field)
                                                                                    setShowFieldConfig(true)
                                                                                }}
                                                                            >
                                                                                Edit
                                                                            </Button>
                                                                            <Button
                                                                                variant="destructive"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    const updatedFields = section.fields.filter(f => f.id !== field.id)
                                                                                    setSections(sections.map(s =>
                                                                                        s.id === section.id
                                                                                            ? { ...s, fields: updatedFields }
                                                                                            : s
                                                                                    ))
                                                                                    setParsedFields([...parsedFields, field.name])
                                                                                }}
                                                                            >
                                                                                Remove
                                                                            </Button>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </TableBody>
                                            )}
                                        </Droppable>
                                    </Table>
                                </CardContent>
                            </Card>
                        ))}
                    </ScrollArea>

                    <div className="flex justify-end">
                        <Button onClick={saveTemplate}>
                            Save Template Configuration
                        </Button>
                    </div>
                </div>

                {/* Section Dialog */}
                <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedSection ? 'Edit Section' : 'Add New Section'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const formData = new FormData(e.currentTarget)
                            if (selectedSection) {
                                // Update existing section
                                setSections(sections.map(section =>
                                    section.id === selectedSection.id
                                        ? {
                                            ...section,
                                            name: formData.get('name') as string,
                                            label: formData.get('label') as string,
                                            description: formData.get('description') as string,
                                        }
                                        : section
                                ))
                            } else {
                                // Add new section
                                addSection({
                                    name: formData.get('name') as string,
                                    label: formData.get('label') as string,
                                    description: formData.get('description') as string,
                                })
                            }
                            setShowSectionDialog(false)
                            setSelectedSection(null)
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <Label>Section Name</Label>
                                    <Input
                                        name="name"
                                        required
                                        defaultValue={selectedSection?.name || ''}
                                    />
                                </div>
                                <div>
                                    <Label>Display Label</Label>
                                    <Input
                                        name="label"
                                        required
                                        defaultValue={selectedSection?.label || ''}
                                    />
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <Textarea
                                        name="description"
                                        defaultValue={selectedSection?.description || ''}
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowSectionDialog(false)
                                            setSelectedSection(null)
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {selectedSection ? 'Update Section' : 'Add Section'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Field Configuration Modal */}
                {selectedField && (
                    <FieldConfigurationModal
                        isOpen={showFieldConfig}
                        onClose={() => {
                            setShowFieldConfig(false)
                            setSelectedField(null)
                        }}
                        onSave={handleFieldConfiguration}
                        field={selectedField}
                        sections={sections}  // Add this line
                    />
                )}
            </div>
        </DragDropContext>
    )
}

