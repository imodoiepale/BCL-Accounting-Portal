// /core/types/display.types.ts
export interface DisplayConfig {
    theme: ThemeConfig;
    layout: LayoutConfig;
    behavior: BehaviorConfig;
    responsive: ResponsiveConfig;
}

export interface ThemeConfig {
    colors: ColorScheme;
    typography: Typography;
    spacing: Spacing;
    borders: Borders;
}

export interface LayoutConfig {
    stickyHeader: boolean;
    stickyFirstColumn: boolean;
    maxHeight?: string;
    width?: string;
    dense: boolean;
}

export interface BehaviorConfig {
    sortable: boolean;
    filterable: boolean;
    resizable: boolean;
    draggable: boolean;
    selectable: boolean;
}

export interface ResponsiveConfig {
    breakpoints: {
        sm: number;
        md: number;
        lg: number;
        xl: number;
    };
    columnPriority: Record<string, number>;
}