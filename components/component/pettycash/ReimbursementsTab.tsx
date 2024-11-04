// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { RefreshCwIcon, Search, FilterIcon, Download, RotateCcw, Loader2, Eye, Plus } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { PettyCashService } from './PettyCashService';
import { TableActions } from './TableActions';
import Image from 'next/image';
import PettyCashEntryForm from './EntryForm';

interface ReimbursementEntry {
    id: string;
    amount: number;
    description: string;
    user_name: string;
    account_type: string;
    account_number: string;
    supplier_name: string;
    supplier_pin: string;
    purchase_type: string;
    category: string;
    subcategory: string;
    paid_via: string;
    payment_proof_url: string | null;
    receipt_url: string | null;
    status: 'Pending' | 'Partially Paid' | 'Paid';
    created_at: string;
    notes: string;
    paid_amount: number;
}

export function ReimbursementsTab() {
    const { userId } = useAuth();
    const [entries, setEntries] = useState<ReimbursementEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllColumns, setShowAllColumns] = useState(false);
    const [users, setUsers] = useState([]);
    const [accounts, setAccounts] = useState([]);

    const [dialogState, setDialogState] = useState({
        isOpen: false,
        mode: 'create' as const,
        entry: null as ReimbursementEntry | null
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
            const data = await PettyCashService.fetchFilteredEntries(
                'acc_portal_pettycash_entries',
                userId,
                'reimbursement'
            );
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
        fetchUsers();
        fetchAccounts();
    }, [userId]);

    const fetchUsers = async () => {
        try {
            const userData = await PettyCashService.fetchUserRecords(userId);
            setUsers(userData);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchAccounts = async () => {
        try {
            const accountData = await PettyCashService.fetchAccountRecords(userId);
            setAccounts(accountData);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const handleSave = async (entryData: ReimbursementEntry) => {
        try {
            const dataWithCategory = {
                ...entryData,
                category: 'reimbursement',
                userid: userId
            };

            if (dialogState.mode === 'create') {
                await PettyCashService.createRecord('acc_portal_pettycash_entries', dataWithCategory);
                toast.success('Reimbursement created successfully');
            } else {
                await PettyCashService.updateRecord('acc_portal_pettycash_entries', entryData.id, dataWithCategory);
                toast.success('Reimbursement updated successfully');
            }
            fetchEntries();
            setDialogState({ isOpen: false, mode: 'create', entry: null });
        } catch (error) {
            console.error('Error saving reimbursement:', error);
            toast.error('Failed to save reimbursement');
        }
    };

    const handleDelete = async (entry: ReimbursementEntry) => {
        try {
            await PettyCashService.deleteRecord('acc_portal_pettycash_entries', entry.id);
            toast.success('Reimbursement deleted successfully');
            fetchEntries();
        } catch (error) {
            console.error('Error deleting reimbursement:', error);
            toast.error('Failed to delete reimbursement');
        }
    };

    const handleViewReceipt = (entry: ReimbursementEntry) => {
        if (entry.receipt_url) {
            setReceiptPreview({
                isOpen: true,
                url: entry.receipt_url,
                rotation: 0
            });
        }
    };

    const handleViewPaymentProof = (entry: ReimbursementEntry) => {
        if (entry.payment_proof_url) {
            setPaymentProofPreview({
                isOpen: true,
                url: entry.payment_proof_url,
                rotation: 0
            });
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
            cell: (entry: ReimbursementEntry) => format(new Date(entry.created_at), 'dd/MM/yyyy'),
            alwaysVisible: true
        },
        {
            header: 'Amount',
            width: '120px',
            cell: (entry: ReimbursementEntry) => (
                <div className="font-medium">
                    {new Intl.NumberFormat('en-KE', {
                        style: 'currency',
                        currency: 'KES',
                    }).format(entry.amount)}
                </div>
            ),
            alwaysVisible: true
        },
        {
            header: 'Status',
            width: '100px',
            cell: (entry: ReimbursementEntry) => (
                <span className={`px-2 py-1 rounded-full text-xs ${entry.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        entry.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                    }`}>
                    {entry.status}
                </span>
            ),
            alwaysVisible: true
        },
        {
            header: 'User',
            width: '150px',
            cell: (entry: ReimbursementEntry) => entry.user_name,
            toggleable: true
        },
        {
            header: 'Account',
            width: '150px',
            cell: (entry: ReimbursementEntry) => entry.account_number,
            toggleable: true
        },
        {
            header: 'Description',
            width: '200px',
            cell: (entry: ReimbursementEntry) => entry.description,
            toggleable: true
        },
        {
            header: 'Receipt',
            width: '100px',
            cell: (entry: ReimbursementEntry) => entry.receipt_url ? (
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
            header: 'Payment Proof',
            width: '100px',
            cell: (entry: ReimbursementEntry) => entry.payment_proof_url ? (
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
            header: 'Actions',
            width: '100px',
            cell: (entry: ReimbursementEntry) => (
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
        entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.account_number?.toLowerCase().includes(searchQuery.toLowerCase())
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
                                        <TableCell
                                            colSpan={visibleColumns.length}
                                            className="h-32 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <RefreshCwIcon className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                                                <span className="text-sm text-gray-500">Loading reimbursements...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredEntries.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={visibleColumns.length}
                                            className="h-32 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="rounded-full bg-gray-100 p-3 mb-2">
                                                    <Search className="h-6 w-6 text-gray-400" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">No Reimbursements Found</span>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {searchQuery
                                                        ? 'No reimbursements match your search criteria'
                                                        : 'Get started by adding your first reimbursement'}
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
                            <DialogTitle>Receipt Preview</DialogTitle>
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
                                        try {
                                            const response = await fetch(
                                                `https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${receiptPreview.url}`
                                            );
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `receipt-${receiptPreview.url}`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            window.URL.revokeObjectURL(url);
                                        } catch (error) {
                                            console.error('Download failed:', error);
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
                                    alt="Receipt"
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

                {/* Payment Proof Preview Dialog */}
                <Dialog
                    open={paymentProofPreview.isOpen}
                    onOpenChange={(open) => setPaymentProofPreview(prev => ({ ...prev, isOpen: open }))}
                >
                    <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                        <DialogHeader className="p-4 border-b">
                            <DialogTitle>Payment Proof Preview</DialogTitle>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPaymentProofPreview(prev => ({
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
                                        try {
                                            const response = await fetch(
                                                `https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${paymentProofPreview.url}`
                                            );
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `payment-proof-${paymentProofPreview.url}`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            window.URL.revokeObjectURL(url);
                                        } catch (error) {
                                            console.error('Download failed:', error);
                                        }
                                    }}
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                </Button>
                            </div>
                        </DialogHeader>
                        {paymentProofPreview.url && (
                            <div className="relative w-full h-[calc(90vh-100px)] bg-gray-50 group">
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                </div>
                                <Image
                                    src={`https://zyszsqgdlrpnunkegipk.supabase.co/storage/v1/object/public/Accounting-Portal/${paymentProofPreview.url}`}
                                    alt="Payment Proof"
                                    fill
                                    className="transition-transform duration-300 ease-in-out hover:scale-150 cursor-zoom-in"
                                    style={{
                                        objectFit: 'contain',
                                        transform: `rotate(${paymentProofPreview.rotation || 0}deg)`,
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

                {/* Edit/Create Form Dialog - Import and use your EntryForm component here */}
                <Dialog
                    open={dialogState.isOpen}
                    onOpenChange={(open) => !open && setDialogState(prev => ({ ...prev, isOpen: false }))}
                >
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>
                                {dialogState.mode === 'create' ? 'New Reimbursement' : 'Edit Reimbursement'}
                            </DialogTitle>
                        </DialogHeader>
                        <PettyCashEntryForm
                            mode={dialogState.mode}
                            initialData={dialogState.entry}
                            onSubmit={handleSave}
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

export default ReimbursementsTab;