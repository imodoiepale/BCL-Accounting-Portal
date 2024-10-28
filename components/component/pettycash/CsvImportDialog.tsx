// @ts-nocheck
// components/CsvImportDialog.tsx
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCwIcon, Upload, Download, X } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-hot-toast';
import { PettyCashService } from './PettyCashService';
import { Card } from "@/components/ui/card";

interface CsvImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CSV_TEMPLATE_HEADERS = [
    'Supplier Name',
    'Supplier Type (Corporate/Individual)',
    'PIN (For Corporate)',
    'ID Number (For Individual)',
    'Mobile',
    'Email',
    'Trading Type (Purchase Only/Expense Only/Both Purchase + Expense)'
];



export const CsvImportDialog: React.FC<CsvImportDialogProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const { userId } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const downloadTemplate = () => {
        const csvContent = [
            CSV_TEMPLATE_HEADERS.join(','),
            'Example Corp,Corporate,A123456789P,N/A,+254712345678,example@corp.com,Both Purchase + Expense'
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'suppliers_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const parseCSV = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const rows = text.split('\n').map(row => row.split(','));
            const headers = rows[0];
            const data = rows.slice(1)
                .map(row => headers.reduce((acc, header, index) => ({
                    ...acc,
                    [header.trim()]: row[index]?.trim() || ''
                }), {}))
                .filter(row => Object.values(row).some(value => value));
            setPreviewData(data);
        };
        reader.readAsText(file);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'text/csv') {
                toast.error('Please upload a CSV file');
                return;
            }
            setFile(file);
            parseCSV(file);
        }
    };

    const handleSubmit = async () => {
        if (!previewData.length) {
            toast.error('No data to import');
            return;
        }

        setIsUploading(true);
        try {
            const suppliersData = previewData.map(row => ({
                userid: userId,
                data: {
                    supplierName: row['Supplier Name'],
                    supplierType: row['Supplier Type (Corporate/Individual)'],
                    pin: row['Supplier Type (Corporate/Individual)'] === 'Corporate' ? row['PIN (For Corporate)'] : null,
                    idNumber: row['Supplier Type (Corporate/Individual)'] === 'Individual' ? row['ID Number (For Individual)'] : null,
                    mobile: row['Mobile'],
                    email: row['Email'],
                    tradingType: row['Trading Type (Purchase Only/Expense Only/Both Purchase + Expense)']
                }
            }));

            await Promise.all(
                suppliersData.map(supplier =>
                    PettyCashService.createRecord('acc_portal_pettycash_suppliers', supplier)
                )
            );

            toast.success(`Successfully imported ${suppliersData.length} suppliers`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Failed to import suppliers');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Import Suppliers from CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file containing supplier information. Download the template to see the required format.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={downloadTemplate}
                            className="flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download Template
                        </Button>
                        <div className="flex items-center gap-2">
                            <Input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="w-[300px]"
                            />
                            {file && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setFile(null);
                                        setPreviewData([]);
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {previewData.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">Preview</h3>
                            <Card className="overflow-hidden">
                                <ScrollArea className="h-[300px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-blue-600 hover:bg-blue-600">
                                                {CSV_TEMPLATE_HEADERS.map((header, index) => (
                                                    <TableHead
                                                        key={index}
                                                        className="text-white h-8 text-xs font-medium"
                                                    >
                                                        {header}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewData.map((row, rowIndex) => (
                                                <TableRow key={rowIndex}>
                                                    {CSV_TEMPLATE_HEADERS.map((header, colIndex) => (
                                                        <TableCell
                                                            key={`${rowIndex}-${colIndex}`}
                                                            className="py-1 px-2 text-xs"
                                                        >
                                                            {row[header]}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </Card>

                            <Alert>
                                <AlertDescription>
                                    {previewData.length} suppliers found in CSV file. Please review the data before importing.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!previewData.length || isUploading}
                        className="bg-blue-600 text-white"
                    >
                        {isUploading ? (
                            <>
                                <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Import Suppliers
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CsvImportDialog;