// @ts-nocheck

// components/PaymentHistoryDialog.tsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { format } from 'date-fns';
import { PaymentTracking, PettyCashEntry } from '../types/paymentTypes';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0
  }).format(amount);
};

interface PaymentHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entry: PettyCashEntry | null;
  paymentHistory: PaymentTracking[];
  onRecordPayment: () => void;
}

export const PaymentHistoryDialog: React.FC<PaymentHistoryDialogProps> = ({
  isOpen,
  onClose,
  entry,
  paymentHistory,
  onRecordPayment
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Customer: {entry?.supplier_name}</h3>
              <div className="text-sm text-gray-500 space-y-1">
                <p>Total Amount: {formatCurrency(entry?.amount || 0)}</p>
                <p>Paid Amount: {formatCurrency(entry?.paid_amount || 0)}</p>
                <p>Balance: {formatCurrency((entry?.amount || 0) - (entry?.paid_amount || 0))}</p>
              </div>
            </div>
            <Button
              onClick={onRecordPayment}
              className="bg-blue-600 text-white"
            >
              Record New Payment
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No payment history found
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentHistory.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell>{format(new Date(payment.payment_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{formatCurrency(payment.payment_amount)}</TableCell>
                      <TableCell className="capitalize">{payment.payment_method}</TableCell>
                      <TableCell>{payment.reference_number}</TableCell>
                      <TableCell>{payment.notes}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentHistoryDialog;