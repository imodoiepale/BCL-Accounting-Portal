// @ts-nocheck

import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface VerificationResponse {
  success: boolean;
  message: string;
  error?: any;
}

interface VerificationStatus {
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
}
export const handleFieldVerification = async (
    field: string,
    mainTab: string,
    subTab: string,
    currentStatus: boolean,
    rowId: string | number
  ): Promise<VerificationResponse> => {
    try {
      console.log('Verification attempt for:', { field, mainTab, subTab });
      const [tableName, fieldName] = field.split('.');
    
   
      // Fetch current mapping
      const { data: mappingData, error: mappingError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('structure')
        .eq('main_tab', mainTab)
        .eq('sub_tab', subTab)
        .single();
  
      if (mappingError) {
        console.error('Mapping error:', mappingError);
        throw mappingError;
      }
  
      if (!mappingData?.structure) {
        console.error('No structure found');
        return {
          success: false,
          message: 'No structure found for the given mapping'
        };
      }
  
      // Debug logging
      console.log('Looking for field:', field);
      console.log('Structure:', JSON.stringify(mappingData.structure, null, 2));
  
      // Deep clone the structure to avoid mutation
      const updatedStructure = JSON.parse(JSON.stringify(mappingData.structure));
  
      // Update field verification status
      let fieldFound = false;
  
      // Iterate through sections to find and update the field
      updatedStructure.sections = updatedStructure.sections.map(section => {
        const updatedSubsections = section.subsections?.map(subsection => {
          const updatedFields = subsection.fields?.map(fieldObj => {
            // Debug each field being checked
            console.log('Checking field:', fieldObj.name);
            
            // Compare the field names
            const isMatch = fieldObj.name === field ||
                           `${fieldObj.table}.${fieldObj.name}` === field;
  
            if (isMatch) {
              fieldFound = true;
              console.log('Found matching field:', fieldObj.name);
　　 　 　 　
              return {
                ...fieldObj,
                verification: {
                  is_verified: !currentStatus,
                  verified_at: !currentStatus ? new Date().toISOString() : null,
                  verified_by: !currentStatus ? 'current_user' : null
                }
              };
            }
            return fieldObj;
          }) || [];
  
          return {
            ...subsection,
            fields: updatedFields
          };
        }) || [];
  
        return {
          ...section,
          subsections: updatedSubsections
        };
      });
  
      if (!fieldFound) {
        console.error('Field not found:', field);
        return {
          success: false,
          message: `Field "${field}" not found in structure`
        };
      }
  
      // Update the overall structure verification
      const allFieldsVerified = updatedStructure.sections.every(section =>
        section.subsections?.every(subsection =>
          subsection.fields?.every(field => field.verification?.is_verified)
        ) ?? true
      );
  
      updatedStructure.verification = {
        ...updatedStructure.verification,
        field_verified: allFieldsVerified,
        verified_at: new Date().toISOString(),
        verified_by: 'current_user'
      };
  
      // Update the database
      const { error: updateError } = await supabase
      .from(tableName)
      .update({
        is_verified: !currentStatus,
        id: rowId
      })
      .eq('id', rowId)
      .eq('field_name', fieldName);

    if (updateError) throw updateError;

    return {
      success: true,
      message: `Field verification ${!currentStatus ? 'enabled' : 'disabled'} successfully`
    };

  } catch (error) {
    console.error('Verification error:', error);
    return {
      success: false,
      message: 'Failed to update verification status',
      error
    };
  }
};