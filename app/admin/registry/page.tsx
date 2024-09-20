//@ts-nocheck
"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from '@/lib/supabaseClient';
import { Toaster, toast } from 'react-hot-toast';
import { Check, Search, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

const Page = () => {
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
  const [supplierSubTab, setSupplierSubTab] = useState("all");

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

  const filteredTabData = useMemo(() => {
    let filtered = sortedTabData;
    if (activeTab === 'suppliers') {
      switch (supplierSubTab) {
        case 'trading':
          filtered = filtered.filter(item => item.category === 'trading');
          break;
        case 'monthly':
          filtered = filtered.filter(item => item.category === 'monthly');
          break;
        // 'all' case doesn't need filtering
      }
    }
    return filtered;
  }, [sortedTabData, activeTab, supplierSubTab]);

  const pendingCount = filteredTabData.filter(item => !item.verified).length;
  const completedCount = filteredTabData.filter(item => item.verified).length;

  const renderSupplierSubTabs = () => (
    <Tabs value={supplierSubTab} onValueChange={setSupplierSubTab} className="mt-4">
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="trading">Trading Suppliers</TabsTrigger>
        <TabsTrigger value="monthly">Monthly Service Vendors</TabsTrigger>
      </TabsList>
    </Tabs>
  );

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

              {activeTab === 'suppliers' && renderSupplierSubTabs()}

              <div className="mb-4 flex justify-between items-center bg-gray-100 p-2 rounded">
                <span className="text-red-500">Pending: {pendingCount}</span>
                <span className="text-green-500">Verified: {completedCount}</span>
              </div>

              <TabsContent value={activeTab}>
                <TableContent
                  data={filteredTabData}
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
  const tableRef = useRef(null);
  const headerRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const tableElement = tableRef.current;
    const headerElement = headerRef.current;

    if (tableElement && headerElement) {
      const handleScroll = () => {
        const { scrollTop } = tableElement;
        headerElement.style.transform = `translateY(${scrollTop}px)`;
      };

      tableElement.addEventListener('scroll', handleScroll);
      return () => tableElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item =>
      columns.some(column =>
        item[column]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, columns, searchTerm]);

  return (
    <div>
      <div className="mb-4">
        <Input
          placeholder="Search table..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div ref={tableRef} className="overflow-auto max-h-[calc(100vh-400px)] relative">
        <Table>
          <TableHeader ref={headerRef} className="sticky top-0 z-10 bg-white">
            <TableRow>
              <TableHead className="text-gray-700 font-bold">INDEX</TableHead>
              {columns.map((column) => (
                <TableHead 
                  key={column} 
                  className="text-gray-700 font-bold cursor-pointer" 
                  onClick={() => onSort(column)}
                >
                  {column.replace('_', ' ').toUpperCase()}
                  {sortColumn === column && (
                    sortOrder === 'asc' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />
                  )}
                </TableHead>
              ))}
              <TableHead className="text-gray-700 font-bold">ACTION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item, index) => (
              <TableRow key={item.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{index + 1}</TableCell>
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
      </div>
    </div>
  );
}

function VerifyDialog({ open, onOpenChange, item, onVerify }) {
  if (!item) return null;

  const displayFields = [
    'name', 'pin', 'contact_name', 'contact_mobile', 'contact_email',
    'status', 'contact_info', 'startdate', 'enddate', 'category'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-600 mb-4">{item.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {displayFields.map((field) => (
            <div key={field} className="bg-gray-100 p-3 rounded-lg shadow">
              <h3 className="font-semibold text-gray-700 mb-1">{field.replace('_', ' ').toUpperCase()}</h3>
              <p className="text-gray-800">{item[field] || 'N/A'}</p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onVerify} className="w-full bg-green-500 hover:bg-green-600 text-white text-lg py-3">
            <Check className="mr-2" /> Verify Information
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

export default Page;