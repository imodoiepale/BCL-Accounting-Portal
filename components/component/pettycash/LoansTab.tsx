// @ts-nocheck
// LoansTab.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCwIcon, Search, FilterIcon, Download, RotateCcw, Loader2, Eye, Plus } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { format } from 'date-fns';
import { PettyCashService } from './PettyCashService';
import { TableActions } from './TableActions';
import PettyCashEntryForm from './EntryForm';
import { Switch } from "@/components/ui/switch";

interface PettyCashEntry {
    id: string;
    invoice_date: string;
    invoice_number: string;
    amount: number;
    description: string;
    user_name: string;
    account_type: string;
    petty_cash_account: string;
    supplier_name: string;
    supplier_pin: string;
    purchase_type: string;
    expense_category: string;
    subcategory: string;
    paid_via: string;
    checked_by: string;
    approved_by: string;
    receipt_url: string | null;
    payment_proof_url: string | null;
    created_at: string;
    status: 'pending' | 'checked' | 'approved';
    // Loan specific fields
    interest_rate?: number;
    loan_term?: number;
    due_date?: string;
    paid_amount?: number;
}

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0
    }).format(amount);
};

export function LoansTab() {
    const { userId } = useAuth();
    const [entries, setEntries] = useState<PettyCashEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllColumns, setShowAllColumns] = useState(false);

    const initialFormState: PettyCashEntry = {
        id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        invoice_number: '',
        amount: 0,
        description: '',
        user_name: '',
        account_type: '',
        petty_cash_account: '',
        supplier_name: '',
        supplier_pin: '',
        purchase_type: '',
        expense_category: 'LOAN',
        subcategory: 'LOAN',
        paid_via: '',
        checked_by: '',
        approved_by: '',
        receipt_url: null,
        payment_proof_url: null,
        created_at: new Date().toISOString(),
        status: 'pending',
        interest_rate: 0,
        loan_term: 0,
        due_date: new Date().toISOString().split('T')[0],
        paid_amount: 0
    };

    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        mode: 'create' | 'edit';
        entry: PettyCashEntry | null;
    }>({
        isOpen: false,
        mode: 'create',
        entry: null
    });

    const [receiptPreview, setReceiptPreview] = useState<{
        isOpen: boolean;
        url: string | null;
        rotation: number;
    }>({
        isOpen: false,
        url: null,
        rotation: 0
    });

    const [paymentProofPreview, setPaymentProofPreview] = useState<{
        isOpen: boolean;
        url: string | null;
        rotation: number;
    }>({
        isOpen: false,
        url: null,
        rotation: 0
    });

    const fetchEntries = async () => {
        setIsLoading(true);
        try {
            const data = await PettyCashService.fetchRecords('acc_portal_pettycash_entries', userId);
            const loanEntries = data.filter(entry => {
                const category = entry.expense_category?.toLowerCase() || '';
                return category === 'loan' || category.includes('loan');
            });
            setEntries(loanEntries);
        } catch (error) {
            console.error('Error fetching entries:', error);
            toast.error('Failed to fetch entries');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, [userId]);

    const handleCreateEntry = () => {
        setDialogState({
            isOpen: true,
            mode: 'create',
            entry: {
                ...initialFormState,
                expense_category: 'LOAN',
                subcategory: 'LOAN'
            }
        });
    };

    const handleSaveEntry = async (entry: PettyCashEntry) => {
        try {
            if (dialogState.mode === 'create') {
                const newEntry = {
                    ...entry,
                    expense_category: 'LOAN',
                    subcategory: 'LOAN',
                    userid: userId,
                    created_at: new Date().toISOString()
                };
                await PettyCashService.createRecord('acc_portal_pettycash_entries', newEntry, userId);
                toast.success('Loan created successfully');
            } else {
                await PettyCashService.updateRecord('acc_portal_pettycash_entries', entry.id, {
                    ...entry,
                    expense_category: 'LOAN',
                    subcategory: 'LOAN'
                });
                toast.success('Loan updated successfully');
            }
            fetchEntries();
            setDialogState({ isOpen: false, mode: 'create', entry: null });
        } catch (error) {
            console.error('Error saving entry:', error);
            toast.error('Failed to save loan');
        }
    };

    const handleDeleteEntry = async (entry: PettyCashEntry) => {
        try {
            await PettyCashService.deleteRecord('acc_portal_pettycash_entries', entry.id);
            toast.success('Loan deleted successfully');
            fetchEntries();
        } catch (error) {
            console.error('Error deleting entry:', error);
            toast.error('Failed to delete loan');
        }
    };

    const handleViewReceipt = (entry: PettyCashEntry) => {
        if (entry.receipt_url) {
            setReceiptPreview({
                isOpen: true,
                url: entry.receipt_url,
                rotation: 0
            });
        }
    };

    const handleViewPaymentProof = (entry: PettyCashEntry) => {
        if (entry.payment_proof_url) {
            setPaymentProofPreview({
                isOpen: true,
                url: entry.payment_proof_url,
                rotation: 0
            });
        }
    };

    const paymentTrackingColumns = [
        {
            header: 'Customer Name',
            width: '150px',
            cell: (entry: any) => entry.supplier_name || '-',
            alwaysVisible: true
        },
        {
            header: 'Total Amount',
            width: '120px',
            cell: (entry: any) => formatCurrency(entry.amount),
            alwaysVisible: true
        },
        {
            header: 'Paid Amount',
            width: '120px',
            cell: (entry: any) => formatCurrency(entry.paid_amount || 0),
            alwaysVisible: true
        },
        {
            header: 'Balance',
            width: '120px',
            cell: (entry: any) => formatCurrency((entry.amount || 0) - (entry.paid_amount || 0)),
            alwaysVisible: true
        },
        {
            header: 'Last Payment Date',
            width: '120px',
            cell: (entry: any) => entry.last_payment_date ?
                format(new Date(entry.last_payment_date), 'dd/MM/yyyy') : '-',
            alwaysVisible: true
        },
        {
            header: 'Next Payment Date',
            width: '120px',
            cell: (entry: any) => entry.next_payment_date ?
                format(new Date(entry.next_payment_date), 'dd/MM/yyyy') : '-',
            alwaysVisible: true
        },
        {
            header: 'Payment Status',
            width: '120px',
            cell: (entry: any) => {
                const balance = (entry.amount || 0) - (entry.paid_amount || 0);
                const status = balance <= 0 ? 'Paid' :
                    entry.paid_amount > 0 ? 'Partial' : 'Pending';
                const colors = {
                    'Paid': 'bg-green-100 text-green-800',
                    'Partial': 'bg-yellow-100 text-yellow-800',
                    'Pending': 'bg-red-100 text-red-800'
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs ${colors[status]}`}>
                        {status}
                    </span>
                );
            },
            alwaysVisible: true
        }
    ];


    // Column definitions
    const columnDefinitions = [

        {
            header: '#',
            width: '40px',
            cell: (_: any, index: number) => <div className="font-bold text-center">{index + 1}</div>,
            alwaysVisible: true
        },
        {
            header: 'Date',
            width: '100px',
            cell: (entry: PettyCashEntry) => format(new Date(entry.invoice_date), 'dd/MM/yyyy'),
            alwaysVisible: true
        },
        {
            header: <div className="">User</div>,
            width: '150px',
            cell: (entry: PettyCashEntry) => <div className="text-nowrap ">{entry.user_name || '-'}</div>,
            alwaysVisible: true
        },
        {
            header: <div className="text-center">Account Type</div>,
            width: '120px',
            cell: (entry: PettyCashEntry) => (
                <div className="capitalize text-center">
                    {entry.account_type?.replace('_', ' ') || '-'}
                </div>
            ),
            toggleable: true
        },
        {
            header: <div className="text-center">Account No.</div>,
            width: '120px',
            cell: (entry: PettyCashEntry) => entry.petty_cash_account || '-',
            toggleable: true
        },
        {
            header: 'Supplier Name',
            width: '150px',
            cell: (entry: PettyCashEntry) => entry.supplier_name || '-',
            toggleable: true
        },
        {
            header: 'Supplier PIN/ID',
            width: '120px',
            cell: (entry: PettyCashEntry) => entry.supplier_pin || '-',
            toggleable: true
        },
        {
            header: 'Purchase Type',
            width: '120px',
            cell: (entry: PettyCashEntry) => (
                <div className="capitalize">
                    {entry.purchase_type ? entry.purchase_type.charAt(0).toUpperCase() + entry.purchase_type.slice(1) : '-'}
                </div>
            ),
            toggleable: true
        },
        {
            header: 'Amount',
            width: '120px',
            cell: (entry: PettyCashEntry) => formatCurrency(entry.amount),
            toggleable: true
        },
        ...paymentTrackingColumns,
        {
            header: 'Description',
            width: '200px',
            cell: (entry: PettyCashEntry) => entry.description,
            toggleable: true
        },
        {
            header: 'Paid Via/By',
            width: '120px',
            cell: (entry: PettyCashEntry) => entry.checked_by || '-',
            toggleable: true
        },
        {
            header: 'Payment Proof',
            width: '100px',
            cell: (entry: PettyCashEntry) => entry.payment_proof_url ? (
                <Button
                    className="h-6 px-1.5 text-[11px] bg-blue-500 flex text-white items-center gap-0.5"
                    onClick={() => handleViewPaymentProof(entry)}
                >
                    <Eye size={12} /> View
                </Button>) : <div className="flex justify-center"><span className="text-red-500 font-bold text-center">Missing</span></div>,
            toggleable: true
        },
        {
            header: 'Bill/PCV Upload',
            width: '100px',
            cell: (entry: PettyCashEntry) => entry.receipt_url ? (
                <Button
                    className="h-6 px-1.5 text-[11px] bg-blue-500 flex text-white items-center gap-0.5"
                    onClick={() => handleViewReceipt(entry)}
                >
                    <Eye size={12} /> View
                </Button>) : <div className="flex justify-center"><span className="text-red-500 font-bold text-center">Missing</span></div>,
            toggleable: true
        },
        {
            header: 'Status',
            width: '100px',
            cell: (entry: PettyCashEntry) => (
                <span className={`px-2 py-1 rounded-full text-xs ${entry.approved_by ? 'bg-green-100 text-green-800' :
                    entry.checked_by ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {entry.approved_by ? 'Approved' :
                        entry.checked_by ? 'Checked' :
                            'Pending'}
                </span>
            ),
            toggleable: true
        },
        {
            header: 'Actions',
            width: '100px',
            cell: (entry: PettyCashEntry) => (
                <TableActions
                    row={entry}
                    onEdit={() => setDialogState({
                        isOpen: true,
                        mode: 'edit',
                        entry
                    })}
                    onDelete={() => handleDeleteEntry(entry)}
                />
            ),
            alwaysVisible: true
        },
        {
            header: 'Payment History',
            width: '100px',
            cell: (entry: any) => (
                <Button
                    className="h-6 px-1.5 text-[11px] bg-blue-500 flex text-white items-center gap-0.5"
                    onClick={() => handleViewPaymentHistory(entry)}
                >
                    <Eye size={12} /> View
                </Button>
            ),
            toggleable: true
        }
    ];

    const visibleColumns = columnDefinitions.filter(col =>
        col.alwaysVisible || (col.toggleable && showAllColumns)
    );

    const filteredEntries = entries.filter(entry =>
        entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.petty_cash_account?.toLowerCase().includes(searchQuery.toLowerCase())
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
                                placeholder="Search loans..."
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
                            onClick={handleCreateEntry}
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
                            <TableHeader className="sticky top-0 bg-blue-800 z-10">
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
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="rounded-full bg-gray-100 p-3 mb-2">
                                                    <Search className="h-6 w-6 text-gray-400" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">No Loans Found</span>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {searchQuery
                                                        ? 'No loans match your search criteria'
                                                        : 'Get started by adding your first loan'}
                                                </p>
                                            </div>
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

                {/* Document Preview Dialogs */}
                <Dialog
                    open={receiptPreview.isOpen}
                    onOpenChange={(open) => setReceiptPreview(prev => ({ ...prev, isOpen: open }))}
                >
                    <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                        <DialogHeader className="p-4 border-b">
                            <DialogTitle>Loan Document Preview</DialogTitle>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setReceiptPreview(prev => ({
                                        ...prev,
                                        rotation: ((prev.rotation || 0) + 90) % 360
                                    }))}
                                >
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    Rotate
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        if (receiptPreview.url) {
                                            const response = await fetch(
                                                `https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${receiptPreview.url}`
                                            );
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `loan-document-${receiptPreview.url}`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            window.URL.revokeObjectURL(url);
                                        }
                                    }}
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                </Button>
                            </div>
                        </DialogHeader>
                        {receiptPreview.url && (
                            <div className="relative w-full h-[calc(90vh-100px)] bg-gray-50 group">
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                </div>
                                <Image
                                    src={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${receiptPreview.url}`}
                                    alt="Loan Document"
                                    fill
                                    className="transition-transform duration-300 ease-in-out hover:scale-150 cursor-zoom-in"
                                    style={{
                                        objectFit: 'contain',
                                        transform: `rotate(${receiptPreview.rotation || 0}deg)`,
                                        transition: 'transform 0.3s ease-in-out'
                                    }}
                                    priority
                                    onLoadingComplete={(image) => {
                                        image.classList.remove('opacity-0');
                                        image.classList.add('opacity-100');
                                    }}
                                />
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Entry Form Dialog */}
                <Dialog
                    open={dialogState.isOpen}
                    onOpenChange={(open) => !open && setDialogState(prev => ({ ...prev, isOpen: false }))}
                >
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>
                                {dialogState.mode === 'create' ? 'New Loan' : 'Edit Loan'}
                            </DialogTitle>
                        </DialogHeader>
                        <PettyCashEntryForm
                            mode={dialogState.mode}
                            initialData={dialogState.entry}
                            onSubmit={handleSaveEntry}
                            onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
                            userId={userId}
                            onSuccess={fetchEntries}
                        />
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}

export default LoansTab;
