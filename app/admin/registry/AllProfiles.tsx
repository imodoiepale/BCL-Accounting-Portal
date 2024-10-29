

/* eslint-disable react/no-unescaped-entities */
//@ts-nocheck

"use client";

import React, { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as XLSX from 'xlsx';
import DocsTable from '../documents/new/page';
import CompanyDocs from '../documents/new/company';

// Utility function to generate mock data
const generateMockData = (prefix, count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${prefix} ${i + 1}`,
    email: `${prefix.toLowerCase()}${i + 1}@example.com`,
    phone: `+254${Math.floor(Math.random() * 100000000)}`,
    date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString().split('T')[0],
    status: Math.random() > 0.5 ? 'Active' : 'Pending',
    type: ['Type A', 'Type B', 'Type C'][Math.floor(Math.random() * 3)],
    category: ['Category 1', 'Category 2', 'Category 3'][Math.floor(Math.random() * 3)],
    value: `$${Math.floor(Math.random() * 10000)}`,
    details: `Details for ${prefix} ${i + 1}`,
    location: ['Nairobi', 'Mombasa', 'Kisumu'][Math.floor(Math.random() * 3)],
  }));
};

const DataTable = ({ columns, data, onExport, title }) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter table..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            onClick={() => onExport(data, title)} 
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: "flex items-center cursor-pointer",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default function AllProfiles() {
  const [activeMainTab, setActiveMainTab] = useState("company-info");
  const [activeSubTab, setActiveSubTab] = useState("company-info-tab");

  const handleExport = (data, title) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, `${title}.xlsx`);
  };

  const commonColumns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "status", header: "Status" },
  ];

  const renderDataTable = (type, extraColumns = []) => (
    <DataTable
      columns={[...commonColumns, ...extraColumns]}
      data={generateMockData(type, 10)}
      onExport={handleExport}
      title={type}
    />
    
  );
  const renderDocs = (type, extraColumns = []) => (
    <DocsTable />
  );
  const renderCompanyDocs = (type, extraColumns = []) => (
    <CompanyDocs />
  );

  return (
    <div className="w-full space-y-4">
      <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
        <TabsList>
          <TabsTrigger value="company-info">Information</TabsTrigger>
          <TabsTrigger value="kyc-docs">KYC Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="company-info" className="space-y-4">
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
            <TabsList>
              <TabsTrigger value="company-info-tab">Company Info</TabsTrigger>
              <TabsTrigger value="directors-info">Directors</TabsTrigger>
              <TabsTrigger value="suppliers-info">Suppliers</TabsTrigger>
              <TabsTrigger value="banks-info">Banks</TabsTrigger>
              <TabsTrigger value="employee-info">Employees</TabsTrigger>
              <TabsTrigger value="insurances-info">Insurance</TabsTrigger>
              <TabsTrigger value="deposits-info">Deposits</TabsTrigger>
              <TabsTrigger value="fixed-assets-info">Assets</TabsTrigger>
            </TabsList>

            <TabsContent value="company-info-tab">
              {renderDataTable('Company', [
                { accessorKey: "industry", header: "Industry" },
                { accessorKey: "location", header: "Location" },
              ])}
            </TabsContent>

            <TabsContent value="suppliers-info">
              <Tabs defaultValue="trading-suppliers">
                <TabsList>
                  <TabsTrigger value="trading-suppliers">Trading Suppliers</TabsTrigger>
                  <TabsTrigger value="monthly-service-vendors">Monthly Service Vendors</TabsTrigger>
                </TabsList>
                
                <TabsContent value="trading-suppliers">
                  {renderDataTable('Trading Supplier', [
                    { accessorKey: "category", header: "Category" },
                    { accessorKey: "type", header: "Type" },
                  ])}
                </TabsContent>
                
                <TabsContent value="monthly-service-vendors">
                  {renderDataTable('Service Vendor', [
                    { accessorKey: "service", header: "Service" },
                    { accessorKey: "value", header: "Contract Value" },
                  ])}
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="fixed-assets-info">
              <Tabs defaultValue="computer-equipment">
                <TabsList>
                  <TabsTrigger value="computer-equipment">Computer & Equipment</TabsTrigger>
                  <TabsTrigger value="furniture-fitting">Furniture & Fitting</TabsTrigger>
                  <TabsTrigger value="land-building">Land & Building</TabsTrigger>
                  <TabsTrigger value="plant-equipment">Plant & Equipment</TabsTrigger>
                  <TabsTrigger value="motor-vehicles">Motor Vehicles</TabsTrigger>
                </TabsList>

                {["computer-equipment", "furniture-fitting", "land-building", "plant-equipment", "motor-vehicles"].map((assetType) => (
                  <TabsContent key={assetType} value={assetType}>
                    {renderDataTable(assetType.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' '), [
                      { accessorKey: "value", header: "Value" },
                      { accessorKey: "category", header: "Category" },
                    ])}
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>

            {/* Other standard tabs */}
            {["directors-info", "banks-info", "employee-info", "insurances-info", "deposits-info"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                {renderDataTable(tab.split('-')[0].charAt(0).toUpperCase() + tab.split('-')[0].slice(1), [
                  { accessorKey: "type", header: "Type" },
                  { accessorKey: "value", header: "Value" },
                ])}
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        <TabsContent value="kyc-docs">
          <Tabs defaultValue="company-docs">
            <TabsList>
              <TabsTrigger value="company-docs">Company Docs</TabsTrigger>
              <TabsTrigger value="director-docs">Director Docs</TabsTrigger>
              <TabsTrigger value="supplier-docs">Supplier Docs</TabsTrigger>
              <TabsTrigger value="bank-docs">Bank Docs</TabsTrigger>
              <TabsTrigger value="employee-docs">Employee Docs</TabsTrigger>
              <TabsTrigger value="insurance-docs">Insurance Docs</TabsTrigger>
              <TabsTrigger value="deposit-docs">Deposit Docs</TabsTrigger>
              <TabsTrigger value="asset-docs">Asset Docs</TabsTrigger>
            </TabsList>

            {/* Company Documents with KRA and Sheria subtabs */}
            <TabsContent value="company-docs">
              <Tabs defaultValue="kra">
                <TabsList>
                  <TabsTrigger value="kra">KRA Documents</TabsTrigger>
                  <TabsTrigger value="sheria">Sheria Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="kra">
                  {renderDocs('KRA Document', [
                    { accessorKey: "type", header: "Document Type" },
                    { accessorKey: "date", header: "Upload Date" },
                    { accessorKey: "expiryDate", header: "Expiry Date" },
                    { accessorKey: "documentNumber", header: "Document Number" },
                  ])}
                </TabsContent>

                <TabsContent value="sheria">
                  {renderDocs('Sheria Document', [
                    { accessorKey: "type", header: "Document Type" },
                    { accessorKey: "date", header: "Upload Date" },
                    { accessorKey: "expiryDate", header: "Expiry Date" },
                    { accessorKey: "documentNumber", header: "Document Number" },
                  ])}
                </TabsContent>
              </Tabs>
            </TabsContent>
            <TabsContent value="director-docs">
            {renderCompanyDocs('Directors Document', [
                    { accessorKey: "type", header: "Document Type" },
                    { accessorKey: "date", header: "Upload Date" },
                    { accessorKey: "expiryDate", header: "Expiry Date" },
                    { accessorKey: "documentNumber", header: "Document Number" },
                  ])}
            </TabsContent>

            {/* Supplier Documents with Trading and Monthly subtabs */}
            <TabsContent value="supplier-docs">
              <Tabs defaultValue="trading-suppliers">
                <TabsList>
                  <TabsTrigger value="trading-suppliers">Trading Suppliers Documents</TabsTrigger>
                  <TabsTrigger value="monthly-service-vendors">Monthly Service Vendors Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="trading-suppliers">
                  {renderDocs('Trading Supplier Document', [
                    { accessorKey: "type", header: "Document Type" },
                    { accessorKey: "supplierName", header: "Supplier Name" },
                    { accessorKey: "date", header: "Upload Date" },
                    { accessorKey: "expiryDate", header: "Expiry Date" },
                  ])}
                </TabsContent>

                <TabsContent value="monthly-service-vendors">
                  {renderDocs('Monthly Service Document', [
                    { accessorKey: "type", header: "Document Type" },
                    { accessorKey: "vendorName", header: "Vendor Name" },
                    { accessorKey: "date", header: "Upload Date" },
                    { accessorKey: "expiryDate", header: "Expiry Date" },
                  ])}
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Fixed Assets Documents with subcategories */}
            <TabsContent value="asset-docs">
              <Tabs defaultValue="computer-equipment-docs">
                <TabsList>
                  <TabsTrigger value="computer-equipment-docs">Computer & Equipment</TabsTrigger>
                  <TabsTrigger value="furniture-fitting-docs">Furniture & Fitting</TabsTrigger>
                  <TabsTrigger value="land-building-docs">Land & Building</TabsTrigger>
                  <TabsTrigger value="plant-equipment-docs">Plant & Equipment</TabsTrigger>
                  <TabsTrigger value="motor-vehicles-docs">Motor Vehicles</TabsTrigger>
                </TabsList>

                {["computer-equipment", "furniture-fitting", "land-building", "plant-equipment", "motor-vehicles"].map((assetType) => (
                  <TabsContent key={`${assetType}-docs`} value={`${assetType}-docs`}>
                    {renderDocs (`${assetType.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')} Document`, [
                      { accessorKey: "type", header: "Document Type" },
                      { accessorKey: "assetName", header: "Asset Name" },
                      { accessorKey: "date", header: "Upload Date" },
                      { accessorKey: "expiryDate", header: "Expiry Date" },
                    ])}
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>

            {/* Standard document sections */}
            {[ "bank", "employee", "insurance", "deposit"].map((type) => (
              <TabsContent key={`${type}-docs`} value={`${type}-docs`}>
                {renderDocs(`${type.charAt(0).toUpperCase() + type.slice(1)} Document`, [
                  { accessorKey: "type", header: "Document Type" },
                  { accessorKey: "ownerName", header: `${type.charAt(0).toUpperCase() + type.slice(1)} Name` },
                  { accessorKey: "date", header: "Upload Date" },
                  { accessorKey: "expiryDate", header: "Expiry Date" },
                  { accessorKey: "documentNumber", header: "Document Number" },
                ])}
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}