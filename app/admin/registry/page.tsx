//@ts-nocheck
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabaseClient';
import Profile from './Profiles';
import AllProfiles from './AllProfiles';
import CompanySidebar from './CompanySidebar';
import CompaniesTable from './CompaniesTable';

const Page = () => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [companies, setCompanies] = useState([]);
  const { toast } = useToast();
  const [users, setUsers] = useState([]);  
  const [allCompaniesData, setAllCompaniesData] = useState([]);


  const handleCompanySelect = (data) => {
    if (Array.isArray(data)) {
      setCompanies(data);
      setShowAllCompanies(true);
    } else {
      setSelectedCompany(data);
      setShowAllCompanies(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: companiesData } = await supabase
        .from('acc_portal_company')
        .select('*');
      const { data: usersData } = await supabase
        .from('acc_portal_clerk_users')
        .select('*');
      
      setCompanies(companiesData || []);
      setUsers(usersData || []);
    };
    fetchData();
  }, []);

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
};


export default Page;