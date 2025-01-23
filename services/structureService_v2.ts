import { supabase } from '@/lib/supabaseClient';
import type { StructureMapping, Structure } from '@/types/structure_v2';

export class StructureService {
    static async getStructure(mainTab: string, subTab: string): Promise<StructureMapping | null> {
        const { data, error } = await supabase
            .from('profile_category_table_mapping_2')
            .select('*')
            .eq('main_tab', mainTab)
            .eq('sub_tab', subTab)
            .single();

        if (error) {
            console.error('Error fetching structure:', error);
            return null;
        }

        return data;
    }

    static async getAllStructures(): Promise<StructureMapping[]> {
        const { data, error } = await supabase
            .from('profile_category_table_mapping_2')
            .select('*')
            .order('main_tab')
            .order('sub_tab');

        if (error) {
            console.error('Error fetching structures:', error);
            return [];
        }

        return data;
    }

    static async updateStructure(mainTab: string, subTab: string, structure: Structure): Promise<boolean> {
        const { error } = await supabase
            .from('profile_category_table_mapping_2')
            .update({ structure })
            .eq('main_tab', mainTab)
            .eq('sub_tab', subTab);

        if (error) {
            console.error('Error updating structure:', error);
            return false;
        }

        return true;
    }

    static async updateOrder(mainTab: string, subTab: string, type: keyof Structure['order'], updates: Record<string, number>): Promise<boolean> {
        const current = await this.getStructure(mainTab, subTab);
        if (!current) return false;

        const newStructure = {
            ...current.structure,
            order: {
                ...current.structure.order,
                [type]: updates
            }
        };

        return this.updateStructure(mainTab, subTab, newStructure);
    }

    static async updateVisibility(mainTab: string, subTab: string, type: keyof Structure['visibility'], updates: Record<string, boolean>): Promise<boolean> {
        const current = await this.getStructure(mainTab, subTab);
        if (!current) return false;

        const newStructure = {
            ...current.structure,
            visibility: {
                ...current.structure.visibility,
                [type]: updates
            }
        };

        return this.updateStructure(mainTab, subTab, newStructure);
    }

    static async createStructure(mainTab: string, subTab: string, structure: Structure): Promise<boolean> {
        const { error } = await supabase
            .from('profile_category_table_mapping_2')
            .insert([{ main_tab: mainTab, sub_tab: subTab, structure }]);

        if (error) {
            console.error('Error creating structure:', error);
            return false;
        }

        return true;
    }

    static async deleteStructure(mainTab: string, subTab: string): Promise<boolean> {
        const { error } = await supabase
            .from('profile_category_table_mapping_2')
            .delete()
            .eq('main_tab', mainTab)
            .eq('sub_tab', subTab);

        if (error) {
            console.error('Error deleting structure:', error);
            return false;
        }

        return true;
    }
}
