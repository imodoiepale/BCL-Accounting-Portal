// /core/types/helper.types.ts
export interface HelperHeader {
    id: string;
    type: HelperHeaderType;
    position: HeaderPosition;
    config: HelperHeaderConfig;
}

export type HelperHeaderType =
    | 'calculation'
    | 'summary'
    | 'reference'
    | 'custom';

export type HeaderPosition =
    | 'top'
    | 'bottom'
    | 'section'
    | 'category';

export interface HelperHeaderConfig {
    label: string;
    calculation?: CalculationRule;
    display: HelperHeaderDisplay;
    conditions?: HelperHeaderCondition[];
}