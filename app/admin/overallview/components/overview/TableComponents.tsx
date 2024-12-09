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
      className={`${separatorWidths[type]} ${separatorColors[type]} p-0 border-x border-gray-300`}
      rowSpan={rowSpan}
    />
  );
};

const sectionColors = {
  index: { main: 'bg-gray-600', sub: 'bg-gray-500', cell: 'bg-gray-50' },
  companyDetails: { main: 'bg-blue-600', sub: 'bg-blue-500', cell: 'bg-blue-50' },
  directorDetails: { main: 'bg-emerald-600', sub: 'bg-emerald-500', cell: 'bg-emerald-50' },
  supplierDetails: { main: 'bg-purple-600', sub: 'bg-purple-500', cell: 'bg-purple-50' },
  bankDetails: { main: 'bg-amber-600', sub: 'bg-amber-500', cell: 'bg-amber-50' },
  employeeDetails: { main: 'bg-rose-600', sub: 'bg-rose-500', cell: 'bg-rose-50' }
};

const categoryColors = {
  'General Information': { bg: 'bg-blue-100', text: 'text-slate-700', border: 'border-slate-200' },
  'Bcl take over Details': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'KRA Details': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'PIN Details': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'NSSF Details': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'NHIF Details': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'Ecitizen Details': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'NITA Details': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  'Housing Levy Details': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Standard Levy Details': { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  'Tourism Levy Details': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Tourism Fund Details': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'VAT Details': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Income Tax Status': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'PAYE Details': { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
  'MRI': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'TOT': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'TIMS Details': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'Sheria Details': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Other Details': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  'KRA ACC Manager': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  'KRA Team Lead': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  'KRA Sector Manager': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  'Client Category': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  'IMM': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  'Audit': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  'Acc': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' }
};

// Calculate missing fields for a specific row
const calculateMissingFieldsForRow = (row: any, processedSections: any[]) => {
  let missingCount = 0;

  processedSections.slice(1).forEach(section => {
    if (!section.isSeparator) {
      section.categorizedFields?.forEach(category => {
        if (!category.isSeparator) {
          category.fields.forEach(field => {
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
      {/* Total Row */}
      <TableRow className="bg-blue-50">
        <TableHead className="font-semibold text-blue-900 text-start">Total</TableHead>
        <TableHead className='font-medium bg-green-100 text-white'></TableHead>
        {renderSeparatorCell(`total-first-separator`, 'section')}
        <TableCell className="text-center font-medium text-blue-700">
          {data.reduce((sum, companyGroup) =>
            sum + calculateMissingFieldsForRow(companyGroup.rows[0], processedSections), 0)}
        </TableCell>
        {processedSections.slice(1).map((section, sectionIndex) => {
          if (section.isSeparator) {
            return renderSeparatorCell(
              `total-sec-sep-${sectionIndex}-${Date.now()}`,
              'section'
            );
          }

          return section.categorizedFields?.map((category, catIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(
                `total-cat-sep-${sectionIndex}-${catIndex}-${Date.now()}`,
                'category'
              );
            }

            return category.fields.map((field, fieldIndex, fieldsArray) => {
              const stats = calculateFieldStatistics(field.name, data);
              return (
                <React.Fragment key={`total-${sectionIndex}-${catIndex}-${fieldIndex}-${field.name}`}>
                  <TableCell className="text-center font-medium text-blue-700">
                    {stats.total}
                  </TableCell>
                  {fieldIndex < fieldsArray.length - 1 &&
                    field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                    renderSeparatorCell(
                      `total-subcat-sep-${sectionIndex}-${catIndex}-${fieldIndex}-${Date.now()}`,
                      'mini'
                    )}
                </React.Fragment>
              );
            });
          });
        })}
      </TableRow>

      {/* Completed Row */}
      <TableRow className="bg-green-50">
        <TableHead className="font-semibold text-green-900 text-start">Completed</TableHead>
        <TableHead className='font-medium bg-green-100 text-white'></TableHead>
        {renderSeparatorCell(`completed-first-separator`, 'section')}
        <TableCell className="text-center font-medium text-green-700">
          {data.reduce((sum, companyGroup) => {
            const totalFields = processedSections.reduce((fieldCount, section) => {
              if (!section.isSeparator) {
                section.categorizedFields?.forEach(category => {
                  if (!category.isSeparator) {
                    fieldCount += category.fields.length;
                  }
                });
              }
              return fieldCount;
            }, 0);
            const missingFields = calculateMissingFieldsForRow(companyGroup.rows[0], processedSections);
            return sum + (totalFields - missingFields);
          }, 0)}
        </TableCell>
        {processedSections.slice(1).map((section, sectionIndex) => {
          if (section.isSeparator) {
            return renderSeparatorCell(
              `completed-sec-sep-${sectionIndex}-${Date.now()}`,
              'section'
            );
          }

          return section.categorizedFields?.map((category, catIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(
                `completed-cat-sep-${sectionIndex}-${catIndex}-${Date.now()}`,
                'category'
              );
            }

            return category.fields.map((field, fieldIndex, fieldsArray) => {
              const stats = calculateFieldStatistics(field.name, data);
              return (
                <React.Fragment key={`completed-${sectionIndex}-${catIndex}-${fieldIndex}-${field.name}`}>
                  <TableCell className="text-center font-medium text-green-700">
                    {stats.completed}
                  </TableCell>
                  {fieldIndex < fieldsArray.length - 1 &&
                    field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                    renderSeparatorCell(
                      `completed-subcat-sep-${sectionIndex}-${catIndex}-${fieldIndex}-${Date.now()}`,
                      'mini'
                    )}
                </React.Fragment>
              );
            });
          });
        })}
      </TableRow>

      {/* Pending Row */}
      <TableRow className="bg-red-50">
        <TableHead className="font-semibold text-red-900 text-start">Pending</TableHead>
        <TableHead className='font-medium bg-green-100 text-white'></TableHead>
        {renderSeparatorCell(`pending-first-separator`, 'section')}
        <TableCell className="text-center font-medium text-red-700">
          {data.reduce((sum, companyGroup) =>
            sum + calculateMissingFieldsForRow(companyGroup.rows[0], processedSections), 0)}
        </TableCell>
        {processedSections.slice(1).map((section, sectionIndex) => {
          if (section.isSeparator) {
            return renderSeparatorCell(
              `pending-sec-sep-${sectionIndex}-${Date.now()}`,
              'section'
            );
          }

          return section.categorizedFields?.map((category, catIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(
                `pending-cat-sep-${sectionIndex}-${catIndex}-${Date.now()}`,
                'category'
              );
            }

            return category.fields.map((field, fieldIndex, fieldsArray) => {
              const stats = calculateFieldStatistics(field.name, data);
              return (
                <React.Fragment key={`pending-${sectionIndex}-${catIndex}-${fieldIndex}-${field.name}`}>
                  <TableCell className="text-center font-medium text-red-700">
                    {stats.pending}
                  </TableCell>
                  {fieldIndex < fieldsArray.length - 1 &&
                    field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                    renderSeparatorCell(
                      `pending-subcat-sep-${sectionIndex}-${catIndex}-${fieldIndex}-${Date.now()}`,
                      'mini'
                    )}
                </React.Fragment>
              );
            });
          });
        })}
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

    console.log('Using table info:', { tableName, rowId });

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
    console.log('Structure:', mappingData.structure);
    console.log('Active subtab:', activeSubTab);
    console.log('Determined table name:', tableName);

    toast.success(`Row ${!currentVerificationState ? 'verified' : 'unverified'}`);
    if (typeof refreshData === 'function') {
      await refreshData();
    }
    console.log('refreshData type:', typeof refreshData);
    console.log('refreshData:', refreshData);

  } catch (error) {
    console.error('Verification error:', error);
    toast.error('Verification update failed: ' + (error as Error).message);
  }
};

// Render data rows
const renderDataRows = (
  data: any[],
  handleCompanyClick: (company: any) => void,
  onMissingFieldsClick: (company: any) => void,
  processedSections: any[],
  refreshData: () => Promise<void>,
  lockedRows: Record<string, boolean>,
  lockedColumns: Record<string, boolean>,
  activeMainTab: any[],
  activeSubTab: any[],
  setLockedRows: (value: any) => void
) => {
  return data.map((companyGroup, groupIndex) => (
    companyGroup.rows.map((row, rowIndex) => {

      const tableName = getTableName(row);
      const rowId = row.id || row[`${tableName}_data`]?.id;
      const isRowVerified = lockedRows[`${tableName}_${rowId}`]?.is_verified;
      return (
        <TableRow
          key={`${groupIndex}-${rowIndex}`}
          className="hover:bg-gray-50 transition-colors"
        >
          <TableCell className="whitespace-nowrap font-medium sticky left-0 z-0 bg-white" style={{ width: '20px', minWidth: '20px' }} >
            {groupIndex + 1}
          </TableCell>
          <TableCell
            className="w-10 cursor-pointer hover:bg-gray-100"
            style={{ width: '80px', minWidth: '80px' }}
            onClick={() => {
              // Get the table name from the row data
              const sourceTableName = row.sourceTable ||
                Object.keys(row).find(key => key.endsWith('_data'))?.replace('_data', '') ||
                'acc_portal_company_duplicate';

              handleToggleRowLock(
                row,
                processedSections,
                setLockedRows,
                refreshData,
                lockedRows,
                activeMainTab, // Add these parameters
                activeSubTab
              );
            }}
          >
            {lockedRows[`${row.sourceTable ||
              Object.keys(row).find(key => key.endsWith('_data'))?.replace('_data', '') ||
              'acc_portal_company_duplicate'}_${row.id || row[`${row.sourceTable ||
                Object.keys(row).find(key => key.endsWith('_data'))?.replace('_data', '') ||
                'acc_portal_company_duplicate'}_data`]?.id}`]?.is_verified ? (
              <Lock className="h-7 w-7 text-green-600 bg-green-200 rounded-sm p-[6px]" />
            ) : (
              <LockOpen className="h-7 w-7 text-red-600 bg-red-200 rounded-sm p-[6px]" />
            )}
          </TableCell>
          {renderSeparatorCell(`missing-fields-separator-${groupIndex}-${rowIndex}`, 'section')}
          <TableCell
            className="whitespace-nowrap cursor-pointer hover:bg-gray-100 sticky left-[50px] z-0 bg-white"
            style={{ width: '10px', minWidth: '10px' }}
            onClick={() => onMissingFieldsClick(companyGroup)}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-red-600">
                {calculateMissingFieldsForRow(row, processedSections)}
              </span>
              <span className='text-black'>Missing Fields</span>
            </div>
          </TableCell>
     
          {processedSections.slice(1).map((section, sectionIndex) => {
            if (section.isSeparator) {
              return renderSeparatorCell(`data-sep-${sectionIndex}-${groupIndex}-${rowIndex}`, 'section');
            }

            return section.categorizedFields?.map((category, catIndex) => {
              if (category.isSeparator) {
                return renderSeparatorCell(`data-cat-sep-${sectionIndex}-${catIndex}-${groupIndex}-${rowIndex}`, 'category');
              }

              return category.fields.map((field, fieldIndex, fieldsArray) => {
                const [tableName, columnName] = field.name.split('.');

                let value;
                if (row.isAdditionalRow && row.sourceTable === tableName) {
                  value = row[columnName];
                } else if (row[`${tableName}_data`]) {
                  value = row[`${tableName}_data`][columnName];
                } else {
                  value = row[columnName];
                }

                if (field.type === 'date') {
                  value = formatDate(value);
                }

                if (field.name === 'acc_portal_company_duplicate.company_name') {
                  if (!row.isFirstRow) return null;

                  return (
                    <React.Fragment key={`${groupIndex}-${rowIndex}-${sectionIndex}-${catIndex}-company-name`}>
                      <TableCell
                        className="whitespace-nowrap cursor-pointer hover:text-primary sticky left-[150px] z-0"
                        onClick={() => handleCompanyClick(companyGroup)}
                        rowSpan={companyGroup.rowSpan}
                      >
                        <EditableCell
                          value={value}
                          onSave={async (newValue) => {
                            if (disabled) {
                              toast.error("This field is locked and cannot be edited");
                              return;
                            }
                            try {
                              const { error } = await supabase
                                .from(tableName)
                                .update({ [columnName]: newValue })
                                .eq('id', row.id);

                              if (error) throw error;
                              window.dispatchEvent(new CustomEvent('refreshData'));
                            } catch (error) {
                              console.error('Error updating:', error);
                              toast.error('Update failed');
                            }
                          }}
                          fieldName={field.name}
                          field={field}
                          dropdownOptions={field.dropdownOptions}
                          rowId={row.id}
                          companyName={row.company_name}
                          className="hover:text-primary"
                          refreshData={refreshData}
                          activeMainTab={activeMainTab}
                          activeSubTab={activeSubTab}
                          disabled={isRowVerified || lockedColumns[`field_${tableName}.${columnName}`]?.is_verified}
                          verificationStatus={
                            isRowVerified ?
                              lockedRows[`${tableName}_${rowId}`] :
                              lockedColumns[`field_${tableName}.${columnName}`]
                          } />
                      </TableCell>
                    </React.Fragment>
                  );
                }

                return (
                  <React.Fragment key={`${groupIndex}-${rowIndex}-${sectionIndex}-${catIndex}-${fieldIndex}-${field.name}`}>
                    <TableCell className="whitespace-nowrap transition-colors">
                      <EditableCell
                        value={value}
                        onSave={async (newValue) => {
                          try {
                            const { error } = await supabase
                              .from(tableName)
                              .update({ [columnName]: newValue })
                              .eq('id', row.id);

                            if (error) throw error;
                            window.dispatchEvent(new CustomEvent('refreshData'));
                          } catch (error) {
                            console.error('Error updating:', error);
                            toast.error('Update failed');
                          }
                        }}
                        fieldName={field.name}
                        field={field}
                        dropdownOptions={field.dropdownOptions}
                        rowId={row.id}
                        companyName={row.company_name}
                        refreshData={refreshData}
                        activeMainTab={activeMainTab}
                        activeSubTab={activeSubTab}
                        disabled={isRowVerified || lockedColumns[`field_${tableName}.${columnName}`]?.is_verified}
                        verificationStatus={
                          isRowVerified ?
                            lockedRows[`${tableName}_${rowId}`] :
                            lockedColumns[`field_${tableName}.${columnName}`]
                        }
                      />
                    </TableCell>
                    {fieldIndex < fieldsArray.length - 1 &&
                      field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                      renderSeparatorCell(
                        `data-subcat-sep-${sectionIndex}-${catIndex}-${fieldIndex}-${groupIndex}-${rowIndex}`,
                        'mini'
                      )}
                  </React.Fragment>
                );
              });
            });
          })}
        </TableRow>
      )
    }
    )))
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
  const [lockedColumns, setLockedColumns] = useState<Record<string, any>>({});
  const [lockedRows, setLockedRows] = useState<Record<string, any>>({});
  const [localProcessedSections, setLocalProcessedSections] = useState(processedSections);
  const useSidebarLayout = typeof activeMainTab === 'string' && activeMainTab ? 
  ['employee details', 'customer details', 'supplier details'].includes(
    activeMainTab.toLowerCase()
  ) : false;

// Add debug logging
console.log('Table props:', {
  activeMainTab,
  type: typeof activeMainTab,
  useSidebarLayout
});
useEffect(() => {
  console.log('Table state:', {
    hasData: data?.length > 0,
    activeMainTab,
    activeSubTab,
    processedSections: processedSections?.length
  });
}, [data, activeMainTab, activeSubTab, processedSections]);

    useEffect(() => {
      if (Array.isArray(processedSections) && processedSections.length > 0) {
        // Initialize both row and column verification states
        initializeVerificationStates(processedSections, activeMainTab, activeSubTab, setLockedRows);
        initializeFieldVerificationStates(processedSections, activeMainTab, activeSubTab, setLockedColumns);
      }
    }, [processedSections, activeMainTab, activeSubTab]);

  useEffect(() => {
    setLocalProcessedSections(processedSections);
  }, [processedSections]);

  useEffect(() => {
    console.log('lockedRows updated:', lockedRows);
  }, [lockedRows]);

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
      console.log('Starting verification process:', { type, id, mainTab, subTab });
      const { data: currentMapping } = await supabase
        .from('profile_category_table_mapping_2')
        .select('structure')
        .eq('main_tab', mainTab)
        .eq('Tabs', subTab)
        .single();

      console.log('Current mapping:', currentMapping);

      if (!currentMapping) return;

      let updatedStructure = { ...currentMapping.structure };
      console.log('Initial structure:', updatedStructure);

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

      console.log('Updated structure:', updatedStructure);

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
      console.log('Verification update successful');
      toast.success(`${type} verification updated`);
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification update failed');
    }
  };

  const handleToggleColumnLock = async (columnName: string) => {
    try {
      // Fix the field name parsing
      let tableName, fieldName;

      // Handle the case where the field name contains multiple dots
      const parts = columnName.split('.');
      if (parts.length >= 2) {
        tableName = parts[0];
        // Take the last part as the field name
        fieldName = parts[parts.length - 1];
      } else {
        throw new Error('Invalid column name format');
      }

      console.log('Handling toggle for:', { tableName, fieldName });

      // Fetch current mapping data
      const { data: mappingData, error: fetchError } = await supabase
        .from('profile_category_table_mapping_2')
        .select('*')
        .eq('main_tab', activeMainTab)
        .eq('Tabs', activeSubTab)
        .single();

      if (fetchError) {
        console.error('Error fetching mapping data:', fetchError);
        throw fetchError;
      }

      if (!mappingData) {
        throw new Error('No mapping data found');
      }

      // Get current verification state
      const fieldKey = `field_${tableName}.${fieldName}`;
      const currentVerificationState = lockedColumns[fieldKey]?.is_verified || false;

      console.log('Current verification state:', currentVerificationState);
      console.log('Current structure:', mappingData.structure);

      // Create deep copy of the structure
      const updatedStructure = JSON.parse(JSON.stringify(mappingData.structure));

      // Flag to check if we found and updated the field
      let fieldUpdated = false;

      // Update the field verification in the structure
      updatedStructure.sections = updatedStructure.sections.map(section => ({
        ...section,
        subsections: section.subsections?.map(subsection => ({
          ...subsection,
          fields: subsection.fields?.map(field => {
            // Log each field being checked
            console.log('Checking field:', {
              fieldTable: field.table,
              fieldName: field.name,
              lookingFor: { tableName, fieldName }
            });

            if (field.table === tableName && field.name === fieldName) {
              fieldUpdated = true;
              console.log('Found matching field, updating verification');
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
        console.error('Field not found in structure. Available fields:',
          updatedStructure.sections.flatMap(s =>
            s.subsections?.flatMap(sub =>
              sub.fields?.map(f => `${f.table}.${f.name}`)
            )
          )
        );
        throw new Error(`Field ${fieldName} not found in structure for table ${tableName}`);
      }

      console.log('Updated structure:', updatedStructure);

      // Update the database
      const { error: updateError } = await supabase
        .from('profile_category_table_mapping_2')
        .update({
          structure: {
            ...updatedStructure,
            order: mappingData.structure.order || {},
            visibility: mappingData.structure.visibility || {},
            relationships: mappingData.structure.relationships || {}
          }
        })
        .eq('id', mappingData.id);

      if (updateError) throw updateError;

      // Update local state for column verification
      setLockedColumns(prev => ({
        ...prev,
        [fieldKey]: {
          is_verified: !currentVerificationState,
          verified_at: new Date().toISOString(),
          verified_by: 'current_user'
        }
      }));

      // Also need to disable editing for all cells in this column
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

      // Show success message
      toast.success(`Column ${!currentVerificationState ? 'locked' : 'unlocked'} successfully`);

      // Refresh data if needed
      if (typeof refreshData === 'function') {
        await refreshData();
      }

    } catch (error) {
      console.error('Error in handleToggleColumnLock:', error);
      toast.error(`Failed to update column verification: ${(error as Error).message}`);
    }
  };

  if (!processedSections || !Array.isArray(processedSections)) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-0 h-[900px]">
        <ScrollArea className="h-[900px] rounded-md border">
          <UITable>
            <TableHeader className="sticky top-0 z-10 bg-white">
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

// Render table headers
const renderHeaders = (
  processedSections: any[],
  sortConfig: SortConfig,
  handleSort: (field: string) => void,
  handleToggleColumnLock: (columnName: string) => void,
  lockedColumns: Record<string, boolean>,
  lockedRows: Record<string, boolean>
) => {
  const lockHeadersRow = (
    <TableRow>
      <TableHead className="font-medium">Lock</TableHead>
      <TableHead className='font-medium bg-green-100 text-white'></TableHead>
      {renderSeparatorCell(`lock-sep-start-${Date.now()}`, 'section')}
      <TableHead className="text-center">-</TableHead>
      {renderSeparatorCell(`lock-sep-end-${Date.now()}`, 'section')}
      {processedSections.slice(1).map((section, sectionIndex) => {
        if (section.isSeparator) return null;

        return section.categorizedFields?.map((category, catIndex) => {
          if (category.isSeparator) {
            return renderSeparatorCell(`lock-cat-${sectionIndex}-${catIndex}-${Date.now()}`, 'category');
          }

          return category.fields.map((field, fieldIndex, fieldsArray) => {
            const fieldKey = `field_${field.table}.${field.name}`;
            const verificationStatus = lockedColumns[fieldKey];
            const isVerified = verificationStatus?.is_verified;

            return (
              <React.Fragment key={`lock-${field.table}-${field.name}-${sectionIndex}-${catIndex}-${fieldIndex}`}>
                <TableCell
                  className={`w-10 cursor-pointer hover:bg-gray-100 group relative ${isVerified ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  onClick={() => handleToggleColumnLock(`${field.table}.${field.name}`)}
                >
                  <div className="group relative">
                    {isVerified ? (
                      <Lock className="h-7 w-7 text-green-600 bg-green-200 rounded-sm p-[6px]" />
                    ) : (
                      <LockOpen className="h-7 w-7 text-red-600 bg-red-200 rounded-sm p-[6px]" />
                    )}
                    {verificationStatus && (
                      <div className="absolute invisible group-hover:visible bg-gray-800 text-white text-xs p-2 rounded -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-50">
                        {isVerified ? 'Verified' : 'Not verified'}
                        {verificationStatus.verified_by && ` by ${verificationStatus.verified_by}`}
                        {verificationStatus.verified_at &&
                          ` on ${new Date(verificationStatus.verified_at).toLocaleDateString()}`}
                      </div>
                    )}
                  </div>
                </TableCell>
                {fieldIndex < fieldsArray.length - 1 &&
                  field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                  renderSeparatorCell(
                    `lock-separator-${sectionIndex}-${catIndex}-${fieldIndex}-${Date.now()}`,
                    'mini'
                  )}
              </React.Fragment>
            );
          });
        });
      })}
    </TableRow>
  );
  return (
    <>
      {/* Section Reference Row */}
      <TableRow className="bg-yellow-50">
        <TableHead key="sec-ref-head" className="font-medium" style={{ width: '20px', minWidth: '20px' }}>Sec REF</TableHead>
        <TableHead></TableHead>
        {renderSeparatorCell(`sec-ref-sep-start-${Date.now()}`, 'section')}
        <TableHead key="sec-ref-0" className="text-center font-medium bg-yellow-50 border-b border-yellow-200">0</TableHead>
        {renderSeparatorCell(`sec-ref-sep-end-${Date.now()}`, 'section')}
        {processedSections.slice(1).map((section, index) => {
          if (section.isSeparator) {
            return null;
          }

          const colSpan = section.categorizedFields?.reduce((total, cat) =>
            total + (cat.isSeparator ? 1 : cat.fields.length), 0);

          return (
            <TableHead
              key={`sec-ref-${section.name}-${index}`}
              colSpan={colSpan}
              className="text-center font-medium bg-yellow-50 border-b border-yellow-200"
            >
              {index + 1}
            </TableHead>
          );
        })}
      </TableRow>

      {/* Section Headers */}
      <TableRow>
        <TableHead key="section-head" className="font-medium bg-blue-600 text-white">Section</TableHead>
        <TableHead className='font-medium bg-green-600 text-white'>Verify</TableHead>
        {renderSeparatorCell(`section-sep-start-${Date.now()}`, 'section')}
        <TableHead key="section-missing" className="text-center text-white bg-red-600">Missing Fields</TableHead>
        {renderSeparatorCell(`section-sep-end-${Date.now()}`, 'section')}
        {processedSections.slice(1).map((section, index) => {
          if (section.isSeparator) {
            return null;
          }

          const colSpan = section.categorizedFields?.reduce((total, cat) =>
            total + (cat.isSeparator ? 1 : cat.fields.length), 0);

          const sectionColor = sectionColors[section.name]?.main || 'bg-gray-600';

          return (
            <TableHead
              key={`section-${section.name}-${index}`}
              colSpan={colSpan}
              className={`text-center text-white ${sectionColor}`}
            >
              {section.label}
            </TableHead>
          );
        })}
      </TableRow>

      {/* Category Headers */}
      <TableRow>
        <TableHead key="subsection-head" className="font-medium">Subsection</TableHead>
        <TableHead className='font-medium bg-green-100 text-white'></TableHead>
        {renderSeparatorCell(`cat-sep-start-${Date.now()}`, 'section')}
        <TableHead key="subsection-row" className="text-center bg-red-50 text-red-700">Per Row</TableHead>
        {renderSeparatorCell(`cat-sep-end-${Date.now()}`, 'section')}
        {processedSections.slice(1).map((section, sectionIndex) => {
          if (section.isSeparator) {
            return null;
          }

          return section.categorizedFields?.map((category, catIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(`cat-sep-${sectionIndex}-${catIndex}-${Date.now()}`, 'category');
            }

            const subCategories = category.fields.reduce((acc, field) => {
              const subCat = field.subCategory || 'default';
              if (!acc[subCat]) acc[subCat] = [];
              acc[subCat].push(field);
              return acc;
            }, {});

            const categoryColor = categoryColors[category.category] ||
              { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

            const totalFields = Object.values(subCategories).reduce((sum, fields) => sum + fields.length, 0);
            const midPoint = Math.floor(totalFields / 2);
            let currentCount = 0;

            return Object.entries(subCategories).map(([subCat, fields], subIndex) => {
              const cell = (
                <React.Fragment key={`cat-${sectionIndex}-${catIndex}-${subIndex}-${subCat}-${Date.now()}`}>
                  <TableHead
                    colSpan={fields.length}
                    className={`text-center align-middle ${categoryColor.bg} ${categoryColor.text} ${categoryColor.border}`}
                  >
                    {currentCount <= midPoint && midPoint < (currentCount + fields.length) ? category.category : ''}
                  </TableHead>
                  {subIndex < Object.entries(subCategories).length - 1 && (
                    <TableCell
                      key={`cat-sep-${sectionIndex}-${catIndex}-${subIndex}-${Date.now()}`}
                      className={`p-0 ${categoryColor.bg} ${categoryColor.border}`}
                    />
                  )}
                </React.Fragment>
              );
              currentCount += fields.length;
              return cell;
            });
          });
        })}
      </TableRow>

      {/* Column Reference Row */}
      <TableRow className="bg-yellow-50">
        <TableHead className="font-medium">CLM REF</TableHead>
        <TableHead className='font-medium bg-green-100 text-white'></TableHead>
        {renderSeparatorCell(`col-ref-sep-start`, 'section')}
        <TableHead className="text-center font-medium bg-yellow-50 border-b border-yellow-200">-</TableHead>
        {renderSeparatorCell(`col-ref-sep-end`, 'section')}
        {(() => {
          let columnCounter = 1;
          return processedSections.slice(1).map((section, sectionIndex) => {
            if (section.isSeparator) {
              return null;
            }

            return section.categorizedFields?.map((category, catIndex) => {
              if (category.isSeparator) {
                return renderSeparatorCell(`col-ref-cat-${catIndex}`, 'category');
              }

              return category.fields.map((field, fieldIndex, fieldsArray) => (
                <React.Fragment key={`col-ref-${sectionIndex}-${catIndex}-${fieldIndex}-${columnCounter}`}>
                  <TableHead
                    className="text-center font-medium bg-yellow-50 border-b border-yellow-200"
                  >
                    {columnCounter++}
                  </TableHead>
                  {fieldIndex < fieldsArray.length - 1 &&
                    field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                    renderSeparatorCell(
                      `col-ref-separator-${sectionIndex}-${catIndex}-${fieldIndex}-${Date.now()}`,
                      'mini'
                    )}
                </React.Fragment>
              ));
            });
          });
        })()}
      </TableRow>

      {/* Column Headers with Lock */}

      {lockHeadersRow}

      {/* Column Headers */}
      <TableRow>
        <TableHead
          className="font-medium sticky left-0 z-0 bg-white"
          style={{ minWidth: '50px' }}
        >
          Field
        </TableHead>
        <TableHead className='font-medium bg-green-100 text-white'></TableHead>

        {renderSeparatorCell(`col-sep-start`, 'section')}
        <TableHead
          className="whitespace-nowrap bg-red-500 text-white sticky left-[50px] z-0"
        >
          Missing Count
        </TableHead>
        {renderSeparatorCell(`col-sep-end`, 'section')}
        {processedSections.slice(1).map((section, sectionIndex) => {
          if (section.isSeparator) {
            return null;
          }

          return section.categorizedFields?.map((category, catIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(`col-cat-${sectionIndex}-${catIndex}`, 'category');
            }

            return category.fields.map((field, fieldIndex, fieldsArray) => (
              <React.Fragment key={`col-header-${sectionIndex}-${catIndex}-${fieldIndex}-${field.name}`}>
                <TableHead
                  className={`whitespace-nowrap ${sectionColors[section.name]?.sub || 'bg-gray-500'} text-white cursor-pointer hover:bg-opacity-90 relative ${field.name === 'acc_portal_company_duplicate.company_name' ? 'sticky left-[150px] z-0' : ''
                    }`}
                  onClick={() => handleSort(field.name)}
                >
                  <div className="flex items-center justify-between px-2">
                    {field.label}
                    {sortConfig.field === field.name && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                {fieldIndex < fieldsArray.length - 1 &&
                  field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                  renderSeparatorCell(
                    `col-header-separator-${sectionIndex}-${catIndex}-${fieldIndex}-${Date.now()}`,
                    'mini'
                  )}
              </React.Fragment>
            ));
          });
        })}
      </TableRow>
    </>
  );
};
// Export table components and utilities
export const TableComponents = {
  renderSeparatorCell,
  renderHeaders,
  renderStatisticsRows,
  renderDataRows,
  categoryColors,
  sectionColors
};