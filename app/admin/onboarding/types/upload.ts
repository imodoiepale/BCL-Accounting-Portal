// types/upload.ts

export interface TableMapping {
    id: number;
    main_tab: string;
    Tabs: string;
    structure: {
      order: {
        tab: number;
        sections: Record<string, number>;
      };
      sections: Array<{
        name: string;
        order: number;
        visible: boolean;
        subsections: Array<{
          name: string;
          order: number;
          fields: Array<{
            name: string;
            order: number;
            table: string;
            display: string;
            visible: boolean;
            verification: {
              is_verified: boolean;
              verified_at: string;
              verified_by: string;
            };
            dropdownOptions: string[];
          }>;
          tables: string[];
          visible: boolean;
        }>;
      }>;
      visibility: {
        tab: boolean;
        sections: Record<string, boolean>;
      };
      relationships: Record<string, any>;
    };
  }
  
  export interface UploadProps {
    onComplete: (data: any) => void;
    companyData: {
      name: string;
      username: string;
      userId: string;
    };
  }
  
  export type ComplianceStatus = {
    name: string;
    status: 'to_be_registered' | 'missing' | 'has_details';
    count?: number;
    verification?: {
      is_verified: boolean;
      verified_at: string;
      verified_by: string;
    };
  };