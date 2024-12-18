// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DirectorsList } from '@/components/component/DirectorsList';
import { EmployeeList } from '@/components/component/Employees';
import { SupplierList } from '@/components/component/SupplierList';
import { BankList } from '@/components/component/BankList';

const CompaniesTable = ({
  data,
  onRowClick,
  showAllColumns = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Define columns based on view type
  const columns = showAllColumns ? [
    { key: 'username', label: 'Company ID' },
    { key: 'company_name', label: 'Company Name' },
    { key: 'company_type', label: 'Company Type' },
    { key: 'registration_number', label: 'Registration Number' },
    { key: 'date_established', label: 'Date Established' },
    { key: 'kra_pin_number', label: 'KRA PIN' },
    { key: 'industry', label: 'Industry' },
    { key: 'employees', label: 'Employees' },
    { key: 'annual_revenue', label: 'Annual Revenue' },
    { key: 'fiscal_year', label: 'Fiscal Year' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    { key: 'country', label: 'Country' }
  ] : [
    { key: 'username', label: 'Company ID' },
    { key: 'company_name', label: 'Company Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' }
  ];

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;

        const aValue = a[sortConfig.key].toString().toLowerCase();
        const bValue = b[sortConfig.key].toString().toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const filteredData = useMemo(() => {
    return sortedData.filter(company =>
      Object.values(company).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedData, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Tabs defaultValue="company-info">
          <TabsList>
            <TabsTrigger value="company-info">Company Information</TabsTrigger>
            <TabsTrigger value="directors">Directors</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="banks">Banks</TabsTrigger>
          </TabsList>

          <TabsContent value="company-info">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort(column.key)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        {sortConfig.key === column.key && (
                          sortConfig.direction === 'ascending' ?
                            <ChevronUp className="h-4 w-4" /> :
                            <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((company, index) => (
                  <TableRow
                    key={company.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onRowClick?.(company)}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {company[column.key] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="directors">
            {data.map(company => (
              <div key={company.id} className="mb-8">
                <h3 className="text-lg font-semibold mb-4">{company.company_name}</h3>
                <DirectorsList selectedUserId={company.userid} />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="employees">
            {data.map(company => (
              <div key={company.id} className="mb-8">
                <h3 className="text-lg font-semibold mb-4">{company.company_name}</h3>
                <EmployeeList selectedUserId={company.userid} />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="suppliers">
            {data.map(company => (
              <div key={company.id} className="mb-8">
                <h3 className="text-lg font-semibold mb-4">{company.company_name}</h3>
                <Tabs defaultValue="trading">
                  <TabsList>
                    <TabsTrigger value="trading">Trading Suppliers</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly Service Vendors</TabsTrigger>
                  </TabsList>
                  <TabsContent value="trading">
                    <SupplierList type="trading" selectedUserId={company.userid} />
                  </TabsContent>
                  <TabsContent value="monthly">
                    <SupplierList type="monthly" selectedUserId={company.userid} />
                  </TabsContent>
                </Tabs>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="banks">
            {data.map(company => (
              <div key={company.id} className="mb-8">
                <h3 className="text-lg font-semibold mb-4">{company.company_name}</h3>
                <BankList selectedUserId={company.userid} />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default CompaniesTable;