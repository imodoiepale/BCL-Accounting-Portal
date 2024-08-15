

/* eslint-disable react/no-unescaped-entities */
//@ts-nocheck

"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { useEffect, useState } from 'react';

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BankList } from "@/components/component/BankList";
import { DirectorsList } from "@/components/component/DirectorsList";
import { CompanyInfoTab } from "@/components/component/companyInfo";
import { EmployeeList } from "@/components/component/Employees";
import { SupplierList } from "@/components/component/SupplierList";
import { KYCDocumentsList } from "@/components/component/kycDocumentsList";
import { InsurancePolicy } from "@/components/component/InsurancePolicy";
import { DirectorsDocumentsList } from "@/components/component/DirectorsDocumentsList";
import { useRouter } from 'next/navigation';


const DataTable = ({ columns, data }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
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
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter names..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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

const generateMockData = (prefix, count) =>
  Array.from({ length: count }, (_, i) => ({
    name: `${prefix}${i + 1}`,
    details: `Details for ${prefix}${i + 1}`,
  }));

export default function Profile() {

  const router = useRouter();
  const [activeTab, setActiveTab] = useState("company-info");

  const bankData = generateMockData('Bank', 5);
  const directorData = generateMockData('Director', 3);
  const employeeData = generateMockData('Employee', 10);
  const supplierData = generateMockData('Supplier', 7);
  const insuranceData = generateMockData('Insurance', 4);
  const depositData = generateMockData('Deposit', 6);
  const kycData = generateMockData('KYC Document', 5);

  useEffect(() => {
    // This effect will run when the component mounts and whenever router.query changes
    if (router.isReady) {
      const { tab } = router.query;
      if (tab) {
        setActiveTab(tab as string);
      }
    }
  }, [router.isReady, router.query]);

  const columns: ColumnDef[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "details",
      header: "Details",
    },
  ];

  return (
    <div className="p-4 w-full">
      <h1 className="text-xl font-bold mb-4">Company Profile</h1>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)}>
        <TabsList>
          <TabsTrigger value="company-info">Company Info</TabsTrigger>
          <TabsTrigger value="kyc-docs">KYC Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="company-info" className="px2">
          <Tabs defaultValue="company-info-tab">
            <TabsList>
              <TabsTrigger value="company-info-tab">Company's Information</TabsTrigger>
              <TabsTrigger value="directors-info">Directors' Information</TabsTrigger>
              <TabsTrigger value="suppliers-info">Suppliers' Information</TabsTrigger>
              <TabsTrigger value="banks-info">Banks' Information</TabsTrigger>
              <TabsTrigger value="employee-info">Employees' Information</TabsTrigger>
              <TabsTrigger value="insurances-info">Insurance Policy Information</TabsTrigger>
              <TabsTrigger value="deposits-info">Deposits' Information</TabsTrigger>
              <TabsTrigger value="fixed-assets-info">Fixed Assets Register</TabsTrigger>
            </TabsList>
            <TabsContent value="company-info-tab">
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Company's Information</h3>
                <CompanyInfoTab />
              </div>
            </TabsContent>
            <TabsContent value="directors-info">
              <div className="space-y-4">
                <Tabs defaultValue="director-info">
                  <TabsList>
                    <TabsTrigger value="director-info">Directors' Information</TabsTrigger>
                    <TabsTrigger value="directors-kyc">Directors' KYC Documents</TabsTrigger>
                  </TabsList>
                  <TabsContent value="director-info">
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold">Directors' Information</h3>
                      <DirectorsList />
                    </div>
                  </TabsContent>
                  <TabsContent value="directors-kyc">
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold">Directors' KYC Documents</h3>
                      <DirectorsDocumentsList />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
            <TabsContent value="employee-info">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Employees' Information</h3>
                <h2 className="text-xl font-semibold mb-2">Employees</h2>
                <EmployeeList />
              </div>
            </TabsContent>
            <TabsContent value="suppliers-info">
              <div className="space-y-4">
                <Tabs defaultValue="trading-suppliers">
                  <TabsList>
                    <TabsTrigger value="trading-suppliers">Trading Suppliers - Information</TabsTrigger>
                    <TabsTrigger value="monthly-service-vendors">Monthly Service Vendors - Information</TabsTrigger>
                  </TabsList>
                  <TabsContent value="trading-suppliers">
                    <div className="space-y-4">
                      <h4 className="text-md font-medium">Trading Suppliers</h4>
                      <SupplierList />
                    </div>
                  </TabsContent>
                  <TabsContent value="monthly-service-vendors">
                    <div className="space-y-4">
                      <h4 className="text-md font-medium">Monthly Service Vendors</h4>
                      <h2 className="text-xl font-semibold mb-2">Suppliers</h2>
                      <SupplierList />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
            <TabsContent value="insurances-info">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Insurances' Information</h3>
                <InsurancePolicy />
              </div>
            </TabsContent>
            <TabsContent value="deposits-info">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Deposits' Information</h3>
                <DataTable columns={columns} data={depositData} />
              </div>
            </TabsContent>
            <TabsContent value="fixed-assets-info">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Fixed Assets Register</h3>
                <Tabs defaultValue="computer-equipment">
                  <TabsList>
                    <TabsTrigger value="computer-equipment">Computer & Equipments</TabsTrigger>
                    <TabsTrigger value="furniture-fitting">Furniture Fitting & Equip 12.5%</TabsTrigger>
                    <TabsTrigger value="land-building">Land & Building</TabsTrigger>
                    <TabsTrigger value="plant-equipment">Plant & Equipment - 12.5 %</TabsTrigger>
                    <TabsTrigger value="motor-vehicles">Motor Vehicles - 25 %</TabsTrigger>
                  </TabsList>
                  <TabsContent value="computer-equipment">
                    <div className="space-y-4">
                      <h4 className="text-md font-medium">Computer & Equipments</h4>
                      <DataTable columns={columns} data={generateMockData('Computer', 5)} />
                    </div>
                  </TabsContent>
                  <TabsContent value="furniture-fitting">
                    <div className="space-y-4">
                      <h4 className="text-md font-medium">Furniture Fitting & Equip 12.5%</h4>
                      <DataTable columns={columns} data={generateMockData('Furniture', 5)} />
                    </div>
                  </TabsContent>
                  <TabsContent value="land-building">
                    <div className="space-y-4">
                      <h4 className="text-md font-medium">Land & Building</h4>
                      <DataTable columns={columns} data={generateMockData('Property', 5)} />
                    </div>
                  </TabsContent>
                  <TabsContent value="plant-equipment">
                    <div className="space-y-4">
                      <h4 className="text-md font-medium">Plant & Equipment - 12.5 %</h4>
                      <DataTable columns={columns} data={generateMockData('Equipment', 5)} />
                    </div>
                  </TabsContent>
                  <TabsContent value="motor-vehicles">
                    <div className="space-y-4">
                      <h4 className="text-md font-medium">Motor Vehicles - 25 %</h4>
                      <DataTable columns={columns} data={generateMockData('Vehicle', 5)} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
            <TabsContent value="banks-info">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-2">Banks</h2>
                <BankList />
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="kyc-docs">
          <h2 className="text-xl font-semibold mb-2">KYC Documents</h2>
          <Tabs defaultValue="company-info-tab">
            <TabsList>
              <TabsTrigger value="company-info-tab">Company's Documents</TabsTrigger>
              <TabsTrigger value="directors-info">Directors' Documents</TabsTrigger>
              <TabsTrigger value="suppliers-info">Suppliers' Documents</TabsTrigger>
              <TabsTrigger value="banks-info">Banks' Documents</TabsTrigger>
              <TabsTrigger value="employee-info">Employees' Documents</TabsTrigger>
              <TabsTrigger value="insurances-info">Insurance Policy Documents</TabsTrigger>
              <TabsTrigger value="deposits-info">Deposits' Documents</TabsTrigger>
              <TabsTrigger value="fixed-assets-info">Fixed Assets Register</TabsTrigger>
            </TabsList>
            <TabsContent value="company-info-tab">
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Company's Documents</h3>
                <KYCDocumentsList category="company" />
              </div>
            </TabsContent>
            <TabsContent value="directors-info">
              <div className="space-y-4">
                <Tabs defaultValue="director-info">
                  <TabsList>
                    <TabsTrigger value="director-info">Directors' Documents</TabsTrigger>
                    <TabsTrigger value="directors-kyc">Directors' KYC Documents</TabsTrigger>
                  </TabsList>
                  <TabsContent value="director-info">
                    <div className="space-y-4">
                      <h3 className="text-xl ">Directors' Documents</h3>
                      <KYCDocumentsList />
                    </div>
                  </TabsContent>
                  <TabsContent value="directors-kyc">
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold">Directors' KYC Documents</h3>
                      <DirectorsDocumentsList />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
            <TabsContent value="employee-info">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Employees' Documents</h3>
                <KYCDocumentsList />
              </div>
            </TabsContent>
            <TabsContent value="suppliers-info">
              <div className="space-y-4">
                <Tabs defaultValue="trading-suppliers">
                  <TabsList>
                    <TabsTrigger value="trading-suppliers">Trading Suppliers - Documents</TabsTrigger>
                    <TabsTrigger value="monthly-service-vendors">Monthly Service Vendors - Documents</TabsTrigger>
                  </TabsList>
                  <TabsContent value="trading-suppliers">
                    <div className="space-y-4">
                      <h4 className="text-xl font-medium">Trading Suppliers Documents</h4>
                      <KYCDocumentsList />
                    </div>
                  </TabsContent>
                  <TabsContent value="monthly-service-vendors">
                    <div className="space-y-4">
                      <h2 className="text-xl font-medium">Monthly Service Vendors Documents</h2>
                      <KYCDocumentsList />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
            <TabsContent value="insurances-info">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Insurance Policy Documents</h3>
                <KYCDocumentsList category="insurance" />
              </div>
            </TabsContent>
            <TabsContent value="deposits-info">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Deposits' Documents</h3>
                <KYCDocumentsList category="deposits" />
              </div>
            </TabsContent>
            <TabsContent value="fixed-assets-info">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Fixed Assets Register</h3>
                <Tabs defaultValue="computer-equipment">
                  <TabsList>
                    <TabsTrigger value="computer-equipment">Computer & Equipments</TabsTrigger>
                    <TabsTrigger value="furniture-fitting">Furniture Fitting & Equip 12.5%</TabsTrigger>
                    <TabsTrigger value="land-building">Land & Building</TabsTrigger>
                    <TabsTrigger value="plant-equipment">Plant & Equipment - 12.5 %</TabsTrigger>
                    <TabsTrigger value="motor-vehicles">Motor Vehicles - 25 %</TabsTrigger>
                  </TabsList>
                  <TabsContent value="computer-equipment">
                    <div className="space-y-4">
                      <h4 className="text-md font-medium">Computer & Equipments</h4>
                      <KYCDocumentsList category="fixed-assets-computer" />
                    </div>
                  </TabsContent>
                  <TabsContent value="furniture-fitting">
                    <div className="space-y-4">
                      <h4 className="text-md font-medium">Furniture Fitting & Equip 12.5%</h4>
                      <KYCDocumentsList category="fixed-assets-furniture" />
                    </div>
                  </TabsContent>
                  <TabsContent value="land-building">
                    <div className="space-y-4">
                      <h4 className="text-md font-medium">Land & Building</h4>
                      <KYCDocumentsList category="fixed-assets-land" />
                    </div>
                  </TabsContent>
                  <TabsContent value="plant-equipment">
                    <div className="space-y-4">
                      <h4 className="text-md font-medium">Plant & Equipment - 12.5 %</h4>
                      <KYCDocumentsList category="fixed-assets-plant" />
                    </div>
                  </TabsContent>
                  <TabsContent value="motor-vehicles">
                    <div className="space-y-4">
                      <h4 className="text-md font-medium">Motor Vehicles - 25 %</h4>
                      <KYCDocumentsList category="fixed-assets-vehicles" />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
            <TabsContent value="banks-info">
              <div className="space-y-4">
                <h2 className="text-xl  mb-2">Bank Documents</h2>
                <KYCDocumentsList />
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

      </Tabs>
    </div>
  );
}

