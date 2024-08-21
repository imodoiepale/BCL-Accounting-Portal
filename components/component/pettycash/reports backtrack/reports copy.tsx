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
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";


export default function PettyCashReportsTab() {
    const [selectedReport, setSelectedReport] = useState('expenditure-summary');
  const [dateRange, setDateRange] = useState({ start: new Date(2023, 0, 1), end: new Date(2023, 11, 31) });
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

  const generateReport = () => {
    const periods = generatePeriods();
    const categories = [
      { name: 'Office Expenses', subcategories: ['Supplies', 'Equipment', 'Furniture'] },
      { name: 'Travel Expenses', subcategories: ['Transportation', 'Accommodation', 'Meals'] },
      { name: 'Utilities', subcategories: ['Electricity', 'Water', 'Internet'] },
      { name: 'Miscellaneous', subcategories: ['Postage', 'Printing', 'Other'] },
    ];

    const dummyData = categories.flatMap(category => 
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

    setReportData({
      title: reportTypes.find(r => r.value === selectedReport).label,
      periods: periods,
      rows: dummyData,
    });
  };

  const exportReport = () => {
    console.log('Exporting petty cash report...');
  };

  const printReport = () => {
    console.log('Printing petty cash report...');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Petty Cash Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
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
            <div className="flex-1">
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
            <div className="flex-1 space-y-2">
              <Label>Report Period</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-between text-left font-normal">
                    {`${format(dateRange.start, "MMM d, yyyy")} - ${format(dateRange.end, "MMM d, yyyy")}`}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.start, to: dateRange.end }}
                    onSelect={(range) => setDateRange({ start: range.from, end: range.to })}
                    initialFocus
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
              <Button variant="outline" size="sm" onClick={exportReport}>
                <FileDown className="mr-2 h-4 w-4" />
                Export
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
            <div className="overflow-x-auto">
              <Table className="border-collapse border border-gray-300">
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="border border-gray-300 w-[200px]">Category</TableHead>
                    <TableHead className="border border-gray-300 w-[200px]">Subcategory</TableHead>
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
                        ? "bg-gray-100 font-semibold" 
                        : rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }
                    >
                      <TableCell className="border border-gray-300">
                        {row.isMainCategory ? row.category : ""}
                      </TableCell>
                      <TableCell className="border border-gray-300">
                        {!row.isMainCategory ? row.category : ""}
                      </TableCell>
                      {reportData.periods.map((period, periodIndex) => (
                        <TableCell key={periodIndex} className="border border-gray-300 text-right">
                          ${row[period].toFixed(2)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-gray-200">
                    <TableCell colSpan={2} className="border border-gray-300">Total</TableCell>
                    {reportData.periods.map((period, periodIndex) => (
                      <TableCell key={periodIndex} className="border border-gray-300 text-right">
                        ${reportData.rows.reduce((sum, row) => sum + row[period], 0).toFixed(2)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
