// @ts-nocheck
"use client"

import React, { useState, useMemo } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Search, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const AllCompanies = ({ companies }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedCompanies = useMemo(() => {
    let sortableCompanies = [...companies];
    if (sortConfig.key) {
      sortableCompanies.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableCompanies;
  }, [companies, sortConfig]);

  const filteredCompanies = useMemo(() => {
    return sortedCompanies.filter(company =>
      Object.values(company).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedCompanies, searchTerm]);

  const SortableHeader = ({ children, sortKey }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-100 transition-colors duration-200" 
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center justify-between">
        {children}
        <span className="ml-2">
          {sortConfig.key === sortKey && (
            sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </div>
    </TableHead>
  );

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredCompanies);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Companies");
    
    // Generate a download link
    XLSX.writeFile(workbook, "companies_data.xlsx");
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">All Companies</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center bg-gray-100 rounded-md p-2 flex-grow mr-4">
            <Search className="mr-2 h-5 w-5 text-gray-500" />
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:ring-0 placeholder-gray-400 text-gray-800 flex-grow"
            />
          </div>
          <Button 
            onClick={exportToExcel} 
            className="bg-green-500 hover:bg-green-600 text-white flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>
      <div className="overflow-auto max-h-[calc(100vh-250px)] rounded-md border border-gray-200">
        <Table>
          <TableHeader className="bg-gray-50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="font-bold text-gray-700">Index</TableHead>
              <SortableHeader sortKey="company_name">Company Name</SortableHeader>
              <SortableHeader sortKey="company_type">Company Type</SortableHeader>
              <SortableHeader sortKey="registration_number">Registration Number</SortableHeader>
              <SortableHeader sortKey="date_established">Date Established</SortableHeader>
              <SortableHeader sortKey="kra_pin_number">KRA PIN</SortableHeader>
              <SortableHeader sortKey="industry">Industry</SortableHeader>
              <SortableHeader sortKey="employees">Employees</SortableHeader>
              <SortableHeader sortKey="annual_revenue">Annual Revenue</SortableHeader>
              <SortableHeader sortKey="fiscal_year">Fiscal Year</SortableHeader>
              <SortableHeader sortKey="website">Website</SortableHeader>
              <SortableHeader sortKey="email">Email</SortableHeader>
              <SortableHeader sortKey="phone">Phone</SortableHeader>
              <SortableHeader sortKey="street">Street</SortableHeader>
              <SortableHeader sortKey="city">City</SortableHeader>
              <SortableHeader sortKey="postal_code">Postal Code</SortableHeader>
              <SortableHeader sortKey="country">Country</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.map((company, index) => (
              <TableRow key={company.id} className="hover:bg-gray-50 transition-colors duration-200">
                <TableCell className="font-medium text-gray-900">{index + 1}</TableCell>
                <TableCell className="font-medium text-blue-600">{company.company_name}</TableCell>
                <TableCell>{company.company_type}</TableCell>
                <TableCell>{company.registration_number}</TableCell>
                <TableCell>{company.date_established}</TableCell>
                <TableCell>{company.kra_pin_number}</TableCell>
                <TableCell>{company.industry}</TableCell>
                <TableCell>{company.employees}</TableCell>
                <TableCell>{company.annual_revenue}</TableCell>
                <TableCell>{company.fiscal_year}</TableCell>
                <TableCell className="text-blue-500 hover:underline">
                  <a href={company.website} target="_blank" rel="noopener noreferrer">{company.website}</a>
                </TableCell>
                <TableCell className="text-blue-500 hover:underline">
                  <a href={`mailto:${company.email}`}>{company.email}</a>
                </TableCell>
                <TableCell>{company.phone}</TableCell>
                <TableCell>{company.street}</TableCell>
                <TableCell>{company.city}</TableCell>
                <TableCell>{company.postal_code}</TableCell>
                <TableCell>{company.country}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 text-gray-600 text-sm">
        Showing {filteredCompanies.length} of {companies.length} companies
      </div>
    </div>
  );
};

export default AllCompanies;