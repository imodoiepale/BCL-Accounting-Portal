// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from "@/components/ui/card";
import Profile from '@/app/admin/registry/Profiles';
import AllProfiles from '@/app/admin/registry/AllProfiles';
import CompanySidebar from '@/app/admin/registry/CompanySidebar';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Record {
  id: string;
  [key: string]: any;
}

export default function DetailsTab({ selectedTab, tabStructure }: { selectedTab: string; tabStructure: any }) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'acc' | 'imm' | 'sheria' | 'audit' | null>(null);
  const [formData, setFormData] = useState<Record | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Company Registry specific states
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);

  const getTableAndFields = () => {
    if (!tabStructure || !tabStructure.sections) return { tableName: '', fields: [] };
    
    let tableName = '';
    const fields: any[] = [];
    
    tabStructure.sections.forEach((section: any) => {
      section.subsections?.forEach((subsection: any) => {
        if (subsection.tables && subsection.tables.length > 0) {
          tableName = subsection.tables[0];
        }
        if (subsection.fields) {
          fields.push(...subsection.fields);
        }
      });
    });

    return { tableName, fields };
  };

  const isCompanyRegistry = () => {
    // Check for both "Company Registry" and "company registry" to handle case sensitivity
    return selectedTab.toLowerCase() === 'company registry';
  };

  useEffect(() => {
    if (isCompanyRegistry()) {
      fetchCompanyData();
    } else {
      fetchRecords();
    }
  }, [selectedTab, filterType, tabStructure]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const { data: companiesData } = await supabase
        .from('acc_portal_company')
        .select('*')
        .order('company_name', { ascending: true });
      const { data: usersData } = await supabase
        .from('acc_portal_clerk_users')
        .select('*')
        .order('username', { ascending: true });
      
      setCompanies(companiesData || []);
      setUsers(usersData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching company data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { tableName, fields } = getTableAndFields();
      
      if (!tableName) {
        setError('No table found for this tab');
        return;
      }

      let query = supabase
        .from(tableName)
        .select('*');

      if (filterType) {
        query = query.eq('client_type', filterType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setRecords(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching records');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (data) => {
    if (Array.isArray(data)) {
      setCompanies(data);
      setShowAllCompanies(true);
    } else {
      setSelectedCompany(data);
      setShowAllCompanies(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : { [field]: value });
  };

  const handleSubmit = async () => {
    if (!formData) return;

    try {
      setLoading(true);
      const { tableName } = getTableAndFields();
      
      const { error: submitError } = await supabase
        .from(tableName)
        .upsert([formData]);

      if (submitError) throw submitError;
      
      setIsDialogOpen(false);
      if (isCompanyRegistry()) {
        fetchCompanyData();
      } else {
        fetchRecords();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving record');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading records...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (isCompanyRegistry()) {
    return (
      <div className="flex flex-col lg:flex-row p-6 bg-gray-100 min-h-screen">
        <CompanySidebar
          onCompanySelect={handleCompanySelect}
          showAllCompanies={showAllCompanies}
          onToggleView={() => setShowAllCompanies(!showAllCompanies)}
        />
        <Card className="lg:w-3/4 bg-white shadow-md">
          <CardContent>
            {showAllCompanies ? (
              <AllProfiles companies={companies} users={users} />
            ) : selectedCompany ? (
              <Profile company={selectedCompany} />
            ) : (
              <div className="text-center py-10 text-gray-500">
                Please select a company
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { fields } = getTableAndFields();

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center mb-4">
        <Select onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by client type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="acc">ACC Clients</SelectItem>
            <SelectItem value="imm">IMM Clients</SelectItem>
            <SelectItem value="sheria">Sheria Clients</SelectItem>
            <SelectItem value="audit">Audit Clients</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New Record</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add/Edit Record</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-4 p-4">
                {fields.map((field: any, fieldIndex: number) => (
                  <div key={`field-${field.name}-${fieldIndex}`} className="space-y-2">
                    <Label htmlFor={field.name}>{field.display || field.name}</Label>
                    {field.dropdownOptions ? (
                      <Select
                        value={formData?.[field.name] || ''}
                        onValueChange={(value) => handleInputChange(field.name, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field.display}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.dropdownOptions.map((option: string, optionIndex: number) => (
                            <SelectItem key={`option-${option}-${optionIndex}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={field.name}
                        value={formData?.[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.display || field.name}
                      />
                    )}
                  </div>
                ))}
                <Button onClick={handleSubmit} disabled={loading}>
                  Save
                </Button>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[600px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {fields.map((field: any, index: number) => (
                <TableHead key={`header-${field.name}-${index}`}>{field.display || field.name}</TableHead>
              ))}
              <TableHead key="header-actions">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record, recordIndex) => (
              <TableRow key={`row-${record.id}-${recordIndex}`}>
                {fields.map((field: any, fieldIndex: number) => (
                  <TableCell key={`cell-${record.id}-${field.name}-${fieldIndex}`}>
                    {record[field.name]}
                  </TableCell>
                ))}
                <TableCell key={`actions-${record.id}`}>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFormData(record);
                      setIsDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
