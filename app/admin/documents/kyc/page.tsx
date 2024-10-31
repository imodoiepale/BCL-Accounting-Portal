// @ts-nocheck
"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTableWithDocuments from "./DataTableWithDocuments"; // Ensure the path is correct

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
              <DataTableWithDocuments category="KRA" showDirectors={false} />
            </TabsContent>
            <TabsContent value="sheria">
              <DataTableWithDocuments category="Sheria" showDirectors={false} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="directors-docs">
          <DataTableWithDocuments category="Directors" showDirectors={true} />
        </TabsContent>

        <TabsContent value="suppliers-docs">
          <DataTableWithDocuments category="Suppliers" showDirectors={true} />
        </TabsContent>

        <TabsContent value="banks-docs">
          <DataTableWithDocuments category="Banks" showDirectors={true} />
        </TabsContent>

        <TabsContent value="employee-docs">
          <DataTableWithDocuments category="Employees" showDirectors={true} />
        </TabsContent>

        <TabsContent value="insurance-docs">
          <DataTableWithDocuments category="Insurance" showDirectors={false} />
        </TabsContent>

        <TabsContent value="deposits-docs">
          <DataTableWithDocuments category="Deposits" showDirectors={false} />
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
              <DataTableWithDocuments category="Computer Equipment" showDirectors={false} />
            </TabsContent>
            <TabsContent value="furniture-fitting">
              <DataTableWithDocuments category="Furniture Fitting" showDirectors={false} />
            </TabsContent>
            <TabsContent value="land-building">
              <DataTableWithDocuments category="Land Building" showDirectors={false} />
            </TabsContent>
            <TabsContent value="plant-equipment">
              <DataTableWithDocuments category="Plant Equipment" showDirectors={false} />
            </TabsContent>
            <TabsContent value="motor-vehicles">
              <DataTableWithDocuments category="Motor Vehicles" showDirectors={false} />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}