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
import { formFields } from './formfields';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePathname } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { PlusIcon } from "lucide-react";
interface UploadProps {
  onComplete: (data: any) => void;
}

const stages = [
  { id: 1, name: "Company Information" },
  { id: 2, name: "Director's Information" },
  { id: 3, name: "Suppliers" },
  { id: 4, name: "Banks" },
  { id: 5, name: "Employee Details" }
];

export default function Upload({ onComplete }: UploadProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const pathname = usePathname();
  const methods = useForm();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setFile(e.target.files[0]);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n');
      const headers = rows[0].split(',');

      const parsedData = rows.slice(1).map(row => {
        const values = row.split(',');
        return headers.reduce((acc, header, index) => {
          acc[header.trim()] = values[index]?.trim();
          return acc;
        }, {} as any);
      }).filter(row => Object.values(row).some(value => value));

      setData({ ...data, [currentStage]: parsedData });
    };

    reader.readAsText(e.target.files[0]);
  };

  const handleManualEntry = (formData: any) => {
    const currentData = data[currentStage] || [];
    setData({ ...data, [currentStage]: [...currentData, formData] });
    setIsDialogOpen(false);
  };

  const handleVerification = () => {
    if (!data[currentStage]?.length) {
      toast.error("Please add or upload data first");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      if (currentStage === 5) {
        onComplete(data);
      } else {
        setCurrentStage(currentStage + 1);
      }
      setLoading(false);
    }, 1500);
  };

  const handleSkip = () => {
    if (currentStage === 5) {
      onComplete(data);
    } else {
      setCurrentStage(currentStage + 1);
    }
  };

  const getFormFields = () => {
    switch (currentStage) {
      case 1: return formFields.companyDetails;
      case 2: return formFields.directorDetails;
      case 3: return formFields.supplierDetails;
      case 4: return formFields.bankDetails;
      case 5: return formFields.employeeDetails;
      default: return [];
    }
  };
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <div className="mb-12">
            <div className="flex justify-between items-center">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className={`flex flex-col items-center w-1/5 relative group transition-all duration-300 ${
                    stage.id === currentStage
                      ? "text-blue-600"
                      : stage.id < currentStage
                      ? "text-blue-400"
                      : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transform transition-all duration-300 hover:scale-110 ${
                      stage.id === currentStage
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
                      className={`absolute top-6 left-[60%] w-full h-[3px] transition-all duration-300 ${
                        stage.id < currentStage
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
                  <DialogContent className="max-w-[1200px] w-[95vw]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Add {stages[currentStage - 1].name}</DialogTitle>
                    </DialogHeader>
                    <FormProvider {...methods}>
                      <form onSubmit={methods.handleSubmit(handleManualEntry)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          {getFormFields().map((field) => (
                            <FormField
                              key={field.name}
                              control={methods.control}
                              name={field.name}
                              render={({ field: formField }) => (
                                <FormItem className={field.type === 'select' ? 'col-span-1' : field.name.includes('address') ? 'col-span-2' : 'col-span-1'}>
                                  <FormLabel className="text-sm font-semibold text-gray-700">{field.label}</FormLabel>
                                  <FormControl>
                                    {field.type === 'select' ? (
                                      <Select 
                                        onValueChange={formField.onChange} 
                                        defaultValue={formField.value}
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
                                        required={field.required}
                                        className="w-full bg-white"
                                      />
                                    )}
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition-colors">
                          Add Entry
                        </Button>
                      </form>
                    </FormProvider>
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
                          {Object.values(row).map((value, i) => (
                            <TableCell key={i} className="py-3">{value}</TableCell>
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