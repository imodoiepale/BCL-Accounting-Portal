// @ts-nocheck
'use client';

import { useState, useMemo } from 'react';
import SidebarTabs from '../components/profile-management/SidebarTabs';
import OnboardingTab from '../components/profile-management/OnboardingTab';
import DetailsTab from '../components/profile-management/DetailsTab';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProfileManagementPage() {
  const [selectedTab, setSelectedTab] = useState('');
  const [activeMainTab, setActiveMainTab] = useState('onboarding');
  const [tabStructure, setTabStructure] = useState<any>({});
  const [dropdownOptions, setDropdownOptions] = useState<{[key: string]: string[]}>({});

  // Function to render dynamic fields based on tab structure
  const renderDynamicFields = useMemo(() => {
    if (!tabStructure || !tabStructure.sections) return null;

    return tabStructure.sections.flatMap((section: any) => 
      section.subsections ? 
        section.subsections.flatMap((subsection: any) => 
          subsection.fields ? 
            subsection.fields
              .filter((field: any) => 
                !['company_name', 'acc_manager_position', 'kra_station'].includes(field.name)
              )
              .map((field: any) => (
                <div key={`${subsection.name}-${field.name}`} className="mb-4">
                  <Label htmlFor={field.name}>{field.display || field.name}</Label>
                  {field.dropdownOptions && field.dropdownOptions.length > 0 ? (
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.display}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.dropdownOptions.map((option: string) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input 
                      type="text" 
                      id={field.name} 
                      placeholder={field.display || field.name} 
                    />
                  )}
                </div>
              )) 
          : []
        )
      : []
    ).flat();
  }, [tabStructure]);

  // Fetch dropdown options when tab changes
  const handleTabChange = (tab: string, structure: any) => {
    setSelectedTab(tab);
    setTabStructure(structure);
    console.log('Selected Tab Structure:', structure);
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
        <SidebarTabs onTabChange={handleTabChange} />
      </div>
      <div className="w-3/4 p-4 overflow-y-auto">
        <div className="space-y-4">
          <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="onboarding" className="mt-4">
              <OnboardingTab 
                selectedTab={selectedTab} 
                tabStructure={tabStructure}
              />
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <DetailsTab 
                selectedTab={selectedTab} 
                tabStructure={tabStructure}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
