// types/account.ts

export interface AccountData {
    id: string;  // Add unique ID
    accountUser: string[];
    pettyCashType: ('Cash' | 'Mpesa' | 'Card')[];
    accountNumber: string;
    accountType: 'Corporate' | 'Personal';
    minFloatBalance: number;
    minFloatAlert: number;
    maxOpeningFloat: number;
    approvedLimitAmount: number;
    startDate: string;
    endDate: string | null;
    status: 'Active' | 'Inactive';
    created_at: string;
    updated_at?: string;
    is_verified?: boolean;
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