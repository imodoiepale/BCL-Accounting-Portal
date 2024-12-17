'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function OnboardingTab({ 
  selectedTab, 
  tabStructure 
}: { 
  selectedTab: string, 
  tabStructure: any 
}) {
  const [activeSubTab, setActiveSubTab] = useState('info');
  const [recordNames, setRecordNames] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState('');
  const [recordDetails, setRecordDetails] = useState<any>({});

  // Extract table names from the tab structure
  const extractTableNames = () => {
    if (!tabStructure || !tabStructure.sections) return [];
    
    const tables: string[] = [];
    tabStructure.sections.forEach((section: any) => {
      section.subsections?.forEach((subsection: any) => {
        if (subsection.tables) {
          tables.push(...subsection.tables);
        }
      });
    });

    return [...new Set(tables)];
  };

  // Fetch record names based on selected tab's tables
  useEffect(() => {
    const fetchRecordNames = async () => {
      const tables = extractTableNames();
      if (tables.length === 0) return;

      try {
        // Attempt to fetch names from the first table
        const { data, error } = await supabase
          .from(tables[0])
          .select('*');

        if (error) throw error;

        // If data exists, try to find a name-like column
        if (data && data.length > 0) {
          const nameColumn = Object.keys(data[0]).find(key => 
            key.toLowerCase().includes('name') || 
            key.toLowerCase().includes('title')
          );

          if (nameColumn) {
            const names = data.map((item: any) => item[nameColumn]).filter(Boolean);
            setRecordNames(names);
          }
        }
      } catch (error) {
        console.error('Error fetching record names:', error);
      }
    };

    fetchRecordNames();
  }, [tabStructure]);

  // Fetch record details when a record is selected
  useEffect(() => {
    const fetchRecordDetails = async () => {
      const tables = extractTableNames();
      if (tables.length === 0 || !selectedRecord) return;

      try {
        const { data, error } = await supabase
          .from(tables[0])
          .select('*')
          .eq(Object.keys(recordDetails)[0], selectedRecord)
          .single();

        if (error) throw error;

        setRecordDetails(data);
      } catch (error) {
        console.error('Error fetching record details:', error);
      }
    };

    if (selectedRecord) {
      fetchRecordDetails();
    }
  }, [selectedRecord]);

  const generateTemplate = () => {
    console.log('Generating template');
  };

  return (
    <Tabs 
      value={activeSubTab} 
      onValueChange={setActiveSubTab} 
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="info">Info</TabsTrigger>
        <TabsTrigger value="docs">Docs</TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="space-y-4">
        <div className="grid gap-4">
          {/* Record Selection Dropdown */}
          <div className="space-y-2">
            <Label>Select Record</Label>
            <Select 
              onValueChange={(value) => setSelectedRecord(value)}
              value={selectedRecord}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Record" />
              </SelectTrigger>
              <SelectContent>
                {recordNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamically render fields based on selected record */}
          {recordDetails && Object.entries(recordDetails)
            .filter(([key]) => 
              !['id', 'created_at', 'updated_at', 'created_by', 'updated_by'].includes(key)
            )
            .map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                <Input
                  id={key}
                  value={value as string}
                  readOnly
                />
              </div>
            ))}

          <Button onClick={generateTemplate}>
            Generate Template
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="docs" className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="doc1">Document 1</Label>
            <Input id="doc1" type="file" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc2">Document 2</Label>
            <Input id="doc2" type="file" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc3">Document 3</Label>
            <Input id="doc3" type="file" />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
