// @ts-nocheck 
"use client";
import React, { useState, useEffect  } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditableCell } from './EditableCell';
import { Search } from 'lucide-react';
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
        {renderSeparatorCell(`cat-sep-start`, 'section')}
        <TableHead className="text-center bg-red-50 text-red-700">Per Row</TableHead>
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
        {renderSeparatorCell(`cat-sep-end`, 'section')}
      </TableRow>

      {/* Field Headers */}
      <TableRow>
        <TableHead className="font-medium sticky left-0 z-0 bg-white">Field</TableHead>
        {renderSeparatorCell(`field-sep-start`, 'section')}
        <TableHead className="whitespace-nowrap bg-red-500 text-white sticky left-[50px] z-0">Missing Count</TableHead>
        {processedSections.slice(1).map((section, sIndex) =>
          section.categorizedFields?.map((category, cIndex) =>
            category.fields?.map((field, fIndex) => (
              <TableHead
                key={`field-${sIndex}-${cIndex}-${fIndex}`}
                className={`whitespace-nowrap font-medium bg-gray-500 text-white`}
              >
                {field.label}
              </TableHead>
            ))
          )
        )}
        {renderSeparatorCell(`field-sep-end`, 'section')}
      </TableRow>
    </TableHeader>
  );

  return (
    <div className="grid h-full" style={{ gridTemplateColumns: '300px 1fr' }}>
      {/* Sidebar */}
      <div className="border-r">
        <div className="p-4 space-y-4">
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
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-1 pr-4">
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
      <div className="overflow-hidden">
        {selectedCompanyData ? (
          <Card className="h-full rounded-none border-0">
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-32px)]">
                <div className="min-w-max">
                  <UITable>
                    {renderTableHeaders()}
                    <TableBody>
                      {selectedCompanyData.rows.map((row, rowIndex) => (
                        <TableRow key={rowIndex} className="hover:bg-gray-50">
                          {/* Field Cell */}
                          <TableCell className="whitespace-nowrap font-medium sticky left-0 z-0 bg-white">
                            {rowIndex + 1}
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

                          {/* Field Values */}
                          {processedSections.slice(1).map((section, sIndex) =>
                            section.categorizedFields?.map((category) =>
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

                                return (
                                  <TableCell key={`${field.name}-${rowIndex}-${fIndex}`}>
                                    <EditableCell
                                      value={value}
                                      onSave={async (newValue) => {
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
              </ScrollArea>
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