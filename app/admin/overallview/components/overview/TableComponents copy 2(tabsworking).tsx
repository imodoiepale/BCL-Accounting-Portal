// components/overview/TableComponents.tsx
// @ts-nocheck
"use client";
import React from 'react';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditableCell } from './EditableCell';
import { getMissingFields } from '../missingFieldsDialog';
import { calculateFieldStats } from '../utility';

interface TableProps {
  data: any[];
  handleCompanyClick: (company: any) => void;
  onMissingFieldsClick: (company: any) => void;
  processedSections: any[];
  structure: {
    section: string;
    subsections: any[];
    columnMappings: Record<string, string>;
    tableNames: string[];
  };
}

// Utility function to render separator cells
const renderSeparatorCell = (key: string, type: 'section' | 'category' | 'mini' = 'section', rowSpan: number = 1) => {
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

// Define color schemes for sections and categories
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

// Render table headers
const renderHeaders = (processedSections: any[]) => {
  return (
    <>
      {/* Section Reference Row */}
      <TableRow className="bg-yellow-50">
        <TableHead className="font-medium">Sec REF</TableHead>
        {processedSections.map((section, index) => {
          if (section.isSeparator) {
            return (
              <React.Fragment key={`sec-ref-sep-${index}`}>
                {renderSeparatorCell(`sec-ref-sep-${index}-start`, 'section')}
                <TableHead
                  key={`sec-ref-sep-${index}-head`}
                  className="text-center font-medium bg-yellow-50 border-b border-yellow-200"
                >
                  0
                </TableHead>
                {renderSeparatorCell(`sec-ref-sep-${index}-end`, 'section')}
              </React.Fragment>
            );
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
              {index < processedSections.length - 1 && renderSeparatorCell(`sec-ref-end-${index}`, 'section')}
            </React.Fragment>
          );
        })}
      </TableRow>

      {/* Section Headers */}
      <TableRow>
        <TableHead className="font-medium bg-blue-600 text-white">Section</TableHead>
        {processedSections.map((section, index) => {
          if (section.isSeparator) {
            return (
              <React.Fragment key={`section-sep-${index}`}>
                {renderSeparatorCell(`section-sep-${index}-start`, 'section')}
                <TableHead key={`section-sep-${index}-head`} className="text-center text-white bg-red-600">Missing Fields</TableHead>
                {renderSeparatorCell(`section-sep-${index}-end`, 'section')}
              </React.Fragment>
            );
          }

          const colSpan = section.categorizedFields?.reduce((total, cat) =>
            total + (cat.isSeparator ? 1 : cat.fields.length), 0);

          const sectionColor = sectionColors[section.name]?.main || 'bg-gray-600';

          return (
            <React.Fragment key={`section-${section.name}`}>
              <TableHead
                colSpan={colSpan}
                className={`text-center text-white ${sectionColor}`}
              >
                {section.label}
              </TableHead>
              {index < processedSections.length - 1 && renderSeparatorCell(`section-end-${index}`, 'section')}
            </React.Fragment>
          );
        })}
      </TableRow>

      {/* Category Headers */}
      <TableRow>
        <TableHead className="font-medium">Category</TableHead>
        {processedSections.map((section, sectionIndex) => {
          if (section.isSeparator) {
            return (
              <React.Fragment key={`cat-sep-${sectionIndex}`}>
                {renderSeparatorCell(`cat-sep-${sectionIndex}-start`, 'section')}
                <TableHead key={`cat-sep-${sectionIndex}-head`} className="text-center bg-red-50 text-red-700">Per Row</TableHead>
                {renderSeparatorCell(`cat-sep-${sectionIndex}-end`, 'section')}
              </React.Fragment>
            );
          }

          return section.categorizedFields?.map((category, catIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(`cat-${sectionIndex}-${catIndex}`, 'category');
            }

            // Group fields by subCategory to calculate spans and separators
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
                  {/* Add empty separator cell if not the last subcategory */}
                  {subIndex < subArray.length - 1 && (
                    <TableCell
                      key={`cat-sep-${sectionIndex}-${catIndex}-${subIndex}`}
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
        {(() => {
          let columnCounter = 1;
          return processedSections.map((section, sectionIndex) => {
            if (section.isSeparator) {
              return (
                <React.Fragment key={`col-ref-sep-${sectionIndex}`}>
                  {renderSeparatorCell(`col-ref-sep-${sectionIndex}-start`, 'section')}
                  <TableHead key={`col-ref-sep-${sectionIndex}-head`} className="text-center font-medium bg-yellow-50 border-b border-yellow-200">-</TableHead>
                  {renderSeparatorCell(`col-ref-sep-${sectionIndex}-end`, 'section')}
                </React.Fragment>
              )
            }

            return section.categorizedFields?.map((category, catIndex) => {
              if (category.isSeparator) {
                return renderSeparatorCell(`col-ref-cat-${catIndex}`, 'category');
              }

              return category.fields.map((field, fieldIndex, fieldsArray) => (
                <React.Fragment key={`col-ref-${columnCounter}`}>
                  <TableHead
                    className="text-center font-medium bg-yellow-50 border-b border-yellow-200"
                  >
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
        <TableHead className="font-medium">Field</TableHead>
        {processedSections.map((section, sectionIndex) => {
          if (section.isSeparator) {
            return (
              <React.Fragment key={`col-sep-${sectionIndex}`}>
                {renderSeparatorCell(`col-sep-${sectionIndex}-start`, 'section')}
                <TableHead key={`col-sep-${sectionIndex}-head`} className="whitespace-nowrap bg-red-500 text-white">Missing Count</TableHead>
                {renderSeparatorCell(`col-sep-${sectionIndex}-end`, 'section')}
              </React.Fragment>
            )
          }

          return section.categorizedFields?.map((category, catIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(`col-cat-${sectionIndex}-${catIndex}`, 'category');
            }

            return category.fields.map((field, fieldIndex, fieldsArray) => (
              <React.Fragment key={`col-${field.name}`}>
                <TableHead
                  className={`whitespace-nowrap ${sectionColors[section.name]?.sub || 'bg-gray-500'} text-white`}
                >
                  {field.label}
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

// Render statistics rows
const renderStatisticsRows = (data: any[], processedSections: any[]) => {
  return (
    <>
      {/* Statistics Rows */}
      <TableRow className="bg-blue-50">
        <TableHead className="font-semibold text-blue-900 text-start">Total</TableHead>
        {renderSeparatorCell(`total-first-separator`, 'section')}
        <TableCell className="text-center font-medium text-blue-700">
          {Object.values(data).reduce((sum, company) => sum + getMissingFields(company.rows[0]).length, 0)}
        </TableCell>

        {processedSections.map((section, sectionIndex) => {
          if (section.isSeparator) {
            return renderSeparatorCell(
              `total-sec-sep-${sectionIndex}`,
              'section'
            );
          }

          return section.categorizedFields?.map((category, catIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(
                `total-cat-sep-${sectionIndex}-${catIndex}`,
                'category'
              );
            }

            return category.fields.map((field, fieldIndex, fieldsArray) => (
              <>
                <TableCell
                  key={`total-${field.name}`}
                  className="text-center font-medium text-blue-700"
                >
                  {calculateFieldStats(field.name, data).total}
                </TableCell>
                {fieldIndex < fieldsArray.length - 1 &&
                  field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                  renderSeparatorCell(
                    `total-subcat-sep-${sectionIndex}-${catIndex}-${fieldIndex}`,
                    'mini'
                  )}
              </>
            ));
          });
        })}
      </TableRow>

      <TableRow className="bg-green-50">
        <TableHead className="font-semibold text-green-900 text-start">Completed</TableHead>
        {renderSeparatorCell(`completed-first-separator`, 'section')}
        <TableCell className="text-center font-medium text-green-700">-</TableCell>
        {processedSections.map((section, sectionIndex) => {
          if (section.isSeparator) {
            return renderSeparatorCell(
              `completed-sec-sep-${sectionIndex}`,
              'section'
            );
          }

          return section.categorizedFields?.map((category, catIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(
                `completed-cat-sep-${sectionIndex}-${catIndex}`,
                'category'
              );
            }

            return category.fields.map((field, fieldIndex, fieldsArray) => (
              <>
                <TableCell
                  key={`completed-${field.name}`}
                  className="text-center font-medium text-green-700"
                >
                  {calculateFieldStats(field.name, data).completed}
                </TableCell>
                {fieldIndex < fieldsArray.length - 1 &&
                  field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                  renderSeparatorCell(
                    `completed-subcat-sep-${sectionIndex}-${catIndex}-${fieldIndex}`,
                    'mini'
                  )}
              </>
            ));
          });
        })}
      </TableRow>

      <TableRow className="bg-red-50">
        <TableHead className="font-semibold text-red-900 text-start">Pending</TableHead>
        {renderSeparatorCell(`pending-first-separator`, 'section')}
        <TableCell className="text-center font-medium text-red-700">-</TableCell>
        {processedSections.map((section, sectionIndex) => {
          if (section.isSeparator) {
            return renderSeparatorCell(
              `pending-sec-sep-${sectionIndex}`,
              'section'
            );
          }

          return section.categorizedFields?.map((category, catIndex) => {
            if (category.isSeparator) {
              return renderSeparatorCell(
                `pending-cat-sep-${sectionIndex}-${catIndex}`,
                'category'
              );
            }

            return category.fields.map((field, fieldIndex, fieldsArray) => (
              <>
                <TableCell
                  key={`pending-${field.name}`}
                  className="text-center font-medium text-red-700"
                >
                  {calculateFieldStats(field.name, data).pending}
                </TableCell>
                {fieldIndex < fieldsArray.length - 1 &&
                  field.subCategory !== fieldsArray[fieldIndex + 1]?.subCategory &&
                  renderSeparatorCell(
                    `pending-subcat-sep-${sectionIndex}-${catIndex}-${fieldIndex}`,
                    'mini'
                  )}
              </>
            ));
          });
        })}
      </TableRow>
    </>
  );
};

// Render data rows
const renderDataRows = (
  data: any[],
  structure: any,
  handleCompanyClick: (company: any) => void,
  onMissingFieldsClick: (company: any) => void,
) => {
  return data.map((companyGroup, groupIndex) => (
    companyGroup.rows.map((row, rowIndex) => (
      <TableRow key={`${groupIndex}-${rowIndex}`} className="hover:bg-gray-50 transition-colors">
        {/* Index cell */}
        {rowIndex === 0 && (
          <TableCell className="whitespace-nowrap font-medium" rowSpan={companyGroup.rowSpan}>
            {groupIndex + 1}
          </TableCell>
        )}

        {rowIndex === 0 && (
          <>
            {renderSeparatorCell(`first-separator-${groupIndex}`, 'section', companyGroup.rowSpan)}
            <TableCell
              className="whitespace-nowrap cursor-pointer hover:bg-gray-100"
              rowSpan={companyGroup.rowSpan}
              onClick={() => handleCompanyClick(companyGroup.company)}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-red-600">
                  {getMissingFields(row).length}
                </span>
                <span>Missing Fields</span>
              </div>
            </TableCell>
          </>
        )}

        {/* Data cells with separators */}
        {structure.columnMappings && Object.entries(structure.columnMappings).map(([key, label]) => (
          <TableCell key={key}>
            {row[key.split('.')[1]] || '-'}
          </TableCell>
        ))}
      </TableRow>
    ))
  ));
};

// Main Table component
export const Table: React.FC<TableProps> = ({ data, handleCompanyClick, processedSections, onMissingFieldsClick, structure }) => {
  const { section, subsections, columnMappings } = structure;

  const renderColumns = () => {
    return Object.entries(columnMappings).map(([key, label]) => (
      <TableHead key={key}>
        {label}
      </TableHead>
    ));
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{section}</CardTitle>
        <CardDescription>
          {subsections.map(sub => sub.subsection).join(', ')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UITable>
          <TableHeader>
            {renderHeaders(processedSections)}
            <TableRow>
              {renderColumns()}
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderDataRows(data, structure, handleCompanyClick, onMissingFieldsClick)}
          </TableBody>
        </UITable>
      </CardContent>
    </Card>
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