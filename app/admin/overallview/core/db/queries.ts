// /db/queries.ts
import { supabase } from '@/lib/supabase';
import { DBTableConfig, DBColumnMapping } from './schema';

export const tableConfigQueries = {
    async getConfig(configId: string): Promise<DBTableConfig> {
        const { data, error } = await supabase
            .from('table_configurations')
            .select('*')
            .eq('id', configId)
            .single();

        if (error) throw error;
        return data;
    },

    async saveConfig(config: Partial<DBTableConfig>): Promise<DBTableConfig> {
        const { data, error } = await supabase
            .from('table_configurations')
            .upsert(config)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getColumnMappings(configId: string): Promise<DBColumnMapping[]> {
        const { data, error } = await supabase
            .from('column_mappings')
            .select('*')
            .eq('config_id', configId);

        if (error) throw error;
        return data;
    }
};