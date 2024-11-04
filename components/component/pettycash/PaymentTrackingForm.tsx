// @ts-nocheck

// components/PaymentTrackingForm.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PaymentTracking, PettyCashEntry } from '../types/paymentTypes';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0
  }).format(amount);
};

interface PaymentTrackingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payment: PaymentTracking) => Promise<void>;
  entry: PettyCashEntry | null;
}

export const PaymentTrackingForm: React.FC<PaymentTrackingFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  entry
}) => {
  const [payment, setPayment] = useState<PaymentTracking>({
    payment_date: new Date().toISOString().split('T')[0],
    payment_amount: 0,
    payment_method: '',
    reference_number: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(payment);
    onClose();
  };

  const remainingBalance = (entry?.amount || 0) - (entry?.paid_amount || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for {entry?.supplier_name}
            <div className="mt-2 text-sm">
              <div>Total Amount: {formatCurrency(entry?.amount || 0)}</div>
              <div>Paid Amount: {formatCurrency(entry?.paid_amount || 0)}</div>
              <div>Remaining Balance: {formatCurrency(remainingBalance)}</div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Input
              type="date"
              value={payment.payment_date}
              onChange={(e) => setPayment({ ...payment, payment_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Amount</Label>
            <Input
              type="number"
              step="0.01"
              max={remainingBalance}
              value={payment.payment_amount}
              onChange={(e) => setPayment({ ...payment, payment_amount: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={payment.payment_method}
              onValueChange={(value) => setPayment({ ...payment, payment_method: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reference Number</Label>
            <Input
              value={payment.reference_number}
              onChange={(e) => setPayment({ ...payment, reference_number: e.target.value })}
              placeholder="Transaction ID or reference number"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              value={payment.notes}
              onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
              placeholder="Additional notes"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 text-white"
              disabled={payment.payment_amount <= 0 || payment.payment_amount > remainingBalance}
            >
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentTrackingForm;