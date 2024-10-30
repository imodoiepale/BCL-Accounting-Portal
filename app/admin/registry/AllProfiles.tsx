

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

import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
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

const directorColumns = [
  // {
  //   accessorKey: "company_name",
  //   header: "Company Name",
  //   cell: ({ row }) => row.original.acc_portal_company.company_name,
  // },
  { accessorKey: "company_name", header: "Company Name" },
  {
    accessorKey: "full_name",
    header: "Director Name",
  },
  {
    accessorKey: "job_position",
    header: "Position",
  },
  {
    accessorKey: "mobile_number",
    header: "Phone",
  },
  {
    accessorKey: "email_address",
    header: "Email",
  },
  {
    accessorKey: "id_number",
    header: "ID Number",
  },
  {
    accessorKey: "shares_held",
    header: "Shares Held",
  },
  {
    accessorKey: "nationality",
    header: "Nationality",
  }
];

const bankColumns = [
  { id: 'company_name', header: 'Company Name' },
  { id: 'name', header: 'Bank Name' },
  { id: 'account_number', header: 'Account Number' },
  { id: 'branch', header: 'Branch' },
  { id: 'currency', header: 'Currency' }
];

export default function AllProfiles() {
  const [activeMainTab, setActiveMainTab] = useState("company-info");
  const [activeSubTab, setActiveSubTab] = useState("company-info-tab");
  const [companies, setCompanies] = useState([]);
  const [directors, setDirectors] = useState([]); // Add this state
  const [banks, setBanks] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [insurance, setInsurance] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
const pathname = usePathname();

  const handleExport = (data, title) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, `${title}.xlsx`);
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch all data in parallel with proper joins
        const [
          { data: companiesData },
          { data: suppliersData },
          { data: directorsData },
          { data: employeesData },
          { data: banksData }
        ] = await Promise.all([
          supabase
            .from('acc_portal_company')
            .select('*'),
          supabase
            .from('acc_portal_pettycash_suppliers')
            .select(`
              *,
              acc_portal_company!inner(
                company_name
              )
            `)
            .eq('acc_portal_pettycash_suppliers.userid', 'acc_portal_company.userid'),
          supabase
            .from('acc_portal_directors')
            .select(`
              *,
              acc_portal_company!inner(
                company_name
              )
            `),
          supabase
            .from('acc_portal_employees')
            .select(`
              *,
              acc_portal_company!inner(
                company_name
              )
            `),
          supabase
            .from('acc_portal_banks')
            .select(`
              *,
              acc_portal_company!inner(
                company_name
              )
            `)
        ]);
    
        // Create company name mapping
        const companyMapping = companiesData?.reduce((acc, company) => {
          acc[company.userid] = company.company_name;
          return acc;
        }, {});
    
        // Transform suppliers data
        const transformedSuppliers = suppliersData?.map(supplier => ({
          id: supplier.id,
          company_name: companyMapping[supplier.userid],
          supplierName: supplier.data.supplierName,
          pin: supplier.data.pin,
          email: supplier.data.email,
          mobile: supplier.data.mobile,
          idNumber: supplier.data.idNumber,
          supplierType: supplier.data.supplierType,
          tradingType: supplier.data.tradingType,
          created_at: supplier.created_at,
          updated_at: supplier.updated_at
        }));
    
        // Transform directors data
        const transformedDirectors = directorsData?.map(director => ({
          ...director,
          company_name: companyMapping[director.userid]
        }));
    
        // Transform employees data
        const transformedEmployees = employeesData?.map(employee => ({
          ...employee,
          company_name: companyMapping[employee.userid]
        }));
    
        // Transform banks data
        const transformedBanks = banksData?.map(bank => ({
          ...bank,
          company_name: companyMapping[bank.userid]
        }));
    
        // Set all transformed data to state
        setCompanies(companiesData || []);
        setSuppliers(transformedSuppliers || []);
        setDirectors(transformedDirectors || []);
        setEmployees(transformedEmployees || []);
        setBanks(transformedBanks || []);
    
        console.log('Transformed Suppliers:', transformedSuppliers);
        console.log('Transformed Directors:', transformedDirectors);
        console.log('Transformed Employees:', transformedEmployees);
        console.log('Transformed Banks:', transformedBanks);
    
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchAllData();
  }, []);
  
  const DataTable = ({ columns, data, onExport, title }) => {
    const [sorting, setSorting] = useState([]);    const [columnFilters, setColumnFilters] = useState([]);
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
            placeholder="Filter companies..."
            value={(table.getColumn("company_name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("company_name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Button 
            onClick={() => onExport(data, title)} 
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };
  

const CompanySeparator = ({ companyName }) => (
  <div className="py-2 px-4 bg-gray-100 border-l-4 border-blue-500 my-4">
    <h3 className="font-semibold text-gray-700">{companyName}</h3>
  </div>
);

const GroupedTable = ({ data, columns }) => {
  // Group data by company
  const groupedData = data.reduce((acc, item) => {
    const companyName = item.company_name;
    if (!acc[companyName]) {
      acc[companyName] = [];
    }
    acc[companyName].push(item);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(groupedData).map(([companyName, items]) => (
        <div key={companyName} className="mb-8">
          <div className="bg-blue-50 p-4 mb-4 border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold">{companyName}</h2>
          </div>
          <DataTable
            columns={columns}
            data={items}
          />
        </div>
      ))}
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
    title="Companies"
  />
</TabsContent>

<TabsContent value="directors-info">
  <DataTable 
    columns={directorColumns}
    data={directors}
    title="Directors"
  />
</TabsContent>
<TabsContent value="banks-info">
  <DataTable 
    columns={bankColumns.map(col => ({
      accessorKey: col.id,
      header: col.header,
    }))}
    data={banks}
    title="Banks"
  />
</TabsContent>
<TabsContent value="suppliers-info">
  <Tabs defaultValue="trading">
    <TabsList>
      <TabsTrigger value="trading">Trading Suppliers</TabsTrigger>
      <TabsTrigger value="monthly">Monthly Service Vendors</TabsTrigger>
    </TabsList>
    <TabsContent value="trading">
      <DataTable
        columns={[
          { accessorKey: "company_name", header: "Company Name" },
          { accessorKey: "supplierName", header: "Supplier Name" },
          { accessorKey: "pin", header: "PIN" },
          { accessorKey: "idNumber", header: "ID Number" },
          { accessorKey: "email", header: "Email" },
          { accessorKey: "mobile", header: "Phone" },
          { accessorKey: "supplierType", header: "Type" },
          { accessorKey: "tradingType", header: "Trading Type" }
        ]}
        data={suppliers.filter(s => s.tradingType === "Purchase Only")}
        title="Trading Suppliers"
      />
    </TabsContent>
    <TabsContent value="monthly">
      <DataTable
        columns={[
          { accessorKey: "company_name", header: "Company Name" },
          { accessorKey: "supplierName", header: "Supplier Name" },
          { accessorKey: "pin", header: "PIN" },
          { accessorKey: "idNumber", header: "ID Number" },
          { accessorKey: "email", header: "Email" },
          { accessorKey: "mobile", header: "Phone" },
          { accessorKey: "supplierType", header: "Type" },
          { accessorKey: "tradingType", header: "Trading Type" }
        ]}
        data={suppliers.filter(s => s.tradingType !== "Purchase Only")}
        title="Monthly Service Vendors"
      />
    </TabsContent>
  </Tabs>
</TabsContent>

<TabsContent value="employee-info">
  <DataTable 
    columns={[
      { accessorKey: "company_name", header: "Company Name" },
      { accessorKey: "name", header: "Employee Name" },
      { accessorKey: "id_number", header: "ID Number" },
      { accessorKey: "kra_pin", header: "KRA PIN" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "mobile", header: "Phone" },
      { accessorKey: "nhif", header: "NHIF" },
      { accessorKey: "nssf", header: "NSSF" },
      { accessorKey: "startdate", header: "Start Date" },
      { accessorKey: "status", header: "Status", 
        cell: ({ row }) => (
          <Badge variant={row.original.status ? "success" : "secondary"}>
            {row.original.status ? "Active" : "Inactive"}
          </Badge>
        ),      }
    ]}
    data={employees}
    title="Employees"
  />
</TabsContent>

<TabsContent value="insurance-info">
  <GroupedTable 
    columns={[
      { accessorKey: "policy_number", header: "Policy Number" },
      { accessorKey: "type", header: "Type" },
      { accessorKey: "provider", header: "Provider" },
      { accessorKey: "start_date", header: "Start Date" },
      { accessorKey: "end_date", header: "End Date" },
      { accessorKey: "status", header: "Status" }
    ]}
    data={insurance}
    title="Insurance Policies"
  />
</TabsContent>

<TabsContent value="fixed-assets-info">
  <Tabs defaultValue="computer">
    <TabsList>
      <TabsTrigger value="computer">Computer Equipment</TabsTrigger>
      <TabsTrigger value="furniture">Furniture</TabsTrigger>
      <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
    </TabsList>
    {["computer", "furniture", "vehicles"].map(assetType => (
      <TabsContent key={assetType} value={assetType}>
        <GroupedTable 
          columns={[
            { accessorKey: "asset_name", header: "Asset Name" },
            { accessorKey: "purchase_date", header: "Purchase Date" },
            { accessorKey: "cost", header: "Cost" },
            { accessorKey: "depreciation", header: "Depreciation" },
            { accessorKey: "current_value", header: "Current Value" }
          ]}
          data={assets.filter(a => a.type === assetType)}
          title={`${assetType.charAt(0).toUpperCase() + assetType.slice(1)} Assets`}
        />
      </TabsContent>
    ))}
  </Tabs>
</TabsContent>
   <TabsContent value="deposits-info">
              <DataTable 
                columns={depositsColumns}
                data={companies}
                onExport={handleExport}
                title="Deposits"
              />
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