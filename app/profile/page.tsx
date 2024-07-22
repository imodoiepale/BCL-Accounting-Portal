//@ts-nocheck
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Profile() {
    return (
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">Company Profile</h1>
          <Tabs defaultValue="company-info">
            <TabsList >
              <TabsTrigger value="company-info">Company Info</TabsTrigger>
              <TabsTrigger value="kyc-docs">KYC Docs</TabsTrigger>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
              <TabsTrigger value="banks">Banks</TabsTrigger>
            </TabsList>
            <TabsContent value="company-info" className="px-8">
              <h2 className="text-xl font-semibold mb-2">Company Info</h2>
              {/* Add company info content here */}
            </TabsContent>
            <TabsContent value="kyc-docs">
              <h2 className="text-xl font-semibold mb-2">KYC Docs</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">One-off</h3>
                  {/* Add one-off KYC docs content */}
                </div>
                <div>
                  <h3 className="text-lg font-medium">Renewal</h3>
                  {/* Add renewal KYC docs content */}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="suppliers">
              <h2 className="text-xl font-semibold mb-2">Suppliers</h2>
              {/* Add suppliers content here */}
            </TabsContent>
            <TabsContent value="banks">
              <h2 className="text-xl font-semibold mb-2">Banks</h2>
              {/* Add banks content here */}
            </TabsContent>
          </Tabs>
        </div>
      )
    }