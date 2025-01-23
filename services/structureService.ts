import { supabase } from '@/lib/supabaseClient';
import type { MainTab, SubTab, Section, Subsection, Field, StructureResponse } from '@/types/structure';

export class StructureService {
    static async getFullStructure(): Promise<StructureResponse> {
        try {
            const { data: mainTabs, error: mainTabsError } = await supabase
                .from('main_tabs')
                .select('*')
                .order('order_index');

            if (mainTabsError) throw mainTabsError;

            const fullStructure = await Promise.all(mainTabs.map(async (mainTab) => {
                const { data: subTabs, error: subTabsError } = await supabase
                    .from('sub_tabs')
                    .select('*')
                    .eq('main_tab_id', mainTab.id)
                    .order('order_index');

                if (subTabsError) throw subTabsError;

                const subTabsWithSections = await Promise.all(subTabs.map(async (subTab) => {
                    const { data: sections, error: sectionsError } = await supabase
                        .from('sections')
                        .select('*')
                        .eq('sub_tab_id', subTab.id)
                        .order('order_index');

                    if (sectionsError) throw sectionsError;

                    const sectionsWithSubsections = await Promise.all(sections.map(async (section) => {
                        const { data: subsections, error: subsectionsError } = await supabase
                            .from('subsections')
                            .select('*')
                            .eq('section_id', section.id)
                            .order('order_index');

                        if (subsectionsError) throw subsectionsError;

                        const subsectionsWithFields = await Promise.all(subsections.map(async (subsection) => {
                            const { data: fields, error: fieldsError } = await supabase
                                .from('fields')
                                .select('*')
                                .eq('subsection_id', subsection.id)
                                .order('order_index');

                            if (fieldsError) throw fieldsError;

                            return {
                                ...subsection,
                                fields
                            };
                        }));

                        return {
                            ...section,
                            subsections: subsectionsWithFields
                        };
                    }));

                    return {
                        ...subTab,
                        sections: sectionsWithSubsections
                    };
                }));

                return {
                    ...mainTab,
                    sub_tabs: subTabsWithSections
                };
            }));

            return { main_tabs: fullStructure };
        } catch (error) {
            console.error('Error fetching structure:', error);
            return { main_tabs: [], error: error.message };
        }
    }

    static async updateStructure(mainTabs: MainTab[]): Promise<void> {
        const client = supabase;
        try {
            await client.rpc('begin_transaction');

            for (const mainTab of mainTabs) {
                await client
                    .from('main_tabs')
                    .upsert({
                        id: mainTab.id,
                        name: mainTab.name,
                        order_index: mainTab.order_index,
                        is_visible: mainTab.is_visible
                    });

                if (mainTab.sub_tabs) {
                    for (const subTab of mainTab.sub_tabs) {
                        await client
                            .from('sub_tabs')
                            .upsert({
                                id: subTab.id,
                                main_tab_id: mainTab.id,
                                name: subTab.name,
                                order_index: subTab.order_index,
                                is_visible: subTab.is_visible
                            });

                        if (subTab.sections) {
                            for (const section of subTab.sections) {
                                await client
                                    .from('sections')
                                    .upsert({
                                        id: section.id,
                                        sub_tab_id: subTab.id,
                                        name: section.name,
                                        order_index: section.order_index,
                                        is_visible: section.is_visible
                                    });

                                if (section.subsections) {
                                    for (const subsection of section.subsections) {
                                        await client
                                            .from('subsections')
                                            .upsert({
                                                id: subsection.id,
                                                section_id: section.id,
                                                name: subsection.name,
                                                order_index: subsection.order_index,
                                                is_visible: subsection.is_visible
                                            });

                                        if (subsection.fields) {
                                            for (const field of subsection.fields) {
                                                await client
                                                    .from('fields')
                                                    .upsert({
                                                        id: field.id,
                                                        subsection_id: subsection.id,
                                                        name: field.name,
                                                        display_name: field.display_name,
                                                        table_name: field.table_name,
                                                        column_name: field.column_name,
                                                        order_index: field.order_index,
                                                        is_visible: field.is_visible,
                                                        dropdown_options: field.dropdown_options
                                                    });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            await client.rpc('commit_transaction');
        } catch (error) {
            await client.rpc('rollback_transaction');
            throw error;
        }
    }

    static async deleteMainTab(id: number): Promise<void> {
        const { error } = await supabase
            .from('main_tabs')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    static async deleteSubTab(id: number): Promise<void> {
        const { error } = await supabase
            .from('sub_tabs')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    static async deleteSection(id: number): Promise<void> {
        const { error } = await supabase
            .from('sections')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    static async deleteSubsection(id: number): Promise<void> {
        const { error } = await supabase
            .from('subsections')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    static async deleteField(id: number): Promise<void> {
        const { error } = await supabase
            .from('fields')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
