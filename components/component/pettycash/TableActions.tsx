// @ts-nocheck
"use client";

import React, { useState } from 'react';
import { MoreHorizontal, Check, X, Pencil, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'react-hot-toast';

interface TableActionsProps {
    row: any;
    onEdit: (row: any) => void; // Changed to just call the callback
    onDelete: (row: any) => void;
    onVerify?: (row: any) => void;
    isVerified?: boolean;
    editFormProps?: any;
    showVerify?: boolean;
    dialogTitle?: string;
    dialogDescription?: string;
    deleteWarning?: string;
}

export const TableActions: React.FC<TableActionsProps> = ({
    row,
    onEdit,
    onDelete,
    onVerify,
    isVerified = false,
    showVerify = true,
    dialogTitle = "Edit Record",
    dialogDescription = "Make changes to this record. Click save when you're done.",
    deleteWarning = "This action cannot be undone. This will permanently delete the record and remove all associated data."
}) => {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEditClick = () => {
        onEdit(row);
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            await onDelete(row);
            setShowDeleteDialog(false);
            toast.success('Record deleted successfully');
        } catch (error) {
            console.error('Error deleting record:', error);
            toast.error('Failed to delete record');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleEditClick}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-600"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                    {showVerify && !isVerified && onVerify && (
                        <DropdownMenuItem onClick={() => onVerify(row)}>
                            <Check className="mr-2 h-4 w-4" />
                            Verify
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>{deleteWarning}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default TableActions;