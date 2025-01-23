export interface Field {
    name: string;
    display: string;
    table: string;
    column: string;
    dropdownOptions?: any[];
}

export interface Subsection {
    name: string;
    fields: Field[];
}

export interface Section {
    name: string;
    subsections: Subsection[];
}

export interface OrderState {
    maintabs: Record<string, number>;
    subtabs: Record<string, number>;
    sections: Record<string, number>;
    subsections: Record<string, number>;
    fields: Record<string, number>;
}

export interface VisibilityState {
    maintabs: Record<string, boolean>;
    subtabs: Record<string, boolean>;
    sections: Record<string, boolean>;
    subsections: Record<string, boolean>;
    fields: Record<string, boolean>;
}

export interface Structure {
    order: OrderState;
    visibility: VisibilityState;
    sections: Section[];
}

export interface StructureMapping {
    id: number;
    main_tab: string;
    sub_tab: string;
    structure: Structure;
    created_at: string;
    updated_at: string;
}
