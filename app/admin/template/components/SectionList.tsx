import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import dynamic from 'next/dynamic'

const Droppable = dynamic(() => import('@hello-pangea/dnd').then(mod => mod.Droppable), { ssr: false })
const Draggable = dynamic(() => import('@hello-pangea/dnd').then(mod => mod.Draggable), { ssr: false })

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

interface SectionListProps {
    sections: Section[]
    setSections: (sections: Section[]) => void
    onAddSection: () => void
    onEditSection: (section: Section) => void
    onFieldEdit: (field: Field) => void
    setParsedFields: (fields: string[]) => void
    parsedFields: string[]
}

export default function SectionList({
    sections,
    setSections,
    onAddSection,
    onEditSection,
    onFieldEdit,
    setParsedFields,
    parsedFields
}: SectionListProps) {
    return (
        <>
            <div className="flex justify-between items-center p-4">
                <h3 className="text-lg font-semibold">Sections</h3>
                <Button onClick={onAddSection}>
                    Add Section
                </Button>
            </div>
            <ScrollArea className="h-[850px] p-4">
                {sections.map((section) => (
                    <Card key={section.id} className="p-4 mb-4">
                        <CardHeader className="px-4">
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
                                        <DropdownMenuItem onClick={() => onEditSection(section)}>
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

                        <CardContent className="px-4">
                            <Table>
                                <TableHeader className="bg-blue-600">
                                    <TableRow>
                                        <TableHead className="font-bold text-white w-16 p-4">Index</TableHead>
                                        <TableHead className="font-bold text-white p-4">Field Name</TableHead>
                                        <TableHead className="font-bold text-white p-4">Type</TableHead>
                                        <TableHead className="font-bold text-white p-4">Label</TableHead>
                                        <TableHead className="font-bold text-white p-4">Default Value</TableHead>
                                        <TableHead className="font-bold text-white p-4">Options</TableHead>
                                        <TableHead className="font-bold text-white p-4">Actions</TableHead>
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
                                                            <TableCell className="font-medium p-4">{index + 1}</TableCell>
                                                            <TableCell className="p-4">{field.name}</TableCell>
                                                            <TableCell className="capitalize p-4">{field.type}</TableCell>
                                                            <TableCell className="p-4">{field.label}</TableCell>
                                                            <TableCell className="p-4">{field.defaultValue || '-'}</TableCell>
                                                            <TableCell className="p-4">
                                                                {field.options ? field.options.join(', ') : '-'}
                                                            </TableCell>
                                                            <TableCell className="p-4">
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => onFieldEdit(field)}
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
        </>
    )
}