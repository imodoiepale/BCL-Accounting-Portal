/* eslint-disable react/jsx-key */
/* eslint-disable react-hooks/rules-of-hooks */
// components/overview/TableComponents.tsx
// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditableCell } from './EditableCell';
import { getMissingFields } from '../missingFieldsDialog';
import { calculateFieldStats } from '../utility';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import SidebarTableView from './SidebarTableView';
import { Lock, LockOpen } from 'lucide-react';
import { handleFieldVerification } from './handleFieldVerification';
interface TableProps {
  data: any[];
  handleCompanyClick: (company: any) => void;
  onMissingFieldsClick: (company: any) => void;
  processedSections: any[];
  refreshData: () => Promise<void>;
  activeMainTab: string;  // Ensure this is string
  activeSubTab: string;
}

interface SortConfig {
  field: string | null;
  direction: 'asc' | 'desc' | null;
}
// Utility function to format dates
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return format(date, 'dd/MM/yyyy'); // Format as needed
};
// Utility function to render separator cells
export const renderSeparatorCell = (key: string, type: 'section' | 'category' | 'mini' = 'section', rowSpan: number = 1) => {
  const separatorWidths = {
    mini: 'w-1',
    category: 'w-2',
    section: 'w-4'
  };

  const separatorColors = {
    mini: 'bg-gray-100',
    category: 'bg-gray-200',
    section: 'bg-gray-300'
  };

  return (
    <TableCell
      key={key}
      className={`${separatorWidths[type]} ${separatorColors[type]} p-0 border-x border-gray-300 h-full`}
      rowSpan={rowSpan}
      style={{ verticalAlign: 'middle' }}
    />
  );
};

const getRandomColor = () => {
  const colors = [
    'bg-blue-100',
    'bg-green-100',
    'bg-purple-100',
    'bg-yellow-100',
    'bg-pink-100',
    'bg-indigo-100',
    'bg-red-100',
    'bg-orange-100',
    'bg-teal-100',
    'bg-cyan-100'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const sectionColors = {};
const categoryColors = {};

// Calculate missing fields for a specific row
const calculateMissingFieldsForRow = (row: any, processedSections: any[]) => {
  let missingCount = 0;

  processedSections.slice(1).forEach(section => {
    if (!section.isSeparator) {
      section.categorizedFields?.forEach(category => {
        if (!category.isSeparator) {
          category.fields.forEach(field => {
            // Skip company_name and index fields
            if (field.name.includes('company_name') || field.name.includes('index')) {
              return;
            }

            const [tableName, columnName] = field.name.split('.');
            let value;

            if (row.isAdditionalRow && row.sourceTable === tableName) {
              value = row[columnName];
            } else if (row[`${tableName}_data`]) {
              value = row[`${tableName}_data`][columnName];
            } else {
              value = row[columnName];
            }

            if (value === null || value === undefined || value === '') {
              missingCount++;
            }
          });
        }
      });
    }
  });

  return missingCount;
};

// Calculate total statistics for a specific field
const calculateFieldStatistics = (fieldName: string, data: any[]) => {
  let total = 0;
  let completed = 0;
  let pending = 0;

  data.forEach(companyGroup => {
    companyGroup.rows.forEach(row => {
      const [tableName, columnName] = fieldName.split('.');
      let value;

      if (row.isAdditionalRow && row.sourceTable === tableName) {
        value = row[columnName];
      } else if (row[`${tableName}_data`]) {
        value = row[`${tableName}_data`][columnName];
      } else {
        value = row[columnName];
      }

      total++;
      if (value !== null && value !== undefined && value !== '') {
        completed++;
      } else {
        pending++;
      }
    });
  });

  return { total, completed, pending };
};
// Add this helper function at the top of the file
const getTableName = (row: any): string => {
  return row.sourceTable ||
    Object.keys(row).find(key => key.endsWith('_data'))?.replace('_data', '') ||
    'acc_portal_company_duplicate';
};

const getFieldVerificationStatusFromStructure = (structure: any, tableName: string, fieldName: string) => {
  for (const section of structure.sections) {
    for (const subsection of section.subsections) {
      const field = subsection.fields?.find(
        (f: any) => f.table === tableName && f.name === fieldName
      );
      if (field?.verification) {
        return field.verification;
      }
    }
  }
  return null;
};

const initializeFieldVerificationStates = async (
  processedSections: any[],
  activeMainTab: string,
  activeSubTab: string,
  setLockedColumns: (states: any) => void
) => {
  try {
    const { data: mappingData } = await supabase
      .from('profile_category_table_mapping_2')
      .select('structure')
      .eq('main_tab', activeMainTab)
      .eq('Tabs', activeSubTab)
      .single();

    if (!mappingData) return;

    const verificationStates = {};

    // Extract verification states from structure
    processedSections.forEach(section => {
      if (!section.isSeparator) {
        section.categorizedFields?.forEach(category => {
          if (!category.isSeparator) {
            category.fields.forEach(field => {
              const [tableName, columnName] = field.name.split('.');
              const verification = getFieldVerificationStatusFromStructure(
                mappingData.structure,
                tableName,
                columnName
              );
              if (verification) {
                verificationStates[`field_${tableName}.${columnName}`] = verification;
              }
            });
          }
        });
      }
    });

    setLockedColumns(verificationStates);
  } catch (error) {
    console.error('Error initializing field verification states:', error);
  }
};

const initializeVerificationStates = async (
  processedSections: any[] | undefined,
  activeMainTab: string,
  activeSubTab: string,
  setLockedRows: (states: any) => void
) => {
  try {
    // Add null check
    if (!Array.isArray(processedSections)) {
      console.log('ProcessedSections is not an array:', processedSections);
      return;
    }
    // Get mapping data with structure
    const { data: mappingData } = await supabase
      .from('profile_category_table_mapping_2')
      .select('structure')
      .eq('main_tab', activeMainTab)
      .eq('Tabs', activeSubTab)
      .single();

    const verificationStates = {};

    // Extract column verifications from structure
    mappingData?.structure?.sections?.forEach(section => {
      section.subsections?.forEach(subsection => {
        subsection.fields?.forEach(field => {
          if (field.verification?.is_verified) {
            const fieldKey = `field_${field.table}.${field.name}`;
            verificationStates[fieldKey] = {
              is_verified: field.verification.is_verified,
              verified_at: field.verification.verified_at,
              verified_by: field.verification.verified_by
            };
          }
        });
      });
    });

    // Get row verifications
    const tables = new Set<string>();
    processedSections.forEach(section => {
      if (!section.isSeparator) {
        section.categorizedFields?.forEach(category => {
          if (!category.isSeparator) {
            category.fields.forEach(field => {
              const [tableName] = field.name.split('.');
              if (tableName) tables.add(tableName);
            });
          }
        });
      }
    });

    // Fetch row verification states
    await Promise.all([...tables].map(async (tableName) => {
      const { data } = await supabase
        .from(tableName)
        .select('id, is_verified, verification_data')
        .eq('is_verified', true);

      if (data) {
        data.forEach(row => {
          const key = `${tableName}_${row.id}`;
          verificationStates[key] = {
            is_verified: row.is_verified,
            verified_at: row.verification_data?.verified_at || new Date().toISOString(),
            verified_by: row.verification_data?.verified_by || 'current_user'
          };
        });
      }
    }));

    // Update states
    setLockedRows(verificationStates);

  } catch (error) {
    console.error('Error initializing verification states:', error);
  }
};

// Render statistics rows
const renderStatisticsRows = (data: any[], processedSections: any[]) => {
  return (
    <>
      <TableRow>
        <TableHead className="sticky left-0 z-20 bg-blue-50 font-semibold text-xs text-blue-600">Total</TableHead>
        <TableHead className="bg-blue-50 font-semibold text-xs text-blue-600"></TableHead>
        <TableCell className="bg-blue-50 font-semibold text-xs text-blue-600">
          {data.reduce((sum, companyGroup) =>
            sum + calculateMissingFieldsForRow(companyGroup.rows[0], processedSections), 0)}
        </TableCell>
        {processedSections.slice(1).map((section, sectionIndex) =>
          section.categorizedFields?.map((category, catIndex) =>
            category.fields.map((field, fieldIndex) => {
              const stats = calculateFieldStatistics(field.name, data);
              return (
                <TableCell
                  key={`total-${sectionIndex}-${catIndex}-${fieldIndex}`}
                  className="text-center font-medium text-blue-600 bg-blue-50 border border-gray-300"
                >
                  {stats.total}
                </TableCell>
              );
            })
          )
        )}
      </TableRow>

      <TableRow>
        <TableHead className="sticky left-0 z-20 bg-green-50 font-semibold text-xs text-green-600">Completed</TableHead>
        <TableHead className="bg-green-50 font-semibold text-xs text-green-600"></TableHead>
        <TableCell className="bg-green-50 font-semibold text-xs text-green-600">
          {data.reduce((sum, companyGroup) => {
            const missingFields = calculateMissingFieldsForRow(companyGroup.rows[0], processedSections);
            return sum + (missingFields === 0 ? 1 : 0);
          }, 0)}
        </TableCell>
        {processedSections.slice(1).map((section, sectionIndex) =>
          section.categorizedFields?.map((category, catIndex) =>
            category.fields.map((field, fieldIndex) => {
              const stats = calculateFieldStatistics(field.name, data);
              return (
                <TableCell
                  key={`completed-${sectionIndex}-${catIndex}-${fieldIndex}`}
                  className="text-center font-medium text-green-600 bg-green-50 border border-gray-300"
                >
                  {stats.completed}
                </TableCell>
              );
            })
          )
        )}
      </TableRow>

      <TableRow>
        <TableHead className="sticky left-0 z-20 bg-red-50 font-semibold text-xs text-red-600">Missing</TableHead>
        <TableHead className="bg-red-50 font-semibold text-xs text-red-600"></TableHead>
        <TableCell className="bg-red-50 font-semibold text-xs text-red-600">
          {data.reduce((sum, companyGroup) => {
            const missingFields = calculateMissingFieldsForRow(companyGroup.rows[0], processedSections);
            return sum + (missingFields > 0 ? 1 : 0);
          }, 0)}
        </TableCell>
        {processedSections.slice(1).map((section, sectionIndex) =>
          section.categorizedFields?.map((category, catIndex) =>
            category.fields.map((field, fieldIndex) => {
              const stats = calculateFieldStatistics(field.name, data);
              return (
                <TableCell
                  key={`missing-${sectionIndex}-${catIndex}-${fieldIndex}`}
                  className="text-center font-medium text-red-600 bg-red-50 border border-gray-300"
                >
                  {stats.pending}
                </TableCell>
              );
            })
          )
        )}
      </TableRow>
    </>
  );
};

const handleToggleRowLock = async (
  row: any,
  processedSections: any[],
  setLockedRows: (value: any) => void,
  refreshData: (() => Promise<void>) | undefined, // Make optional
  lockedRows: any[],
  activeMainTab: string,
  activeSubTab: string
) => {
  try {
    // Get the mapping data
    const { data: mappingData, error: mappingError } = await supabase
      .from('profile_category_table_mapping_2')
      .select('structure')
      .eq('main_tab', activeMainTab)
      .eq('Tabs', activeSubTab)
      .single();

    if (mappingError) throw mappingError;

    // Get table name from structure
    const tableName = getTableNameFromStructure(mappingData.structure, activeSubTab);

    if (!tableName) {
      throw new Error(`Could not determine table name for subtab: ${activeSubTab}`);
    }

    // Get row ID from the table data
    const rowId = row.id || row[`${tableName}_data`]?.id;

    if (!rowId) {
      throw new Error('Row ID not found');
    }

    // console.log('Using table info:', { tableName, rowId });

    // Update verification status
    const verificationKey = `${tableName}_${rowId}`;
    const currentVerificationState = lockedRows?.[verificationKey]?.is_verified || false;

    const { error } = await supabase
      .from(tableName)
      .update({
        is_verified: !currentVerificationState,
        verification_data: JSON.stringify({
          verified_at: new Date().toISOString(),
          verified_by: 'current_user'
        })
      })
      .eq('id', rowId);

    if (error) throw error;

    setLockedRows(prev => ({
      ...prev,
      [verificationKey]: {
        is_verified: !currentVerificationState,
        verified_at: new Date().toISOString(),
        verified_by: 'current_user'
      }
    }));
    // Add these logs in handleToggleRowLock
    // console.log('Structure:', mappingData.structure);
    // console.log('Active subtab:', activeSubTab);
    // console.log('Determined table name:', tableName);

    toast.success(`Row ${!currentVerificationState ? 'verified' : 'unverified'}`);
    if (typeof refreshData === 'function') {
      await refreshData();
    }
    // console.log('refreshData type:', typeof refreshData);
    // console.log('refreshData:', refreshData);

  } catch (error) {
    console.error('Verification error:', error);
    toast.error('Verification update failed: ' + (error as Error).message);
  }
};

const renderDataRows = (
  data: any[],
  handleCompanyClick: any,
  onMissingFieldsClick: any,
  processedSections: any[],
  refreshData: any,
  lockedRows: any,
  lockedColumns: any,
  activeMainTab: string,
  activeSubTab: string,
  setLockedRows: any
) => {
  return data.map((companyGroup, groupIndex) =>
    companyGroup.rows.map((row, rowIndex) => {
      const isFirstRow = rowIndex === 0;
      const tableName = row.sourceTable || getTableName(row);
      const rowId = row.id || row[`${tableName}_data`]?.id;
      const isRowVerified = lockedRows[`${tableName}_${rowId}`]?.is_verified;

      return (
        <TableRow key={`${groupIndex}-${rowIndex}`}>
          {/* Index Column */}
          {isFirstRow && (
            <TableCell
              className="whitespace-nowrap font-medium text-center border border-gray-300"
              rowSpan={companyGroup.rowSpan}
            >
              {groupIndex + 1}
            </TableCell>
          )}

          {/* Lock Column */}
          {isFirstRow && (
            <TableCell
              className="text-center border border-gray-300"
              rowSpan={companyGroup.rowSpan}
              onClick={() => handleToggleRowLock(row, processedSections, setLockedRows, refreshData, lockedRows, activeMainTab, activeSubTab)}
            >
              {isRowVerified ?
                <Lock className="h-5 w-5 text-red-600 mx-auto" /> :
                <LockOpen className="h-5 w-5 text-green-600 mx-auto" />
              }
            </TableCell>
          )}

          {/* Missing Fields Column */}
          {isFirstRow && (
            <TableCell
              className="text-center border border-gray-300 cursor-pointer bg-red-50/70" // Lighter red
              rowSpan={companyGroup.rowSpan}
              onClick={() => onMissingFieldsClick(companyGroup)}
            >
              {missingFieldsCount}
            </TableCell>
          )}

          {/* Data Fields */}
          {processedSections.slice(1).map((section, sectionIndex) =>
            section.categorizedFields?.map((category, catIndex) =>
              category.fields.map((field, fieldIndex) => {
                const [fieldTableName, columnName] = field.name.split('.');
                let value;

                // Get value from the correct data source
                if (row.isAdditionalRow && row.sourceTable === fieldTableName) {
                  value = row[columnName];
                } else if (row[`${fieldTableName}_data`]) {
                  value = row[`${fieldTableName}_data`][columnName];
                } else if (row.related_data?.[`${fieldTableName}_data`]?.[0]) {
                  value = row.related_data[`${fieldTableName}_data`][0][columnName];
                } else {
                  value = row[columnName];
                }

                const isColumnLocked = lockedColumns[`field_${fieldTableName}.${columnName}`]?.is_verified;
                const isEmpty = value === null || value === undefined || value === '';

                return (
                  <TableCell
                    key={`${groupIndex}-${rowIndex}-${sectionIndex}-${catIndex}-${fieldIndex}`}
                    className={`whitespace-nowrap border border-gray-300 ${isEmpty ? 'bg-red-50' : ''
                      } ${isColumnLocked ? 'bg-gray-100' : ''}`}
                  >
                    <EditableCell
                      value={isEmpty ? 'N/A' : String(value)}
                      onSave={async (newValue) => {
                        if (isRowVerified || isColumnLocked) {
                          toast.error("This field is locked and cannot be edited");
                          return;
                        }
                        try {
                          const { error } = await supabase
                            .from(fieldTableName)
                            .update({
                              [columnName]: newValue,
                              updated_at: new Date().toISOString(),
                              updated_by: 'current_user'
                            })
                            .eq('id', rowId);

                          if (error) throw error;
                          refreshData();
                          toast.success("Field updated successfully");
                        } catch (error) {
                          console.error('Error updating field:', error);
                          toast.error("Failed to update field");
                        }
                      }}
                      disabled={isRowVerified || isColumnLocked}
                      textClassName={isEmpty ? 'text-red-500' : ''}
                    />
                  </TableCell>
                );
              })
            )
          )}
        </TableRow>
      );
    })
  );
};

const persistVerificationStates = async (structure: any, activeMainTab: string, activeSubTab: string) => {
  try {
    const { error } = await supabase
      .from('profile_category_table_mapping_2')
      .update({
        structure: {
          ...structure,
          order: structure.order,
          visibility: structure.visibility,
          relationships: structure.relationships
        }
      })
      .eq('main_tab', activeMainTab)
      .eq('Tabs', activeSubTab);

    if (error) throw error;
  } catch (error) {
    console.error('Error persisting verification states:', error);
  }
};

const getTableNameFromStructure = (structure: any, activeSubTab: string): string => {
  try {
    // Find the section matching the active subtab
    const section = structure.sections.find(
      (s: any) => s.name === activeSubTab || s.name === "Monthy Checklist"
    );

    if (!section?.subsections?.[0]?.tables?.[0]) {
      console.warn('No table found in structure for subtab:', activeSubTab);
      return '';
    }

    // Return the first table from the matching section
    return section.subsections[0].tables[0];

  } catch (error) {
    console.error('Error getting table name from structure:', error);
    return '';
  }
};

const extractFieldVerificationStatus = (structure: any, fieldName: string) => {
  try {
    // Iterate through sections and subsections to find the field
    for (const section of structure.sections) {
      for (const subsection of section.subsections) {
        const field = subsection.fields.find(f =>
          `${f.table}.${f.name}` === fieldName || f.name === fieldName
        );

        if (field?.verification) {
          return {
            is_verified: field.verification.is_verified,
            verified_at: field.verification.verified_at,
            verified_by: field.verification.verified_by
          };
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error extracting field verification:', error);
    return null;
  }
};

const findFieldInStructure = (structure: any, tableName: string, fieldName: string) => {
  for (const section of structure.sections) {
    for (const subsection of section.subsections) {
      const field = subsection.fields?.find(
        (f: any) => f.table === tableName && f.name === fieldName
      );
      if (field) return field;
    }
  }
  return null;
};

// Updated Table component with sticky headers
export const Table: React.FC<TableProps> = ({
  data,
  handleCompanyClick,
  refreshData,
  activeMainTab = '', // Provide default value
  activeSubTab = '', // Provide default value
  processedSections = [], // Provide default empty array
  onMissingFieldsClick,
}) => {

  const [sortConfig, setSortConfig] = useState<{
    field: string | null;
    direction: 'asc' | 'desc' | null;
  }>({ field: null, direction: null });
  console.log('Table Data:', data);
  console.log('Processed Sections:', processedSections);

  const [lockedColumns, setLockedColumns] = useState<Record<string, any>>({});
  const [lockedRows, setLockedRows] = useState<Record<string, any>>({});
  const [localProcessedSections, setLocalProcessedSections] = useState(processedSections);

  const useSidebarLayout = typeof activeMainTab === 'string' && activeMainTab ?
    ['employee details', 'customer details', 'supplier details'].includes(
      activeMainTab.toLowerCase()
    ) : false;
  useEffect(() => {
    if (Array.isArray(processedSections) && processedSections.length > 0) {
      initializeVerificationStates(processedSections, activeMainTab, activeSubTab, setLockedRows);
      initializeFieldVerificationStates(processedSections, activeMainTab, activeSubTab, setLockedColumns);
    }
  }, [processedSections, activeMainTab, activeSubTab]);

  useEffect(() => {
    setLocalProcessedSections(processedSections);
  }, [processedSections]);

  const sortedData = React.useMemo(() => {
    if (!sortConfig.field || !sortConfig.direction) return data;

    return [...data].sort((a, b) => {
      const [tableName, columnName] = sortConfig.field.split('.');
      const aValue = a.rows[0][`${tableName}_data`]?.[columnName] ?? a.rows[0][columnName];
      const bValue = b.rows[0][`${tableName}_data`]?.[columnName] ?? b.rows[0][columnName];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      return sortConfig.direction === 'asc'
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });
  }, [data, sortConfig]);

  const handleSort = (field: string) => {
    setSortConfig(prevConfig => ({
      field,
      direction:
        prevConfig.field === field && prevConfig.direction === 'asc'
          ? 'desc'
          : 'asc'
    }));
  };

  if (useSidebarLayout) {
    return (
      <SidebarTableView
        data={data}
        handleCompanyClick={handleCompanyClick}
        onMissingFieldsClick={onMissingFieldsClick}
        refreshData={refreshData}
        processedSections={processedSections}
        activeMainTab={activeMainTab}
        activeSubTab={activeSubTab}
      />
    );
  }

  const handleVerification = async (type: 'field' | 'row' | 'section', id: string, mainTab: string, subTab: string) => {
    try {
      const { data: currentMapping } = await supabase
        .from('profile_category_table_mapping_2')
        .select('structure')
        .eq('main_tab', mainTab)
        .eq('Tabs', subTab)
        .single();

      if (!currentMapping) return;

      let updatedStructure = { ...currentMapping.structure };

      if (type === 'field') {
        // Update field verification
        updatedStructure.sections = updatedStructure.sections.map(section => ({
          ...section,
          subsections: section.subsections.map(subsection => ({
            ...subsection,
            fields: subsection.fields.map(field =>
              field.name === id ? {
                ...field,
                verification: {
                  is_verified: !field.verification?.is_verified,
                  verified_at: new Date().toISOString(),
                  verified_by: 'current_user' // Replace with actual user
                }
              } : field
            )
          }))
        }));

        // Update the top-level verification status
        updatedStructure.verification = {
          ...updatedStructure.verification,
          field_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: 'current_user'
        };
      }

      // console.log('Updated structure:', updatedStructure);

      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: {
            ...updatedStructure,
            order: updatedStructure.order,
            visibility: updatedStructure.visibility,
            relationships: updatedStructure.relationships
          }
        })
        .eq('main_tab', mainTab)
        .eq('Tabs', subTab);

      if (error) throw error;
      // console.log('Verification update successful');
      toast.success(`${type} verification updated`);
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification update failed');
    }
  };
  const handleToggleColumnLock = async (columnName: string) => {
    try {
      let tableName, fieldName;
      const parts = columnName.split('.');
      if (parts.length >= 2) {
        tableName = parts[0];
        fieldName = parts[parts.length - 1];
      } else {
        throw new Error('Invalid column name format');
      }

      const { data: mappingData, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*')
        .eq('main_tab', activeMainTab)
        .eq('Tabs', activeSubTab)
        .single();

      if (fetchError) throw fetchError;
      if (!mappingData) throw new Error('No mapping data found');

      const fieldKey = `field_${tableName}.${fieldName}`;
      const currentVerificationState = lockedColumns[fieldKey]?.is_verified || false;

      const updatedStructure = JSON.parse(JSON.stringify(mappingData.structure));
      let fieldUpdated = false;

      updatedStructure.sections = updatedStructure.sections.map(section => ({
        ...section,
        subsections: section.subsections?.map(subsection => ({
          ...subsection,
          fields: subsection.fields?.map(field => {
            if (field.table === tableName && field.name === fieldName) {
              fieldUpdated = true;
              return {
                ...field,
                verification: {
                  is_verified: !currentVerificationState,
                  verified_at: new Date().toISOString(),
                  verified_by: 'current_user'
                }
              };
            }
            return field;
          })
        }))
      }));

      if (!fieldUpdated) {
        throw new Error(`Field ${fieldName} not found in structure for table ${tableName}`);
      }

      const { error: updateError } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: updatedStructure
        })
        .eq('id', mappingData.id);

      if (updateError) throw updateError;

      setLockedColumns(prev => ({
        ...prev,
        [fieldKey]: {
          is_verified: !currentVerificationState,
          verified_at: new Date().toISOString(),
          verified_by: 'current_user'
        }
      }));

      const rowKeys = Object.keys(lockedRows);
      const updatedLockedRows = { ...lockedRows };
      rowKeys.forEach(key => {
        if (key.startsWith(tableName)) {
          updatedLockedRows[key] = {
            ...updatedLockedRows[key],
            [`${fieldName}_locked`]: !currentVerificationState
          };
        }
      });
      setLockedRows(updatedLockedRows);

      toast.success(`Column ${!currentVerificationState ? 'locked' : 'unlocked'} successfully`);

      if (typeof refreshData === 'function') {
        await refreshData();
      }

    } catch (error) {
      console.error('Error in handleToggleColumnLock:', error);
      toast.error(`Failed to update column verification: ${(error as Error).message}`);
    }
  };

  const renderHeaders = (
    processedSections: any[],
    sortConfig: SortConfig,
    handleSort: (field: string) => void,
    handleToggleColumnLock: (columnName: string) => void,
    lockedColumns: Record<string, boolean>,
    lockedRows: Record<string, boolean>
  ) => {
    let columnCounter = 1;

    return (
      <>
        {/* Section Reference Row */}
        <TableRow>
          <TableHead className="w-12 text-center sticky left-0 z-20 bg-blue-600 text-white border border-gray-300">Sec REF</TableHead>
          <TableHead className="w-12 text-center bg-blue-600 text-white border border-gray-300">Lock</TableHead>
          <TableHead className="text-center w-20 bg-blue-600 text-white border border-gray-300">Missing Fields</TableHead>
          {processedSections.slice(1).map((section, index) => {
            if (section.isSeparator) return null;
            const colSpan = section.categorizedFields?.reduce((total, cat) =>
              total + (!cat.isSeparator ? cat.fields.length : 0), 0);

            return (
              <TableHead
                key={`sec-ref-${index}`}
                className="text-center bg-blue-600 text-white border border-gray-300"
                colSpan={colSpan}
              >
                {index + 1}
              </TableHead>
            );
          })}
        </TableRow>

        {/* Section Names Row */}
        <TableRow>
          <TableHead className="w-12 text-center bg-blue-100 border border-gray-300">Section</TableHead>
          <TableHead className='font-medium bg-green-100 text-white'></TableHead>
          {/* {renderSeparatorCell(`section-sep-start-${Date.now()}`, 'section')} */}
          <TableHead className="text-center bg-red-100 border border-gray-300">Per Row</TableHead>
          {/* {renderSeparatorCell(`section-sep-end-${Date.now()}`, 'section')} */}
          {processedSections.slice(1).map((section, index) => {
            if (section.isSeparator) return null;
            const colSpan = section.categorizedFields?.reduce((total, cat) =>
              total + (!cat.isSeparator ? cat.fields.length : 0), 0);

            return (
              <TableHead
                key={`section-${index}`}
                className="text-center bg-blue-100 border border-gray-300"
                colSpan={colSpan}
              >
                {section.name}
              </TableHead>
            );
          })}
        </TableRow>

        {/* Subsection Row */}
        <TableRow>
          <TableHead className="w-12 text-center bg-white border border-gray-300">Subsection</TableHead>
          <TableHead className='font-medium bg-green-100 text-white'></TableHead>
          {/* {renderSeparatorCell(`cat-sep-start-${Date.now()}`, 'section')} */}
          <TableHead className="text-center bg-red-100 border border-gray-300"></TableHead>
          {/* {renderSeparatorCell(`cat-sep-end-${Date.now()}`, 'section')} */}
          {processedSections.slice(1).map((section, sectionIndex) =>
            section.categorizedFields?.map((category, catIndex) => {
              if (category.isSeparator) return null;
              const colSpan = category.fields.length;

              return (
                <TableHead
                  key={`subsec-${sectionIndex}-${catIndex}`}
                  className="text-center bg-white border border-gray-300"
                  colSpan={colSpan}
                >
                  {category.name}
                </TableHead>
              );
            })
          )}
        </TableRow>

        {/* Column Reference Row */}
        <TableRow>
          <TableHead className="w-12 text-center bg-gray-50 border border-gray-300">CLM REF</TableHead>
          <TableHead className='font-medium bg-green-100 text-white'></TableHead>
          {/* {renderSeparatorCell(`col-ref-sep-start-${Date.now()}`, 'section')} */}
          <TableHead className="text-center bg-red-100 border border-gray-300"></TableHead>
          {/* {renderSeparatorCell(`col-ref-sep-end-${Date.now()}`, 'section')} */}
          {processedSections.slice(1).map((section, sectionIndex) =>
            section.categorizedFields?.map((category, catIndex) =>
              category.fields.map((field, fieldIndex) => {
                const colNumber = columnCounter++;
                return (
                  <TableHead
                    key={`col-ref-${sectionIndex}-${catIndex}-${fieldIndex}`}
                    className="text-center w-40 bg-gray-50 border border-gray-300"
                  >
                    {colNumber}
                  </TableHead>
                );
              })
            )
          )}
        </TableRow>

        {/* Lock Row */}
        <TableRow>
          <TableHead className="w-12 text-center bg-white border border-gray-300">Lock</TableHead>
          <TableHead className='font-medium bg-green-100 text-white'></TableHead>
          {/* {renderSeparatorCell(`lock-sep-start-${Date.now()}`, 'section')} */}
          <TableHead className="text-center bg-red-100 border border-gray-300"></TableHead>
          {/* {renderSeparatorCell(`lock-sep-end-${Date.now()}`, 'section')} */}
          {processedSections.slice(1).map((section, sectionIndex) =>
            section.categorizedFields?.map((category, catIndex) =>
              category.fields.map((field, fieldIndex) => {
                const [fieldTableName, columnName] = field.name.split('.');
                const isColumnLocked = lockedColumns[`field_${fieldTableName}.${columnName}`]?.is_verified;

                return (
                  <TableHead
                    key={`lock-${sectionIndex}-${catIndex}-${fieldIndex}`}
                    className="text-center w-40 bg-white border border-gray-300 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleToggleColumnLock(`${fieldTableName}.${columnName}`)}
                  >
                    {isColumnLocked ? (
                      <Lock className="h-5 w-5 text-red-600 mx-auto" />
                    ) : (
                      <LockOpen className="h-5 w-5 text-green-600 mx-auto" />
                    )}
                  </TableHead>
                );
              })
            )
          )}
        </TableRow>

        {/* Field Names Row */}
        <TableRow>
          <TableHead className="w-12 text-center bg-white border border-gray-300">Fieldsss</TableHead>
          <TableHead className='font-medium bg-green-100 text-white'></TableHead>
          {/* {renderSeparatorCell(`col-sep-start`, 'section')} */}
          <TableHead className="text-center w-20 bg-red-100 border border-gray-300"></TableHead>
          {/* {renderSeparatorCell(`col-sep-end`, 'section')} */}
          {processedSections.slice(1).map((section, sectionIndex) =>
            section.categorizedFields?.map((category, catIndex) =>
              category.fields.map((field, fieldIndex) => (
                <TableHead
                  key={`field-${sectionIndex}-${catIndex}-${fieldIndex}`}
                  className="text-center w-40 bg-white border border-gray-300"
                >
                  {field.label || field.name.split('.')[1]}
                </TableHead>
              ))
            )
          )}
        </TableRow>
      </>
    );
  };

  const renderDataRows = (
    data: any[],
    handleCompanyClick: any,
    onMissingFieldsClick: any,
    processedSections: any[],
    refreshData: any,
    lockedRows: any,
    lockedColumns: any,
    activeMainTab: string,
    activeSubTab: string,
    setLockedRows: any
  ) => {
    if (!Array.isArray(data)) {
      console.error('Data is not an array:', data);
      return null;
    }

    return data.map((companyGroup, groupIndex) =>
      companyGroup.rows.map((row, rowIndex) => {
        const isFirstRow = rowIndex === 0;
        const tableName = row.sourceTable || getTableName(row);
        const rowId = row.id || row[`${tableName}_data`]?.id;
        const isRowVerified = lockedRows[`${tableName}_${rowId}`]?.is_verified;
        const missingFieldsCount = isFirstRow ? calculateMissingFieldsForRow(row, processedSections) : 0;

        return (
          <TableRow key={`${groupIndex}-${rowIndex}`} className={`hover:bg-gray-50 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
            {/* Index Column */}
            {isFirstRow && (
              <TableCell
                className="whitespace-nowrap font-medium text-center border border-gray-300"
                rowSpan={companyGroup.rowSpan}
              >
                {groupIndex + 1}
              </TableCell>
            )}

            {/* Lock Column */}
            {isFirstRow && (
              <TableCell
                className="text-center bg-green-100 border border-gray-300 cursor-pointer"
                rowSpan={companyGroup.rowSpan}
                onClick={() => handleToggleRowLock(row, processedSections, setLockedRows, refreshData, lockedRows, activeMainTab, activeSubTab)}
              >
                {isRowVerified ?
                  <Lock className="h-5 w-5 text-red-600 mx-auto" /> :
                  <LockOpen className="h-5 w-5 text-green-600 mx-auto" />
                }
              </TableCell>
            )}

            {/* Missing Fields Column */}
            {isFirstRow && (
              <TableCell
                className="text-center bg-red-100 border border-gray-300 cursor-pointer"
                rowSpan={companyGroup.rowSpan}
                onClick={() => onMissingFieldsClick(companyGroup)}
              >
                {missingFieldsCount}
              </TableCell>
            )}

            {/* Data Fields */}
            {processedSections.slice(1).map((section, sectionIndex) =>
              section.categorizedFields?.map((category, catIndex) =>
                category.fields.map((field, fieldIndex) => {
                  const [fieldTableName, columnName] = field.name.split('.');
                  let value;

                  // Get value based on data structure
                  if (row.isAdditionalRow && row.sourceTable === fieldTableName) {
                    value = row[columnName];
                  } else if (row[`${fieldTableName}_data`]) {
                    value = row[`${fieldTableName}_data`][columnName];
                  } else if (row.related_data?.[`${fieldTableName}_data`]?.[0]) {
                    value = row.related_data[`${fieldTableName}_data`][0][columnName];
                  } else {
                    value = row[columnName];
                  }

                  const isColumnLocked = lockedColumns[`field_${fieldTableName}.${columnName}`]?.is_verified;
                  const isEmpty = value === null || value === undefined || value === '';

                  return (
                    <TableCell
                      key={`${groupIndex}-${rowIndex}-${sectionIndex}-${catIndex}-${fieldIndex}`}
                      className={`whitespace-nowrap border border-gray-300 ${isEmpty ? 'bg-red-50' : ''
                        } ${isColumnLocked ? 'bg-gray-100' : ''}`}
                    >
                      <EditableCell
                        value={isEmpty ? 'N/A' : String(value)}
                        onSave={async (newValue) => {
                          if (isRowVerified || isColumnLocked) {
                            toast.error("This field is locked and cannot be edited");
                            return;
                          }
                          try {
                            const { error } = await supabase
                              .from(fieldTableName)
                              .update({
                                [columnName]: newValue,
                                updated_at: new Date().toISOString(),
                                updated_by: 'current_user'
                              })
                              .eq('id', rowId);

                            if (error) throw error;
                            refreshData();
                            toast.success("Field updated successfully");
                          } catch (error) {
                            console.error('Error updating field:', error);
                            toast.error("Failed to update field");
                          }
                        }}
                        disabled={isRowVerified || isColumnLocked}
                        textClassName={isEmpty ? 'text-red-500' : ''}
                      />
                    </TableCell>
                  );
                })
              )
            )}
          </TableRow>
        );
      })
    );
  };

  if (!processedSections || !Array.isArray(processedSections)) {
    return null;
  }

  return (
    <Card className="shadow border rounded-none">
      <CardContent className="p-0 h-[900px]">
        <ScrollArea className="h-[900px]">
          <UITable>
            <TableHeader className="sticky top-0 z-10 bg-white border-b">
              {renderHeaders(
                localProcessedSections,
                sortConfig,
                handleSort,
                handleToggleColumnLock,
                lockedRows,
                lockedColumns
              )}
              {renderStatisticsRows(data, localProcessedSections)}
            </TableHeader>
            <TableBody>
              {renderDataRows(sortedData, handleCompanyClick, onMissingFieldsClick, localProcessedSections, refreshData, lockedRows, lockedColumns, activeMainTab, activeSubTab, setLockedRows)}
            </TableBody>
          </UITable>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Export table components and utilities
export const TableComponents = {
  renderSeparatorCell,
  // renderHeaders,
  // renderStatisticsRows,
  // renderDataRows,
  categoryColors,
  sectionColors
};