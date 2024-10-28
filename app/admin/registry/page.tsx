//@ts-nocheck
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabaseClient';
import Profile from './Profiles';
import AllProfiles from './AllProfiles';
import CompanySidebar from './CompanySidebar';

const Page = () => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [companies, setCompanies] = useState([]);
  const { toast } = useToast();

  // Fetch companies data
  const fetchCompanies = async () => {
    try {
      // Fetch users from clerk_users table
      const { data: clerkUsers, error: clerkError } = await supabase
        .from('acc_portal_clerk_users')
        .select('*')
        .order('username');

      if (clerkError) throw clerkError;

      // Fetch company data
      const { data: companiesData, error: companiesError } = await supabase
        .from('acc_portal_company')
        .select('*');

      if (companiesError) throw companiesError;

      // Create company mapping
      const companyMapping = companiesData.reduce((acc, company) => {
        acc[company.userid] = company;
        return acc;
      }, {});

      // Map users with company data
      const mappedUsers = clerkUsers.map(user => ({
        id: user.id,
        userid: user.userid,
        username: user.username,
        ...companyMapping[user.userid],
        displayName: companyMapping[user.userid]?.company_name || user.username,
      }));

      setCompanies(mappedUsers);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch companies data",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Handle company selection
  const handleCompanySelect = async (user) => {
    try {
      const userid = user.userid;
      
      // Fetch related data
      const promises = [
        supabase.from('acc_portal_suppliers').select('*').eq('userid', userid),
        supabase.from('acc_portal_banks').select('*').eq('userid', userid),
        supabase.from('acc_portal_employees').select('*').eq('userid', userid),
        supabase.from('acc_portal_directors').select('*').eq('userid', userid)
      ];

      const [suppliers, banks, employees, directors] = await Promise.all(promises);

      setSelectedCompany({
        ...user,
        suppliers: suppliers.data || [],
        banks: banks.data || [],
        employees: employees.data || [],
        directors: directors.data || []
      });
      
      setShowAllCompanies(false);
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast({
        title: "Error",
        description: "Failed to load company details",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row p-6 bg-gray-100 min-h-screen">
      {/* Sidebar */}
      <CompanySidebar
        onCompanySelect={handleCompanySelect}
        showAllCompanies={showAllCompanies}
        onToggleView={() => setShowAllCompanies(!showAllCompanies)}
      />

      {/* Main Content */}
      <Card className="lg:w-3/4 bg-white shadow-md">
        <CardContent>
          {showAllCompanies ? (
            <AllProfiles 
              companies={companies}
              onCompanySelect={handleCompanySelect}
            />
          ) : selectedCompany ? (
            <Profile company={selectedCompany} />
          ) : (
            <div className="text-center py-10 text-gray-500">
              Please select a company or view all companies
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;