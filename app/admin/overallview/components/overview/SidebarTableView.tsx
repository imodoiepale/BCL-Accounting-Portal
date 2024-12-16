// @ts-nocheck 
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditableCell } from './EditableCell';
import { Lock, LockOpen, Search } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export const SidebarTableView = ({
  data,
  handleCompanyClick,
  onMissingFieldsClick,
  refreshData,
  processedSections = [],
  activeMainTab,
  activeSubTab
}) => {
  const [selectedCompanyIndex, setSelectedCompanyIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState(data);
  const [lockedRows, setLockedRows] = useState<Record<string, any>>({});
  const [lockedColumns, setLockedColumns] = useState<Record<string, any>>({});

  // Function to get the table name from the row
  const getTableName = (row) => {
    if (row.sourceTable) {
      return row.sourceTable;
    }
    return row.tableName || ''; // Fallback if no sourceTable is found
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

  useEffect(() => {
    if (Array.isArray(processedSections) && processedSections.length > 0) {
      initializeVerificationStates(processedSections, activeMainTab, activeSubTab, setLockedRows);
      initializeFieldVerificationStates(processedSections, activeMainTab, activeSubTab, setLockedColumns);
    }
  }, [processedSections, activeMainTab, activeSubTab]);

  const initializeVerificationStates = async () => {
    try {
      const { data: mappingData } = await supabase
        .from('profile_category_table_mapping_2')
        .select('structure')
        .eq('main_tab', activeMainTab)
        .eq('Tabs', activeSubTab)
        .single();

      if (!mappingData?.structure) return;

      const columnVerifications = {};
      const rowVerifications = {};

      // Process structure for column verifications
      mappingData.structure.sections?.forEach(section => {
        section.subsections?.forEach(subsection => {
          subsection.fields?.forEach(field => {
            if (field.verification) {
              const fieldKey = `field_${field.table}.${field.name}`;
              columnVerifications[fieldKey] = field.verification;
            }
          });
        });
      });

      setLockedColumns(columnVerifications);

      // Get table names from processed sections
      const tables = new Set();
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

      // Fetch row verifications for each table
      await Promise.all([...tables].map(async (tableName) => {
        const { data: verifiedRows } = await supabase
          .from(tableName)
          .select('id, is_verified, verification_data')
          .eq('is_verified', true);

        verifiedRows?.forEach(row => {
          const key = `${tableName}_${row.id}`;
          rowVerifications[key] = {
            is_verified: row.is_verified,
            verified_at: row.verification_data?.verified_at,
            verified_by: row.verification_data?.verified_by
          };
        });
      }));

      setLockedRows(rowVerifications);
    } catch (error) {
      console.error('Error initializing verification states:', error);
    }
  };

  const initializeFieldVerificationStates = async (
    processedSections: any[],
    activeMainTab: string,
    activeSubTab: string,
    setLockedColumns: (columns: Record<string, any>) => void
  ) => {
    try {
      const { data: mappingData } = await supabase
        .from('profile_category_table_mapping_2')
        .select('structure')
        .eq('main_tab', activeMainTab)
        .eq('Tabs', activeSubTab)
        .single();

      if (!mappingData?.structure) return;

      const fieldVerifications = {};

      mappingData.structure.sections?.forEach(section => {
        section.subsections?.forEach(subsection => {
          subsection.fields?.forEach(field => {
            if (field.verification) {
              const fieldKey = `field_${field.table}.${field.name}`;
              fieldVerifications[fieldKey] = field.verification;
            }
          });
        });
      });

      setLockedColumns(fieldVerifications);
    } catch (error) {
      console.error('Error initializing field verification states:', error);
    }
  };

  const handleToggleColumnLock = async (columnName) => {
    try {
      const [tableName, fieldName] = columnName.split('.');
      const fieldKey = `field_${tableName}.${fieldName}`;
      const currentVerificationState = lockedColumns[fieldKey]?.is_verified || false;

      const { data: mappingData } = await supabase
        .from('profile_category_table_mapping_2')
        .select('structure')
        .eq('main_tab', activeMainTab)
        .eq('Tabs', activeSubTab)
        .single();

      if (!mappingData?.structure) throw new Error('Structure not found');

      const updatedStructure = {
        ...mappingData.structure,
        sections: mappingData.structure.sections.map(section => ({
          ...section,
          subsections: section.subsections.map(subsection => ({
            ...subsection,
            fields: subsection.fields.map(field =>
              field.table === tableName && field.name === fieldName
                ? {
                  ...field,
                  verification: {
                    is_verified: !currentVerificationState,
                    verified_at: new Date().toISOString(),
                    verified_by: 'current_user'
                  }
                }
                : field
            )
          }))
        }))
      };

      const { error } = await supabase
        .from('profile_category_table_mapping_2')
        .update({ structure: updatedStructure })
        .eq('main_tab', activeMainTab)
        .eq('Tabs', activeSubTab);

      if (error) throw error;

      setLockedColumns(prev => ({
        ...prev,
        [fieldKey]: {
          is_verified: !currentVerificationState,
          verified_at: new Date().toISOString(),
          verified_by: 'current_user'
        }
      }));

      toast.success(`Column ${!currentVerificationState ? 'locked' : 'unlocked'} successfully`);
      if (refreshData) await refreshData();

    } catch (error) {
      console.error('Error toggling column lock:', error);
      toast.error('Failed to update column verification');
    }
  };

  useEffect(() => {
    // Filter and process data based on the active tab
    const processData = () => {
      if (!data) return [];

      const filtered = data.filter(item => {
        const searchable = item.company?.company_name?.toLowerCase() || '';
        return searchable.includes(searchTerm.toLowerCase());
      });

      return filtered;
    };

    setFilteredData(processData());
  }, [data, searchTerm, activeMainTab]);

  const filteredCompanies = data
    .filter(company =>
      company.company.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) =>
      a.company.company_name.localeCompare(b.company.company_name)
    );

  const selectedCompanyData = filteredCompanies[selectedCompanyIndex];

  const renderSeparatorCell = (key, type = 'section', rowSpan = 1) => {
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
  // Add this to the SidebarTableView component
  const handleToggleLock = async (field: any, rowId: string, type: 'row' | 'column') => {
    try {
      const isCurrentlyLocked = type === 'row'
        ? lockedRows[`${field.table}_${rowId}`]?.is_verified
        : lockedColumns[`field_${field.table}.${field.name}`]?.is_verified;

      const newVerificationData = {
        is_verified: !isCurrentlyLocked,
        verified_at: new Date().toISOString(),
        verified_by: 'current_user'
      };

      if (type === 'row') {
        // Update row lock
        const { error } = await supabase
          .from(field.table)
          .update({
            is_verified: !isCurrentlyLocked,
            verification_data: newVerificationData
          })
          .eq('id', rowId);

        if (error) throw error;

        setLockedRows(prev => ({
          ...prev,
          [`${field.table}_${rowId}`]: newVerificationData
        }));
      } else {
        // Update column lock in structure
        const { data: currentMapping } = await supabase
          .from('profile_category_table_mapping_2')
          .select('structure')
          .eq('main_tab', activeMainTab)
          .eq('Tabs', activeSubTab)
          .single();

        if (currentMapping?.structure) {
          const updatedStructure = {
            ...currentMapping.structure,
            sections: currentMapping.structure.sections.map(section => ({
              ...section,
              subsections: section.subsections.map(subsection => ({
                ...subsection,
                fields: subsection.fields.map(f =>
                  f.table === field.table && f.name === field.name
                    ? { ...f, verification: newVerificationData }
                    : f
                )
              }))
            }))
          };

          const { error } = await supabase
            .from('profile_category_table_mapping_2')
            .update({ structure: updatedStructure })
            .eq('main_tab', activeMainTab)
            .eq('Tabs', activeSubTab);

          if (error) throw error;

          setLockedColumns(prev => ({
            ...prev,
            [`field_${field.table}.${field.name}`]: newVerificationData
          }));
        }
      }

      toast.success(`${type === 'row' ? 'Row' : 'Column'} ${!isCurrentlyLocked ? 'locked' : 'unlocked'} successfully`);
      refreshData();

    } catch (error) {
      console.error('Error toggling lock:', error);
      toast.error('Failed to update lock status');
    }
  };

  // Calculate missing fields for a specific row
  const calculateMissingFields = (row) => {
    let missingCount = 0;
    processedSections.forEach(section => {
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
  const renderTableHeaders = () => (
    <TableHeader className="sticky top-0 z-10 bg-white">
      {/* Section Reference Row */}
      <TableRow className="bg-yellow-50">
        <TableHead className="font-medium">Sec REF</TableHead>
        <TableHead className='font-medium bg-green-100 text-white'></TableHead>
        {renderSeparatorCell(`sec-ref-sep-start`, 'section')}
        <TableHead className="text-center font-medium bg-yellow-50 border-b border-yellow-200">0</TableHead>
        {processedSections.slice(1).map((section, index) => {
          if (section.isSeparator) {
            return renderSeparatorCell(`sec-sep-${index}`, 'section');
          }
          const colSpan = section.categorizedFields?.reduce((total, cat) =>
            total + (cat.isSeparator ? 1 : cat.fields.length), 0);
          return (
            <TableHead
              key={`sec-ref-${index}`}
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
        <TableHead className="font-medium bg-blue-600 text-white">Section</TableHead>
        <TableHead className='font-medium bg-green-600 text-white'>Verify</TableHead>
        {renderSeparatorCell(`section-sep-start`, 'section')}
        <TableHead className="text-center text-white bg-red-600">Missing Fields</TableHead>
        {processedSections.slice(1).map((section, index) => {
          if (section.isSeparator) {
            return renderSeparatorCell(`section-sep-${index}`, 'section');
          }
          const colSpan = section.categorizedFields?.reduce((total, cat) =>
            total + (cat.isSeparator ? 1 : cat.fields.length), 0);
          return (
            <TableHead
              key={`section-${index}`}
              colSpan={colSpan}
              className={`text-center text-white bg-blue-600`}
            >
              {section.label}
            </TableHead>
          );
        })}
      </TableRow>

      {/* Category Headers */}
      <TableRow>
        <TableHead className="font-medium">Subsection</TableHead>
        <TableHead className='font-medium bg-green-100 text-white'></TableHead>
        {renderSeparatorCell(`cat-sep-start-1`, 'section')}
        <TableHead className="text-center bg-red-50 text-red-700">Per Row</TableHead>
        {renderSeparatorCell(`cat-sep-start-2`, 'section')}
        {processedSections.slice(1).map((section, sIndex) =>
          section.categorizedFields?.map((category, catIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(`cat-${sIndex}-${catIndex}`, 'category');
            }

            const categoryColor = categoryColors[category.category] ||
              { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

            return (
              <TableHead
                key={`cat-${sIndex}-${catIndex}`}
                colSpan={category.fields?.length}
                className={`text-center ${categoryColor.bg} ${categoryColor.text} ${categoryColor.border}`}
              >
                {category.category}
              </TableHead>
            );
          })
        )}
      </TableRow>

      {/* Add new Lock Headers row */}
      <TableRow>
        <TableHead className="font-medium">Lock</TableHead>
        <TableHead className='font-medium bg-green-100 text-white'></TableHead>
        {renderSeparatorCell(`lock-sep-start-1`, 'section')}
        <TableHead className="text-center">-</TableHead>
        {renderSeparatorCell(`lock-sep-start-2`, 'section')}
        {processedSections.slice(1).map((section, sIndex) =>
          section.categorizedFields?.map((category, cIndex) =>
            category.fields?.map((field, fIndex) => {
              const fieldKey = `field_${field.table}.${field.name}`;
              const isVerified = lockedColumns[fieldKey]?.is_verified;
              const uniqueLockKey = `lock_${sIndex}_${cIndex}_${fIndex}_${field.table}_${field.name}`;

              return (
                <TableHead
                  key={uniqueLockKey}
                  className={`w-10 cursor-pointer hover:bg-gray-100 ${isVerified ? 'bg-green-50' : 'bg-red-50'}`}
                  onClick={() => handleToggleColumnLock(`${field.table}.${field.name}`)}
                >
                  {isVerified ? (
                    <Lock className="h-7 w-7 text-green-600 bg-green-200 rounded-sm p-[6px]" />
                  ) : (
                    <LockOpen className="h-7 w-7 text-red-600 bg-red-200 rounded-sm p-[6px]" />
                  )}
                </TableHead>
              );
            })
          )
        )}
      </TableRow>

      {/* Field Headers */}
      <TableRow>
        <TableHead className="font-medium sticky left-0 z-0 bg-white">Field</TableHead>
        <TableHead className='font-medium bg-green-100 text-white'></TableHead>
        {renderSeparatorCell(`field-sep-start-1`, 'section')}
        <TableHead className="whitespace-nowrap bg-red-500 text-white sticky left-[50px] z-0">Missing Count</TableHead>
        {renderSeparatorCell(`field-sep-start-2`, 'section')}
        {processedSections.slice(1).map((section, sIndex) =>
          section.categorizedFields?.map((category, cIndex) =>
            category.fields?.map((field, fIndex) => {
              const uniqueHeaderKey = `header_${sIndex}_${cIndex}_${fIndex}_${field.table}_${field.name}`;
              return (
                <TableHead
                  key={uniqueHeaderKey}
                  className={`whitespace-nowrap font-medium bg-gray-500 text-white`}
                >
                  {field.label}
                </TableHead>
              );
            })
          )
        )}
      </TableRow>
    </TableHeader>
  );

  return (
    <div className="grid h-full" style={{ gridTemplateColumns: '300px 1fr' }}>
      {/* Sidebar */}
      <div className="w-[300px] border-r bg-white flex-shrink-0 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search companies..."
                className="w-full pl-8 pr-4 py-2 border rounded-md focus-visible:ring-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-100px)]">
            <div className="space-y-1 p-4">
              {filteredCompanies.map((company, index) => (
                <Button
                  key={company.company.id}
                  variant={selectedCompanyIndex === index ? "default" : "ghost"}
                  className="w-full justify-start font-normal"
                  onClick={() => setSelectedCompanyIndex(index)}
                >
                  {company.company.company_name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {selectedCompanyData ? (
          <Card className="h-full rounded-none border-0">
            <CardContent className="p-0">
              <div className="h-[calc(100vh-32px)] overflow-auto">
                <div className="min-w-max overflow-visible">
                  <UITable>
                    {renderTableHeaders()}
                    <TableBody className='overflow-auto'>
                      {selectedCompanyData.rows.map((row, rowIndex) => (
                        <TableRow key={rowIndex} className="hover:bg-gray-50">
                          {/* Field Cell */}
                          <TableCell className="whitespace-nowrap font-medium sticky left-0 z-0 bg-white">
                            {rowIndex + 1}
                          </TableCell>
                          <TableCell
                            className="w-10 cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              const tableName = getTableName(row);
                              const rowId = row.id || row[`${tableName}_data`]?.id;
                              const verificationKey = `${tableName}_${rowId}`;
                              const isRowLocked = lockedRows[verificationKey]?.is_verified || false;

                              handleToggleRowLock(
                                row,
                                processedSections,
                                setLockedRows,
                                refreshData,
                                lockedRows,
                                activeMainTab,
                                activeSubTab
                              );
                            }}
                          >
                            {lockedRows[`${getTableName(row)}_${row.id || row[`${getTableName(row)}_data`]?.id}`]?.is_verified ? (
                              <Lock className="h-7 w-7 text-green-600 bg-green-200 rounded-sm p-[6px]" />
                            ) : (
                              <LockOpen className="h-7 w-7 text-red-600 bg-red-200 rounded-sm p-[6px]" />
                            )}
                          </TableCell>
                          {/* Separator */}
                          {renderSeparatorCell(`row-sep-start-${rowIndex}`, 'section')}

                          {/* Missing Fields */}
                          <TableCell
                            className="whitespace-nowrap cursor-pointer hover:bg-gray-100 sticky left-[50px] z-0 bg-white"
                            onClick={() => onMissingFieldsClick(selectedCompanyData)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-red-600">
                                {calculateMissingFields(row)}
                              </span>
                              <span className="text-black">Missing Fields</span>
                            </div>
                          </TableCell>
                          {renderSeparatorCell(`row-sep-end-${rowIndex}`, 'section')}

                          {/* Field Values */}
                          {processedSections.slice(1).map((section, sIndex) =>
                            section.categorizedFields?.map((category, cIndex) =>
                              category.fields?.map((field, fIndex) => {
                                const [tableName, columnName] = field.name.split('.');
                                let value;
                                if (row.isAdditionalRow && row.sourceTable === tableName) {
                                  value = row[columnName];
                                } else if (row[`${tableName}_data`]) {
                                  value = row[`${tableName}_data`][columnName];
                                } else {
                                  value = row[columnName];
                                }

                                const uniqueKey = `cell_${rowIndex}_${sIndex}_${cIndex}_${fIndex}_${field.table}_${field.name}`;

                                return (
                                  <TableCell key={uniqueKey}>
                                    <EditableCell
                                      value={value}
                                      onSave={async (newValue) => {
                                        const tableName = getTableName(row);
                                        const rowId = row.id || row[`${tableName}_data`]?.id;
                                        const isRowLocked = lockedRows[`${tableName}_${rowId}`]?.is_verified;
                                        const isColumnLocked = lockedColumns[`field_${tableName}.${columnName}`]?.is_verified;

                                        if (isRowLocked || isColumnLocked) {
                                          toast.error("This field is locked and cannot be edited");
                                          return;
                                        }

                                        try {
                                          const { error } = await supabase
                                            .from(tableName)
                                            .update({ [columnName]: newValue })
                                            .eq('id', row.id);
                                          if (error) throw error;
                                          refreshData();
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
                                      disabled={
                                        lockedRows[`${getTableName(row)}_${row.id || row[`${getTableName(row)}_data`]?.id}`]?.is_verified ||
                                        lockedColumns[`field_${tableName}.${columnName}`]?.is_verified
                                      }
                                      verificationStatus={
                                        lockedRows[`${getTableName(row)}_${row.id || row[`${getTableName(row)}_data`]?.id}`]?.is_verified
                                          ? lockedRows[`${getTableName(row)}_${row.id || row[`${getTableName(row)}_data`]?.id}`]
                                          : lockedColumns[`field_${tableName}.${columnName}`]
                                      }
                                    />
                                  </TableCell>
                                );
                              })
                            )
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </UITable>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a company from the sidebar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarTableView;

