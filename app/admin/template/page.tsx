// @ts-nocheck
import TemplateSelector from './components/TemplateSelector'
import FormBuilder from './components/FormBuilder'
import DocumentPreview from './components/DocumentPreview'
import TemplateUploader from './components/TemplateUploader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <div className=" mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Form Template Generator</h1>
      <Tabs defaultValue="generate" className="w-full">
        <TabsList>
          <TabsTrigger value="generate">Generate Document</TabsTrigger>
          <TabsTrigger value="settings">Template Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="generate">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <TemplateSelector />
              <FormBuilder />
            </div>
            <DocumentPreview />
          </div>
        </TabsContent>
        <TabsContent value="settings">
          <TemplateUploader />
        </TabsContent>
      </Tabs>
    </div>
  )
}