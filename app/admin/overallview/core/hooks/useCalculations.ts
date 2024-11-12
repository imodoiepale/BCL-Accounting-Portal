// /core/hooks/useCalculations.ts
import { useAtom } from 'jotai';
import { calculationsAtom } from '../store/tableStore';
import { CalculationRule, CalculationResult } from '../types';
import { calculateValue } from '../utils/calculationEngine';

export const useCalculations = (data: any[], rules: CalculationRule[]) => {
    const [calculations, setCalculations] = useAtom(calculationsAtom);

    const processCalculations = async () => {
        const results: Record<string, CalculationResult> = {};

        for (const rule of rules) {
            try {
                const result = await calculateValue(rule, data);
                results[rule.id] = {
                    id: rule.id,
                    value: result,
                    metadata: {
                        timestamp: Date.now(),
                        dependencies: rule.dependencies,
                        isValid: true
                    }
                };
            } catch (error) {
                console.error(`Calculation error for rule ${rule.id}:`, error);
                results[rule.id] = {
                    id: rule.id,
                    value: null,
                    metadata: {
                        timestamp: Date.now(),
                        dependencies: rule.dependencies,
                        isValid: false,
                        error: error.message
                    }
                };
            }
        }

        setCalculations(results);
    };

    const updateCalculation = async (ruleId: string) => {
        const rule = rules.find(r => r.id === ruleId);
        if (!rule) return;

        try {
            const result = await calculateValue(rule, data);
            setCalculations(prev => ({
                ...prev,
                [ruleId]: {
                    id: ruleId,
                    value: result,
                    metadata: {
                        timestamp: Date.now(),
                        dependencies: rule.dependencies,
                        isValid: true
                    }
                }
            }));
        } catch (error) {
            console.error(`Error updating calculation ${ruleId}:`, error);
        }
    };

    return {
        calculations: calculations || {}, // Ensure calculations is an object
        processCalculations,
        updateCalculation
    };
};