'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTemplateStore } from '../store/templateStore'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { saveAs } from 'file-saver'
import { renderAsync } from 'docx-preview'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export default function DocumentPreview() {
  const { selectedTemplate, formData } = useTemplateStore()
  const [docxContent, setDocxContent] = useState<ArrayBuffer | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const renderedContentRef = useRef<string | null>(null)

  // Load template
  useEffect(() => {
    const loadTemplate = async () => {
      if (selectedTemplate?.templateUrl) {
        try {
          const response = await fetch(selectedTemplate.templateUrl)
          if (!response.ok) throw new Error('Failed to fetch template')
          
          const buffer = await response.arrayBuffer()
          setDocxContent(buffer)
        } catch (error) {
          console.error('Error loading template:', error)
        }
      }
    }

    loadTemplate()
  }, [selectedTemplate])

  // Update preview content
  const updatePreviewContent = useCallback(async () => {
    if (!docxContent || !formData || !previewContainerRef.current) return

    try {
      const zip = new PizZip(docxContent)
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true
      })

      doc.setData(formData)
      doc.render()

      const content = doc.getZip().generate({
        type: 'string'
      })

      if (content !== renderedContentRef.current) {
        renderedContentRef.current = content
        
        const blob = doc.getZip().generate({
          type: 'blob',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        })

        // Clear previous content
        previewContainerRef.current.innerHTML = ''

        await renderAsync(blob, previewContainerRef.current, previewContainerRef.current, {
          className: 'preview-content',
          ignoreWidth: false,
          ignoreHeight: false,
          inWrapper: true
        })
      }
    } catch (error) {
      console.error('Error updating preview:', error)
    }
  }, [docxContent, formData])

  // Debounced update
  useEffect(() => {
    const timeoutId = setTimeout(updatePreviewContent, 300)
    return () => clearTimeout(timeoutId)
  }, [updatePreviewContent])

  const handleExport = async (type: 'docx' | 'pdf') => {
    if (!docxContent || !formData || !previewContainerRef.current) return

    try {
      setIsExporting(true)
      const zip = new PizZip(docxContent)
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true
      })

      doc.setData(formData)
      doc.render()

      if (type === 'docx') {
        const content = doc.getZip().generate({
          type: 'blob',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        })
        saveAs(content, `${selectedTemplate?.name || 'document'}.docx`)
      } else {
        // Convert current preview to PDF
        const element = previewContainerRef.current
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false
        })

        const imgWidth = 210 // A4 width in mm
        const pageHeight = 297 // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight
        let position = 0

        const pdf = new jsPDF('p', 'mm')
        let firstPage = true

        while (heightLeft >= 0) {
          if (!firstPage) {
            pdf.addPage()
          }
          
          const contentDataURL = canvas.toDataURL('image/png')
          pdf.addImage(
            contentDataURL, 
            'PNG', 
            0, 
            position,
            imgWidth, 
            imgHeight,
            '',
            'FAST'
          )
          
          heightLeft -= pageHeight
          position -= pageHeight
          firstPage = false
        }

        pdf.save(`${selectedTemplate?.name || 'document'}.pdf`)
      }
    } catch (error) {
      console.error('Error exporting document:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Document Preview</h2>
        
        <div className="relative bg-gray-50 rounded-lg">
          <ScrollArea className="h-[842px] w-full rounded-lg">
            <div 
              ref={previewContainerRef}
              className="w-full bg-white rounded-lg shadow-inner p-8"
              style={{ minWidth: '100%' }}
            />
          </ScrollArea>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button 
            onClick={() => handleExport('pdf')} 
            disabled={isExporting}
          >
            {isExporting ? 'Converting...' : 'Export as PDF'}
          </Button>
          <Button 
            onClick={() => handleExport('docx')}
            disabled={isExporting}
          >
            Export as Word
          </Button>
        </div>
      </div>
    </div>
  )
}