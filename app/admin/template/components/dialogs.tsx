// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { FieldConfigurationProps, SectionDialogProps, Field, SectionFormData } from './types'

export const FieldConfigurationDialog: React.FC<FieldConfigurationProps> = ({
    isOpen,
    onClose,
    onSave,
    field,
    sections
}) => {
    const [fieldConfig, setFieldConfig] = useState<Partial<Field>>(field)
    const [options, setOptions] = useState<string[]>(field.options || [])
    const [selectedSectionId, setSelectedSectionId] = useState<string>('')
    const [newOption, setNewOption] = useState('')
    const [hasDefault, setHasDefault] = useState(!!field.defaultValue)

    useEffect(() => {
        setFieldConfig(field)
        setOptions(field.options || [])
        setHasDefault(!!field.defaultValue)
    }, [field])

    const handleSave = () => {
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

export const SectionDialog: React.FC<SectionDialogProps> = ({
    isOpen,
    onClose,
    onSave,
    section
}) => {
    const [formData, setFormData] = useState<SectionFormData>({
        name: '',
        label: '',
        description: ''
    })

    useEffect(() => {
        if (section) {
            setFormData({
                name: section.name,
                label: section.label,
                description: section.description
            })
        } else {
            setFormData({
                name: '',
                label: '',
                description: ''
            })
        }
    }, [section])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(formData)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{section ? 'Edit Section' : 'Add New Section'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Label>Section Name</Label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label>Display Label</Label>
                            <Input
                                name="label"
                                value={formData.label}
                                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                name="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {section ? 'Update' : 'Add'} Section
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}