    // @ts-nocheck
    import React, { useMemo } from 'react';
    import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
    import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
    import { ScrollArea } from "@/components/ui/scroll-area";
    import { AlertCircle } from 'lucide-react';

    const ProfileTab = ({ company }) => {
      const fields = useMemo(() => [
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
      ], []);

      const missingCellCount = useMemo(() => {
        return fields.filter(field => !company?.[field.key]).length;
      }, [company, fields]);

      return (
        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 py-4">
            <h2 className="text-2xl font-bold text-gray-800">Company Profile</h2>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-200px)] rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="w-1/3 font-semibold text-gray-700">Field</TableHead>
                    <TableHead className="font-semibold text-gray-700">Value</TableHead>
                  </TableRow>
                  <TableRow className="bg-amber-50">
                    <TableHead colSpan={2} className="text-amber-600">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        <span className="text-sm font-medium">Missing Fields: {missingCellCount}</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <TableCell className="font-medium text-gray-600">{field.label}</TableCell>
                      <TableCell className="text-gray-800">
                        {company?.[field.key] || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      );
    };

    export default ProfileTab;