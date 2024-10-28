// @ts-nocheck
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from '@/lib/supabaseClient'


const DocumentUploadDialog = ({ isOpen, onClose, supplier, selectedMonth }) => {
  const [closingBalance, setClosingBalance] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${supplier.id}_${selectedMonth.year}_${selectedMonth.month + 1}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('Accounting-Portal')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Update database record
      const { data, error: updateError } = await supabase
        .from('supplier_documents')
        .upsert({
          supplier_id: supplier.id,
          year: selectedMonth.year,
          month: selectedMonth.month + 1,
          closing_balance: parseFloat(closingBalance),
          document_path: filePath,
          status: 'uploaded',
          is_verified: false
        });

      if (updateError) throw updateError;

      console.log('Document uploaded successfully', data);
      onClose();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document for {selectedMonth ? `${MONTHS[selectedMonth.month]} ${selectedMonth.year}` : ''}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="closingBalance">Closing Balance:</label>
              <Input 
                id="closingBalance" 
                type="number" 
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="document">Document:</label>
              <Input 
                id="document" 
                type="file" 
                onChange={(e) => setFile(e.target.files[0])}
                className="col-span-3" 
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button type="submit" onClick={() => {
                setSelectedSupplier(supplier);
                setSelectedMonth({ month: doc.month, year: doc.year });
                setUploadDialogOpen(true);
                }}>Upload</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadDialog;