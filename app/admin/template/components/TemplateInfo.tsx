// @ts-nocheck

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Download, Upload } from 'lucide-react'

interface TemplateInfoProps {
    templateName: string
    templateDescription: string
    setTemplateName: (name: string) => void
    setTemplateDescription: (desc: string) => void
    parseTemplate: (file: File) => void
    isExistingTemplate: boolean
    templateFileUrl?: string
    templateFileName?: string
    onDownload: () => Promise<void>
}

export default function TemplateInfo({
    templateName,
    templateDescription,
    setTemplateName,
    setTemplateDescription,
    parseTemplate,
    isExistingTemplate,
    templateFileUrl,
    templateFileName,
    onDownload
}: TemplateInfoProps) {
    return (
        <div className="space-y-4 p-4">
            <h3 className="text-lg font-semibold">Template Information</h3>
            <div className="space-y-4">
                <div>
                    <Label>Template Name</Label>
                    <Input
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Enter template name"
                    />
                </div>
                <div>
                    <Label>Description</Label>
                    <Textarea
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        placeholder="Enter template description"
                    />
                </div>

                <div className="pt-2">
                    <Label>Template Document</Label>
                    <div className="flex items-center gap-2 mt-2">
                        {isExistingTemplate ? (
                            <>
                                <span className="text-sm text-gray-600 truncate max-w-[200px]">
                                    {templateFileName || 'template.docx'}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onDownload}
                                    className="ml-auto"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Template
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col gap-2 w-full">
                                <span className="text-sm text-gray-600">
                                    Upload a template document (.docx)
                                </span>
                                <div className="flex gap-2 items-center w-full">
                                    <Input
                                        type="file"
                                        accept=".docx"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) parseTemplate(file)
                                        }}
                                    />
                                    <Button variant="outline" size="icon">
                                        <Upload className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}