//@ts-nocheck
"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from '@/lib/supabaseClient';
import { Toaster, toast } from 'react-hot-toast';
import { Check, Search, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

export function RegistryPage() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [activeTab, setActiveTab] = useState("suppliers");
  const [tabData, setTabData] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tableSortColumn, setTableSortColumn] = useState('');
  const [tableSortOrder, setTableSortOrder] = useState('asc');

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchTabData();
    }
  }, [selectedCompany, activeTab]);

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('acc_portal_company')
      .select('*');
    if (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to fetch companies');
    } else {
      setCompanies(data);
    }
  };

  const fetchTabData = async () => {
    const tableName = getTableName(activeTab);
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('userid', selectedCompany.userid);
    if (error) {
      console.error(`Error fetching ${activeTab}:`, error);
      toast.error(`Failed to fetch ${activeTab}`);
    } else {
      setTabData(data);
    }
  };

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleVerify = (item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleTableSort = (column) => {
    if (tableSortColumn === column) {
      setTableSortOrder(tableSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortColumn(column);
      setTableSortOrder('asc');
    }
  };

  const filteredCompanies = companies
    .filter(company => company.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.company_name.localeCompare(b.company_name);
      } else {
        return b.company_name.localeCompare(a.company_name);
      }
    });

  const getDisplayColumns = () => {
    switch (activeTab) {
      case 'suppliers': return ['name', 'pin', 'contact_name', 'contact_email'];
      case 'banks': return ['name', 'account_number', 'currency', 'branch'];
      case 'employees': return ['name', 'id_number', 'email', 'mobile'];
      case 'directors': return ['full_name', 'first_name', 'last_name'];
      default: return [];
    }
  };

  const sortedTabData = useMemo(() => {
    if (!tableSortColumn) return tabData;
    return [...tabData].sort((a, b) => {
      if (a[tableSortColumn] < b[tableSortColumn]) return tableSortOrder === 'asc' ? -1 : 1;
      if (a[tableSortColumn] > b[tableSortColumn]) return tableSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tabData, tableSortColumn, tableSortOrder]);

  const pendingCount = tabData.filter(item => !item.verified).length;
  const completedCount = tabData.filter(item => item.verified).length;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 bg-gray-100">
      <Toaster position="top-right" />
      <Card className="lg:w-1/5 bg-white shadow"> 
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8 border-gray-300 focus:border-blue-500"
            />
          </div>
          <Button onClick={handleSort} className="mt-2 bg-blue-500 hover:bg-blue-600 text-white">
            Sort {sortOrder === "asc" ? <ArrowUpDown className="ml-2" /> : <ArrowUpDown className="ml-2" />}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredCompanies.map((company) => (
              <Button
                key={company.id}
                variant={selectedCompany?.id === company.id ? "default" : "outline"}
                onClick={() => handleCompanySelect(company)}
                className="w-full justify-start bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                {company.company_name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:w-3/4 bg-white shadow">
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-700">{selectedCompany?.company_name || "Select a company"}</h2>
        </CardHeader>
        <CardContent>
          {selectedCompany && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 bg-gray-100">
                <TabsTrigger value="suppliers" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Suppliers</TabsTrigger>
                <TabsTrigger value="banks" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Banks</TabsTrigger>
                <TabsTrigger value="employees" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Employees</TabsTrigger>
                <TabsTrigger value="directors" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Directors</TabsTrigger>
              </TabsList>

              <div className="mb-4 flex justify-between items-center bg-gray-100 p-2 rounded">
                <span className="text-red-500">Pending: {pendingCount}</span>
                <span className="text-green-500">Completed: {completedCount}</span>
              </div>

              <TabsContent value={activeTab}>
                <TableContent
                  data={sortedTabData}
                  columns={getDisplayColumns()}
                  onVerify={handleVerify}
                  onSort={handleTableSort}
                  sortColumn={tableSortColumn}
                  sortOrder={tableSortOrder}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <VerifyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        onVerify={async () => {
          try {
            const { data, error } = await supabase
              .from(getTableName(activeTab))
              .update({ verified: true })
              .eq('id', selectedItem.id);

            if (error) throw error;

            toast.success('Information verified successfully!');
            setDialogOpen(false);
            fetchTabData(); // Refresh the data
          } catch (error) {
            console.error('Error verifying information:', error);
            toast.error('Failed to verify information');
          }
        }}
      />
    </div>
  );
}

function TableContent({ data, columns, onVerify, onSort, sortColumn, sortOrder }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column} className="text-gray-700 cursor-pointer" onClick={() => onSort(column)}>
              {column.replace('_', ' ').toUpperCase()}
              {sortColumn === column && (
                sortOrder === 'asc' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />
              )}
            </TableHead>
          ))}
          <TableHead className="text-gray-700">ACTION</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            {columns.map((column) => (
              <TableCell key={column}>{item[column]}</TableCell>
            ))}
            <TableCell>
              {item.verified ? (
                <span className="text-green-500 flex items-center">
                  <Check className="mr-1" /> Verified
                </span>
              ) : (
                <Button onClick={() => onVerify(item)} className="bg-blue-500 hover:bg-blue-600 text-white">
                  Verify
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function VerifyDialog({ open, onOpenChange, item, onVerify }) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-700">Verify Information</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-4 py-4">
          {Object.entries(item).map(([key, value]) => (
            key !== 'id' && key !== 'verified' && (
              <div key={key} className="flex items-center gap-2 bg-gray-100 p-2 rounded-md">
                <span className="font-medium text-gray-700">{key.replace('_', ' ').toUpperCase()}:</span>
                <span>{value}</span>
              </div>
            )
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onVerify} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
            <Check className="mr-2" /> Verify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getTableName(activeTab) {
  switch (activeTab) {
    case 'suppliers': return 'acc_portal_suppliers';
    case 'banks': return 'acc_portal_banks';
    case 'employees': return 'acc_portal_employees';
    case 'directors': return 'acc_portal_directors';
    default: return '';
  }
}