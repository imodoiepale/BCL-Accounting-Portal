// types.ts
export interface Company {
    id: number;
    company_name: string;
    status: string;
  }
  
  export interface Director {
    id: number;
    company_id: number;
    full_name: string;
  }
  
  export interface Document {
    id: string;
    name: string;
    department: string;
    subcategory: string;
    category: string;
  }
  
  export interface DirectorDocument {
    id: string;
    company_id: number;
    director_id: number;
    document_id: string;
    issue_date: string;
    expiry_date: string;
    file_path: string;
    status: string;
  }
  
  export interface UploadData {
    issueDate: string;
    expiryDate: string;
    file: File | null;
  }
  
  export type SortField = 'company' | 'issueDate' | 'expiryDate' | 'daysLeft' | 'status';
  export type SortDirection = 'asc' | 'desc';
  
  export interface ColumnConfig {
    visible: boolean;
    subColumns: {
      upload: boolean;
      issueDate: boolean;
      expiryDate: boolean;
      daysLeft: boolean;
      status: boolean;
    };
  }
  
  export interface VisibleColumns {
    [key: string]: ColumnConfig;
  }

  export interface Stats {
    total: number;
    missing: number;
    complete: number;
  }