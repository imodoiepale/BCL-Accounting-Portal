// /core/types/configuration.types.ts
export interface TableConfiguration {
    id: string;
    name: string;
    version: number;
    structure: TableStructure;
    display: DisplayConfig;
    security?: SecurityConfig;
    metadata: TableMetadata;
}

export interface TableStructure {
    sections: Section[];
    categories: Category[];
    subCategories: SubCategory[];
    columns: ColumnDefinition[];
    relationships: Relationship[];
}

export interface Section {
    id: string;
    name: string;
    order: number;
    categories: string[]; // Category IDs
    config?: SectionConfig;
}

export interface Category {
    id: string;
    name: string;
    order: number;
    sectionId: string;
    subCategories: string[]; // SubCategory IDs
    config?: CategoryConfig;
}

export interface SubCategory {
    id: string;
    name: string;
    order: number;
    categoryId: string;
    columns: string[]; // Column IDs
    config?: SubCategoryConfig;
}

export interface ColumnDefinition {
    id: string;
    name: string;
    field: string;
    type: ColumnType;
    subCategoryId: string;
    config: ColumnConfig;
    validation?: ValidationRule[];
    calculation?: CalculationRule;
}

export type ColumnType =
    | 'text'
    | 'number'
    | 'date'
    | 'select'
    | 'multiselect'
    | 'boolean'
    | 'custom';