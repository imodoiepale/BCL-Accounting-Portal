// components/overview/Dialogs/ImportDialog.tsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (file: File) => Promise<void>;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ isOpen, onClose, onImport }) => {
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await onImport(file);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Import Data</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};