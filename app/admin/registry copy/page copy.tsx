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
import { Check, Search, ArrowUpDown, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import * as XLSX from 'xlsx';
import ProfileTab from './ProfileTab';
import AllCompanies from './AllCompanies';
import Profile from './Profiles';
import AllProfiles from './AllProfiles';


const DataTable = ({ data, columns, onVerify, onSort, sortColumn, sortOrder, onExport, verifiedItems }) => {
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
      <div className="mb-4 flex justify-between items-center">
        <Input
          placeholder="Search table..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={onExport} className="bg-green-500 hover:bg-green-600 text-white">
          Export to Excel
        </Button>
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
                  {verifiedItems[item.id] || item.verified || item.verified ? (
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

const Page = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [activeTab, setActiveTab] = useState("profile");
  const [tabData, setTabData] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tableSortColumn, setTableSortColumn] = useState('');
  const [tableSortOrder, setTableSortOrder] = useState('asc');
  const [supplierSubTab, setSupplierSubTab] = useState("all");
  const [tabCounts, setTabCounts] = useState({
    suppliers: 0,
    banks: 0,
    employees: 0,
    directors: 0
  });
  const [companyProfile, setCompanyProfile] = useState(null);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [verifiedItems, setVerifiedItems] = useState({});

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      if (activeTab === 'profile') {
        fetchCompanyProfile();
      } else {
        fetchTabData();
      }
      fetchTabCounts();
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
      const newVerifiedItems = {};
      data.forEach(item => {
        if (item.verified || item.status) {
          newVerifiedItems[item.id] = true;
        }
      });
      setVerifiedItems(newVerifiedItems);
    }
  };

  const fetchTabCounts = async () => {
    if (!selectedCompany) return;

    const tables = ['acc_portal_suppliers', 'acc_portal_banks', 'acc_portal_employees', 'acc_portal_directors'];
    const newCounts = {};

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('userid', selectedCompany.userid);

      if (error) {
        console.error(`Error fetching count for ${table}:`, error);
      } else {
        newCounts[table.replace('acc_portal_', '')] = count;
      }
    }

    setTabCounts(newCounts);
  };

  const fetchCompanyProfile = async () => {
    const { data, error } = await supabase
      .from('acc_portal_company')
      .select('*')
      .eq('id', selectedCompany.id)
      .single();
    if (error) {
      console.error('Error fetching company profile:', error);
      toast.error('Failed to fetch company profile');
    } else {
      setCompanyProfile(data);
    }
  };

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setActiveTab('profile');
    setShowAllCompanies(false);
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

  const performVerification = async (item) => {
    const tableName = getTableName(activeTab);
    const { data, error } = await supabase
      .from(tableName)
      .update({ verified: true, verified: true })
      .eq('id', item.id);
  
    if (error) {
      console.error('Error verifying item:', error);
      toast.error('Failed to verify item');
    } else {
      setVerifiedItems(prev => ({ ...prev, [item.id]: true }));
      toast.success('Item verified successfully');
      fetchTabData(); // Refetch the data to update the table
    }
    setDialogOpen(false);
  };

  const handleTableSort = (column) => {
    if (tableSortColumn === column) {
      setTableSortOrder(tableSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortColumn(column);
      setTableSortOrder('asc');
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredTabData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `${selectedCompany.company_name}_${activeTab}.xlsx`);
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

  const pendingCount = filteredTabData.filter(item => !verifiedItems[item.id] && !item.verified).length;
  const completedCount = filteredTabData.filter(item => verifiedItems[item.id] || item.verified).length;

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
    <div className="flex flex-col lg:flex-row p-6 bg-gray-100">
      <Toaster position="top-right" />
      <Card className="lg:w-1/5 bg-white shadow">
        <CardHeader className="space-y-4">
          <Button 
            onClick={() => setShowAllCompanies(!showAllCompanies)} 
            className="w-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center"
          >
            {showAllCompanies ? <EyeOff className="mr-2" /> : <Eye className="mr-2" />}
            {showAllCompanies ? "Hide All Companies" : "View All Companies"}
          </Button>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8 border-gray-300 focus:border-blue-500"
            />
          </div>
          <Button onClick={handleSort} className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center">
            <ArrowUpDown className="mr-2" />
            Sort {sortOrder === "asc" ? "A-Z" : "Z-A"}
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
      {/* <Profile/> */}
      {/* <AllProfiles/> */}
      <Card className="lg:w-3/4 bg-white shadow">
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-700">
            {selectedCompany?.company_name || (showAllCompanies ? "All Companies" : "Select a company")}
          </h2>
        </CardHeader>
        <CardContent>
          {showAllCompanies ? (
            <AllCompanies companies={companies} />
          ) : selectedCompany ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 bg-gray-100">
                <TabsTrigger value="profile" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Profile
                </TabsTrigger>
                <TabsTrigger value="suppliers" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Suppliers ({tabCounts.suppliers})
                </TabsTrigger>
                <TabsTrigger value="banks" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Banks ({tabCounts.banks})
                </TabsTrigger>
                <TabsTrigger value="employees" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Employees ({tabCounts.employees})
                </TabsTrigger>
                <TabsTrigger value="directors" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Directors ({tabCounts.directors})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <ProfileTab company={companyProfile} />
              </TabsContent>

              {activeTab !== 'profile' && (
                <>
                  {activeTab === 'suppliers' && renderSupplierSubTabs()}

                  <div className="mb-4 flex justify-between items-center bg-gray-100 p-2 rounded">
                    <span className="text-red-500">Pending: {pendingCount}</span>
                    <span className="text-green-500">Verified: {completedCount}</span>
                  </div> 

                  <DataTable
                    data={filteredTabData}
                    columns={getDisplayColumns()}
                    onVerify={handleVerify}
                    onSort={handleTableSort}
                    sortColumn={tableSortColumn}
                    sortOrder={tableSortOrder}
                    onExport={handleExport}
                    verifiedItems={verifiedItems}
                  />
                </>
              )}
            </Tabs>
          ) : (
            <p>Please select a company or view all companies.</p>
          )}
        </CardContent>
      </Card>

      <VerifyDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        item={selectedItem} 
        onVerify={performVerification} 
      />
    </div>
  );
};

function VerifyDialog({ open, onOpenChange, item, onVerify }) {
  if (!item) return null;

  const displayFields = [
    'name', 'pin', 'contact_name', 'contact_mobile', 'contact_email',
    'verified', 'contact_info', 'startdate', 'enddate', 'category'
  ];

  const handleVerify = (e) => {
    e.preventDefault();
    onVerify(item);
    onOpenChange(false);
  };

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
          <Button onClick={handleVerify} className="w-full bg-green-500 hover:bg-green-600 text-white text-lg py-3">
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