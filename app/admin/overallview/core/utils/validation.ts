// /core/utils/validation.ts
import { ValidationRule, ValidationResult } from '../types';

export class Validator {
    static validate(value: any, rules: ValidationRule[]): ValidationResult {
        const results = rules.map(rule => this.validateRule(value, rule));
        const isValid = results.every(result => result.isValid);

        return {
            isValid,
            errors: results.filter(r => !r.isValid).map(r => r.error),
            warnings: results.filter(r => r.warning).map(r => r.warning)
        };
    }

    private static validateRule(value: any, rule: ValidationRule): ValidationResult {
        switch (rule.type) {
            case 'required':
                return this.validateRequired(value);
            case 'format':
                return this.validateFormat(value, rule.format);
            case 'range':
                return this.validateRange(value, rule.min, rule.max);
            case 'custom':
                return this.validateCustom(value, rule.validator);
            default:
                return { isValid: true };
        }
    }

    private static validateRequired(value: any): ValidationResult {
        const isValid = value !== null && value !== undefined && value !== '';
        return {
            isValid,
            error: isValid ? undefined : 'This field is required'
        };
    }

    private static validateFormat(value: any, format: string): ValidationResult {
        // Implementation for format validation
        return { isValid: true }; // Placeholder
    }

    private static validateRange(value: number, min?: number, max?: number): ValidationResult {
        // Implementation for range validation
        return { isValid: true }; // Placeholder
    }

    private static validateCustom(value: any, validator: (value: any) => ValidationResult): ValidationResult {
        return validator(value);
    }
}