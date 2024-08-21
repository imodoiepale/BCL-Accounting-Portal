/* eslint-disable react/no-unescaped-entities */
// @ts-nocheck
"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FileDown, Printer, ChevronDown } from "lucide-react";
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-react';

export default function PettyCashReportsTab() {
  const { userId } = useAuth();
  
  const [selectedReport, setSelectedReport] = useState('expenditure-summary');
  const [dateRange, setDateRange] = useState({ start: subMonths(new Date(), 1), end: new Date() });
  const [periodType, setPeriodType] = useState('month');
  const [reportData, setReportData] = useState(null);

  const reportTypes = [
    { value: 'expenditure-summary', label: 'Expenditure Summary' },
    { value: 'category-breakdown', label: 'Category Breakdown' },
    { value: 'reconciliation', label: 'Reconciliation Report' },
    { value: 'user-activity', label: 'User Activity Report' },
    { value: 'replenishment-history', label: 'Replenishment History' },
  ];

  const periodTypes = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'quarter', label: 'Quarterly' },
  ];

  const generatePeriods = () => {
    switch (periodType) {
      case 'day':
        return eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
          .map(date => format(date, 'MMM dd'));
      case 'week':
        return eachWeekOfInterval({ start: dateRange.start, end: dateRange.end })
          .map(date => `${format(startOfWeek(date), 'MMM dd')} - ${format(endOfWeek(date), 'MMM dd')}`);
      case 'month':
        return eachMonthOfInterval({ start: dateRange.start, end: dateRange.end })
          .map(date => format(date, 'MMM yyyy'));
      case 'quarter':
        return ['Q1', 'Q2', 'Q3', 'Q4'];
      default:
        return [];
    }
  };

  const categoryColors = {
    'Office Expenses': 'bg-blue-100',
    'Travel Expenses': 'bg-green-100',
    'Utilities': 'bg-yellow-100',
    'Miscellaneous': 'bg-purple-100',
  };

  const generateReport = () => {
    const periods = generatePeriods();
    const categories = [
      { name: 'Office Expenses', subcategories: ['Supplies', 'Equipment', 'Furniture'] },
      { name: 'Travel Expenses', subcategories: ['Transportation', 'Accommodation', 'Meals'] },
      { name: 'Utilities', subcategories: ['Electricity', 'Water', 'Internet'] },
      { name: 'Miscellaneous', subcategories: ['Postage', 'Printing', 'Other'] },
    ];

    let dummyData;

    switch (selectedReport) {
      case 'expenditure-summary':
        dummyData = categories.flatMap(category => 
          [
            { 
              category: category.name, 
              isMainCategory: true,
              ...periods.reduce((acc, period) => ({ ...acc, [period]: Math.floor(Math.random() * 1000) }), {})
            },
            ...category.subcategories.map(subcategory => ({
              category: subcategory,
              isMainCategory: false,
              ...periods.reduce((acc, period) => ({ ...acc, [period]: Math.floor(Math.random() * 500) }), {})
            }))
          ]
        );
        break;
      case 'category-breakdown':
        dummyData = categories.flatMap(category => 
          category.subcategories.map(subcategory => ({
            category: category.name,
            subcategory: subcategory,
            amount: Math.floor(Math.random() * 1000),
            percentage: Math.random() * 100
          }))
        );
        break;
      case 'reconciliation':
        dummyData = periods.map(period => ({
          period,
          openingBalance: Math.floor(Math.random() * 1000),
          expenses: Math.floor(Math.random() * 500),
          replenishments: Math.floor(Math.random() * 300),
          closingBalance: Math.floor(Math.random() * 1000)
        }));
        break;
      case 'user-activity':
        dummyData = ['John Doe', 'Jane Smith', 'Bob Johnson'].flatMap(user => 
          periods.map(period => ({
            user,
            period,
            transactions: Math.floor(Math.random() * 20),
            amount: Math.floor(Math.random() * 500)
          }))
        );
        break;
      case 'replenishment-history':
        dummyData = periods.map(period => ({
          period,
          amount: Math.floor(Math.random() * 1000),
          requestedBy: ['John Doe', 'Jane Smith', 'Bob Johnson'][Math.floor(Math.random() * 3)],
          approvedBy: ['Manager A', 'Manager B', 'Manager C'][Math.floor(Math.random() * 3)],
          status: ['Approved', 'Pending', 'Rejected'][Math.floor(Math.random() * 3)]
        }));
        break;
      default:
        dummyData = [];
    }

    setReportData({
      title: reportTypes.find(r => r.value === selectedReport).label,
      periods: periods,
      rows: dummyData,
    });
  };

const exportToExcel = () => {
      console.log('Exporting petty cash report...');
      const table = document.querySelector('table');
      const ws = XLSX.utils.table_to_sheet(table);
      const wb = XLSX.utils.book_new();

      // Apply styling
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = {c: C, r: R};
          const cell_ref = XLSX.utils.encode_cell(cell_address);
          if (!ws[cell_ref]) continue;
          ws[cell_ref].s = {
            font: { bold: R === 0, color: { rgb: R === 0 ? "FFFFFF" : "000000" } },
            fill: { fgColor: { rgb: R === 0 ? "4F81BD" : "FFFFFF" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
          };
        }
      }

      // Auto-adjust column widths
      const colWidths = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxWidth = 0;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cell_address = {c: C, r: R};
          const cell_ref = XLSX.utils.encode_cell(cell_address);
          if (ws[cell_ref] && ws[cell_ref].v) {
            const cellWidth = ws[cell_ref].v.toString().length;
            maxWidth = Math.max(maxWidth, cellWidth);
          }
        }
        colWidths[C] = maxWidth + 2; // Add some padding
      }
      ws['!cols'] = colWidths.map(w => ({ wch: w }));

      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `${reportData.title}.xlsx`);
};
const printReport = () => {
    console.log('Printing petty cash report...');
    window.print();
  };

  const renderTable = () => {
    switch (selectedReport) {
      case 'expenditure-summary':
        return (
            <Table className="border-collapse border border-gray-300 w-full">
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="border border-gray-300 w-[200px] left-0 z-20 bg-white sticky">Category</TableHead>
                <TableHead className="border border-gray-300 w-[200px] left-[200px] z-20 bg-white sticky">Subcategory</TableHead>
                {reportData.periods.map((period, index) => (
                  <TableHead key={index} className="border border-gray-300 text-right min-w-[100px]">{period}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.rows.map((row, rowIndex) => (
                <TableRow 
                  key={rowIndex}
                  className={row.isMainCategory 
                    ? `${categoryColors[row.category]} font-semibold` 
                    : rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }
                >
                  <TableCell className="border border-gray-300 left-0 z-10 bg-inherit sticky">
                    {row.isMainCategory ? row.category : ""}
                  </TableCell>
                  <TableCell className="border border-gray-300 left-[200px] z-10 bg-inherit sticky">
                    {!row.isMainCategory ? row.category : ""}
                  </TableCell>
                  {reportData.periods.map((period, periodIndex) => (
                    <TableCell key={periodIndex} className="border border-gray-300 text-right">
                      ${row[period] !== undefined ? row[period].toFixed(2) : '0.00'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow className="font-bold bg-green-200">
                <TableCell colSpan={2} className="border border-gray-300 left-0 z-10 bg-green-200 sticky">Total</TableCell>
                {reportData.periods.map((period, periodIndex) => (
                  <TableCell key={periodIndex} className="border border-gray-300 text-right">
                    ${reportData.rows.reduce((sum, row) => sum + (row[period] || 0), 0).toFixed(2)}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        );
      case 'category-breakdown':
        return (
          <Table className="border-collapse border border-gray-300 w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="border border-gray-300">Category</TableHead>
                <TableHead className="border border-gray-300">Subcategory</TableHead>
                <TableHead className="border border-gray-300 text-right">Amount</TableHead>
                <TableHead className="border border-gray-300 text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.rows.map((row, index) => (
                <TableRow key={index} className={categoryColors[row.category]}>
                  <TableCell className="border border-gray-300">{row.category}</TableCell>
                  <TableCell className="border border-gray-300">{row.subcategory}</TableCell>
                  <TableCell className="border border-gray-300 text-right">${row.amount.toFixed(2)}</TableCell>
                  <TableCell className="border border-gray-300 text-right">{row.percentage.toFixed(2)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      case 'reconciliation':
        return (
          <Table className="border-collapse border border-gray-300 w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="border border-gray-300">Period</TableHead>
                <TableHead className="border border-gray-300 text-right">Opening Balance</TableHead>
                <TableHead className="border border-gray-300 text-right">Expenses</TableHead>
                <TableHead className="border border-gray-300 text-right">Replenishments</TableHead>
                <TableHead className="border border-gray-300 text-right">Closing Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.rows.map((row, index) => (
                <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell className="border border-gray-300">{row.period}</TableCell>
                  <TableCell className="border border-gray-300 text-right">${row.openingBalance.toFixed(2)}</TableCell>
                  <TableCell className="border border-gray-300 text-right">${row.expenses.toFixed(2)}</TableCell>
                  <TableCell className="border border-gray-300 text-right">${row.replenishments.toFixed(2)}</TableCell>
                  <TableCell className="border border-gray-300 text-right">${row.closingBalance.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      case 'user-activity':
        return (
          <Table className="border-collapse border border-gray-300 w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="border border-gray-300">User</TableHead>
                <TableHead className="border border-gray-300">Period</TableHead>
                <TableHead className="border border-gray-300 text-right">Transactions</TableHead>
                <TableHead className="border border-gray-300 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.rows.map((row, index) => (
                <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell className="border border-gray-300">{row.user}</TableCell>
                  <TableCell className="border border-gray-300">{row.period}</TableCell>
                  <TableCell className="border border-gray-300 text-right">{row.transactions}</TableCell>
                  <TableCell className="border border-gray-300 text-right">${row.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      case 'replenishment-history':
        return (
          <Table className="border-collapse border border-gray-300 w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="border border-gray-300">Period</TableHead>
                <TableHead className="border border-gray-300 text-right">Amount</TableHead>
                <TableHead className="border border-gray-300">Requested By</TableHead>
                <TableHead className="border border-gray-300">Approved By</TableHead>
                <TableHead className="border border-gray-300">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.rows.map((row, index) => (
                <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell className="border border-gray-300">{row.period}</TableCell>
                  <TableCell className="border border-gray-300 text-right">${row.amount.toFixed(2)}</TableCell>
                  <TableCell className="border border-gray-300">{row.requestedBy}</TableCell>
                  <TableCell className="border border-gray-300">{row.approvedBy}</TableCell>
                  <TableCell className="border border-gray-300">{row.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      default:
        return null;
    }
  };


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Petty Cash Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((report) => (
                    <SelectItem key={report.value} value={report.value}>
                      {report.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="period-type">Period Type</Label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger id="period-type">
                  <SelectValue placeholder="Select period type" />
                </SelectTrigger>
                <SelectContent>
                  {periodTypes.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Report Period</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {`${format(dateRange.start, "MMM d, yyyy")} - ${format(dateRange.end, "MMM d, yyyy")}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.start, to: dateRange.end }}
                    onSelect={(range) => setDateRange({ start: range.from, end: range.to })}
                    initialFocus
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <Button onClick={generateReport}>Generate Report</Button>
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{reportData.title}</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                <FileDown className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
              <Button variant="outline" size="sm" onClick={printReport}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              Period: {format(dateRange.start, "MMM d, yyyy")} - {format(dateRange.end, "MMM d, yyyy")}
            </div>
            <div className="overflow-x-auto max-w-full">
              <div className="inline-block min-w-full align-middle">
                {renderTable()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}