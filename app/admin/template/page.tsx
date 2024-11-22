import TemplateSelector from './components/TemplateSelector'
import FormBuilder from './components/FormBuilder'
import DocumentPreview from './components/DocumentPreview'
import TemplateUploader from './components/TemplateUploader'

export default function Home() {
  return (
    <div className=" mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Form Template Generator</h1>
        <TemplateUploader/>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <TemplateSelector />
          <FormBuilder />
        </div>
        <DocumentPreview />
      </div>
    </div>
  )
}

