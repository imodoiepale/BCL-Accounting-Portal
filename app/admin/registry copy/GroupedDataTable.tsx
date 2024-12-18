// @ts-nocheck
// @ts-ignore
"use client";
import React, { useState } from 'react';
import { flexRender, getCoreRowModel, getSortedRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const GroupedRowTable = ({ columns, data, onExport, title }) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const pathname = usePathname();

  // Keep existing data processing logic
  const processedData = React.useMemo(() => {
    const grouped = data.reduce((acc, item) => {
      const companyName = item.company_name;
      if (!acc[companyName]) {
        acc[companyName] = [];
      }
      acc[companyName].push(item);
      return acc;
    }, {});

    let result = [];
    let companyIndex = 1;
    Object.entries(grouped).forEach(([companyName, items]) => {
      items.forEach((item, index) => {
        result.push({
          ...item,
          companyIndex: companyIndex,
          isFirstInGroup: index === 0,
          rowspan: index === 0 ? items.length : 0
        });
      });
      companyIndex++;
    });

    return result;
  }, [data]);

  const countMissingFields = (row) => {
    const fields = Object.keys(row).filter(key =>
      key !== 'companyIndex' &&
      key !== 'company_name' &&
      key !== 'isFirstInGroup' &&
      key !== 'rowspan'
    );

    const totalFields = fields.length;
    const completedFields = fields.filter(field => row[field] !== null && row[field] !== '').length;
    const missingFields = totalFields - completedFields;

    return (
      <div className='flex gap-2 text-sm font-medium border rounded-lg p-2 bg-gray-50'>
        <span className='text-blue-600 border-r pr-2'>T: {totalFields}</span>
        <span className='text-green-600 border-r pr-2'>C: {completedFields}</span>
        <span className='text-red-600'>P: {totalMissing}</span>
      </div>
    );
  };
  const table = useReactTable({
    data: processedData,
    columns: [
      {
        accessorKey: 'companyIndex',
        header: '#',
        cell: ({ row }) => {
          if (row.original.isFirstInGroup) {
            return (
              <TableCell rowSpan={row.original.rowspan}>
                {row.original.companyIndex}
              </TableCell>
            );
          }
          return null;
        }
      },
      {
        accessorKey: 'company_name',
        header: 'Company',
        cell: ({ row }) => {
          if (row.original.isFirstInGroup) {
            return (
              <TableCell
                rowSpan={row.original.rowspan}
                className="align-top border-r border-gray-200 bg-gray-50 font-semibold text-gray-700 min-w-[200px] p-4"
              >
                {row.getValue('company_name')}
              </TableCell>
            );
          }
          return null;
        }
      },
      {
        id: 'completeness',
        header: 'Missing Fields',
        cell: ({ row }) => countMissingFields(row.original)
      },
      ...columns.filter(col => col.accessorKey !== 'company_name' && col.id !== 'company_name').map(col => ({
        ...col,
        cell: ({ getValue }) => {
          const value = getValue();
          return value === null || value === '' ? <span className="text-red-500">N/A</span> : value;
        }
      }))
    ],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
  });

  // Calculate total missing fields and per-column missing counts
  const calculateMissingCounts = () => {
    const fields = Object.keys(data[0] || {}).filter(key =>
      key !== 'companyIndex' &&
      key !== 'company_name' &&
      key !== 'isFirstInGroup' &&
      key !== 'rowspan'
    );

    const totalFields = fields.length;
    const completedFields = fields.filter(field =>
      data.every(row => row[field] !== null && row[field] !== '')
    ).length;
    const totalMissing = totalFields - completedFields;

    const columnMissing = {};
    columns.forEach(column => {
      if (column.accessorKey !== 'company_name') {
        columnMissing[column.accessorKey] = data.filter(row =>
          row[column.accessorKey] === null || row[column.accessorKey] === ''
        ).length;
      }
    });

    return { totalFields, completedFields, totalMissing, columnMissing };
  };

  const { totalFields, completedFields, totalMissing, columnMissing } = calculateMissingCounts();


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter companies..."
          value={(table.getColumn("company_name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("company_name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
        {onExport && (
          <Button
            onClick={() => onExport(data, title)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-md shadow-sm transition-colors"
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        )}
      </div>

      <ScrollArea className="h-[900px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-blue-500">
              <TableHead className="border-r font-bold text-white py-3 p-4">#</TableHead>
              <TableHead className="border-r font-bold text-white p-4">Company</TableHead>
              {table.getHeaderGroups()[0].headers.slice(2).map((header) => (
                <TableHead key={header.id} className="font-bold text-white p-4">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
            {/* Enhanced Missing Fields Summary Row */}
            <TableRow className="bg-gray-100 border-b">
              <TableCell className="text-center font-medium"></TableCell>
              <TableCell className="text-center font-medium"></TableCell>
              <TableCell className="text-center">
                <div className='flex justify-center gap-3 font-medium bg-white rounded-lg p-2 shadow-sm'>
                  <span className='text-blue-600 border-r pr-3'>T: {totalFields}</span>
                  <span className='text-green-600 border-r pr-3'>C: {completedFields}</span>
                  <span className='text-red-600'>P: {totalMissing}</span>
                </div>
              </TableCell>
              {columns.filter(col => col.accessorKey !== 'company_name').map((column) => (
                <TableCell key={column.accessorKey} className="text-center">
                  <div className='flex gap-2 justify-center text-sm bg-white rounded-lg p-2 shadow-sm'>
                    <span className='text-blue-600 border-r pr-2'>T: 1</span>
                    <span className='text-green-600 border-r pr-2'>
                      C: {columnMissing[column.accessorKey] === 0 ? 1 : 0}
                    </span>
                    <span className='text-red-600'>
                      P: {columnMissing[column.accessorKey]}
                    </span>
                  </div>
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.original.isFirstInGroup && (
                    <>
                      <TableCell
                        rowSpan={row.original.rowspan}
                        className="align-top border-r border-gray-200 bg-gray-50 font-semibold text-gray-700 w-12 text-center p-4"
                      >
                        {row.original.companyIndex}
                      </TableCell>
                      <TableCell
                        rowSpan={row.original.rowspan}
                        className="align-top border-r border-gray-200 bg-gray-50 font-semibold text-gray-700 p-4"
                      >
                        {row.getValue('company_name')}
                      </TableCell>
                    </>
                  )}
                  {row.getVisibleCells().slice(2).map((cell) => (
                    <TableCell key={cell.id} className="py-2 p-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 2}
                  className="h-24 text-center text-gray-500 p-4"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation='horizontal' />
        </ScrollArea>
    </div>
  );
};

export default GroupedRowTable;