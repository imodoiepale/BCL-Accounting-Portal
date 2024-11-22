'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabaseClient'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import dynamic from 'next/dynamic'
import TemplateInfo from './TemplateInfo'
import FieldList from './FieldList'
import SectionList from './SectionList'
import { SectionDialog } from './modals/SectionDialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { FieldConfigurationModal } from './modals/FieldConfigurationModal'
import { TemplateSidebar } from './TemplateSidebar'

const DragDropContext = dynamic(
    () => import('@hello-pangea/dnd').then(mod => mod.DragDropContext),
    { ssr: false }
)

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
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [availableFields, setAvailableFields] = useState<string[]>([])
    const [templateFile, setTemplateFile] = useState<{
        url: string;
        name: string;
        content?: ArrayBuffer;
    } | null>(null);

    const handleNewTemplate = () => {
        setSelectedTemplateId(null)
        setTemplateName('')
        setTemplateDescription('')
        setSections([])
        setParsedFields([])
    }

    const downloadTemplate = async () => {
        try {
            if (!templateFile?.url) {
                toast({
                    title: "Error",
                    description: "Template file not found",
                    variant: "destructive"
                });
                return;
            }

            const { data, error } = await supabase
                .storage
                .from('templates') // your bucket name
                .download(templateFile.url);

            if (error) throw error;

            // Create blob and download
            const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = templateFile.name || 'template.docx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading template:', error);
            toast({
                title: "Error",
                description: "Failed to download template",
                variant: "destructive"
            });
        }
    };
    const loadTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to load templates',
                    variant: 'destructive'
                });
                return;
            }

            // Reset states after successful load
            if (!selectedTemplateId) {
                setTemplateName('');
                setTemplateDescription('');
                setSections([]);
                setParsedFields([]);
                setTemplateFile(null);
            }

            return data;
        } catch (error) {
            console.error('Error loading templates:', error);
            toast({
                title: 'Error',
                description: 'Failed to load templates',
                variant: 'destructive'
            });
        }
    };


    const loadTemplate = async (templateId: string) => {
        setIsLoading(true);
        try {
            const { data: template, error } = await supabase
                .from('templates')
                .select('*')
                .eq('id', templateId)
                .single();

            if (error) {
                console.error('Error details:', error);
                throw error;
            }

            if (template) {
                setTemplateName(template.name);
                setTemplateDescription(template.description || '');
                setSections(template.sections || []);

                // Set template file information
                setTemplateFile({
                    url: template.file_url,
                    name: template.file_name
                });

                // Load template contents to get fields
                if (template.file_url) {
                    try {
                        const { data: fileData, error: fileError } = await supabase
                            .storage
                            .from('templates')
                            .download(template.file_url);

                        if (fileError) throw fileError;

                        // Parse the document to get fields
                        const arrayBuffer = await fileData.arrayBuffer();
                        const zip = new PizZip(arrayBuffer);
                        const doc = new Docxtemplater(zip, {
                            paragraphLoop: true,
                            linebreaks: true
                        });

                        const content = doc.getFullText();
                        const variables = content.match(/\{([^}]+)\}/g) || [];
                        const uniqueFields = [...new Set(variables.map(v => v.replace(/[{}]/g, '')))];

                        // Combine with existing fields from database
                        const allFields = new Set([
                            ...uniqueFields,
                            ...Object.keys(template.field_mappings || {})
                        ]);

                        // Get fields that are already in sections
                        const sectionFields = new Set(
                            template.sections.flatMap(section =>
                                section.fields.map(field => field.name)
                            )
                        );

                        // Set available fields (those not in any section)
                        const unmappedFields = [...allFields].filter(field => !sectionFields.has(field));
                        setAvailableFields(unmappedFields);
                    } catch (parseError) {
                        console.error('Error parsing template file:', parseError);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading template:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load template data',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplateId(templateId)
        loadTemplate(templateId)
    }

    const parseTemplate = async (file: File) => {
        const arrayBuffer = await file.arrayBuffer()
        setTemplateFile({
            url: '',
            name: file.name,
            content: arrayBuffer
        })
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
            setAvailableFields(uniqueFields)
        } catch (error) {
            console.error('Error parsing template:', error)
            toast({
                title: 'Error',
                description: 'Failed to parse template'
            })
        }
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
    const checkTemplateNameExists = async (name: string, excludeId?: string) => {
        const query = supabase
            .from('templates')
            .select('id')
            .eq('name', name.trim())

        if (excludeId) {
            query.neq('id', excludeId)
        }

        const { data } = await query;
        return data && data.length > 0;
    };

    // Delete template
    const handleDeleteTemplate = async (templateId: string) => {
        try {
            if (templateFile?.url) {
                const { error: storageError } = await supabase
                    .storage
                    .from('templates')
                    .remove([templateFile.url]);

                if (storageError) throw storageError;
            }

            const { error: dbError } = await supabase
                .from('templates')
                .delete()
                .eq('id', templateId);

            if (dbError) throw dbError;

            // Reset states
            setSelectedTemplateId(null);
            setTemplateName('');
            setTemplateDescription('');
            setSections([]);
            setParsedFields([]);
            setTemplateFile(null);

            // Load fresh templates
            await loadTemplates();

            toast({
                title: 'Success',
                description: 'Template deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting template:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete template',
                variant: 'destructive'
            });
        }
    };


    const saveTemplate = async () => {
        try {
            // Basic validation
            if (!templateName.trim()) {
                toast({
                    title: 'Error',
                    description: 'Template name is required',
                    variant: 'destructive'
                });
                return;
            }

            // Check if template name exists
            const nameExists = await checkTemplateNameExists(
                templateName,
                selectedTemplateId // exclude current template when editing
            );

            if (nameExists) {
                toast({
                    title: 'Error',
                    description: 'Template name already exists',
                    variant: 'destructive'
                });
                return;
            }

            if (sections.length === 0) {
                toast({
                    title: 'Error',
                    description: 'At least one section with fields is required',
                    variant: 'destructive'
                });
                return;
            }

            const templateData = {
                name: templateName.trim(),
                description: templateDescription.trim(),
                status: 'active',
                config: {
                    version: 1,
                    sections: sections.map(section => ({
                        id: section.id,
                        name: section.name,
                        label: section.label,
                        description: section.description,
                        order: section.order,
                        fields: section.fields.map(field => ({
                            name: field.name,
                            type: field.type,
                            label: field.label,
                            defaultValue: field.defaultValue,
                            options: field.options,
                            required: field.required,
                            validation: field.validation
                        }))
                    }))
                },
                available_fields: availableFields,
                parsed_fields: parsedFields,
                sections: sections,
                field_mappings: sections.reduce((acc, section) => ({
                    ...acc,
                    ...section.fields.reduce((fieldAcc, field) => ({
                        ...fieldAcc,
                        [field.name]: {
                            section: section.name,
                            type: field.type,
                            label: field.label,
                            options: field.options,
                            defaultValue: field.defaultValue,
                            required: field.required,
                            validation: field.validation
                        }
                    }), {})
                }), {}),
                validation_rules: {
                    required_fields: sections.reduce((acc, section) => ({
                        ...acc,
                        ...section.fields.reduce((fieldAcc, field) => ({
                            ...fieldAcc,
                            [field.name]: field.required
                        }), {})
                    }), {}),
                    field_types: sections.reduce((acc, section) => ({
                        ...acc,
                        ...section.fields.reduce((fieldAcc, field) => ({
                            ...fieldAcc,
                            [field.name]: field.type
                        }), {})
                    }), {})
                },
                metadata: {
                    total_sections: sections.length,
                    total_fields: sections.reduce((total, section) => total + section.fields.length, 0),
                    created_at: new Date().toISOString(),
                    last_modified: new Date().toISOString()
                }
            }

            if (templateFile?.content) {
                const sanitizedFileName = templateName.toLowerCase().replace(/[^a-z0-9]/g, '-')
                const fileName = `templates/${sanitizedFileName}-${Date.now()}.docx`

                const { data, error: uploadError } = await supabase.storage
                    .from('templates')
                    .upload(fileName, templateFile.content)

                if (uploadError) throw uploadError

                templateData.file_url = fileName
                templateData.file_name = templateFile.name
            }

            if (selectedTemplateId) {
                // Update existing template
                const { error: updateError } = await supabase
                    .from('templates')
                    .update(templateData)
                    .eq('id', selectedTemplateId);

                if (updateError) throw updateError;

                toast({
                    title: 'Success',
                    description: 'Template updated successfully'
                });
            } else {
                // Create new template
                const { error: insertError } = await supabase
                    .from('templates')
                    .insert(templateData);

                if (insertError) throw insertError;

                toast({
                    title: 'Success',
                    description: 'Template created successfully'
                });
            }

            // Refresh templates list
            loadTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to save template',
                variant: 'destructive'
            });
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <TemplateSidebar
                onTemplateSelect={handleTemplateSelect}
                selectedTemplateId={selectedTemplateId}
                onNewTemplate={handleNewTemplate}
                onDeleteTemplate={handleDeleteTemplate}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-semibold">
                                {selectedTemplateId ? 'Edit Template' : 'New Template'}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {selectedTemplateId
                                    ? 'Modify your existing template configuration'
                                    : 'Create a new template configuration'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {selectedTemplateId && (
                                <Button
                                    variant="outline"
                                    onClick={handleNewTemplate}
                                >
                                    Create New Template
                                </Button>
                            )}
                            <Button onClick={saveTemplate}>
                                {selectedTemplateId ? 'Update Template' : 'Save Template'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="h-full flex gap-6 p-6 overflow-auto">
                            {/* Left Panel */}
                            <div className="w-1/3 flex flex-col gap-6">
                                <div className="bg-white rounded-lg shadow">
                                    <TemplateInfo
                                        templateName={templateName}
                                        templateDescription={templateDescription}
                                        setTemplateName={setTemplateName}
                                        setTemplateDescription={setTemplateDescription}
                                        parseTemplate={parseTemplate}
                                        isExistingTemplate={!!selectedTemplateId}
                                        templateFileUrl={templateFile?.url}
                                        templateFileName={templateFile?.name}
                                        onDownload={downloadTemplate}
                                    />
                                </div>

                                {/* Only show field list if we have fields to show */}
                                {(availableFields.length > 0 || parsedFields.length > 0) && (
                                    <div className="bg-white rounded-lg shadow flex-1 overflow-auto">
                                        <FieldList
                                            fields={selectedTemplateId ? availableFields : parsedFields}
                                            sections={sections}
                                            onFieldSelect={(field) => {
                                                setSelectedField(field)
                                                setShowFieldConfig(true)
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Right Panel */}
                            <div className="w-2/3 bg-white rounded-lg shadow overflow-auto">
                                <SectionList
                                    sections={sections}
                                    setSections={setSections}
                                    onAddSection={() => setShowSectionDialog(true)}
                                    onEditSection={setSelectedSection}
                                    onFieldEdit={(field) => {
                                        setSelectedField(field)
                                        setShowFieldConfig(true)
                                    }}
                                    setParsedFields={setAvailableFields}  // Update to use availableFields
                                    parsedFields={selectedTemplateId ? availableFields : parsedFields}
                                />
                            </div>
                        </div>
                    </DragDropContext>
                </div>
            </div>

            {/* Modals */}
            <SectionDialog
                isOpen={showSectionDialog}
                onClose={() => {
                    setShowSectionDialog(false)
                    setSelectedSection(null)
                }}
                selectedSection={selectedSection}
                sections={sections}
                setSections={setSections}
            />

            {selectedField && (
                <FieldConfigurationModal
                    isOpen={showFieldConfig}
                    onClose={() => {
                        setShowFieldConfig(false)
                        setSelectedField(null)
                    }}
                    onSave={handleFieldConfiguration}
                    field={selectedField}
                    sections={sections}
                />
            )}
        </div>
    )
}

