// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useStructure() {
  const [structure, setStructure] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStructure();
  }, []);

  const fetchStructure = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profile_category_table_mapping')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setStructure(data || []);
    } catch (error) {
      console.error('Error fetching structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const addField = async (category: string, subcategory: string, fieldName: string, columnName: string) => {
    try {
      const item = structure.find(
        item => item.category === category && item.subcategory === subcategory
      );

      if (!item) return;

      const newColumnMappings = {
        ...item.column_mappings,
        [fieldName]: columnName
      };

      const { error } = await supabase
        .from('profile_category_table_mapping')
        .update({ column_mappings: newColumnMappings })
        .match({ category, subcategory });

      if (error) throw error;
      await fetchStructure();
    } catch (error) {
      console.error('Error adding field:', error);
    }
  };

  const deleteField = async (category: string, subcategory: string, fieldName: string) => {
    try {
      const item = structure.find(
        item => item.category === category && item.subcategory === subcategory
      );

      if (!item) return;

      const newColumnMappings = { ...item.column_mappings };
      delete newColumnMappings[fieldName];

      const { error } = await supabase
        .from('profile_category_table_mapping')
        .update({ column_mappings: newColumnMappings })
        .match({ category, subcategory });

      if (error) throw error;
      await fetchStructure();
    } catch (error) {
      console.error('Error deleting field:', error);
    }
  };

  return {
    structure,
    loading,
    fetchStructure,
    addField,
    deleteField
  };
}