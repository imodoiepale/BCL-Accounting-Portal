// components/overview/dialogs/ImportDialog.tsx
// @ts-nocheck
"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Upload } from 'lucide-react';
import { handleFileImport } from '../../utility';

interface ImportDialogProps {
    isImportDialogOpen: boolean;
    setIsImportDialogOpen: () => void;
    processedSections: any[];
    onImport: (data: any) => void;
}

export const ImportDialog = React.memo(({ isImportDialogOpen, setIsImportDialogOpen, onImport, processedSections }: ImportDialogProps) => {
  // Create a file input ref to handle the file selection
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      await handleFileImport(e);
      setIsImportDialogOpen(); // Close dialog after successful import
    } catch (error) {
      console.error('Error during file import:', error);
      // Error handling is already done in handleFileImport with toast
    }
  };

  return (
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Import Data</DialogTitle>
                        <DialogDescription>
                            Upload your Excel or CSV file to import data
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <div className="flex items-center justify-center w-full p-6 border-2 border-dashed rounded-lg border-gray-300 hover:border-primary">
                                <div className="text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="mt-2">Click to upload or drag and drop</div>
                                    <div className="mt-1 text-sm text-gray-500">XLSX, CSV files supported</div>
                                </div>
                            </div>
                            <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept=".xlsx,.csv"
                                onChange={handleFileImport}
                            />
                        </label>
                    </div>
                </DialogContent>
            </Dialog>
        )
    });

ImportDialog.displayName = 'ImportDialog';