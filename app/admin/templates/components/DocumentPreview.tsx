'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTemplateStore } from '../store/templateStore'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { PDFDocument, rgb } from 'pdf-lib'

export default function DocumentPreview() {
  const { selectedTemplate, formData } = useTemplateStore()
  const [previewContent, setPreviewContent] = useState<string>('Your document preview will appear here.')

  useEffect(() => {
    if (selectedTemplate && formData) {
      const content = Object.entries(formData).map(([key, value]) => {
        const field = selectedTemplate.fields.find((f) => f.id === key)
        return `${field?.label}: ${value}`
      }).join('\n')
      setPreviewContent(content)
    }
  }, [selectedTemplate, formData])

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!selectedTemplate || !formData) {
      console.error('No template or form data available')
      return
    }

    if (format === 'docx') {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun(previewContent)],
            }),
          ],
        }],
      })

      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedTemplate.name}.docx`
      link.click()
      URL.revokeObjectURL(url)
    } else if (format === 'pdf') {
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage()
      const { height, width } = page.getSize()
      page.drawText(previewContent, {
        x: 50,
        y: height - 50,
        size: 12,
        color: rgb(0, 0, 0),
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedTemplate.name}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-xl font-semibold mb-2">Document Preview</h2>
      <div className="bg-gray-100 p-4 rounded min-h-[300px] mb-4 whitespace-pre-wrap">
        {previewContent}
      </div>
      <div className="flex space-x-2">
        <Button onClick={() => handleExport('docx')}>Export as Word</Button>
        <Button onClick={() => handleExport('pdf')}>Export as PDF</Button>
      </div>
    </div>
  )
}

