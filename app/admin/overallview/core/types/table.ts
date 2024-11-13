// types/table.ts
export interface TableConfiguration {
    structure: TableStructure;
    calculations?: CalculationConfig[];
    display?: DisplayConfig;
}

export interface TableStructure {
    sections: Section[];
    categories: Category[];
    subCategories: SubCategory[];
    columns: ColumnDefinition[];
}

export interface Section {
    id: string;
    name: string;
    order: number;
    categories: string[]; // Category IDs
}

export interface Category {
    id: string;
    name: string;
    order: number;
    sectionId: string;
    subCategories: string[]; // SubCategory IDs
}

export interface SubCategory {
    id: string;
    name: string;
    order: number;
    categoryId: string;
    columns: string[]; // Column IDs
}

export interface ColumnDefinition {
    id: string;
    name: string;
    type: ColumnType;
    field: string;
    config?: ColumnConfig;
}

export type ColumnType =
    | 'text'
    | 'number'
    | 'date'
    | 'select'
    | 'multiSelect'
    | 'checkbox'
    | 'custom';