//@ts-nocheck
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationPrevious, 
  PaginationNext 
} from "@/components/ui/pagination";
import { Card, CardHeader, CardContent } from "@/components/ui/card"; // Import ShadCN UI card components

interface DataRow {
  name: string;
  startDate: string;
  months: number[];
}

interface ReportTableProps {
  data: DataRow[];
  title: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ReportTable: React.FC<ReportTableProps> = ({ data, title }) => {
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("2024-01-01");
  const [toDate, setToDate] = useState<string>("2024-12-31");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10; // Adjust this to set the number of rows per page

  const currentMonthIndex = useMemo(() => new Date().getMonth(), []);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredData = data.filter((row) => {
    const rowDate = new Date(row.startDate);
    return rowDate >= new Date(fromDate) && rowDate <= new Date(toDate);
  }).filter((row) =>
    Object.values(row).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortColumn === "") return 0;
    const aValue = sortColumn.startsWith("months.") 
      ? a.months[parseInt(sortColumn.split('.')[1])]
      : a[sortColumn as keyof DataRow];
    const bValue = sortColumn.startsWith("months.") 
      ? b.months[parseInt(sortColumn.split('.')[1])]
      : b[sortColumn as keyof DataRow];
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  return (
    <div>
      <Card className="mb-4 p-4">
        <CardHeader className="text-lg font-semibold mb-2">Choose Period to View Reports</CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 mb-4">
            <div className="flex space-x-4">
              <div>
                <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700">From</label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="toDate" className="block text-sm font-medium text-gray-700">To</label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
              <Input
                id="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-white">
                <Button variant="ghost" onClick={() => handleSort("name")}>
                  Name <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("startDate")}>
                  Start Date <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              {MONTHS.map((month, index) => (
                <TableHead 
                  key={month}
                  className={index === currentMonthIndex ? "bg-yellow-100" : ""}
                >
                  <Button variant="ghost" onClick={() => handleSort(`months.${index}`)}>
                    {month} <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell className="sticky left-0 bg-white">{row.name}</TableCell>
                <TableCell>{row.startDate}</TableCell>
                {MONTHS.map((_, monthIndex) => (
                  <TableCell 
                    key={monthIndex}
                    className={monthIndex === currentMonthIndex ? "bg-yellow-100" : ""}
                  >
                    {monthIndex < currentMonthIndex ? row.months[monthIndex] || "" : ""}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationPrevious onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} />
          {[...Array(totalPages)].map((_, index) => (
            <PaginationItem key={index}>
              <PaginationLink
                isActive={index + 1 === currentPage}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationNext onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} />
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default ReportTable;
