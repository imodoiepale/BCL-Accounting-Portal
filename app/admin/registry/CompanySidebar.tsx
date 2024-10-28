// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Search, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const CompanySidebar = ({ onCompanySelect, showAllCompanies, onToggleView }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch users from clerk_users table
      const { data: clerkUsers, error: clerkError } = await supabase
        .from('acc_portal_clerk_users')
        .select('*')
        .order('username');

      if (clerkError) throw clerkError;

      // Fetch company names if they exist
      const { data: companies, error: companiesError } = await supabase
        .from('acc_portal_company')
        .select('*');

      if (companiesError) throw companiesError;

      // Create a mapping of userid to company name
      const companyMapping = companies.reduce((acc, company) => {
        acc[company.userid] = company.company_name;
        return acc;
      }, {});

      // Map users with company names
      const mappedUsers = clerkUsers.map(user => ({
        ...user,
        displayName: companyMapping[user.userid] || user.username
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCompanySelect = (company) => {
    setSelectedCompany(company.id);
    onCompanySelect(company);
  };

  return (
    <Card className="lg:w-1/4 bg-white shadow-md mr-6">
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-center">
          <Button 
            onClick={onToggleView} 
            className="flex-1 bg-green-500 hover:bg-green-600 text-white mr-2"
          >
            {showAllCompanies ? (
              <><EyeOff className="mr-2" /> Hide All Companies</>
            ) : (
              <><Eye className="mr-2" /> View All Companies</>
            )}
          </Button>
          <Button
            onClick={fetchUsers}
            variant="outline"
            disabled={isLoading}
            className="px-3"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>

      <CardContent className="overflow-auto max-h-[calc(100vh-300px)]">
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <Button
              key={user.id}
              onClick={() => handleCompanySelect(user)}
              variant={selectedCompany === user.id ? "default" : "outline"}
              className="w-full justify-start text-left"
            >
              <span className="truncate">{user.displayName}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanySidebar;