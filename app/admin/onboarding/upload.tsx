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

  const { fields, defaultValues } = getFormFields();
const methods = useForm({
  defaultValues: {
    ...defaultValues,
    company_name: companyData.company_name || companyData.name, // Try both properties
    ...formData
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
      let cleanedData;
      if (currentStage === 3) { // Supplier stage
        cleanedData = {
          userid: companyData.userId,
          data: {
            supplierName: formData['data.supplierName'] || '',
            supplierType: formData['data.supplierType'] || '',
            tradingType: formData['data.tradingType'] || '',
            pin: formData['data.pin'] || '',
            idNumber: formData['data.idNumber'] || '',
            mobile: formData['data.mobile'] || '',
            email: formData['data.email'] || ''
          }
        };
      } else {
        cleanedData = {
          ...Object.keys(formData).reduce((acc, key) => {
            if (formData[key] !== undefined && formData[key] !== '') {
              acc[key] = formData[key];
            }
            return acc;
          }, {}),
          userid: companyData.userId
        };
      }
  
      // Update local state
      setData(prev => ({
        ...prev,
        [currentStage]: [cleanedData] // Replace instead of append
      }));
      setFormData(cleanedData);
      
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
        const companyData = {
          company_name: name,
          company_type: data[1][0].company_type,
          description: data[1][0].description,
          registration_number: data[1][0].registration_number,
          date_established: data[1][0].date_established,
          kra_pin_number: data[1][0].kra_pin,
          industry: data[1][0].industry,
          employees: data[1][0].employees,
          annual_revenue: data[1][0].annual_revenue,
          fiscal_year: data[1][0].fiscal_year,
          website: data[1][0].website,
          email: data[1][0].email,
          phone: data[1][0].phone,
          street: data[1][0].street,
          city: data[1][0].city,
          postal_code: data[1][0].postal_code,
          country: data[1][0].country,
          userid: userId
        };

        const { error: companyError } = await supabase
          .from('acc_portal_company')
          .insert(companyData);
        if (companyError) throw companyError;

        // Submit statutory data
        await Promise.all([
          // Password Checker
          companyData.kra_pin && supabase
            .from('PasswordChecker')
            .insert({
              company_name: name,
              kra_pin: data[1][0].kra_pin,
              kra_password: data[1][0].kra_password,
              status: 'pending',
            }),

          // NSSF
          data[1][0].nssf_code && supabase
            .from('nssf_companies')
            .insert({
              name: name,
              identifier: data[1][0].nssf_user,
              nssf_password: data[1][0].nssf_password,
              nssf_code: data[1][0].nssf_code,
            }),

          // NHIF
          data[1][0].nhif_code && supabase
            .from('nhif_companies')
            .insert({
              name: name,
              identifier: data[1][0].nhif_code,
              nhif_password: data[1][0].nhif_password,
              nhif_code: data[1][0].nhif_code,
              nhif_mobile: data[1][0].nhif_mobile,
              nhif_email: data[1][0].nhif_email,
            }),

          // Ecitizen
          data[1][0].ecitizen_identifier && supabase
            .from('ecitizen_companies')
            .insert({
              name: name,
              ecitizen_identifier: data[1][0].ecitizen_identifier,
              ecitizen_password: data[1][0].ecitizen_password,
              ecitizen_status: 'Pending',
            })
        ].filter(Boolean));
      }

      // Directors
      if (data[2]?.length) {
        const directorData = data[2].map(director => ({
          first_name: director.first_name,
          middle_name: director.middle_name,
          last_name: director.last_name,
          full_name: director.full_name,
          gender: director.gender,
          place_of_birth: director.place_of_birth,
          country_of_birth: director.country_of_birth,
          nationality: director.nationality,
          date_of_birth: director.date_of_birth,
          id_number: director.id_number,
          tax_pin: director.tax_pin,
          mobile_number: director.mobile_number,
          email_address: director.email_address,
          job_position: director.job_position,
          shares_held: director.shares_held,
          userid: userId
        }));

        const { error: directorError } = await supabase
          .from('acc_portal_directors')
          .insert(directorData);
        if (directorError) throw directorError;
      }

      // Suppliers
      if (data[3]?.length) {
        const supplierData = data[3].map(supplier => ({
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
        }));

        const { error: supplierError } = await supabase
          .from('acc_portal_pettycash_suppliers')
          .insert(supplierData);
        if (supplierError) throw supplierError;
      }

      // Banks
      if (data[4]?.length) {
        const bankData = data[4].map(bank => ({
          bank_name: bank.bank_name,
          account_number: bank.account_number,
          currency: bank.currency || null,
          branch: bank.branch,
          relationship_manager_name: bank.relationship_manager_name,
          relationship_manager_mobile: bank.relationship_manager_mobile,
          relationship_manager_email: bank.relationship_manager_email,
          bank_startdate: bank.bank_startdate,
          userid: userId,
          bank_status: false,
          bank_verified: false
        }));

        const { error: bankError } = await supabase
          .from('acc_portal_banks')
          .insert(bankData);
        if (bankError) throw bankError;
      }

      // Employees
      if (data[5]?.length) {
        const employeeData = data[5].map(employee => ({
          employee_name: employee.employee_name,
          id_number: employee.id_number,
          employee_kra_pin: employee.employee_kra_pin,
          employee_email: employee.employee_email,
          employee_mobile: employee.employee_mobile,
          employee_nhif: employee.employee_nhif,
          employee_nssf: employee.employee_nssf,
          employee_startdate: employee.employee_startdate,
          employee_enddate: employee.employee_enddate,
          userid: userId,
          employee_status: false,
          employee_verified: false
        }));

        const { error: employeeError } = await supabase
          .from('acc_portal_employees')
          .insert(employeeData);
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
            {currentStage === 3 ? (
              // Special handling for suppliers
              <>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Supplier Type</TableHead>
                <TableHead>Trading Type</TableHead>
                <TableHead>PIN</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Email</TableHead>
              </>
            ) : (
              // Other stages
              Object.keys(data[currentStage][0])
                .filter(key => key !== 'userid')
                .map((header) => (
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
                  <TableCell>{row.data.supplierName || ''}</TableCell>
                  <TableCell>{row.data.supplierType || ''}</TableCell>
                  <TableCell>{row.data.tradingType || ''}</TableCell>
                  <TableCell>{row.data.pin || ''}</TableCell>
                  <TableCell>{row.data.idNumber || ''}</TableCell>
                  <TableCell>{row.data.mobile || ''}</TableCell>
                  <TableCell>{row.data.email || ''}</TableCell>
                </>
              ) : (
                Object.entries(row)
                  .filter(([key]) => key !== 'userid')
                  .map(([key, value], i) => (
                    <TableCell key={i} className="py-3">
                      {typeof value === 'object' ? JSON.stringify(value) : value}
                    </TableCell>
                  ))
              )}
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