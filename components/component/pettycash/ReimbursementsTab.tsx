// components/ReimbursementsTab.tsx
// ReimbursementsTab.tsx
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
  
  interface ReimbursementEntry extends BaseEntry {
    // Add reimbursement-specific fields here
    reimbursement_type: string;
  }

interface ReimbursementDialogProps {
    isOpen: boolean;
    onClose: () => void;
    entry: ReimbursementEntry | null;
    onSave: (entry: ReimbursementEntry) => Promise<void>;
    mode: 'create' | 'edit';
}

const ReimbursementDialog: React.FC<ReimbursementDialogProps> = ({
    isOpen,
    onClose,
    entry,
    onSave,
    mode
}) => {
    const initialFormState: ReimbursementEntry = {
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

    const [formData, setFormData] = useState<ReimbursementEntry>(entry || initialFormState);
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
                const uploadPath = `reimbursements/${Date.now()}_${receiptFile.name}`;
                receipt_url = await PettyCashService.uploadReceipt(receiptFile, uploadPath);
            }

            await onSave({ ...formData, receipt_url });
            onClose();
        } catch (error) {
            console.error('Error saving reimbursement:', error);
            toast.error('Failed to save reimbursement');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'New Reimbursement' : 'Edit Reimbursement'}</DialogTitle>
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

export function ReimbursementsTab() {
    const { userId } = useAuth();
    const [entries, setEntries] = useState<ReimbursementEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllColumns, setShowAllColumns] = useState(false);
    const [dialogState, setDialogState] = useState({
        isOpen: false,
        mode: 'create' as const,
        entry: null as ReimbursementEntry | null
    });

    const fetchEntries = async () => {
        setIsLoading(true);
        try {
            const data = await PettyCashService.fetchRecords('acc_portal_pettycash_reimbursements', userId);
            setEntries(data || []);
        } catch (error) {
            console.error('Error fetching reimbursements:', error);
            toast.error('Failed to fetch reimbursements');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, [userId]);

    const handleSave = async (entryData: ReimbursementEntry) => {
        try {
            if (dialogState.mode === 'create') {
                await PettyCashService.createRecord('acc_portal_pettycash_reimbursements', {
                    ...entryData,
                    userid: userId
                }, userId);
                toast.success('Reimbursement created successfully');
            } else {
                await PettyCashService.updateRecord('acc_portal_pettycash_reimbursements', entryData.id, entryData);
                toast.success('Reimbursement updated successfully');
            }
            fetchEntries();
        } catch (error) {
            console.error('Error saving reimbursement:', error);
            toast.error('Failed to save reimbursement');
        }
    };

    const handleDelete = async (entry: ReimbursementEntry) => {
        try {
            await PettyCashService.deleteRecord('acc_portal_pettycash_reimbursements', entry.id);
            toast.success('Reimbursement deleted successfully');
            fetchEntries();
        } catch (error) {
            console.error('Error deleting reimbursement:', error);
            toast.error('Failed to delete reimbursement');
        }
    };

    // Common column definitions for both tabs
    const columnDefinitions = [
        // Always visible columns
        {
            header: '#',
            width: '40px',
            cell: (_: any, index: number) => index + 1,
            alwaysVisible: true
        },
        {
            header: 'Customer Name',
            width: '200px',
            cell: (entry: any) => entry.customer_name,
            alwaysVisible: true
        },
        {
            header: 'Payment Reminder Date',
            width: '150px',
            cell: (entry: any) => format(new Date(entry.reminder_date), 'dd/MM/yyyy'),
            alwaysVisible: true
        },
        {
            header: 'Payment Date',
            width: '150px',
            cell: (entry: any) => entry.payment_date ? format(new Date(entry.payment_date), 'dd/MM/yyyy') : '-',
            alwaysVisible: true
        },
        {
            header: 'Balance',
            width: '120px',
            cell: (entry: any) => formatCurrency(entry.amount - (entry.paid_amount || 0)),
            alwaysVisible: true
        },
        {
            header: 'User',
            width: '150px',
            cell: (entry: any) => entry.user_name,
            alwaysVisible: true
        },
        {
            header: 'Account',
            width: '150px',
            cell: (entry: any) => entry.account_number,
            alwaysVisible: true
        },

        // Hidden columns (toggleable)
        {
            header: 'Account Type',
            width: '120px',
            cell: (entry: any) => entry.account_type,
            toggleable: true
        },
        {
            header: 'Account No.',
            width: '120px',
            cell: (entry: any) => entry.account_number,
            toggleable: true
        },
        {
            header: 'Supplier Name',
            width: '200px',
            cell: (entry: any) => entry.supplier_name,
            toggleable: true
        },
        {
            header: 'Supplier PIN/ID',
            width: '120px',
            cell: (entry: any) => entry.supplier_pin,
            toggleable: true
        },
        {
            header: 'Purchase Type',
            width: '120px',
            cell: (entry: any) => entry.purchase_type,
            toggleable: true
        },
        {
            header: 'Category',
            width: '150px',
            cell: (entry: any) => entry.category,
            toggleable: true
        },
        {
            header: 'Subcategory',
            width: '150px',
            cell: (entry: any) => entry.subcategory,
            toggleable: true
        },
        {
            header: 'Amount',
            width: '120px',
            cell: (entry: any) => formatCurrency(entry.amount),
            toggleable: true
        },
        {
            header: 'Description',
            width: '200px',
            cell: (entry: any) => entry.description,
            toggleable: true
        },
        {
            header: 'Paid Via/By',
            width: '120px',
            cell: (entry: any) => entry.paid_via,
            toggleable: true
        },
        {
            header: 'Payment Proof',
            width: '100px',
            cell: (entry: any) => entry.payment_proof_url ? (
                <Button
                    className="h-6 px-1.5 text-[11px] bg-blue-500 flex text-white items-center gap-0.5"
                    onClick={() => handleViewPaymentProof(entry)}
                >
                    <Eye size={12} /> View
                </Button>
            ) : '-',
            toggleable: true
        },
        {
            header: 'Bill/PCV Upload',
            width: '100px',
            cell: (entry: any) => entry.receipt_url ? (
                <Button
                    className="h-6 px-1.5 text-[11px] bg-blue-500 flex text-white items-center gap-0.5"
                    onClick={() => handleViewReceipt(entry)}
                >
                    <Eye size={12} /> View
                </Button>
            ) : '-',
            toggleable: true
        },
        {
            header: 'Status',
            width: '100px',
            cell: (entry: any) => (
                <span className={`px-2 py-1 rounded-full text-xs ${entry.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        entry.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                    }`}>
                    {entry.status}
                </span>
            ),
            toggleable: true
        },
        {
            header: 'Actions',
            width: '100px',
            cell: (entry: any) => (
                <TableActions
                    row={entry}
                    onEdit={() => handleEdit(entry)}
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
                                placeholder="Search reimbursements..."
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
                            New Reimbursement
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
                                            No reimbursements found
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

                {/* Add/Edit Reimbursement Dialog */}
                <ReimbursementDialog
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
export type { ReimbursementEntry };
export default ReimbursementsTab;