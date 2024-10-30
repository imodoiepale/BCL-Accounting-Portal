// types/finance.ts
export interface FinanceEntry {
    id: string;
    amount: number;
    customer_name: string;
    payment_status: 'Pending' | 'Partially Paid' | 'Paid';
    paid_amount: number;
    entry_type: 'reimbursement' | 'loan';
    description: string;
    created_at: string;
    due_date: string;
  }