
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent
} from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Download, Search, Settings } from "lucide-react";
import { TableHeaders } from './TableHeaders';
import { TableBody as CustomTableBody } from './TableBody';
import { EditDialog } from './EditDialog';
import { SettingsDialog } from './SettingsDialog';
import { HelperColumns } from './HelperColumns';
import { ProductData, SortConfig } from './types';
import { tableStructure, defaultVisibility, defaultHelperColumns } from './constants';
import { sortData, filterData, generateSampleData } from './utils';
import { Badge } from '@/components/ui/badge';

const AdvancedTable: React.FC = () => {
    // State
    const [data, setData] = useState<ProductData[]>([]);
    const [filteredData, setFilteredData] = useState<ProductData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });
    const [selectedRow, setSelectedRow] = useState<ProductData | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

    // Visibility state
    const [visibility, setVisibility] = useState(defaultVisibility);

    // Helper columns state
    const [helperColumns, setHelperColumns] = useState(defaultHelperColumns);

    // Effect hooks
    useEffect(() => {
        const initialData = generateSampleData();
        setData(initialData);
        setFilteredData(initialData);
    }, []);

    useEffect(() => {
        const filtered = filterData(data, searchTerm);
        const sorted = sortData(filtered, sortConfig);
        setFilteredData(sorted);
    }, [data, searchTerm, sortConfig]);

    // Handlers
    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key
                ? prev.direction === 'asc' ? 'desc'
                    : prev.direction === 'desc' ? null
                        : 'asc'
                : 'asc'
        }));
    };

    const handleVisibilityChange = (type: string, id: string) => {
        setVisibility(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [id]: !prev[type][id]
            }
        }));
    };

    const handleHelperColumnChange = (type: string, id: string) => {
        setHelperColumns(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [id]: !prev[type][id]
            }
        }));
    };

    // Add pagination state
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Add loading state
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const initialData = generateSampleData();
                setData(initialData);
                setFilteredData(initialData);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        const filtered = filterData(data, searchTerm);
        const sorted = sortData(filtered, sortConfig);
        setFilteredData(sorted);
        setCurrentPage(1); // Reset to first page when filter/sort changes
    }, [data, searchTerm, sortConfig]);

    // Calculate pagination
    const paginatedData = React.useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredData.length / pageSize);

    // Enhanced export function
    const handleExport = async () => {
        try {
            if (!data || data.length === 0) {
                console.error('No data to export');
                return;
            }

            const headers = Object.entries(data[0] || {}).map(([key]) => key);
            const csvData = [
                headers.join(','),
                ...data.map(row =>
                    Object.values(row).map(value => {
                        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value;
                    }).join(',')
                )
            ].join('\n');

            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `table-data-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting data:', error);
            // Here you might want to show a toast notification
        }
    };

    return (
        <div className="w-full p-4 space-y-4">
            {/* Controls */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-64"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <Badge variant="secondary" className="font-normal">
                        {filteredData.length} results
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        className="flex items-center gap-2"
                        disabled={isLoading || data.length === 0}
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setSettingsDialogOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Button>
                </div>
            </div>

            {/* Table */}
            <ScrollArea className="h-[800px] border rounded-md">
                <Table>
                    <TableHeaders
                        sections={tableStructure.sections}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        visibility={visibility}
                        helperColumns={helperColumns}
                    />
                    {isLoading ? (
                        <TableBody>
                            <TableRow>
                                <TableCell
                                    colSpan={100}
                                    className="h-96 text-center text-muted-foreground"
                                >
                                    Loading data...
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    ) : filteredData.length === 0 ? (
                        <TableBody>
                            <TableRow>
                                <TableCell
                                    colSpan={100}
                                    className="h-96 text-center text-muted-foreground"
                                >
                                    No results found
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    ) : (
                        <CustomTableBody
                            data={paginatedData}
                            visibility={visibility}
                            onRowClick={(row) => {
                                setSelectedRow(row);
                                setEditDialogOpen(true);
                            }}
                        />
                    )}
                </Table>
                <ScrollBar orientation="horizontal" />
                <ScrollBar orientation="vertical" />
            </ScrollArea>

            {/* Pagination */}
            {!isLoading && filteredData.length > 0 && (
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="border rounded px-2 py-1"
                        >
                            {[10, 20, 30, 50].map(size => (
                                <option key={size} value={size}>
                                    {size} per page
                                </option>
                            ))}
                        </select>
                        <span className="text-sm text-muted-foreground">
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Dialogs */}
            <EditDialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                data={selectedRow}
                onSave={(updatedData) => {
                    setData(prev =>
                        prev.map(item =>
                            item === selectedRow ? updatedData : item
                        )
                    );
                }}
            />

            <SettingsDialog
                open={settingsDialogOpen}
                onClose={() => setSettingsDialogOpen(false)}
                visibility={visibility}
                helperColumns={helperColumns}
                onVisibilityChange={handleVisibilityChange}
                onHelperColumnChange={handleHelperColumnChange}
            />
        </div>
    );
};

export default AdvancedTable;
