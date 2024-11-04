// types/paymentTypes.ts
export interface PaymentTracking {
    id?: string;
    payment_date: string;
    payment_amount: number;
    payment_method: string;
    reference_number: string;
    notes: string;
    created_at?: string;
    entry_id?: string;
    user_id?: string;
  }
  
  export interface PettyCashEntry {
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
    paid_amount?: number;
    last_payment_date?: string;
    next_payment_date?: string;
    payment_history?: PaymentTracking[];
    // Loan specific fields
    interest_rate?: number;
    loan_term?: number;
    due_date?: string;
  }