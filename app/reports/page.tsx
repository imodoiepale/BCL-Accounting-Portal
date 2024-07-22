//@ts-nocheck
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Reports() {
    return (
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">Reports</h1>
          <Tabs defaultValue="suppliers">
            <TabsList >
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
              <TabsTrigger value="banks">Banks</TabsTrigger>
              <TabsTrigger value="others">Other Docs</TabsTrigger>
            </TabsList>
            <TabsContent value="suppliers">
              <h2 className="text-xl font-semibold mb-2">Suppliers</h2>
              {/* Add suppliers content here */}
            </TabsContent>
            
            <TabsContent value="banks">
              <h2 className="text-xl font-semibold mb-2">Banks</h2>
              {/* Add banks content here */}
            </TabsContent>

            <TabsContent value="others">
              <h2 className="text-xl font-semibold mb-2">Other Docs</h2>
              {/* other docs content here */}
            </TabsContent>
          </Tabs>
        </div>
      )
    }