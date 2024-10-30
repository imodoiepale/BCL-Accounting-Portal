// components/UploadComponent.tsx
// @ts-nocheck
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

interface UploadProps {
  onComplete: (data: any) => void;
}

export default function Upload({ onComplete }: UploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

      console.log('Extracted CSV Data:', parsedData);
      setData(parsedData);
    };

    reader.readAsText(e.target.files[0]);
  };

  const handleVerification = () => {
    if (data.length === 0) {
      toast.error("Please upload data first");
      return;
    }

    setLoading(true);
    // Simulate verification process
    setTimeout(() => {
      onComplete({ uploadedData: data });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Input type="file" accept=".csv" onChange={handleFileUpload} />
      
      {data.length > 0 && (
        <>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {Object.keys(data[0]).map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  {Object.values(row).map((value, i) => (
                    <TableCell key={i}>{value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button
            onClick={handleVerification}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Verifying..." : "Complete Verification"}
          </Button>
        </>
      )}
    </div>
  );
}
