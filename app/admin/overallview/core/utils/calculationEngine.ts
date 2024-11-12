// /core/utils/calculationEngine.ts
import { CalculationRule, CalculationResult } from '../types';

export class CalculationEngine {
    private static instance: CalculationEngine;
    private calculationCache: Map<string, CalculationResult>;

    private constructor() {
        this.calculationCache = new Map();
    }

    static getInstance(): CalculationEngine {
        if (!CalculationEngine.instance) {
            CalculationEngine.instance = new CalculationEngine();
        }
        return CalculationEngine.instance;
    }

    async calculate(
        rule: CalculationRule,
        data: any[],
        context?: any
    ): Promise<CalculationResult> {
        const cacheKey = this.getCacheKey(rule, data);

        if (this.calculationCache.has(cacheKey)) {
            return this.calculationCache.get(cacheKey)!;
        }

        try {
            const result = await this.executeCalculation(rule, data, context);
            this.calculationCache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Calculation error:', error);
            throw error;
        }
    }

    private async executeCalculation(
        rule: CalculationRule,
        data: any[],
        context?: any
    ): Promise<CalculationResult> {
        switch (rule.type) {
            case 'sum':
                return this.calculateSum(rule, data);
            case 'average':
                return this.calculateAverage(rule, data);
            case 'count':
                return this.calculateCount(rule, data);
            case 'custom':
                return this.executeCustomCalculation(rule, data, context);
            default:
                throw new Error(`Unsupported calculation type: ${rule.type}`);
        }
    }

    private calculateSum(rule: CalculationRule, data: any[]): CalculationResult {
        const sum = data.reduce((acc, item) => acc + (item[rule.dependencies[0]] || 0), 0);
        return {
            id: rule.id,
            value: sum,
            metadata: {
                timestamp: Date.now(),
                dependencies: rule.dependencies,
                isValid: true
            }
        };
    }

    private calculateAverage(rule: CalculationRule, data: any[]): CalculationResult {
        const sum = this.calculateSum(rule, data).value;
        const count = data.length;
        const average = count > 0 ? sum / count : 0;
        return {
            id: rule.id,
            value: average,
            metadata: {
                timestamp: Date.now(),
                dependencies: rule.dependencies,
                isValid: true
            }
        };
    }

    private calculateCount(rule: CalculationRule, data: any[]): CalculationResult {
        const count = data.length;
        return {
            id: rule.id,
            value: count,
            metadata: {
                timestamp: Date.now(),
                dependencies: rule.dependencies,
                isValid: true
            }
        };
    }

    private async executeCustomCalculation(
        rule: CalculationRule,
        data: any[],
        context?: any
    ): Promise<CalculationResult> {
        // Implementation for custom calculations
        return {
            id: rule.id,
            value: null,
            metadata: {
                timestamp: Date.now(),
                dependencies: rule.dependencies,
                isValid: false
            }
        };
    }

    private getCacheKey(rule: CalculationRule, data: any[]): string {
        return `${rule.id}-${JSON.stringify(data)}`;
    }
}

// Export the calculateValue function
export const calculateValue = async (rule: CalculationRule, data: any[], context?: any) => {
    const engine = CalculationEngine.getInstance();
    return engine.calculate(rule, data, context);
};