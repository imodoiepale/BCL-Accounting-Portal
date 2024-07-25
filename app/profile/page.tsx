//@ts-nocheck
import { BankList } from "@/components/component/BankList"
import { CompanyInfoTab } from "@/components/component/companyInfo"
import { EmployeeList } from "@/components/component/Employees"
import { SupplierList } from "@/components/component/SupplierList"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Profile() {
    return (
        <div className="p-4 w-full">
          <h1 className="text-xl font-bold mb-4">Company Profile</h1>
          <Tabs defaultValue="company-info">
            <TabsList>
              <TabsTrigger value="company-info">Company Info</TabsTrigger>
              <TabsTrigger value="kyc-docs">KYC Documents</TabsTrigger>
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
              <TabsTrigger value="banks">Banks</TabsTrigger>
            </TabsList>
            <TabsContent value="company-info" className="px-8">
              <h2 className="text-xl font-semibold mb-2">Company Info</h2>
              <CompanyInfoTab />
            </TabsContent>
            <TabsContent value="kyc-docs">
              <h2 className="text-xl font-semibold mb-2">KYC Documents</h2>
              <Tabs defaultValue="one-off">
                <TabsList>
                  <TabsTrigger value="one-off">One-off KYC Documents </TabsTrigger>
                  <TabsTrigger value="renewal">Renewal KYC Documents </TabsTrigger>
                </TabsList>
                <TabsContent value="one-off">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">One-off KYC Documents</h3>
                    {/* Add one-off KYC docs content */}
                  </div>
                </TabsContent>
                <TabsContent value="renewal">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Renewal KYC Documents</h3>
                    {/* Add renewal KYC docs content */}
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
            <TabsContent value="employees" className="px-8">
              <h2 className="text-xl font-semibold mb-2">Employees</h2>
              <EmployeeList />
            </TabsContent>
            <TabsContent value="suppliers">
              <h2 className="text-xl font-semibold mb-2">Suppliers</h2>
              <SupplierList />
            </TabsContent>
            <TabsContent value="banks">
              <h2 className="text-xl font-semibold mb-2">Banks</h2>
              <BankList />
            </TabsContent>
          </Tabs>
        </div>
      )
}
