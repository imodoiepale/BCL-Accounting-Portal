// @ts-nocheck
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
import { Checkbox } from "@/components/ui/checkbox";

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
  const [existingData, setExistingData] = useState<Record<string, any[]>>({});
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

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
  // Add function to fetch existing data
  const fetchExistingData = async () => {
    const tables = {
      2: 'acc_portal_directors_duplicate',
      3: 'acc_portal_suppliers_duplicate',
      4: 'acc_portal_banks',
      5: 'acc_portal_employees'
    };

    const promises = Object.entries(tables).map(async ([stage, table]) => {
      const { data } = await supabase
        .from(table)
        .select('*')
        .order('company_name', { ascending: false });
      return [table, data || []];
    });

    const results = await Promise.all(promises);
    const formattedResults = Object.fromEntries(results);
    console.log('Fetched existing data:', formattedResults);
    setExistingData(formattedResults);
  };

  useEffect(() => {
    fetchExistingData();
  }, []);


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
  const handleManualEntry = async (formData: any) => {
    try {
      const currentMapping = formStructure.find(m => m.structure.order.tab === currentStage);
      if (!currentMapping) {
        toast.error('Form structure not found');
        return;
      }

      // Filter out stage name from data
      const { name, ...dataToSubmit } = formData;

      setData(prev => ({
        ...prev,
        [currentStage]: [
          ...(prev[currentStage] || []),
          {
            ...dataToSubmit,
            status: 'has_details',
            userid: currentStage === 1 ? companyData.userId : undefined,
            company_name: currentStage !== 1 ? companyData.company_name || companyData.name : undefined
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

        const tableName = getTableNameForStage(stage.id);

        for (const record of stageData) {
          const { name, userid, ...recordWithoutName } = record;

          // Check if record exists based on stage
          const { data: existingData, error: fetchError } = await supabase
            .from(tableName)
            .select('*')
            .eq(stage.id === 1 ? 'userid' : 'company_name', stage.id === 1 ? companyData.userId : (companyData.company_name || companyData.name))
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
            throw fetchError;
          }

          const recordToSubmit = stage.id === 1 ? { ...recordWithoutName, userid: companyData.userId } : recordWithoutName;

          if (existingData) {
            // Update existing record
            const { error: updateError } = await supabase
              .from(tableName)
              .update(recordToSubmit)
              .eq(stage.id === 1 ? 'userid' : 'company_name', stage.id === 1 ? companyData.userId : (companyData.company_name || companyData.name));

            if (updateError) throw updateError;
          } else {
            // Insert new record
            const { error: insertError } = await supabase
              .from(tableName)
              .insert(recordToSubmit);

            if (insertError) throw insertError;
          }
        }
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
      1: 'acc_portal_company_duplicate2',
      2: 'acc_portal_directors',
      3: 'acc_portal_suppliers',
      4: 'acc_portal_banks_duplicate',
      5: 'acc_portal_employees2'
    };
    return tableMap[stageId as keyof typeof tableMap] || 'unknown';
  };
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
  const getVisibleFields = () => {
    return formStructure[currentStage - 1]?.structure.sections[0].subsections[0].fields
      .filter(f => f.visible) || [];
  };

  const formatFieldValue = (value: any) => {
    if (value instanceof Date) {
      return format(value, 'dd/MM/yyyy');
    }
    return value || '-';
  };

  const handleItemSelection = (item: any, checked: boolean) => {
    setSelectedItems(prev => {
      if (checked) {
        return [...prev, item.id];
      }
      return prev.filter(id => id !== item.id);
    });
  };

  const handleAddSelected = () => {
    const selectedData = existingData[getTableNameForStage(currentStage)]
      ?.filter(item => selectedItems.includes(item.id));

    setData(prev => ({
      ...prev,
      [currentStage]: [...(prev[currentStage] || []), ...selectedData]
    }));

    setIsDialogOpen(false);
    toast.success(`Added ${selectedItems.length} ${getCurrentStageName()}`);
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

                <Tabs defaultValue="existing">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="existing">Choose Existing {getCurrentStageName()}</TabsTrigger>
                    <TabsTrigger value="new">Add New {getCurrentStageName()}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="existing">
                    <ScrollArea className="h-[calc(90vh-180px)] pr-4">
                      <div className="p-6 space-y-6">
                        {currentStage !== 1 && (
                          <div className="space-y-4">
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Search..."
                                  className="w-full"
                                  onChange={(e) => {
                                    // Add search functionality
                                  }}
                                />
                              </div>                              
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select item" />
                                </SelectTrigger>
                                <SelectContent>
                                  {existingData[getTableNameForStage(currentStage)]?.map((item, index) => {
                                    const displayName = currentStage === 4 ? item.fullname : item[`${getCurrentStageName().toLowerCase()}_name`]
                                    return (
                                      <SelectItem 
                                        key={index} 
                                        value={item.id.toString()}
                                        onClick={() => handleItemSelection(item, true)}
                                      >
                                        {displayName}
                                      </SelectItem>
                                    )
                                  })}
                                </SelectContent>
                              </Select>
                              {selectedItems.length === 1 && (
                                <div className="border p-4 rounded-lg">
                                  <h3 className="font-semibold mb-2">Preview</h3>
                                  <div className="space-y-2">
                                    {getVisibleFields().slice(0, 3).map(field => {
                                      const selectedItem = existingData[getTableNameForStage(currentStage)]?.find(
                                        item => item.id === selectedItems[0]
                                      )
                                      return (
                                        <div key={field.name} className="flex justify-between">
                                          <span className="text-gray-600">{field.display}:</span>
                                          <span>{formatFieldValue(selectedItem?.[field.name])}</span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              {selectedItems.length > 0 && (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setSelectedItems([])}
                                  >
                                    Clear Selection
                                  </Button>
                                  <Button onClick={handleAddSelected}>
                                    Add Selected
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>                  
                  </TabsContent>

                  <TabsContent value="new">
                    <ScrollArea className="h-[calc(90vh-180px)] pr-4">
                      <div className="p-6 space-y-6">
                        <div className="space-y-4">
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
                          </div>

                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg">New {getCurrentStageName()} Details</h3>
                            <Button
                              variant="outline"
                              onClick={handleTemplateDownload}
                              className="hover:bg-blue-50"
                            >
                              Download Template
                            </Button>
                          </div>

                          <div className="space-y-6">
                            <Input
                              type="file"
                              accept=".csv,.xlsx"
                              onChange={handleFileUpload}
                              className="w-full"
                            />

                            <FormProvider {...methods}>
                              <form onSubmit={methods.handleSubmit(handleManualEntry)} className="space-y-6">
                                {formStructure[currentStage - 1]?.structure.sections
                                  .filter(section => section.visible)
                                  .map((section) => (
                                    <div key={section.name} className="bg-white rounded-lg border p-6">
                                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                        {section.name}
                                      </h3>
                                      <div className="grid grid-cols-2 gap-4">
                                        {section.subsections
                                          .flatMap(subsection => subsection.fields)
                                          .filter(field => field.visible)
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
                                                          <SelectValue placeholder={`Select ${field.display}`} />
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
                                <Button type="submit" className="w-full">
                                  Save
                                </Button>
                              </form>
                            </FormProvider>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>              </DialogContent>
            </Dialog>
          </div>

          {/* Data table */}
          {data[currentStage]?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(data[currentStage][0])
                    .filter(key => !['userid', 'company_name'].includes(key))
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
                      .filter(([key]) => !['userid', 'company_name'].includes(key))
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