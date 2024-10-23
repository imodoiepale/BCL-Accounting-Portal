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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface TableActionsProps {
    row: any;
    onEdit: (row: any) => void;
    onDelete: (row: any) => void;
    onVerify?: (row: any) => void;
    isVerified?: boolean;
    editForm: React.ComponentType<any>;  // Accept component instead of function
    editFormProps?: any;                 // Additional props for the form
    showVerify?: boolean;
}

export const TableActions: React.FC<TableActionsProps> = ({
    row,
    onEdit,
    onDelete,
    onVerify,
    isVerified = false,
    editForm: EditForm,
    editFormProps = {},
    showVerify = true
}) => {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditSheet, setShowEditSheet] = useState(false);
    return (
        <div className="flex items-center gap-2">
            {/* {showVerify && (
                <Badge
                    variant={isVerified ? "success" : "destructive"}
                    className="h-6 cursor-default"
                >
                    {isVerified ? (
                        <Check className="h-3 w-3 mr-1" />
                    ) : (
                        <X className="h-3 w-3 mr-1" />
                    )}
                    {isVerified ? "Verified" : "Unverified"}
                </Badge>
            )} */}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setShowEditSheet(true)}>
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
                    {showVerify && !isVerified && (
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
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the record
                            and remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                onDelete(row);
                                setShowDeleteDialog(false);
                            }}
                            className="bg-red-600"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Sheet */}
            <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Edit Record</SheetTitle>
                        <SheetDescription>
                            Make changes to the record here. Click save when done.
                        </SheetDescription>
                    </SheetHeader>
                    <EditForm
                        entry={row}
                        onClose={() => setShowEditSheet(false)}
                        onSubmit={async (updatedData) => {
                            await onEdit(updatedData);
                            setShowEditSheet(false);
                        }}
                        {...editFormProps}
                    />
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default TableActions;