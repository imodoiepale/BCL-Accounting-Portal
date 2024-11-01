// components/UploadComponent.tsx
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
import { usePathname } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { PlusIcon } from "lucide-react";
import { formFields } from "../overallview/formfields";
import { supabase } from "@/lib/supabaseClient";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
interface UploadProps {
  onComplete: (data: any) => void;
  companyData: {
    name: string;
    username: string;
    userId: string; // from onboarding
  };
}

const stages = [
  { id: 1, name: "Company Information" },
  { id: 2, name: "Director's Information" },
  { id: 3, name: "Suppliers" },
  { id: 4, name: "Banks" },
  { id: 5, name: "Employee Details" }
];

export default function Upload({ onComplete, companyData }: UploadProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const pathname = usePathname();
  const [formData, setFormData] = useState({});

  const getFormFields = () => {
    const fields = (() => {
      switch (currentStage) {
        case 1: return formFields.companyDetails.fields;
        case 2: return formFields.directorDetails.fields;
        case 3: return formFields.supplierDetails.fields;
        case 4: return formFields.bankDetails.fields;
        case 5: return formFields.employeeDetails.fields;
        default: return [];
      }
    })();

    // Initialize default values
    const defaultValues = fields.reduce((acc, field) => {
      acc[field.name] = '';
      return acc;
    }, {} as Record<string, string>);

    return { fields, defaultValues };
  };

// Initialize form with empty values or saved data
const { fields, defaultValues } = getFormFields();
const methods = useForm({
  defaultValues: {
    ...defaultValues,
    company_name: companyData.name,
    ...formData // Include saved form data
  }
});

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    try {
      setFile(e.target.files[0]);
      const reader = new FileReader();

      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const rows = text.split('\n');
        const headers = rows[0].split(',');

        const parsedData = rows.slice(1)
          .map(row => {
            const values = row.split(',');
            const rowData = headers.reduce((acc, header, index) => {
              const value = values[index]?.trim();
              if (value) acc[header.trim()] = value;
              return acc;
            }, {} as Record<string, string>);

            // Add userid to each row
            return { ...rowData, userid: companyData.userId };
          })
          .filter(row => Object.keys(row).length > 1); // Filter out empty rows

        if (parsedData.length === 0) {
          toast.error('No valid data found in CSV');
          return;
        }

        setData({ ...data, [currentStage]: parsedData });
        toast.success('CSV data loaded successfully');
      };

      reader.onerror = () => {
        toast.error('Error reading file');
      };

      reader.readAsText(e.target.files[0]);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file');
    }
  };


  const handleManualEntry = async (formData: any) => {
    try {
      const cleanedData = {
        ...Object.keys(formData).reduce((acc, key) => {
          if (formData[key] !== undefined && formData[key] !== '') {
            acc[key] = formData[key];
          }
          return acc;
        }, {}),
        userid: companyData.userId
      };
  
      // Update local state
      setData(prev => ({
        ...prev,
        [currentStage]: [cleanedData] // Replace instead of append
      }));
      setFormData(cleanedData); // Save form data
      
      setIsDialogOpen(false);
      toast.success('Data added successfully');
      return true;
  
    } catch (error) {
      console.error('Error adding data:', error);
      toast.error('Failed to add data. Please try again.');
      return false;
    }
  };

  const submitAllData = async () => {
    const { userId, name } = companyData;

    try {
      setLoading(true);

      // Company Data
      if (data[1]?.length) {
        const companyData = data[1][0];
        const { error: companyError } = await supabase
          .from('acc_portal_company')
          .insert({
            ...companyData,
            company_name: name,
            userid: userId
          });
        if (companyError) throw companyError;

        // Password Checker
        if (companyData.kra_pin && companyData.kra_password) {
          const { error: passwordError } = await supabase
            .from('PasswordChecker')
            .insert({
              company_name: name,
              kra_pin: companyData.kra_pin,
              kra_password: companyData.kra_password,
              status: 'pending',
              last_checked: new Date().toISOString()
            });
          if (passwordError) throw passwordError;
        }

        // NSSF
        if (companyData.nssf_code) {
          const { error: nssfError } = await supabase
            .from('nssf_companies')
            .insert({
              name: name,
              identifier: companyData.nssf_user,
              nssf_password: companyData.nssf_password,
              nssf_code: companyData.nssf_code,
              userid: userId
            });
          if (nssfError) throw nssfError;
        }

        // NHIF
        if (companyData.nhif_code) {
          const { error: nhifError } = await supabase
            .from('nhif_companies')
            .insert({
              name: name,
              identifier: companyData.nhif_code,
              nhif_password: companyData.nhif_password,
              nhif_code: companyData.nhif_code,
              nhif_mobile: companyData.nhif_mobile,
              nhif_email: companyData.nhif_email,
              userid: userId
            });
          if (nhifError) throw nhifError;
        }

        // Ecitizen
        if (companyData.ecitizen_identifier) {
          const { error: ecitizenError } = await supabase
            .from('ecitizen_companies')
            .insert({
              name: name,
              ecitizen_identifier: companyData.ecitizen_identifier,
              ecitizen_password: companyData.ecitizen_password,
              ecitizen_status: 'Pending',
              userid: userId
            });
          if (ecitizenError) throw ecitizenError;
        }
      }

      // Directors
      if (data[2]?.length) {
        const { error: directorError } = await supabase
          .from('acc_portal_directors')
          .insert(data[2].map(director => ({
            ...director,
            userid: userId
          })));
        if (directorError) throw directorError;
      }

      // Suppliers
      if (data[3]?.length) {
        const { error: supplierError } = await supabase
          .from('acc_portal_pettycash_suppliers')
          .insert(data[3].map(supplier => ({
            userid: userId,
            data: {
              supplierName: supplier['data.supplierName'],
              supplierType: supplier['data.supplierType'],
              tradingType: supplier['data.tradingType'],
              pin: supplier['data.pin'],
              idNumber: supplier['data.idNumber'],
              mobile: supplier['data.mobile'],
              email: supplier['data.email']
            }
          })));
        if (supplierError) throw supplierError;
      }

      // Banks
      if (data[4]?.length) {
        const { error: bankError } = await supabase
          .from('acc_portal_banks')
          .insert(data[4].map(bank => ({
            ...bank,
            userid: userId
          })));
        if (bankError) throw bankError;
      }

      // Employees
      if (data[5]?.length) {
        const { error: employeeError } = await supabase
          .from('acc_portal_employees')
          .insert(data[5].map(employee => ({
            ...employee,
            userid: userId
          })));
        if (employeeError) throw employeeError;
      }

      toast.success('All data submitted successfully!');
      onComplete(data);
      return true;

    } catch (error) {
      console.error('Error submitting data:', error);
      toast.error('Failed to submit data. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update handleVerification
  const handleVerification = async () => {
    if (currentStage === 5) {
      // Submit all data when completing the final stage
      await submitAllData();
    } else {
      // Just move to next stage
      setCurrentStage(currentStage + 1);
    }
  };


  const handleSkip = () => {
    if (currentStage === 5) {
      onComplete(data);
    } else {
      setCurrentStage(currentStage + 1);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="mb-12">
     {/* Company Header */}
     <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-gray-600">Company:</span>
          <span>{companyData.name}</span>
        </h1>
      </div>
          <div className="flex justify-between items-center">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className={`flex flex-col items-center w-1/5 relative group transition-all duration-300 ${stage.id === currentStage
                  ? "text-blue-600"
                  : stage.id < currentStage
                    ? "text-blue-400"
                    : "text-gray-400"
                  }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transform transition-all duration-300 hover:scale-110 ${stage.id === currentStage
                    ? "bg-blue-600 text-white shadow-lg"
                    : stage.id < currentStage
                      ? "bg-blue-400 text-white"
                      : "bg-gray-200"
                    }`}
                >
                  {stage.id}
                </div>
                <span className="text-sm font-medium">{stage.name}</span>
                {stage.id < stages.length && (
                  <div
                    className={`absolute top-6 left-[60%] w-full h-[3px] transition-all duration-300 ${stage.id < currentStage
                      ? "bg-blue-400"
                      : "bg-gray-200"
                      }`}
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
            <div className="flex items-center space-x-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="hover:bg-blue-50 transition-colors">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Manually
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[1200px] w-[100vw] max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Add {stages[currentStage - 1].name}</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[calc(90vh-180px)] pr-4">
                    <FormProvider {...methods}>
                      <form onSubmit={methods.handleSubmit(handleManualEntry)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                           {/* Add the Company Name field first when in Stage 1 */}
    {currentStage === 1 && (
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
    )}
     {Object.entries(
                            fields.reduce((groups, field) => {
                              const category = field.category || 'General Information';
                              if (!groups[category]) {
                                groups[category] = [];
                              }
                              groups[category].push(field);
                              return groups;
                            }, {} as Record<string, any[]>)
                          ).map(([category, categoryFields]) => (
                            <div key={category} className="col-span-2 space-y-4">
                              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">{category}</h3>
                              <div className="grid grid-cols-2 gap-4">
                                {categoryFields.map((field) => (
                                  <FormField
                                    key={field.name}
                                    control={methods.control}
                                    name={field.name}
                                    defaultValue=""
                                    render={({ field: formField }) => (
                                      <FormItem className={field.type === 'select' ? 'col-span-1' : field.name.includes('address') ? 'col-span-2' : 'col-span-1'}>
                                        <FormLabel className="text-sm font-semibold text-gray-700">{field.label}</FormLabel>
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
                                              value={formField.value || ''}
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
                          ))}
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition-colors">
                          Add Entry
                        </Button>
                      </form>
                    </FormProvider>
                    <ScrollBar orientation="vertical" />
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <div className="relative">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="w-[300px] file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          </div>

          {data[currentStage]?.length > 0 && (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            {Object.keys(data[currentStage][0]).map((header) => (
              <TableHead key={header} className="font-semibold text-gray-700">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data[currentStage].map((row, index) => (
            <TableRow key={index} className="hover:bg-gray-50 transition-colors">
              {Object.entries(row).map(([key, value], i) => (
                <TableCell key={i} className="py-3">
                  {typeof value === 'object' ? JSON.stringify(value) : value}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
)}
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
            onClick={handleSkip}
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