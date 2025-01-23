export interface MainTab {
    id: number;
    name: string;
    order_index: number;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
    sub_tabs?: SubTab[];
}

export interface SubTab {
    id: number;
    main_tab_id: number;
    name: string;
    order_index: number;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
    sections?: Section[];
}

export interface Section {
    id: number;
    sub_tab_id: number;
    name: string;
    order_index: number;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
    subsections?: Subsection[];
}

export interface Subsection {
    id: number;
    section_id: number;
    name: string;
    order_index: number;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
    fields?: Field[];
}

export interface Field {
    id: number;
    subsection_id: number;
    name: string;
    display_name: string;
    table_name: string;
    column_name: string;
    order_index: number;
    is_visible: boolean;
    dropdown_options?: any;
    created_at: string;
    updated_at: string;
}

export interface StructureResponse {
    main_tabs: MainTab[];
    error?: string;
}
