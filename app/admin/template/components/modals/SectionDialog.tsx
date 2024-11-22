import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface Section {
    id: string
    name: string
    label: string
    description?: string
    order: number
    fields: any[]
}

interface SectionDialogProps {
    isOpen: boolean
    onClose: () => void
    selectedSection: Section | null
    sections: Section[]
    setSections: (sections: Section[]) => void
}

export function SectionDialog({
    isOpen,
    onClose,
    selectedSection,
    sections,
    setSections
}: SectionDialogProps) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
            const newSection: Section = {
                id: crypto.randomUUID(),
                name: formData.get('name') as string,
                label: formData.get('label') as string,
                description: formData.get('description') as string,
                order: sections.length,
                fields: []
            }
            setSections([...sections, newSection])
        }
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{selectedSection ? 'Edit Section' : 'Add New Section'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
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
                                onClick={onClose}
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
    )
}