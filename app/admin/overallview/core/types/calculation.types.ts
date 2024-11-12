// /core/types/calculation.types.ts
export interface CalculationRule {
    id: string;
    type: CalculationType;
    formula: string;
    dependencies: string[];
    conditions?: CalculationCondition[];
    format?: FormatOptions;
}

export type CalculationType =
    | 'sum'
    | 'average'
    | 'count'
    | 'custom'
    | 'formula';

export interface CalculationCondition {
    field: string;
    operator: ConditionOperator;
    value: any;
    type: 'AND' | 'OR';
}

export interface CalculationResult {
    id: string;
    value: any;
    metadata: {
        timestamp: number;
        dependencies: string[];
        isValid: boolean;
    };
}