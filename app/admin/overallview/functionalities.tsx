/* eslint-disable react/jsx-key */
// @ts-nocheck
"use client";
import { useState, useCallback, useMemo, useEffect } from 'react';

export interface VisibilityState {
  [key: string]: boolean;
}

export interface FilterState {
  [key: string]: string | null;
}

export const useTableFunctionalities = (initialData: any[]) => {
  // States
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');

  // Custom debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(globalFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [globalFilter]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sectionVisibility, setSectionVisibility] = useState<VisibilityState>({});
  const [categoryVisibility, setCategoryVisibility] = useState<VisibilityState>({});
  const [fieldFilters, setFieldFilters] = useState<FilterState>({});

  // Handle global search
  const handleGlobalSearch = useCallback((searchTerm: string) => {
    setGlobalFilter(searchTerm);
  }, []);

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnId: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  }, []);

  // Toggle section visibility
  const toggleSectionVisibility = useCallback((sectionId: string) => {
    setSectionVisibility(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  // Toggle category visibility
  const toggleCategoryVisibility = useCallback((categoryId: string) => {
    setCategoryVisibility(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, []);

  // Set field filter
  const setFieldFilter = useCallback((fieldId: string, value: string | null) => {
    setFieldFilters(prev => ({
      ...prev,
      [fieldId]: value
    }));
  }, []);

  // Filter data based on all active filters
  const filteredData = useMemo(() => {
    let filtered = [...initialData];

    // Apply global search
    if (debouncedFilter) {
      filtered = filtered.filter(item => {
        return Object.entries(item).some(([key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') {
            return String(value)
              .toLowerCase()
              .includes(debouncedFilter.toLowerCase());
          }
          return false;
        });
      });
    }

    // Apply field-specific filters
    Object.entries(fieldFilters).forEach(([fieldId, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(item => {
          const value = item[fieldId];
          if (typeof value === 'string' || typeof value === 'number') {
            return String(value)
              .toLowerCase()
              .includes(filterValue.toLowerCase());
          }
          return false;
        });
      }
    });

    return filtered;
  }, [initialData, debouncedFilter, fieldFilters]);

  // Get visible columns based on section and category visibility
  const getVisibleColumns = useCallback(
    (columns: any[]) => {
      return columns.filter(column => {
        const isColumnVisible = !columnVisibility[column.id];
        const isSectionVisible = !sectionVisibility[column.section];
        const isCategoryVisible = !categoryVisibility[column.category];
        return isColumnVisible && isSectionVisible && isCategoryVisible;
      });
    },
    [columnVisibility, sectionVisibility, categoryVisibility]
  );

  // Reset all filters and visibility states
  const resetAll = useCallback(() => {
    setGlobalFilter('');
    setColumnVisibility({});
    setSectionVisibility({});
    setCategoryVisibility({});
    setFieldFilters({});
  }, []);

  // Generate column filters based on unique values
  const generateColumnFilters = useCallback(
    (columnId: string) => {
      const uniqueValues = new Set(
        initialData.map(item => item[columnId]).filter(Boolean)
      );
      return Array.from(uniqueValues).sort();
    },
    [initialData]
  );

  // Export visibility state
  const exportVisibilityState = useCallback(() => {
    return {
      columns: columnVisibility,
      sections: sectionVisibility,
      categories: categoryVisibility
    };
  }, [columnVisibility, sectionVisibility, categoryVisibility]);

  // Import visibility state
  const importVisibilityState = useCallback(
    (state: {
      columns: VisibilityState;
      sections: VisibilityState;
      categories: VisibilityState;
    }) => {
      setColumnVisibility(state.columns);
      setSectionVisibility(state.sections);
      setCategoryVisibility(state.categories);
    },
    []
  );

  return {
    // Data
    filteredData,
    
    // Search
    globalFilter,
    handleGlobalSearch,
    
    // Visibility controls
    columnVisibility,
    toggleColumnVisibility,
    sectionVisibility,
    toggleSectionVisibility,
    categoryVisibility,
    toggleCategoryVisibility,
    
    // Filters
    fieldFilters,
    setFieldFilter,
    generateColumnFilters,
    
    // Utility functions
    getVisibleColumns,
    resetAll,
    exportVisibilityState,
    importVisibilityState
  };
};

// Additional utility types and functions
export interface Column {
  id: string;
  label: string;
  section?: string;
  category?: string;
  accessor: (row: any) => any;
}

export interface Section {
  id: string;
  label: string;
  categories?: Category[];
}

export interface Category {
  id: string;
  label: string;
  columns: Column[];
}

// Function to organize columns by section and category
export const organizeColumns = (columns: Column[]): Section[] => {
  const sections: { [key: string]: Section } = {};

  columns.forEach(column => {
    const sectionId = column.section || 'Other';
    const categoryId = column.category || 'General';

    if (!sections[sectionId]) {
      sections[sectionId] = {
        id: sectionId,
        label: sectionId,
        categories: []
      };
    }

    let category = sections[sectionId].categories?.find(c => c.id === categoryId);
    if (!category) {
      category = {
        id: categoryId,
        label: categoryId,
        columns: []
      };
      sections[sectionId].categories?.push(category);
    }

    category.columns.push(column);
  });

  return Object.values(sections);
};

// Custom hook for managing table state persistence
export const useTableStatePersistence = (tableId: string) => {
  const saveState = useCallback((state: any) => {
    localStorage.setItem(`table-state-${tableId}`, JSON.stringify(state));
  }, [tableId]);

  const loadState = useCallback(() => {
    const saved = localStorage.getItem(`table-state-${tableId}`);
    return saved ? JSON.parse(saved) : null;
  }, [tableId]);

  return { saveState, loadState };
};

// Function to generate column definitions from form fields
export const generateColumnsFromFields = (
  fields: any[],
  section?: string
): Column[] => {
  return fields.map(field => ({
    id: field.name,
    label: field.label,
    section: section || field.category || 'Other',
    category: field.category || 'General',
    accessor: (row: any) => row[field.name]
  }));
};