// utils/templateHelpers.ts

export const createTemplateVersion = async (templateId: string, supabase: any) => {
    // Get current template
    const { data: currentTemplate } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single()

    if (!currentTemplate) return null

    // Create new version
    const newVersion = {
        ...currentTemplate,
        version: currentTemplate.version + 1,
        created_at: new Date().toISOString(),
        metadata: {
            ...currentTemplate.metadata,
            parent_template_id: templateId,
            version_created_at: new Date().toISOString()
        }
    }
    delete newVersion.id

    const { data: newTemplate, error } = await supabase
        .from('templates')
        .insert(newVersion)
        .select()
        .single()

    if (error) throw error
    return newTemplate
}

export const duplicateTemplate = async (templateId: string, supabase: any) => {
    const { data: template } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single()

    if (!template) return null

    const duplicateData = {
        ...template,
        name: `${template.name} (Copy)`,
        version: 1,
        metadata: {
            ...template.metadata,
            duplicated_from: templateId,
            duplicated_at: new Date().toISOString()
        }
    }
    delete duplicateData.id

    const { data: newTemplate, error } = await supabase
        .from('templates')
        .insert(duplicateData)
        .select()
        .single()

    if (error) throw error
    return newTemplate
}