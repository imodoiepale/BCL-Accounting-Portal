// types/account.ts

export interface AccountData {
    accountUser: string[];           // Multiple users can be assigned
    pettyCashType: ('Cash' | 'Mpesa' | 'Card')[];  // Multiple types can be selected
    accountNumber: string;
    accountType: 'Corporate' | 'Personal';
    minFloatBalance: number;
    minFloatAlert: number;
    maxOpeningFloat: number;
    approvedLimitAmount: number;
    startDate: string;              // ISO date string
    endDate: string | null;         // ISO date string, null if no end date
    status: 'Active' | 'Inactive';  // Calculated based on end date
}

export interface Account {
    id: string;
    userid: string;
    data: AccountData;
    created_at: string;
    updated_at: string;
}

export const CASH_TYPES = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Mpesa', label: 'Mpesa' },
    { value: 'Card', label: 'Card' }
] as const;

export const ACCOUNT_TYPES = [
    { value: 'Corporate', label: 'Corporate' },
    { value: 'Personal', label: 'Personal' }
] as const;

export const DEFAULT_ACCOUNT_DATA: AccountData = {
    accountUser: [],
    pettyCashType: [],
    accountNumber: '',
    accountType: 'Corporate',
    minFloatBalance: 0,
    minFloatAlert: 0,
    maxOpeningFloat: 0,
    approvedLimitAmount: 0,
    startDate: new Date().toISOString(),
    endDate: null,
    status: 'Active'
};