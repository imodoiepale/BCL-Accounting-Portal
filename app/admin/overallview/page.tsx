// @ts-nocheck
"use client";

import React, { useEffect, useState } from 'react';
import { formFields } from '../onboarding/formfields';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function OverallView() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: companiesData } = await supabase
        .from('acc_portal_company')
        .select('*');
      setCompanies(companiesData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getFieldCompletion = (company) => {
    const fields = formFields.companyDetails;
    const completedFields = fields.filter(field => 
      company[field.name] !== null && 
      company[field.name] !== ''
    );
    return {
      total: fields.length,
      completed: completedFields.length,
      pending: fields.length - completedFields.length
    };
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Company Profiles Overview</h1>
      <Table>
        <TableHeader>
          <TableRow className="bg-blue-500">
            <TableHead className="text-white">#</TableHead>
            <TableHead className="text-white">Company Name</TableHead>
            <TableHead className="text-white">Completion Status</TableHead>
            {formFields.companyDetails.map(field => (
              <TableHead key={field.name} className="text-white">
                {field.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company, index) => {
            const completion = getFieldCompletion(company);
            return (
              <TableRow key={company.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{company.company_name}</TableCell>
                <TableCell>
                  <div className="flex gap-2 text-sm font-medium">
                    <Badge variant="default" className="bg-blue-100 text-blue-600">
                      T: {completion.total}
                    </Badge>
                    <Badge variant="default" className="bg-green-100 text-green-600">
                      C: {completion.completed}
                    </Badge>
                    <Badge variant="default" className="bg-red-100 text-red-600">
                      P: {completion.pending}
                    </Badge>
                  </div>
                </TableCell>
                {formFields.companyDetails.map(field => (
                  <TableCell key={field.name}>
                    <span className={company[field.name] ? 'text-black' : 'text-red-600'}>
                      {company[field.name] || 'N/A'}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
