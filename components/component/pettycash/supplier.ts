// types/supplier.ts

export interface SupplierData {
    supplierName: string;
    supplierType: 'Corporate' | 'Individual';
    pin: string | null;
    idNumber: string | null;
    mobile: string;
    email: string;
    tradingType: 'Purchase Only' | 'Expense Only' | 'Both Purchase + Expense';
}

export interface Supplier {
    id: string;
    userid: string;
    data: SupplierData;
    created_at: string;
}

export const SUPPLIER_TYPES = [
    { value: 'Corporate', label: 'Corporate' },
    { value: 'Individual', label: 'Individual' }
] as const;

export const TRADING_TYPES = [
    { value: 'Purchase Only', label: 'Purchase Only' },
    { value: 'Expense Only', label: 'Expense Only' },
    { value: 'Both Purchase + Expense', label: 'Both Purchase + Expense' }
] as const;

export const CSV_TEMPLATE_HEADERS = [
    'Supplier Name',
    'Supplier Type (Corporate/Individual)',
    'PIN (For Corporate)',
    'ID Number (For Individual)',
    'Mobile',
    'Email',
    'Trading Type (Purchase Only/Expense Only/Both Purchase + Expense)'
];

export const DEFAULT_SUPPLIER_DATA: SupplierData = {
    supplierName: '',
    supplierType: 'Corporate',
    pin: null,
    idNumber: null,
    mobile: '',
    email: '',
    tradingType: 'Both Purchase + Expense'
};