  "use client"
  import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CompanyDocs from "./documenttable";

const DataTableWithDocuments = ({ category }: { category: string }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{category} Documents</h3>
      <CompanyDocs />
    </div>
  );
};
export default function KYCDocuments() {
  return (
    <div className="p-4 w-full">
      <h1 className="text-xl font-bold mb-4">KYC Documents</h1>
      <Tabs defaultValue="company-docs">
        <TabsList className="mb-4">
          <TabsTrigger value="company-docs">Company Documents</TabsTrigger>
          <TabsTrigger value="directors-docs">Director Documents</TabsTrigger>
          <TabsTrigger value="suppliers-docs">Supplier Documents</TabsTrigger>
          <TabsTrigger value="banks-docs">Bank Documents</TabsTrigger>
          <TabsTrigger value="employee-docs">Employee Documents</TabsTrigger>
          <TabsTrigger value="insurance-docs">Insurance Policy Documents</TabsTrigger>
          <TabsTrigger value="deposits-docs">Deposit Documents</TabsTrigger>
          <TabsTrigger value="fixed-assets-docs">Fixed Assets Register</TabsTrigger>
        </TabsList>

        <TabsContent value="company-docs">
          <Tabs defaultValue="kra">
            <TabsList className="mb-4">
              <TabsTrigger value="kra">KRA Documents</TabsTrigger>
              <TabsTrigger value="sheria">Sheria Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="kra">
              <DataTableWithDocuments category="KRA" />
            </TabsContent>
            <TabsContent value="sheria">
              <DataTableWithDocuments category="Sheria" />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="directors-docs">
          <DataTableWithDocuments category="Directors" />
        </TabsContent>

        <TabsContent value="suppliers-docs">
          <Tabs defaultValue="trading-suppliers">
            <TabsList className="mb-4">
              <TabsTrigger value="trading-suppliers">Trading Suppliers - Documents</TabsTrigger>
              <TabsTrigger value="monthly-service-vendors">Monthly Service Vendors - Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="trading-suppliers">
              <DataTableWithDocuments category="Trading Suppliers" />
            </TabsContent>
            <TabsContent value="monthly-service-vendors">
              <DataTableWithDocuments category="Monthly Service Vendors" />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="banks-docs">
          <DataTableWithDocuments category="Banks" />
        </TabsContent>

        <TabsContent value="employee-docs">
          <DataTableWithDocuments category="Employees" />
        </TabsContent>

        <TabsContent value="insurance-docs">
          <DataTableWithDocuments category="Insurance" />
        </TabsContent>

        <TabsContent value="deposits-docs">
          <DataTableWithDocuments category="Deposits" />
        </TabsContent>

        <TabsContent value="fixed-assets-docs">
          <Tabs defaultValue="computer-equipment">
            <TabsList className="mb-4">
              <TabsTrigger value="computer-equipment">Computer & Equipments</TabsTrigger>
              <TabsTrigger value="furniture-fitting">Furniture Fitting & Equip 12.5%</TabsTrigger>
              <TabsTrigger value="land-building">Land & Building</TabsTrigger>
              <TabsTrigger value="plant-equipment">Plant & Equipment - 12.5 %</TabsTrigger>
              <TabsTrigger value="motor-vehicles">Motor Vehicles - 25 %</TabsTrigger>
            </TabsList>
            <TabsContent value="computer-equipment">
              <DataTableWithDocuments category="Computer Equipment" />
            </TabsContent>
            <TabsContent value="furniture-fitting">
              <DataTableWithDocuments category="Furniture Fitting" />
            </TabsContent>
            <TabsContent value="land-building">
              <DataTableWithDocuments category="Land Building" />
            </TabsContent>
            <TabsContent value="plant-equipment">
              <DataTableWithDocuments category="Plant Equipment" />
            </TabsContent>
            <TabsContent value="motor-vehicles">
              <DataTableWithDocuments category="Motor Vehicles" />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}