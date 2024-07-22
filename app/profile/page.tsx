//@ts-nocheck
import { SupplierList } from "@/components/component/SupplierList"
import { BankList } from "@/components/component/BankList"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompanyInfoTab } from "@/components/component/companyInfo"



export default function Profile() {
    return (
        <div className="p-4 w-full">
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
              <CompanyInfoTab/>
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
              <SupplierList/>
            </TabsContent>
            <TabsContent value="banks">
              <h2 className="text-xl font-semibold mb-2">Banks</h2>
              <BankList/>
            </TabsContent>
          </Tabs>
        </div>
      )
    }