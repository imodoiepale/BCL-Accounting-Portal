

/* eslint-disable react/no-unescaped-entities */
//@ts-nocheck

"use client";

import React, { useEffect, useState } from 'react';
import { flexRender, getCoreRowModel, getSortedRowModel, getFilteredRowModel, useReactTable,} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import * as XLSX from 'xlsx';
import { DirectorsList } from "@/components/component/DirectorsList";
import { SupplierList } from "@/components/component/SupplierList";
import { EmployeeList } from "@/components/component/Employees";
import { BankList } from "@/components/component/BankList";
import { InsurancePolicy } from "@/components/component/InsurancePolicy";
import { KYCDocumentsList } from "@/components/component/kycDocumentsList";
import { DirectorsDocumentsList } from "@/components/component/DirectorsDocumentsList";
import { supabase } from '@/lib/supabaseClient';
import DirectorsDocs from '../documents/new/directors';

interface AllProfilesProps {
  companies: Array<{
    id: number;
    company_name: string;
    company_type: string;
    registration_number: string;
    date_established: string;
    kra_pin_number: string;
    industry: string;
    employees: string;
    annual_revenue: string;
    fiscal_year: string;
    website: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    postal_code: string;
    country: string;
    userid: string;
  }>;
  users: Array<{
    id: number;
    username: string;
    userid: string;
    is_active: boolean;
  }>;
}

const companyInfoColumns = [
  { id: 'company_name', accessorKey: 'company_name', header: 'Company Name' },
  { id: 'company_type', accessorKey: 'company_type', header: 'Company Type' },
  { id: 'registration_number', accessorKey: 'registration_number', header: 'Registration Number' },
  { id: 'date_established', accessorKey: 'date_established', header: 'Date Established' },
  { id: 'kra_pin_number', accessorKey: 'kra_pin_number', header: 'KRA PIN' },
  { id: 'industry', accessorKey: 'industry', header: 'Industry' },
  { id: 'employees', accessorKey: 'employees', header: 'Employees' },
  { id: 'annual_revenue', accessorKey: 'annual_revenue', header: 'Annual Revenue' },
  { id: 'fiscal_year', accessorKey: 'fiscal_year', header: 'Fiscal Year' },
  { id: 'email', accessorKey: 'email', header: 'Email' },
  { id: 'phone', accessorKey: 'phone', header: 'Phone' },
  { id: 'city', accessorKey: 'city', header: 'City' },
  { id: 'country', accessorKey: 'country', header: 'Country' }
];

const depositsColumns = [
  { id: 'deposit_name', accessorKey: 'deposit_name', header: 'Deposit Name' },
  { id: 'deposit_type', accessorKey: 'deposit_type', header: 'Type' },
  { id: 'amount', accessorKey: 'amount', header: 'Amount' },
  { id: 'date_paid', accessorKey: 'date_paid', header: 'Date Paid' },
  { id: 'expiry_date', accessorKey: 'expiry_date', header: 'Expiry Date' },
  { id: 'status', accessorKey: 'status', header: 'Status' },
  { id: 'reference_number', accessorKey: 'reference_number', header: 'Reference Number' },
  { id: 'description', accessorKey: 'description', header: 'Description' }
];


export default function AllProfiles() {
  const [activeMainTab, setActiveMainTab] = useState("company-info");
  const [activeSubTab, setActiveSubTab] = useState("company-info-tab");

  const handleExport = (data, title) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, `${title}.xlsx`);
  };

  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: companiesData } = await supabase
        .from('acc_portal_company')
        .select('*');

      const { data: usersData } = await supabase
        .from('acc_portal_clerk_users')
        .select('*');

      if (companiesData && usersData) {
        setCompanies(companiesData);
        setUsers(usersData);
      }
    };

    fetchData();
  }, []);

const DataTable = ({ columns, data, onExport, title }) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});


  
  const transformedData = data.map(company => {
    const user = users.find(u => u.userid === company.userid);
    return {
      ...company,
      username: user?.username || 'N/A',
      status: user?.is_active ? 'Active' : 'Inactive'
    };
  });

  
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

      // Get the name column for filtering
      const nameColumn = table.getColumn("company_name");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter table..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            nameColumn?.setFilterValue(event.target.value)
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
              <DataTable 
                columns={companyInfoColumns}
                data={companies}
                onExport={handleExport}
                title="Companies"
              />
            </TabsContent>

            <TabsContent value="directors-info">
              {companies.map(company => (
                <DirectorsList key={company.id} selectedUserId={company.userid} />
              ))}
            </TabsContent>

            <TabsContent value="suppliers-info">
              <Tabs defaultValue="trading-suppliers">
                <TabsList>
                  <TabsTrigger value="trading-suppliers">Trading Suppliers</TabsTrigger>
                  <TabsTrigger value="monthly-service-vendors">Monthly Service Vendors</TabsTrigger>
                </TabsList>
                
                <TabsContent value="trading-suppliers">
                  {companies.map(company => (
                    <SupplierList key={company.id} type="trading" selectedUserId={company.userid} />
                  ))}
                </TabsContent>
                
                <TabsContent value="monthly-service-vendors">
                  {companies.map(company => (
                    <SupplierList key={company.id} type="monthly" selectedUserId={company.userid} />
                  ))}
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="banks-info">
              {companies.map(company => (
                <BankList key={company.id} selectedUserId={company.userid} />
              ))}
            </TabsContent>

            <TabsContent value="employee-info">
              {companies.map(company => (
                <EmployeeList key={company.id} selectedUserId={company.userid} />
              ))}
            </TabsContent>

            <TabsContent value="insurances-info">
              {companies.map(company => (
                <InsurancePolicy key={company.id} selectedUserId={company.userid} />
              ))}
            </TabsContent>

            <TabsContent value="deposits-info">
              <DataTable 
                columns={depositsColumns}
                data={companies}
                onExport={handleExport}
                title="Deposits"
              />
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

                {/* {["computer-equipment", "furniture-fitting", "land-building", "plant-equipment", "motor-vehicles"].map((assetType) => (
                  <TabsContent key={assetType} value={assetType}>
                    {companies.map(company => (
                      <DataTable
                        key={company.id}
                        // columns={assetsColumns}
                        // data={getAssetsByType(company, assetType)}
                        title={`${company.company_name} - ${assetType}`}
                      />
                    ))}
                  </TabsContent>
                ))} */}
              </Tabs>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="kyc-docs">
          <Tabs defaultValue="company-docs">
            <TabsList>
              <TabsTrigger value="company-docs">Company Documents</TabsTrigger>
              <TabsTrigger value="director-docs">Director Documents</TabsTrigger>
              <TabsTrigger value="supplier-docs">Supplier Documents</TabsTrigger>
              <TabsTrigger value="bank-docs">Bank Documents</TabsTrigger>
              <TabsTrigger value="employee-docs">Employee Documents</TabsTrigger>
              <TabsTrigger value="insurance-docs">Insurance Documents</TabsTrigger>
            </TabsList>

            {companies.map(company => (
              <div key={company.id}>
                <TabsContent value="company-docs">
                  <KYCDocumentsList category="company-docs" selectedUserId={company.userid} />
                </TabsContent>
                <TabsContent value="director-docs">
                  {/* <DirectorsDocumentsList selectedUserId={company.userid} /> */}
<DirectorsDocs/>
                </TabsContent>
                <TabsContent value="supplier-docs">
                  <KYCDocumentsList category="suppliers-docs" selectedUserId={company.userid} />
                </TabsContent>
                <TabsContent value="bank-docs">
                  <KYCDocumentsList category="banks-docs" selectedUserId={company.userid} />
                </TabsContent>
                <TabsContent value="employee-docs">
                  <KYCDocumentsList category="employees-docs" selectedUserId={company.userid} />
                </TabsContent>
                <TabsContent value="insurance-docs">
                  <KYCDocumentsList category="insurance-docs" selectedUserId={company.userid} />
                </TabsContent>
              </div>
            ))}
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}