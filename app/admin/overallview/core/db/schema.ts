export interface DBTableConfig {
    id: string;
    name: string;
    config: TableConfiguration;
    created_at: string;
    updated_at: string;
    version: number;
    metadata: Record<string, any>;
}

export interface DBColumnMapping {
    id: string;
    config_id: string;
    source_table: string;
    source_column: string;
    target_field: string;
    transformations: TransformationRule[];
    metadata: Record<string, any>;
}