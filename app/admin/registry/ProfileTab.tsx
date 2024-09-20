

// @ts-nocheck
import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const ProfileTab = ({ company }) => {
  const fields = [
    { key: 'company_name', label: 'Company Name' },
    { key: 'company_type', label: 'Company Type' },
    { key: 'description', label: 'Description' },
    { key: 'registration_number', label: 'Registration Number' },
    { key: 'date_established', label: 'Date Established' },
    { key: 'kra_pin_number', label: 'KRA PIN Number' },
    { key: 'industry', label: 'Industry' },
    { key: 'employees', label: 'Employees' },
    { key: 'annual_revenue', label: 'Annual Revenue' },
    { key: 'fiscal_year', label: 'Fiscal Year' },
    { key: 'website', label: 'Website' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'street', label: 'Street' },
    { key: 'city', label: 'City' },
    { key: 'postal_code', label: 'Postal Code' },
    { key: 'country', label: 'Country' },
  ];

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold text-gray-700">Company Profile</h2>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Field</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.key}>
                <TableCell className="font-medium">{field.label}</TableCell>
                <TableCell>{company?.[field.key] || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ProfileTab;