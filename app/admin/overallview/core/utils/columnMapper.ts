// /core/utils/columnMapper.ts
import { ColumnDefinition, ColumnMapping } from '../types';

export class ColumnMapper {
    private mappings: Map<string, ColumnMapping>;
    private columnDefinitions: ColumnDefinition[];

    constructor(columnDefinitions: ColumnDefinition[]) {
        this.columnDefinitions = columnDefinitions;
        this.mappings = new Map();
        this.initializeMappings();
    }

    private initializeMappings() {
        this.columnDefinitions.forEach(definition => {
            this.mappings.set(definition.id, {
                sourceField: definition.field,
                transformation: definition.config.transformation,
                validation: definition.validation
            });
        });
    }

    mapData(data: any[]): MappedData[] {
        return data.map(item => this.mapItem(item));
    }

    private mapItem(item: any): MappedData {
        const mapped: any = { id: item.id };

        this.mappings.forEach((mapping, columnId) => {
            mapped[columnId] = this.extractAndTransformValue(item, mapping);
        });

        return mapped;
    }

    private extractAndTransformValue(item: any, mapping: ColumnMapping): any {
        const rawValue = this.extractValue(item, mapping.sourceField);
        return this.transformValue(rawValue, mapping.transformation);
    }

    private extractValue(item: any, sourceField: string): any {
        // Handle nested paths
        return sourceField.split('.').reduce((obj, key) => obj?.[key], item);
    }

    private transformValue(value: any, transformation?: TransformationRule): any {
        if (!transformation) return value;

        // Apply transformations
        switch (transformation.type) {
            case 'format':
                return this.formatValue(value, transformation.config);
            case 'calculate':
                return this.calculateValue(value, transformation.config);
            case 'custom':
                return this.applyCustomTransformation(value, transformation.config);
            default:
                return value;
        }
    }
}