// components/overview/TableComponents.tsx
// @ts-nocheck
"use client";
import React, { useState } from 'react';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditableCell } from './EditableCell';
import { getMissingFields } from '../missingFieldsDialog';
import { calculateFieldStats } from '../utility';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
interface TableProps {
  data: any[];
  handleCompanyClick: (company: any) => void;
  onMissingFieldsClick: (company: any) => void;
  processedSections: any[];
  refreshData: () => Promise<void>; // Add this line
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


// Render statistics rows
const renderStatisticsRows = (data: any[], processedSections: any[]) => {
  return (
    <>
      {/* Total Row */}
      <TableRow className="bg-blue-50">
        <TableHead className="font-semibold text-blue-900 text-start">Total</TableHead>
        <TableCell className="text-center font-medium text-blue-700">
          {data.reduce((sum, companyGroup) =>
            sum + calculateMissingFieldsForRow(companyGroup.rows[0], processedSections), 0)}
        </TableCell>
        {processedSections.slice(2).map((section, sectionIndex) => {
          if (section.isSeparator) {
            return renderSeparatorCell(`total-sep-${sectionIndex}`, 'section');
          }

          return section.categorizedFields?.map((category, catIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(`total-cat-${sectionIndex}-${catIndex}`, 'category');
            }

            return category.fields.map((field, fieldIndex, fieldsArray) => {
              const stats = calculateFieldStatistics(field.name, data);
              return (
                <React.Fragment key={`total-${field.name}`}>
                  <TableCell className="text-center font-medium text-blue-700">
                    {stats.total}
                  </TableCell>
                  {fieldIndex < fieldsArray.length - 1 &&
                    field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                    renderSeparatorCell(`total-subcat-${sectionIndex}-${catIndex}-${fieldIndex}`, 'mini')}
                </React.Fragment>
              );
            });
          });
        })}
      </TableRow>

      {/* Completed Row */}
      <TableRow className="bg-green-50">
        <TableHead className="font-semibold text-green-900 text-start">Completed</TableHead>
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
        {processedSections.slice(2).map((section, sectionIndex) => {
          if (section.isSeparator) {
            return renderSeparatorCell(`completed-sep-${sectionIndex}`, 'section');
          }

          return section.categorizedFields?.map((category, catIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(`completed-cat-${sectionIndex}-${catIndex}`, 'category');
            }

            return category.fields.map((field, fieldIndex, fieldsArray) => {
              const stats = calculateFieldStatistics(field.name, data);
              return (
                <React.Fragment key={`completed-${field.name}`}>
                  <TableCell className="text-center font-medium text-green-700">
                    {stats.completed}
                  </TableCell>
                  {fieldIndex < fieldsArray.length - 1 &&
                    field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                    renderSeparatorCell(`completed-subcat-${sectionIndex}-${catIndex}-${fieldIndex}`, 'mini')}
                </React.Fragment>
              );
            });
          });
        })}
      </TableRow>

      {/* Pending Row */}
      <TableRow className="bg-red-50">
        <TableHead className="font-semibold text-red-900 text-start">Pending</TableHead>
        <TableCell className="text-center font-medium text-red-700">
          {data.reduce((sum, companyGroup) =>
            sum + calculateMissingFieldsForRow(companyGroup.rows[0], processedSections), 0)}
        </TableCell>
        {processedSections.slice(2).map((section, sectionIndex) => {
          if (section.isSeparator) {
            return renderSeparatorCell(`pending-sep-${sectionIndex}`, 'section');
          }

          return section.categorizedFields?.map((category, catIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(`pending-cat-${sectionIndex}-${catIndex}`, 'category');
            }

            return category.fields.map((field, fieldIndex, fieldsArray) => {
              const stats = calculateFieldStatistics(field.name, data);
              return (
                <React.Fragment key={`pending-${field.name}`}>
                  <TableCell className="text-center font-medium text-red-700">
                    {stats.pending}
                  </TableCell>
                  {fieldIndex < fieldsArray.length - 1 &&
                    field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                    renderSeparatorCell(`pending-subcat-${sectionIndex}-${catIndex}-${fieldIndex}`, 'mini')}
                </React.Fragment>
              );
            });
          });
        })}
      </TableRow>
    </>
  );
};
// Updated renderDataRows to remove missing fields column
const renderDataRows = (
  data,
  handleCompanyClick,
  onMissingFieldsClick,
  processedSections,
  refreshData
) => {
  return data.map((companyGroup, groupIndex) => (
    companyGroup.rows.map((row, rowIndex) => (
      <TableRow key={`${groupIndex}-${rowIndex}`} className="hover:bg-gray-50 transition-colors">
        {rowIndex === 0 && (
          <>
            <TableCell
              className="whitespace-nowrap font-medium sticky left-0 z-0 bg-white"
              rowSpan={companyGroup.rowSpan}
            >
              {groupIndex + 1}
            </TableCell>
            {/* Missing Fields column */}
            <TableCell
              className="whitespace-nowrap cursor-pointer hover:bg-gray-100 sticky left-[50px] z-0 bg-white"
              onClick={() => onMissingFieldsClick(companyGroup)}
              rowSpan={companyGroup.rowSpan}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-red-600">
                  {calculateMissingFieldsForRow(row, processedSections)}
                </span>
                <span className='text-black'>Missing Fields</span>
              </div>
            </TableCell>
          </>
        )}

        {processedSections.slice(1).map((section, sectionIndex) => {
          if (section.isSeparator) {
            return renderSeparatorCell(
              `data-sep-${sectionIndex}-${groupIndex}-${rowIndex}`,
              'section'
            );
          }

          return section.categorizedFields?.map((category, categoryIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(
                `data-cat-sep-${sectionIndex}-${categoryIndex}`,
                'category'
              );
            }

            return category.fields.map((field, fieldIndex, fieldsArray) => {
              const [tableName, columnName] = field.name.split('.');
              let value;

              if (field.name === 'acc_portal_company_duplicate.company_name') {
                // Always show company name for first row
                value = row.company_name;
              } else {
                // Get value from appropriate source
                if (row.isAdditionalRow && row.sourceTable === tableName) {
                  value = row[columnName];
                } else if (row[`${tableName}_data`]) {
                  value = row[`${tableName}_data`][columnName];
                } else {
                  value = row[columnName];
                }
              }

              // Format date fields
              if (field.type === 'date' && value) {
                value = formatDate(value);
              }

              return (
                <React.Fragment key={`${groupIndex}-${rowIndex}-${field.name}`}>
                  <TableCell
                    className={`whitespace-nowrap transition-colors ${field.name === 'acc_portal_company_duplicate.company_name'
                        ? 'cursor-pointer hover:text-primary sticky left-[150px] z-0 bg-white'
                        : ''
                      }`}
                    onClick={
                      field.name === 'acc_portal_company_duplicate.company_name'
                        ? () => handleCompanyClick(companyGroup.company)
                        : undefined
                    }
                    rowSpan={tableName === 'acc_portal_company_duplicate' && row.isFirstRow ? companyGroup.rowSpan : 1}
                  >
                    <EditableCell
                      value={value}
                      onSave={async (newValue) => {
                        try {
                          let sourceId = row.isAdditionalRow && row.sourceTable === tableName
                            ? row.id
                            : row[`${tableName}_data`]?.id || row.id;

                          const { error } = await supabase
                            .from(tableName)
                            .update({ [columnName]: newValue })
                            .eq('id', sourceId);

                          if (error) throw error;
                          await refreshData();
                        } catch (error) {
                          console.error('Error updating:', error);
                          toast.error('Update failed');
                        }
                      }}
                      fieldName={field.name}
                      field={field}
                      dropdownOptions={field.dropdownOptions}
                      rowId={
                        row.isAdditionalRow && row.sourceTable === tableName
                          ? row.id
                          : row[`${tableName}_data`]?.id || row.id
                      }
                      companyName={row.company_name}
                      className={field.name === 'acc_portal_company_duplicate.company_name' ? 'hover:text-primary' : ''}
                      refreshData={refreshData}
                    />
                  </TableCell>
                  {fieldIndex < fieldsArray.length - 1 &&
                    field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                    renderSeparatorCell(
                      `data-subcat-sep-${sectionIndex}-${categoryIndex}-${fieldIndex}`,
                      'mini'
                    )}
                </React.Fragment>
              );
            });
          });
        })}
      </TableRow>
    ))
  ));
};

// Updated Table component with sticky headers
export const Table: React.FC<TableProps> = ({ data, handleCompanyClick, refreshData, processedSections, onMissingFieldsClick }) => {
  const [sortConfig, setSortConfig] = useState<{
    field: string | null;
    direction: 'asc' | 'desc' | null;
  }>({ field: null, direction: null });
  const handleSort = (field: string) => {
    setSortConfig(prevConfig => ({
      field,
      direction:
        prevConfig.field === field && prevConfig.direction === 'asc'
          ? 'desc'
          : 'asc'
    }));
  };
  // Inside the Table component, before rendering:
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

  if (!processedSections || !Array.isArray(processedSections)) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="h-[900px] rounded-md border">
          <UITable>
            <TableHeader className="sticky top-0 z-10 bg-white">
              {renderHeaders(processedSections, sortConfig, handleSort)}
              {renderStatisticsRows(data, processedSections)}
            </TableHeader>
            <TableBody>
              {renderDataRows(sortedData, handleCompanyClick, onMissingFieldsClick, processedSections, refreshData)}
            </TableBody>
          </UITable>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
// Render table headers
const renderHeaders = (processedSections: any[], sortConfig: SortConfig, handleSort: (field: string) => void) => {
  return (
    <>
      {/* Section Reference Row */}
      <TableRow className="bg-yellow-50">
        <TableHead className="font-medium">Sec REF</TableHead>
        <TableHead className="text-center font-medium bg-yellow-50 border-b border-yellow-200">
          0
        </TableHead>
        {processedSections.slice(2).map((section, index) => {
          if (section.isSeparator) {
            return renderSeparatorCell(`sec-ref-sep-${index}`, 'section');
          }

          const colSpan = section.categorizedFields?.reduce((total, cat) =>
            total + (cat.isSeparator ? 1 : cat.fields.length), 0);

          return (
            <React.Fragment key={`sec-ref-${section.name}`}>
              <TableHead
                colSpan={colSpan}
                className="text-center font-medium bg-yellow-50 border-b border-yellow-200"
              >
                {index + 1}
              </TableHead>
            </React.Fragment>
          );
        })}
      </TableRow>

      {/* Section Headers */}
      <TableRow>
        <TableHead className="font-medium bg-blue-600 text-white">Section</TableHead>
        <TableHead className="text-center text-white bg-red-600 sticky left-[50px] z-0">
          Missing Fields
        </TableHead>
        {processedSections.slice(2).map((section, index) => {
          if (section.isSeparator) {
            return renderSeparatorCell(`section-sep-${index}`, 'section');
          }

          const colSpan = section.categorizedFields?.reduce((total, cat) =>
            total + (cat.isSeparator ? 1 : cat.fields.length), 0);

          const sectionColor = sectionColors[section.name]?.main || 'bg-gray-600';

          return (
            <TableHead
              key={`section-${section.name}`}
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
        <TableHead className="font-medium">Subsection</TableHead>
        <TableHead className="text-center bg-red-50 text-red-700 sticky left-[50px] z-0">
          Per Row
        </TableHead>
        {processedSections.slice(2).map((section, sectionIndex) => {
          if (section.isSeparator) {
            return renderSeparatorCell(`cat-${sectionIndex}`, 'category');
          }

          return section.categorizedFields?.map((category, catIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(`cat-${sectionIndex}-${catIndex}`, 'category');
            }

            // Group fields by subCategory
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

            return Object.entries(subCategories).map(([subCat, fields], subIndex, subArray) => {
              const cell = (
                <React.Fragment key={`cat-${sectionIndex}-${catIndex}-${subIndex}`}>
                  <TableHead
                    colSpan={fields.length}
                    className={`text-center align-middle ${categoryColor.bg} ${categoryColor.text} ${categoryColor.border}`}
                  >
                    {currentCount <= midPoint && midPoint < (currentCount + fields.length) ? category.category : ''}
                  </TableHead>
                  {subIndex < subArray.length - 1 && (
                    <TableCell className={`p-0 ${categoryColor.bg} ${categoryColor.border}`} />
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
        <TableHead className="text-center font-medium bg-yellow-50 border-b border-yellow-200 sticky left-[50px] z-0">
          -
        </TableHead>
        {(() => {
          let columnCounter = 1;
          return processedSections.slice(2).map((section, sectionIndex) => {
            if (section.isSeparator) {
              return renderSeparatorCell(`col-ref-${sectionIndex}`, 'section');
            }

            return section.categorizedFields?.map((category, catIndex) => {
              if (category.isSeparator) {
                return renderSeparatorCell(`col-ref-cat-${catIndex}`, 'category');
              }

              return category.fields.map((field, fieldIndex, fieldsArray) => (
                <React.Fragment key={`col-ref-${columnCounter}`}>
                  <TableHead className="text-center font-medium bg-yellow-50 border-b border-yellow-200">
                    {columnCounter++}
                  </TableHead>
                  {fieldIndex < fieldsArray.length - 1 &&
                    field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                    renderSeparatorCell(`col-ref-subcat-${sectionIndex}-${catIndex}-${fieldIndex}`, 'mini')}
                </React.Fragment>
              ));
            });
          });
        })()}
      </TableRow>

      {/* Column Headers */}
      <TableRow>
        <TableHead className="font-medium sticky left-0 z-0 bg-white" style={{ minWidth: '50px' }}>
          Field
        </TableHead>
        <TableHead className="whitespace-nowrap bg-red-500 text-white sticky left-[50px] z-0">
          Missing Count
        </TableHead>
        {processedSections.slice(2).map((section, sectionIndex) => {
          if (section.isSeparator) {
            return renderSeparatorCell(`col-${sectionIndex}`, 'section');
          }

          return section.categorizedFields?.map((category, catIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(`col-cat-${sectionIndex}-${catIndex}`, 'category');
            }

            return category.fields.map((field, fieldIndex, fieldsArray) => (
              <React.Fragment key={`col-${field.name}`}>
                <TableHead
                  className={`whitespace-nowrap ${sectionColors[section.name]?.sub || 'bg-gray-500'} 
                    text-white cursor-pointer hover:bg-opacity-90 relative ${field.name === 'acc_portal_company_duplicate.company_name' ? 'sticky left-[150px] z-0' : ''
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
                  renderSeparatorCell(`col-subcat-${sectionIndex}-${catIndex}-${fieldIndex}`, 'mini')}
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