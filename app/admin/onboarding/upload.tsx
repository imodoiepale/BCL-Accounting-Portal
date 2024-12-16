// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
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

// Constants
const TABLE_MAP = {
  2: 'acc_portal_directors_duplicate',
  3: 'acc_portal_suppliers_duplicate',
  4: 'acc_portal_banks',
  5: 'acc_portal_employees'
};

const STAGE_FIELDS = {
  2: { // Directors
    nameField: 'full_name',
    displayFields: ['full_name', 'job_position', 'nationality', 'email_address']
  },
  3: { // Suppliers
    nameField: 'supplier_name_as_per_qb',
    displayFields: ['supplier_name_as_per_qb', 'exp_cat', 'country_name', 'off_email']
  },
  4: { // Banks
    nameField: 'bank_name',
    displayFields: ['bank_name', 'account_number', 'currency', 'branch', 'rm_name']
  },
  5: { // Employees
    nameField: 'employee_name',
    displayFields: ['employee_name', 'id_number', 'employee_email', 'employee_mobile']
  }
};

export default function Upload({ onComplete, companyData }: UploadProps) {
  // State Management
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
  const [stages, setStages] = useState<Stage[]>([]);
  const [existingData, setExistingData] = useState<Record<string, any[]>>({});
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Form initialization
  const methods = useForm({
    defaultValues: {
      ...defaultValues,
      company_name: companyData.company_name || companyData.name,
      ...formData
    }
  });

  // Memoized Values
  const currentStageName = useMemo(() => {
    if (!stages.length) return "Loading...";
    return stages[currentStage - 1]?.name || "Unknown Stage";
  }, [stages, currentStage]);

  const currentTableData = useMemo(() => {
    const tableName = TABLE_MAP[currentStage as keyof typeof TABLE_MAP];
    return existingData[tableName] || [];
  }, [existingData, currentStage]);

  const filteredTableData = useMemo(() => {
    if (!searchTerm) return currentTableData;

    const stageFields = STAGE_FIELDS[currentStage as keyof typeof STAGE_FIELDS];
    if (!stageFields) return currentTableData;

    return currentTableData.filter(item =>
      item[stageFields.nameField]?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentTableData, searchTerm, currentStage]);

  const fetchFormStructure = async () => {
    const { data, error } = await supabase
      .from('profile_category_table_mapping_2')
      .select('*')
      .order('id');

    if (error) throw error;
    return data as TableMapping[];
  };

  const handleTemplateDownload = async () => {
    try {
      if (!stages.length) {
        toast.error('Form structure not loaded');
        return;
      } const currentMapping = formStructure.find(m => m.structure.order.tab === currentStage);
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

  // Effects
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const [structure, fetchedStages] = await Promise.all([
          fetchFormStructure(),
          fetchStages()
        ]);

        setFormStructure(structure);
        setStages(fetchedStages);

        if (fetchedStages.length > 0) {
          const { fields: initialFields, defaultValues: initialDefaults } =
            await getFormFields(currentStage, structure);
          setFields(initialFields);
          setDefaultValues(initialDefaults);
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

  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const promises = Object.entries(TABLE_MAP).map(async ([stage, table]) => {
          const { data } = await supabase
            .from(table)
            .select('*')
            .order('company_name', { ascending: false });
          return [table, data || []];
        });

        const results = await Promise.all(promises);
        const formattedResults = Object.fromEntries(results);
        setExistingData(formattedResults);
      } catch (error) {
        console.error('Error fetching existing data:', error);
        toast.error('Failed to fetch existing data');
      }
    };

    fetchExistingData();
  }, []);

  // Handlers
  const handleItemSelection = (item: any, checked: boolean) => {
    console.log('Selected item:', item);
    console.log('Checked status:', checked);
    setSelectedItems(prev => {
      if (checked) {
        return [...prev, item.id];
      }
      return prev.filter(id => id !== item.id);
    });
  };

  const handleAddSelected = () => {
    console.log('Selected items to add:', selectedItems);
    console.log('Current table data:', currentTableData);
    const selectedData = currentTableData
      .filter(item => selectedItems.includes(item.id))
      .map(item => ({
        ...item,
        company_name: companyData.company_name || companyData.name
      }));

    console.log('Processed data to add:', selectedData);
    setData(prev => ({
      ...prev,
      [currentStage]: [...(prev[currentStage] || []), ...selectedData]
    }));

    setIsDialogOpen(false);
    setSelectedItems([]);
    toast.success(`Added ${selectedItems.length} ${currentStageName}`);
  };

  const handleManualEntry = async (formData: any) => {
    console.log('Manual entry form data:', formData);
    try {
      const currentMapping = formStructure.find(m => m.structure.order.tab === currentStage);
      if (!currentMapping) {
        toast.error('Form structure not found');
        return;
      }

      const { name, ...dataToSubmit } = formData;
      console.log('Data to submit:', dataToSubmit);

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
    console.log('Submitting data:', data);
    try {
      setLoading(true);

      for (const stage of stages) {
        const stageData = data[stage.id];
        if (!stageData?.length) continue;

        const tableName = TABLE_MAP[stage.id as keyof typeof TABLE_MAP];
        console.log(`Processing stage ${stage.id} data for table ${tableName}:`, stageData);

        for (const record of stageData) {
          const { name, userid, ...recordWithoutName } = record;

          const { data: existingRecord, error: fetchError } = await supabase
            .from(tableName)
            .select('*')
            .eq(
              stage.id === 1 ? 'userid' : 'company_name',
              stage.id === 1 ? companyData.userId : (companyData.company_name || companyData.name)
            )
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

          const recordToSubmit = stage.id === 1
            ? { ...recordWithoutName, userid: companyData.userId }
            : recordWithoutName;

          console.log(`Submitting record for stage ${stage.id}:`, recordToSubmit);

          if (existingRecord) {
            const { error: updateError } = await supabase
              .from(tableName)
              .update(recordToSubmit)
              .eq(
                stage.id === 1 ? 'userid' : 'company_name',
                stage.id === 1 ? companyData.userId : (companyData.company_name || companyData.name)
              );

            if (updateError) throw updateError;
          } else {
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

  // Render helper functions
  const renderPreview = () => {
    if (selectedItems.length !== 1) return null;
  
    const selectedItem = currentTableData.find(item => item.id === selectedItems[0]);
    const stageFields = STAGE_FIELDS[currentStage as keyof typeof STAGE_FIELDS];
  
    if (!selectedItem || !stageFields) return null;
  
    return (
      <div className="border p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Preview</h3>
        <div className="space-y-2">
          {stageFields.displayFields.map(field => (
            <div key={field} className="flex justify-between">
              <span className="text-gray-600">
                {field.split('_').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}:
              </span>
              <span>{selectedItem[field] || '-'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Loading states
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
          <Button onClick={() => window.location.reload()} className="mt-4">
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        {/* Company Header */}
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

        {/* Progress Indicators */}
        <div className="flex justify-between items-center mb-8">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={`flex flex-col items-center w-1/5 relative 
                ${stage.id === currentStage ? "text-blue-600" : "text-gray-400"}`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-3
                  ${stage.id === currentStage ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                {stage.id}
              </div>
              <span className="text-sm font-medium">{stage.name}</span>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="bg-white p-6 rounded-lg mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Stage {currentStage}: {currentStageName}
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
                  <DialogTitle className="text-2xl">Add {currentStageName}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="existing">
                  <TabsList className="grid w-full grid-cols-2">
                    {currentStage === 1 ? (
                      <TabsTrigger value="new" className="w-full">Add New {currentStageName}</TabsTrigger>
                    ) : (
                      <>
                        <TabsTrigger value="existing">Choose Existing {currentStageName}</TabsTrigger>
                        <TabsTrigger value="new">Add New {currentStageName}</TabsTrigger>
                      </>
                    )}
                  </TabsList>

                  {currentStage !== 1 && (
                    <TabsContent value="existing">
                      <ScrollArea className="h-[calc(90vh-180px)] pr-4">
                        <div className="p-6 space-y-6">
                          <div className="space-y-4">
                            <div className="flex flex-col gap-4">
                              <Input
                                placeholder={`Search ${currentStageName}...`}
                                className="w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />

                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select ${currentStageName}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredTableData.map((item) => {
                                    const stageFields = STAGE_FIELDS[currentStage as keyof typeof STAGE_FIELDS];
                                    const displayName = item[stageFields?.nameField];

                                    // Skip items without a display name
                                    if (!displayName) return null;

                                    return (
                                      <SelectItem
                                        key={item.id}
                                        value={item.id.toString()}
                                        onClick={() => handleItemSelection(item, true)}
                                      >
                                        {displayName}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>

                              {renderPreview()}

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
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  )}

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
                                    ...prev.filter(p => p.name !== currentStageName),
                                    {
                                      name: currentStageName,
                                      status: value as ComplianceStatus['status']
                                    }
                                  ]))
                                }
                                value={complianceStatus.find(s => s.name === currentStageName)?.status}
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
                            <h3 className="font-semibold text-lg">New {currentStageName} Details</h3>
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
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          {/* Data Table */}
          {data[currentStage]?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(data[currentStage][0])
                    .filter(key => !['userid', 'company_name'].includes(key))
                    .map(header => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data[currentStage].map((row, index) => (
                  <TableRow key={index}>
                    {Object.entries(row)
                      .filter(([key]) => !['userid', 'company_name'].includes(key))
                      .map(([key, value]) => (
                        <TableCell key={key}>{value as string}</TableCell>
                      ))}
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

        {/* Navigation Buttons */}
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
