'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

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
  const [activeStage, setActiveStage] = useState('stage1');
  const [activeInfoTab, setActiveInfoTab] = useState('upload');
  const [recordNames, setRecordNames] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState('');
  const [recordDetails, setRecordDetails] = useState<any>({});
  const [progress, setProgress] = useState(33);

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
        const { data, error } = await supabase
          .from(tables[0])
          .select('*');

        if (error) throw error;

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

  // Function to format the tab name by removing "details" suffix
  const formatTabName = (tabName: string) => {
    return tabName.toLowerCase().replace(' details', '').replace(' registry', '');
  };

  // Generate dynamic fields based on tab structure
  const renderDynamicFields = () => {
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
  };

  const generateTemplate = () => {
    // TODO: Implement Excel template generation
    console.log('Generating template');
  };

  const handleStageChange = (stage: string) => {
    setActiveStage(stage);
    switch(stage) {
      case 'stage1':
        setProgress(33);
        break;
      case 'stage2':
        setProgress(66);
        break;
      case 'stage3':
        setProgress(100);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${activeStage === 'stage1' ? 'text-blue-600' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">1</div>
            <span className="ml-2">Onboard {formatTabName(selectedTab)}</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300" />
          <div className={`flex items-center ${activeStage === 'stage2' ? 'text-blue-600' : ''}`}>
            <div className={`w-8 h-8 rounded-full ${activeStage === 'stage2' ? 'bg-blue-600' : 'bg-gray-300'} text-white flex items-center justify-center`}>2</div>
            <span className="ml-2">Upload {formatTabName(selectedTab)} Documents</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300" />
          <div className={`flex items-center ${activeStage === 'stage3' ? 'text-blue-600' : ''}`}>
            <div className={`w-8 h-8 rounded-full ${activeStage === 'stage3' ? 'bg-blue-600' : 'bg-gray-300'} text-white flex items-center justify-center`}>3</div>
            <span className="ml-2">Completed</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        {activeStage === 'stage1' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Stage 1: Bank Details</h2>
            <Tabs value={activeInfoTab} onValueChange={setActiveInfoTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="existing">Choose Existing</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <div className="space-y-4">
                  <Button onClick={generateTemplate}>Generate Template</Button>
                  <Input type="file" />
                </div>
              </TabsContent>

              <TabsContent value="existing">
                <div className="space-y-4">
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
                  {selectedRecord && renderDynamicFields()}
                </div>
              </TabsContent>

              <TabsContent value="new">
                <div className="space-y-4">
                  {renderDynamicFields()}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {activeStage === 'stage2' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Stage 2: Upload Documents</h2>
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
          </div>
        )}

        {activeStage === 'stage3' && (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">Stage 3: Completed</h2>
            <p>All stages have been successfully completed.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => handleStageChange(activeStage === 'stage2' ? 'stage1' : activeStage === 'stage3' ? 'stage2' : 'stage1')}
          disabled={activeStage === 'stage1'}
        >
          Previous
        </Button>
        <Button
          onClick={() => handleStageChange(activeStage === 'stage1' ? 'stage2' : activeStage === 'stage2' ? 'stage3' : 'stage3')}
          disabled={activeStage === 'stage3'}
        >
          Next Stage
        </Button>
      </div>
    </div>
  );
}
