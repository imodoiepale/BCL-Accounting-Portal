// @ts-nocheck
// components/SupplierDialog.tsx

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from 'lucide-react';
import { SupplierForm } from './SupplierForm';
import { SupplierData } from './supplier';

interface SupplierDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: SupplierData) => Promise<void>;
    editingSupplier?: SupplierData | null;
    mode: 'create' | 'edit';
}

export const SupplierDialog: React.FC<SupplierDialogProps> = ({
    isOpen,
    onClose,
    onSubmit,
    editingSupplier = null,
    mode = 'create'
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {mode === 'create' ? 'Add New Supplier' : 'Edit Supplier'}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500">
                        {mode === 'create'
                            ? 'Add a new supplier to your system. Fields marked with * are required.'
                            : 'Update the supplier information. Fields marked with * are required.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <Alert className="bg-blue-50 border-blue-200 mb-4">
                    <InfoIcon className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-sm text-blue-700">
                        Select supplier type to show relevant identification fields:
                        <ul className="list-disc list-inside mt-1 ml-1">
                            <li>Corporate suppliers require a PIN</li>
                            <li>Individual suppliers require an ID number</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                <Card className="p-4">
                    <SupplierForm
                        onSubmit={onSubmit}
                        initialData={editingSupplier}
                        mode={mode}
                    />
                </Card>
            </DialogContent>
        </Dialog>
    );
};

export default SupplierDialog;