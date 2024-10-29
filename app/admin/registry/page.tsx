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


  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setShowAllCompanies(false);
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
        {selectedCompany ? (
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