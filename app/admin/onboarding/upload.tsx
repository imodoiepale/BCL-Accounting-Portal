// @ts-nocheck
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, FormProvider } from "react-hook-form";
import { PlusIcon } from "lucide-react";
import { formFields } from "../overallview/formfields";
import { supabase } from "@/lib/supabaseClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as XLSX from 'xlsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { handleFileUpload, handleManualEntry, submitAllData, handleTemplateDownload,sanitizeData,processFormData,getFormFields,generateFieldsBasedOnCount,generateDefaultValues , parseXLSX , parseCSV} from './utility';
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
};

const stages = [
  { id: 1, name: "Company Information" },
  { id: 2, name: "Director's Information" },
  { id: 3, name: "Suppliers" },
  { id: 4, name: "Banks" },
  { id: 5, name: "Employee Details" }
];

const complianceItems = [
  { name: 'KRA', requiresCount: false },
  { name: 'NSSF', requiresCount: false },
  { name: 'NHIF', requiresCount: false },
  { name: 'Ecitizen', requiresCount: false },
  { name: 'NITA', requiresCount: false },
  { name: 'Housing Levy', requiresCount: false },
  { name: 'Standard Levy', requiresCount: false },
  { name: 'Tourism Levy', requiresCount: false },
  { name: 'Tourism Fund', requiresCount: false },
  { name: 'VAT', requiresCount: false },
  { name: 'Income Tax', requiresCount: false },
  { name: 'NEA', requiresCount: false },
  { name: 'PAYE', requiresCount: false },
  { name: 'MRI', requiresCount: false },
  { name: 'TOT', requiresCount: false },
  { name: 'TIMS', requiresCount: false },
  { name: 'Sheria', requiresCount: false },
  { name: "Director's Information", requiresCount: true },
  { name: 'Suppliers', requiresCount: true },
  { name: 'Banks', requiresCount: true },
  { name: 'Employee', requiresCount: true }
];

export default function Upload({ onComplete, companyData }: UploadProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus[]>([]);

  const { fields, defaultValues } = getFormFields(currentStage, stages, complianceStatus, formFields);
  const methods = useForm({
    defaultValues: {
      ...defaultValues,
      company_name: companyData.company_name || companyData.name,
      ...formData
    }
  });
  
  const hasValidStatus = (name: string, status: string) =>
    complianceStatus.find(s => s.name === name)?.status === status;

  const getUniqueEmployees = (employees: any[]) =>
    employees.filter((employee, index, self) =>
      index === self.findIndex((e) => e.employee_email === employee.employee_email)
    );

    const handleVerification = async () => {
      if (currentStage === 5) {
          await submitAllData(data, companyData, complianceStatus, setLoading);
      } else {
          setCurrentStage(currentStage + 1);
      }
  };
  

  const renderDataTable = () => {
    if (!data[currentStage] || !Array.isArray(data[currentStage]) || data[currentStage].length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No data available for this stage
        </div>
      );
    }

    // Function to extract supplier data fields
    const getSupplierData = (row: any) => {
      if (row.data) {
        return {
          status: row.status,
          supplierName: row.data.supplierName || row.data.supplierName_1 || '-',
          supplierType: row.data.supplierType || row.data.supplierType_1 || '-',
          tradingType: row.data.tradingType || row.data.tradingType_1 || '-',
          pin: row.data.pin || row.data.pin_1 || '-',
          idNumber: row.data.idNumber || row.data.idNumber_1 || '-',
          mobile: row.data.mobile || row.data.mobile_1 || '-',
          email: row.data.email || row.data.email_1 || '-'
        };
      }
      return {
        status: row.status || '-',
        supplierName: row['Supplier Name'] || '-',
        supplierType: row['Supplier Type'] || '-',
        tradingType: row['Trading Type'] || '-',
        pin: row['PIN'] || '-',
        idNumber: row['ID Number'] || '-',
        mobile: row['Mobile'] || '-',
        email: row['Email'] || '-'
      };
    };

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {currentStage === 3 ? (
                  <>
                    <TableHead>Status</TableHead>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Supplier Type</TableHead>
                    <TableHead>Trading Type</TableHead>
                    <TableHead>PIN</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Email</TableHead>
                  </>
                ) : (
                  Object.keys(data[currentStage][0])
                    .filter(key => !['userid', 'created_at', 'updated_at'].includes(key))
                    .map(header => (
                      <TableHead key={header} className="font-semibold text-gray-700">
                        {header}
                      </TableHead>
                    ))
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data[currentStage].map((row, index) => (
                <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                  {currentStage === 3 ? (
                    <>
                      {Object.values(getSupplierData(row)).map((value, i) => (
                        <TableCell key={i}>{value}</TableCell>
                      ))}
                    </>
                  ) : (
                    Object.entries(row)
                      .filter(([key]) => !['userid', 'created_at', 'updated_at'].includes(key))
                      .map(([key, value], i) => (
                        <TableCell key={i} className="py-3">
                          {value ? (typeof value === 'object' ? JSON.stringify(value) : value) : '-'}
                        </TableCell>
                      ))
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="mb-12">
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

          <div className="flex justify-between items-center">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className={`flex flex-col items-center w-1/5 relative group transition-all duration-300 
                  ${stage.id === currentStage
                    ? "text-blue-600"
                    : stage.id < currentStage
                      ? "text-blue-400"
                      : "text-gray-400"}`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 
                    transform transition-all duration-300 hover:scale-110 
                    ${stage.id === currentStage
                      ? "bg-blue-600 text-white shadow-lg"
                      : stage.id < currentStage
                        ? "bg-blue-400 text-white"
                        : "bg-gray-200"}`}
                >
                  {stage.id}
                </div>
                <span className="text-sm font-medium">{stage.name}</span>
                {stage.id < stages.length && (
                  <div
                    className={`absolute top-6 left-[60%] w-full h-[3px] transition-all duration-300 
                      ${stage.id < currentStage ? "bg-blue-400" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Stage {currentStage}: {stages[currentStage - 1].name}
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
                  <DialogTitle className="text-2xl">Add {stages[currentStage - 1].name}</DialogTitle>
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
                        {/* Conditionally render checklist based on current stage */}
                        {currentStage === 1 && (
                          <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Statutory Compliance Status</h3>
                            <div className="grid grid-cols-2 gap-4">
                              {complianceItems
                                .filter(item => !item.requiresCount)
                                .map((item) => (
                                  <div key={item.name} className="space-y-2 border p-4 rounded-lg">
                                    <Label className="text-base">{item.name}</Label>
                                    <Select
                                      onValueChange={(value) =>
                                        setComplianceStatus(prev => ([
                                          ...prev.filter(p => p.name !== item.name),
                                          { name: item.name, status: value as ComplianceStatus['status'] }
                                        ]))
                                      }
                                      value={complianceStatus.find(s => s.name === item.name)?.status}
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
                                ))}
                            </div>
                          </div>
                        )}

                        {/* For stages with count requirements */}
                        {currentStage >= 2 && currentStage <= 5 && (
                          <div className="space-y-4">
                            <h3 className="font-semibold text-lg">
                              {stages[currentStage - 1].name} Details
                            </h3>
                            <div className="border p-4 rounded-lg space-y-4">
                              <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                  onValueChange={(value) =>
                                    setComplianceStatus(prev => ([
                                      ...prev.filter(p => p.name !== stages[currentStage - 1].name),
                                      {
                                        name: stages[currentStage - 1].name,
                                        status: value as ComplianceStatus['status']
                                      }
                                    ]))
                                  }
                                  value={complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.status}
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

                              {/* Only show count if status is 'has_details' */}
                              {complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.status === 'has_details' && (
                                <div className="space-y-2">
                                  <Label>Number of {stages[currentStage - 1].name}</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.count || 1}
                                    onChange={(e) => {
                                      const count = parseInt(e.target.value) || 1;
                                      setComplianceStatus(prev => ([
                                        ...prev.filter(p => p.name !== stages[currentStage - 1].name),
                                        {
                                          name: stages[currentStage - 1].name,
                                          status: prev.find(p => p.name === stages[currentStage - 1].name)?.status || 'has_details',
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
                        )}
                        <Button
                          className="w-full mt-4"
                          onClick={() => {
                            // Get all tab triggers
                            const tabTriggers = document.querySelectorAll('[role="tab"]');
                            // Find the manual entry tab
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
                          {currentStage === 1 ? (
                            // Company Information Stage
                            <>
                              {/* Always show General Information */}
                              <div className="space-y-6">
                                <div className="col-span-2">
                                  <FormField
                                    control={methods.control}
                                    name="company_name"
                                    render={({ field }) => (
                                      <FormItem className="col-span-2">
                                        <FormLabel className="text-sm font-semibold text-gray-700">
                                          Company Name
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            value={companyData.name}
                                            disabled
                                            className="w-full bg-gray-50"
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                {/* General Information Section */}
                                <div className="col-span-2 space-y-4">
                                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                                    General Information
                                  </h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    {fields
                                      .filter(field => !field.category)
                                      .map((field) => (
                                        <FormField
                                          key={field.name}
                                          control={methods.control}
                                          name={field.name}
                                          defaultValue=""
                                          render={({ field: formField }) => (
                                            <FormItem className={field.type === 'select' ? 'col-span-1' : field.name.includes('address') ? 'col-span-2' : 'col-span-1'}>
                                              <FormLabel className="text-sm font-semibold text-gray-700">
                                                {field.label}
                                              </FormLabel>
                                              <FormControl>
                                                {field.type === 'select' ? (
                                                  <Select
                                                    onValueChange={formField.onChange}
                                                    value={formField.value || ''}
                                                  >
                                                    <SelectTrigger className="w-full bg-white">
                                                      <SelectValue placeholder={`Select ${field.label}`} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {field.options?.map(option => (
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
                                                    placeholder={field.label}
                                                    className="w-full bg-white"
                                                  />
                                                )}
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                      ))}
                                  </div>
                                </div>

                                {/* Render other categories based on compliance status */}
                                {Object.entries(
                                  fields.reduce((groups, field) => {
                                    if (field.category) {
                                      const category = field.category;
                                      const item = complianceItems.find(item =>
                                        item.name === category.replace(' Details', '')
                                      );

                                      if (!item || complianceStatus.find(s =>
                                        s.name === item.name && s.status === 'has_details'
                                      )) {
                                        if (!groups[category]) {
                                          groups[category] = [];
                                        }
                                        groups[category].push(field);
                                      }
                                    }
                                    return groups;
                                  }, {} as Record<string, any[]>)
                                ).map(([category, categoryFields]) => (
                                  <div key={category} className="col-span-2 space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                                      {category}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      {categoryFields.map((field) => (
                                        <FormField
                                          key={field.name}
                                          control={methods.control}
                                          name={field.name}
                                          defaultValue=""
                                          render={({ field: formField }) => (
                                            <FormItem className="col-span-1">
                                              <FormLabel className="text-sm font-semibold text-gray-700">
                                                {field.label}
                                              </FormLabel>
                                              <FormControl>
                                                <Input
                                                  {...formField}
                                                  type={field.type}
                                                  placeholder={field.label}
                                                  className="w-full bg-white"
                                                />
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <>
                              {!complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.status ? (
                                <div className="p-6 text-center">
                                  <h3 className="text-lg font-medium">Please select a status first</h3>
                                </div>
                              ) : complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.status === 'missing' ? (
                                <div className="p-6 text-center space-y-4">
                                  <h3 className="text-lg font-medium">This will be marked as missing</h3>
                                  <Button
                                    onClick={() => {
                                      setData(prev => ({
                                        ...prev,
                                        [currentStage]: [{
                                          status: 'missing',
                                          userid: companyData.userId,
                                          name: stages[currentStage - 1].name
                                        }]
                                      }));
                                      setIsDialogOpen(false);
                                      toast.success(`${stages[currentStage - 1].name} marked as missing`);
                                    }}
                                    className="w-full"
                                  >
                                    Confirm Status
                                  </Button>
                                </div>
                              ) : complianceStatus.find(s => s.name === stages[currentStage - 1].name)?.status === 'to_be_registered' ? (
                                <div className="p-6 text-center space-y-4">
                                  <h3 className="text-lg font-medium">This will be marked for registration</h3>
                                  <Button
                                    onClick={() => {
                                      setData(prev => ({
                                        ...prev,
                                        [currentStage]: [{
                                          status: 'to_be_registered',
                                          userid: companyData.userId,
                                          name: stages[currentStage - 1].name
                                        }]
                                      }));
                                      setIsDialogOpen(false);
                                      toast.success(`${stages[currentStage - 1].name} marked for registration`);
                                    }}
                                    className="w-full"
                                  >
                                    Confirm Status
                                  </Button>
                                </div>
                              ) : (
                                // Other stages - show multiple sections based on count
                                Array.from({
                                  length: complianceStatus.find(s =>
                                    s.name === stages[currentStage - 1].name
                                  )?.count || 1
                                }).map((_, index) => (
                                  <div key={index} className="space-y-6 border-b pb-6 last:border-0">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                      {stages[currentStage - 1].name} {index + 1}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                      {fields.map((field) => (
                                        <FormField
                                          key={`${field.name}_${index + 1}`}
                                          control={methods.control}
                                          name={`${field.name}_${index + 1}`}
                                          defaultValue=""
                                          render={({ field: formField }) => (
                                            <FormItem className={field.type === 'select' ? 'col-span-1' : field.name.includes('address') ? 'col-span-2' : 'col-span-1'}>
                                              <FormLabel className="text-sm font-semibold text-gray-700">
                                                {field.label}
                                              </FormLabel>
                                              <FormControl>
                                                {field.type === 'select' ? (
                                                  <Select
                                                    onValueChange={formField.onChange}
                                                    value={formField.value || ''}
                                                  >
                                                    <SelectTrigger className="w-full bg-white">
                                                      <SelectValue placeholder={`Select ${field.label}`} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {field.options?.map(option => (
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
                                                    placeholder={field.label}
                                                    className="w-full bg-white"
                                                  />
                                                )}
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))
                              )}
                            </>
                          )}

                          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition-colors">
                            Add Entry
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
    onClick={() => handleTemplateDownload(currentStage, complianceStatus, stages, () => ({fields}))}
    className="hover:bg-blue-50"
>
    Download Template
</Button>

                      </div>
                      <Input
    type="file"
    accept=".csv,.xlsx"
    onChange={(e) => handleFileUpload(
        e,
        setFile,
        setData,
        currentStage,
        { userId: companyData.userId },
        data
    )}
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

          {renderDataTable()}
        </div>

        <div className="flex justify-end space-x-4">
          {currentStage > 1 && (
            <Button
              onClick={() => setCurrentStage(currentStage - 1)}
              variant="outline"
              className="hover:bg-gray-50 transition-colors"
            >
              Previous Stage
            </Button>
          )}
          <Button
            onClick={() => currentStage === 5 ? onComplete(data) : setCurrentStage(currentStage + 1)}
            variant="outline"
            className="hover:bg-gray-50 transition-colors"
          >
            Skip this stage
          </Button>
          <Button
            onClick={handleVerification}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 transition-colors min-w-[150px]"
          >
            {loading ? (
              <div className="flex items-center">
                <span className="animate-spin mr-2">⏳</span>
                Verifying...
              </div>
            ) : currentStage === 5 ? (
              "Complete All Stages"
            ) : (
              "Next Stage"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}