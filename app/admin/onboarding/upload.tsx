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
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div className="w-full">
          <div className="flex justify-between mb-2">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className={`flex flex-col items-center w-1/5 relative ${stage.id === currentStage
                    ? "text-primary"
                    : stage.id < currentStage
                      ? "text-primary/60"
                      : "text-gray-400"
                  }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${stage.id === currentStage
                      ? "bg-primary text-white"
                      : stage.id < currentStage
                        ? "bg-primary/60 text-white"
                        : "bg-gray-200"
                    }`}
                >
                  {stage.id}
                </div>
                <span className="text-xs text-center">{stage.name}</span>
                {stage.id < stages.length && (
                  <div
                    className={`absolute top-4 left-[60%] w-full h-[2px] ${stage.id < currentStage
                        ? "bg-primary/60"
                        : "bg-gray-200"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Stage {currentStage}: {stages[currentStage - 1].name}</h2>
        <div className="space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Add Manually</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[1200px] w-[95vw]">
              <DialogHeader>
                <DialogTitle>Add {stages[currentStage - 1].name}</DialogTitle>
              </DialogHeader>
              <FormProvider {...methods}>
  <form onSubmit={methods.handleSubmit(handleManualEntry)} className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      {getFormFields().map((field) => (
        <FormField
          key={field.name}
          control={methods.control}
          name={field.name}
          render={({ field: formField }) => (
            <FormItem className={field.type === 'select' ? 'col-span-1' : field.name.includes('address') ? 'col-span-2' : 'col-span-1'}>
              <FormLabel className="font-medium">{field.label}</FormLabel>
              <FormControl>
                {field.type === 'select' ? (
                  <Select 
                    onValueChange={formField.onChange} 
                    defaultValue={formField.value}
                  >
                    <SelectTrigger className="w-full">
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
                    className={field.name.includes('address') ? 'w-full' : 'w-full'}
                  />
                )}
              </FormControl>
            </FormItem>
          )}
        />
      ))}
    </div>
    <Button type="submit" className="w-full mt-4">Add Entry</Button>
  </form>
</FormProvider>

        </DialogContent>
      </Dialog>
          <Input type="file" accept=".csv" onChange={handleFileUpload} className="w-[300px]" />
        </div>
      </div>

      {data[currentStage]?.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {Object.keys(data[currentStage][0]).map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data[currentStage].map((row, index) => (
                <TableRow key={index}>
                  {Object.values(row).map((value, i) => (
                    <TableCell key={i}>{value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button onClick={handleSkip} variant="outline">
          Skip this stage
        </Button>
        <Button
          onClick={handleVerification}
          disabled={loading}
        >
          {loading ? "Verifying..." : currentStage === 5 ? "Complete All Stages" : "Next Stage"}
        </Button>
      </div>
    </div>
  );
}