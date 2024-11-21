'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTemplateStore } from '../store/templateStore'

export default function SignatureUpload() {
  const [signature, setSignature] = useState<string | null>(null)
  const { setFormData } = useTemplateStore()

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setSignature(result)
        setFormData((prevData) => ({ ...prevData, signature: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="mb-4">
      <Label htmlFor="signature-upload" className="block mb-1">
        Upload Signature
      </Label>
      <Input
        type="file"
        id="signature-upload"
        accept="image/*"
        onChange={handleSignatureUpload}
        className="mb-2"
      />
      {signature && (
        <div>
          <p className="mb-2">Preview:</p>
          <img src={signature} alt="Signature Preview" className="max-w-xs" />
        </div>
      )}
    </div>
  )
}

