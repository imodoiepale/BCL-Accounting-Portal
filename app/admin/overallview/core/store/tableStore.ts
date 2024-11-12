// /store/tableStore.ts
import { atom } from 'jotai';

// Atom to hold the table configuration
export const tableConfigAtom = atom<any>(null); // Replace 'any' with your specific type if available

// Atom to hold the loading state for the configuration
export const tableConfigLoadingAtom = atom<boolean>(false);

// Atom to hold the table data
export const tableDataAtom = atom<any>({}); // Replace 'any' with your specific type if available

// Atom to hold the loading state for the table data
export const tableDataLoadingAtom = atom<boolean>(false);

// Atom to hold calculations
export const calculationsAtom = atom<any>({}); // Replace 'any' with your specific type if available

// Atom to hold helper headers
export const helperHeadersAtom = atom<any>({}); // Replace 'any' with your specific type if available