// components/LoansTab.tsx
// LoansTab.tsx
// @ts-nocheck
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { RefreshCwIcon, Search, Plus, Eye } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { PettyCashService } from './PettyCashService';
import { TableActions } from './TableActions';
import { formatCurrency } from './currency';
import Image from 'next/image';

interface BaseEntry {
    id: string;
    customer_name: string;
    reminder_date: string;
    payment_date: string | null;
    amount: number;
    paid_amount: number;
    user_name: string;
    account_number: string;

    // Hidden fields
    account_type: string;
    supplier_name: string;
    supplier_pin: string;
    purchase_type: string;
    category: string;
    subcategory: string;
    description: string;
    paid_via: string;
    payment_proof_url: string | null;
    receipt_url: string | null;
    status: 'Pending' | 'Partially Paid' | 'Paid';

    created_at: string;
    updated_at: string;
    notes: string;
}

interface LoanEntry extends BaseEntry {
    // Add loan-specific fields here
    interest_rate: number;
    loan_term: number;
    collateral?: string;
}

interface LoanDialogProps {
    isOpen: boolean;
    onClose: () => void;
    entry: LoanEntry | null;
    onSave: (entry: LoanEntry) => Promise<void>;
    mode: 'create' | 'edit';
}

const LoanDialog: React.FC<LoanDialogProps> = ({
    isOpen,
    onClose,
    entry,
    onSave,
    mode
}) => {
    const initialFormState: LoanEntry = {
        id: '',
        amount: 0,
        customer_name: '',
        payment_status: 'Pending',
        paid_amount: 0,
        description: '',
        created_at: new Date().toISOString(),
        due_date: new Date().toISOString(),
        contact_number: '',
        email: '',
        notes: '',
        receipt_url: null
    };

    const [formData, setFormData] = useState<LoanEntry>(entry || initialFormState);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    useEffect(() => {
        setFormData(entry || initialFormState);
    }, [entry]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let receipt_url = formData.receipt_url;

            if (receiptFile) {
                const uploadPath = `Loans/${Date.now()}_${receiptFile.name}`;
                receipt_url = await PettyCashService.uploadReceipt(receiptFile, uploadPath);
            }

            await onSave({ ...formData, receipt_url });
            onClose();
        } catch (error) {
            console.error('Error saving Loan:', error);
            toast.error('Failed to save Loan');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'New Loan' : 'Edit Loan'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Customer Name *</Label>
                        <Input
                            name="customer_name"
                            value={formData.customer_name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Amount *</Label>
                            <Input
                                name="amount"
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Paid Amount</Label>
                            <Input
                                name="paid_amount"
                                type="number"
                                step="0.01"
                                value={formData.paid_amount}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                            name="due_date"
                            type="date"
                            value={formData.due_date.split('T')[0]}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Payment Status</Label>
                        <Select
                            value={formData.payment_status}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value as any }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Contact Number</Label>
                            <Input
                                name="contact_number"
                                value={formData.contact_number}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Receipt Upload</Label>
                        <Input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Input
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 text-white">
                            {mode === 'create' ? 'Create' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export function LoansTab() {
    const { userId } = useAuth();
    const [entries, setEntries] = useState<LoanEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllColumns, setShowAllColumns] = useState(false);
    const [dialogState, setDialogState] = useState({
        isOpen: false,
        mode: 'create' as const,
        entry: null as LoanEntry | null
    });

    const fetchEntries = async () => {
        setIsLoading(true);
        try {
            const data = await PettyCashService.fetchRecords('acc_portal_pettycash_loans', userId);
            setEntries(data || []);
        } catch (error) {
            console.error('Error fetching Loans:', error);
            toast.error('Failed to fetch Loans');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, [userId]);

    const handleSave = async (entryData: LoanEntry) => {
        try {
            if (dialogState.mode === 'create') {
                await PettyCashService.createRecord('acc_portal_pettycash_loans', {
                    ...entryData,
                    userid: userId
                }, userId);
                toast.success('Loan created successfully');
            } else {
                await PettyCashService.updateRecord('acc_portal_pettycash_loans', entryData.id, entryData);
                toast.success('Loan updated successfully');
            }
            fetchEntries();
        } catch (error) {
            console.error('Error saving Loan:', error);
            toast.error('Failed to save Loan');
        }
    };

    const handleDelete = async (entry: LoanEntry) => {
        try {
            await PettyCashService.deleteRecord('acc_portal_pettycash_loans', entry.id);
            toast.success('Loan deleted successfully');
            fetchEntries();
        } catch (error) {
            console.error('Error deleting Loan:', error);
            toast.error('Failed to delete Loan');
        }
    };

    const columnDefinitions = [
        {
            header: '#',
            width: '40px',
            cell: (_: any, index: number) => index + 1,
            alwaysVisible: true
        },
        {
            header: 'Date',
            width: '100px',
            cell: (entry: LoanEntry) => format(new Date(entry.created_at), 'dd/MM/yyyy'),
            alwaysVisible: true
        },
        {
            header: 'Amount',
            width: '120px',
            cell: (entry: LoanEntry) => formatCurrency(entry.amount),
            alwaysVisible: true
        },
        {
            header: 'Customer',
            width: '200px',
            cell: (entry: LoanEntry) => entry.customer_name,
            toggleable: true
        },
        {
            header: 'Status',
            width: '120px',
            cell: (entry: LoanEntry) => (
                <span className={`px-2 py-1 rounded-full text-xs ${entry.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                    entry.payment_status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {entry.payment_status}
                </span>
            ),
            toggleable: true
        },
        {
            header: 'Paid Amount',
            width: '120px',
            cell: (entry: LoanEntry) => formatCurrency(entry.paid_amount),
            toggleable: true
        },
        {
            header: 'Due Date',
            width: '100px',
            cell: (entry: LoanEntry) => format(new Date(entry.due_date), 'dd/MM/yyyy'),
            toggleable: true
        },
        {
            header: 'Actions',
            width: '100px',
            cell: (entry: LoanEntry) => (
                <TableActions
                    row={entry}
                    onEdit={() => setDialogState({
                        isOpen: true,
                        mode: 'edit',
                        entry
                    })}
                    onDelete={() => handleDelete(entry)}
                />
            ),
            alwaysVisible: true
        }
    ];

    const visibleColumns = columnDefinitions.filter(col =>
        col.alwaysVisible || (col.toggleable && showAllColumns)
    );

    const filteredEntries = entries.filter(entry =>
        entry.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex w-full bg-gray-100">
            <main className="flex-1 p-4 w-full">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="search"
                                placeholder="Search Loans..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 h-8 w-64"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={showAllColumns}
                                onCheckedChange={setShowAllColumns}
                            />
                            <Label>Show All Details</Label>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchEntries}
                            className="h-8"
                        >
                            <RefreshCwIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={() => setDialogState({
                                isOpen: true,
                                mode: 'create',
                                entry: null
                            })}
                            className="h-8 bg-blue-600 text-white"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            New Loan
                        </Button>
                    </div>
                </div>

                <Card className="overflow-hidden">
                    <ScrollArea className="h-[calc(100vh-200px)]">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-blue-600 hover:bg-blue-600">
                                    {visibleColumns.map((col, index) => (
                                        <TableHead
                                            key={index}
                                            style={{ width: col.width }}
                                            className="text-white h-8 text-xs font-medium border-r border-blue-500 last:border-r-0"
                                        >
                                            {col.header}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleColumns.length} className="h-32 text-center">
                                            <RefreshCwIcon className="h-8 w-8 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredEntries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleColumns.length} className="h-32 text-center">
                                            No Loans found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredEntries.map((entry, index) => (
                                        <TableRow
                                            key={entry.id}
                                            className="hover:bg-blue-50 border-b border-gray-100 transition-colors [&>td]:h-8"
                                        >
                                            {visibleColumns.map((col, colIndex) => (
                                                <TableCell
                                                    key={`${entry.id}-${colIndex}`}
                                                    style={{ width: col.width }}
                                                    className="py-1 px-2 text-xs border-r border-gray-100 last:border-r-0"
                                                >
                                                    {col.cell(entry, index)}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </Card>

                {/* Receipt Preview Dialog */}
                <Dialog
                    open={Boolean(dialogState.entry?.receipt_url)}
                    onOpenChange={() => setDialogState(prev => ({ ...prev, entry: null }))}>
                    <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                        <DialogHeader className="p-4 border-b">
                            <DialogTitle>Receipt Preview</DialogTitle>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (dialogState.entry?.receipt_url) {
                                            window.open(
                                                `https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${dialogState.entry.receipt_url}`,
                                                '_blank'
                                            );
                                        }
                                    }}
                                >
                                    Download
                                </Button>
                            </div>
                        </DialogHeader>
                        {dialogState.entry?.receipt_url && (
                            <div className="relative w-full h-[calc(90vh-100px)] bg-gray-50">
                                <Image
                                    src={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${dialogState.entry.receipt_url}`}
                                    alt="Receipt"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Add/Edit Loan Dialog */}
                <LoanDialog
                    isOpen={dialogState.isOpen}
                    onClose={() => setDialogState({ isOpen: false, mode: 'create', entry: null })}
                    entry={dialogState.entry}
                    onSave={handleSave}
                    mode={dialogState.mode}
                />
            </main>
        </div>
    );
}

// Export types for use in other components
export type { LoanEntry };
export default LoansTab;