// @ts-nocheck
// components/Upload.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, FormProvider } from "react-hook-form";
import { PlusIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import * as XLSX from 'xlsx';
import { supabase } from "@/lib/supabaseClient";
import { fetchStages, getFormFields, handleFileUpload } from "./utils/upload";

interface TableMapping {
  id: number;
  main_tab: string;
  Tabs: string;
  structure: {
    order: {
      tab: number;
      sections: Record<string, number>;
    };
    sections: Array<{
      name: string;
      order: number;
      visible: boolean;
      subsections: Array<{
        name: string;
        order: number;
        fields: Array<{
          name: string;
          order: number;
          table: string;
          display: string;
          visible: boolean;
          verification: {
            is_verified: boolean;
            verified_at: string;
            verified_by: string;
          };
          dropdownOptions: string[];
        }>;
        tables: string[];
        visible: boolean;
      }>;
    }>;
    visibility: {
      tab: boolean;
      sections: Record<string, boolean>;
    };
    relationships: Record<string, any>;
  };
}

interface UploadProps {
  onComplete: (data: any) => void;
  companyData: {
    name: string;
    username: string;
    userId: string;
  };
}

type ComplianceStatus = {
  name: string;
  status: 'to_be_registered' | 'missing' | 'has_details';
  count?: number;
  verification?: {
    is_verified: boolean;
    verified_at: string;
    verified_by: string;
  };
};

type Stage = {
  id: number;
  name: string;
  order: number;
  tables: string[];
};

const fetchFormStructure = async () => {
  const { data, error } = await supabase
    .from('profile_category_table_mapping_2')
    .select('*')
    .order('id');

  if (error) throw error;
  return data as TableMapping[];
};

export default function Upload({ onComplete, companyData }: UploadProps) {
  // State declarations
  const [currentStage, setCurrentStage] = useState(1);
  const [formStructure, setFormStructure] = useState<TableMapping[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<Record<number, any[]>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus[]>([]);
  const [stages, setStages] = useState<Array<{ id: number, name: string, order: number }>>([]);

  // Form initialization
  const methods = useForm({
    defaultValues: {
      ...defaultValues,
      company_name: companyData.company_name || companyData.name,
      ...formData
    }
  });

  // Effects
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const [structure, stages] = await Promise.all([
          fetchFormStructure(),
          fetchStages()
        ]);
        
        setFormStructure(structure);
        setStages(stages);
        
        // Also fetch initial stage data if needed
        if (stages.length > 0) {
          const { fields, defaultValues } = await getFormFields(currentStage, structure);
          setFields(fields);
          setDefaultValues(defaultValues);
        }
      } catch (error) {
        console.error('Error initializing:', error);
        toast.error('Failed to load form structure');
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>Loading form structure...</p>
        </div>
      </div>
    );
  }

  if (!stages.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">No stages found. Please try again.</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  const getCurrentStageName = () => {
    if (!stages.length) return "Loading...";
    return stages[currentStage - 1]?.name || "Unknown Stage";
  };

  const handleTemplateDownload = async () => {
    try {
      if (!stages.length) {
        toast.error('Form structure not loaded');
        return;
      }
  
      const currentMapping = formStructure.find(m => m.structure.order.tab === currentStage);
      if (!currentMapping) {
        toast.error('Form structure not found');
        return;
      }
  
      const currentStageData = stages[currentStage - 1];
      if (!currentStageData) {
        toast.error('Current stage not found');
        return;
      }
      const count = complianceStatus.find(s => 
        s.name === stages[currentStage - 1]?.name
      )?.count || 1;
  
      // Generate template headers and rows from the structure
      const headers = currentMapping.structure.sections
        .flatMap(section => 
          section.subsections.flatMap(subsection =>
            subsection.fields
              .filter(field => field.visible)
              .map(field => field.display)
          )
        );
  
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        ...Array(count).fill(Array(headers.length).fill(''))
      ]);
  
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, `${stages[currentStage - 1]?.name.replace(/\s+/g, '_')}_Template.xlsx`);
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error('Failed to generate template');
    }
  };

  // Form submission handler
  const handleManualEntry = async (formData: any) => {
    try {
      const currentMapping = formStructure.find(m => m.structure.order.tab === currentStage);
      if (!currentMapping) {
        toast.error('Form structure not found');
        return;
      }

      setData(prev => ({
        ...prev,
        [currentStage]: [
          ...(prev[currentStage] || []),
          {
            ...formData,
            status: 'has_details',
            userid: companyData.userId
          }
        ]
      }));

      setIsDialogOpen(false);
      toast.success('Data added successfully');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form data');
    }
  };

  const handleSubmission = async () => {
    try {
      setLoading(true);

      // Submit data to Supabase
      for (const stage of stages) {
        const stageData = data[stage.id];
        if (!stageData?.length) continue;

        const { error } = await supabase
          .from(getTableNameForStage(stage.id))
          .insert(stageData);

        if (error) throw error;
      }

      toast.success('All data submitted successfully');
      onComplete(data);
    } catch (error) {
      console.error('Error submitting data:', error);
      toast.error('Failed to submit data');
    } finally {
      setLoading(false);
    }
  };

  const getTableNameForStage = (stageId: number) => {
    // Map stage IDs to table names
    const tableMap = {
      1: 'company_information',
      2: 'director_information',
      3: 'suppliers',
      4: 'banks',
      5: 'employee_details'
    };
    return tableMap[stageId as keyof typeof tableMap] || 'unknown';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Main content */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        {/* Company header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-gray-600">Company:</span>
              <span>{companyData.company_name || companyData.name}</span>
            </h1>
            <div className="text-sm text-gray-500">
              ID: {companyData.userId}
            </div>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="flex justify-between items-center mb-8">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={`flex flex-col items-center w-1/5 relative 
                ${stage.id === currentStage ? "text-blue-600" : "text-gray-400"}`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-3
                  ${stage.id === currentStage
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"}`}
              >
                {stage.id}
              </div>
              <span className="text-sm font-medium">{stage.name}</span>
            </div>
          ))}
        </div>

        {/* Form content */}
        <div className="bg-white p-6 rounded-lg mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Stage {currentStage}: {getCurrentStageName()}
            </h2>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Information
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-[1200px] w-[100vw] max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Add {getCurrentStageName()}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="checklist">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="checklist">Set Status</TabsTrigger>
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    <TabsTrigger value="upload">File Upload</TabsTrigger>
                  </TabsList>

                  <TabsContent value="checklist">
                    <ScrollArea className="h-[calc(90vh-180px)] pr-4">
                      <div className="p-6 space-y-6">
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg">{getCurrentStageName()} Details</h3>
                          <div className="border p-4 rounded-lg space-y-4">
                            <div className="space-y-2">
                              <Label>Status</Label>
                              <Select
                                onValueChange={(value) =>
                                  setComplianceStatus(prev => ([
                                    ...prev.filter(p => p.name !== getCurrentStageName()),
                                    {
                                      name: getCurrentStageName(),
                                      status: value as ComplianceStatus['status']
                                    }
                                  ]))
                                }
                                value={complianceStatus.find(s => s.name === getCurrentStageName())?.status}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="to_be_registered">To Be Registered</SelectItem>
                                  <SelectItem value="missing">Missing</SelectItem>
                                  <SelectItem value="has_details">Has Details</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {complianceStatus.find(s => s.name === getCurrentStageName())?.status === 'has_details' && (
                              <div className="space-y-2">
                                <Label>Number of {getCurrentStageName()}</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={complianceStatus.find(s => s.name === getCurrentStageName())?.count || 1}
                                  onChange={(e) => {
                                    const count = parseInt(e.target.value) || 1;
                                    setComplianceStatus(prev => ([
                                      ...prev.filter(p => p.name !== getCurrentStageName()),
                                      {
                                        name: getCurrentStageName(),
                                        status: prev.find(p => p.name === getCurrentStageName())?.status || 'has_details',
                                        count
                                      }
                                    ]));
                                  }}
                                  className="w-full"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          className="w-full mt-4"
                          onClick={() => {
                            const tabTriggers = document.querySelectorAll('[role="tab"]');
                            const manualTab = Array.from(tabTriggers).find(
                              trigger => trigger.getAttribute('value') === 'manual'
                            );
                            if (manualTab instanceof HTMLElement) {
                              manualTab.click();
                            }
                          }}
                        >
                          Continue to Data Entry
                        </Button>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="manual">
                    <ScrollArea className="h-[calc(90vh-180px)] pr-4">
                      <FormProvider {...methods}>
                        <form onSubmit={methods.handleSubmit(handleManualEntry)} className="space-y-6 p-6">
                          {!complianceStatus.find(s => s.name === getCurrentStageName())?.status ? (
                            <div className="p-6 text-center">
                              <h3 className="text-lg font-medium">Please select a status first</h3>
                            </div>
                          ) : complianceStatus.find(s => s.name === getCurrentStageName())?.status === 'missing' ? (
                            <div className="p-6 text-center space-y-4">
                              <h3 className="text-lg font-medium">This will be marked as missing</h3>
                              <Button
                                onClick={() => {
                                  setData(prev => ({
                                    ...prev,
                                    [currentStage]: [{
                                      status: 'missing',
                                      userid: companyData.userId,
                                      name: getCurrentStageName()
                                    }]
                                  }));
                                  setIsDialogOpen(false);
                                  toast.success(`${getCurrentStageName()} marked as missing`);
                                }}
                                className="w-full"
                              >
                                Confirm Status
                              </Button>
                            </div>
                          ) : complianceStatus.find(s => s.name === getCurrentStageName())?.status === 'to_be_registered' ? (
                            <div className="p-6 text-center space-y-4">
                              <h3 className="text-lg font-medium">This will be marked for registration</h3>
                              <Button
                                onClick={() => {
                                  setData(prev => ({
                                    ...prev,
                                    [currentStage]: [{
                                      status: 'to_be_registered',
                                      userid: companyData.userId,
                                      name: getCurrentStageName()
                                    }]
                                  }));
                                  setIsDialogOpen(false);
                                  toast.success(`${getCurrentStageName()} marked for registration`);
                                }}
                                className="w-full"
                              >
                                Confirm Status
                              </Button>
                            </div>
                          ) : (
                            // Dynamic fields from database structure
                            <div className="space-y-8">
                            {formStructure[currentStage - 1]?.structure.sections
                              .filter(section => section.visible)
                              .map((section) => (
                                <div key={section.name} className="bg-white rounded-lg border p-6">
                                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    {section.name}
                                  </h3>
                                  <div className="space-y-6">
                                    {section.subsections
                                      .filter(subsection => subsection.visible)
                                      .map((subsection) => (
                                        <div key={subsection.name} className="space-y-4">
                                          <h4 className="text-md font-medium text-gray-700 border-b pb-2">
                                            {subsection.name}
                                          </h4>
                                          <div className="grid grid-cols-2 gap-4">
                                            {subsection.fields
                                              .filter(f => f.visible)
                                              .sort((a, b) => a.order - b.order)
                                              .map((field) => (
                                                <FormField
                                                  key={field.name}
                                                  control={methods.control}
                                                  name={field.name}
                                                  render={({ field: formField }) => (
                                                    <FormItem className={
                                                      field.name.includes('description') ? 'col-span-2' : ''
                                                    }>
                                                      <FormLabel>{field.display}</FormLabel>
                                                      <FormControl>
                                                        {field.dropdownOptions?.length > 0 ? (
                                                          <Select
                                                            onValueChange={formField.onChange}
                                                            value={formField.value || ''}
                                                          >
                                                            <SelectTrigger>
                                                              <SelectValue 
                                                                placeholder={`Select ${field.display}`} 
                                                              />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                              {field.dropdownOptions.map((option) => (
                                                                <SelectItem key={option} value={option}>
                                                                  {option}
                                                                </SelectItem>
                                                              ))}
                                                            </SelectContent>
                                                          </Select>
                                                        ) : (
                                                          <Input 
                                                            {...formField}
                                                            type={field.type}
                                                            placeholder={`Enter ${field.display}`}
                                                          />
                                                        )}
                                                      </FormControl>
                                                    </FormItem>
                                                  )}
                                                />
                                              ))}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                        <Button type="submit" className="w-full mt-6">
                          Save
                        </Button>
                      </form>
                    </FormProvider>
                  </ScrollArea>
                </TabsContent>

                  <TabsContent value="upload">
                    <div className="p-6 space-y-4">
                      <div className="flex justify-end mb-4">
                        <Button
                          variant="outline"
                          onClick={handleTemplateDownload}
                          className="hover:bg-blue-50"
                        >
                          Download Template
                        </Button>
                      </div>
                      <Input
                        type="file"
                        accept=".csv,.xlsx"
                        onChange={handleFileUpload}
                        className="w-full"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Upload a CSV or Excel file with your data
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          {/* Data table */}
          {data[currentStage]?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(data[currentStage][0])
                    .filter(key => !['userid', 'created_at', 'updated_at'].includes(key))
                    .map(header => (
                      <TableHead key={header}>{header}</TableHead>
                    ))
                  }
                </TableRow>
              </TableHeader>
              <TableBody>
                {data[currentStage].map((row, index) => (
                  <TableRow key={index}>
                    {Object.entries(row)
                      .filter(([key]) => !['userid', 'created_at', 'updated_at'].includes(key))
                      .map(([key, value]) => (
                        <TableCell key={key}>{value as string}</TableCell>
                      ))
                    }
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No data added yet
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-end space-x-4">
          {currentStage > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStage(prev => prev - 1)}
            >
              Previous
            </Button>
          )}

          {currentStage < stages.length ? (
            <Button
              onClick={() => setCurrentStage(prev => prev + 1)}
            >
              Next Stage
            </Button>
          ) : (
            <Button
              onClick={handleSubmission}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}