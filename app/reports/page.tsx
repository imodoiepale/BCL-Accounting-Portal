//@ts-nocheck

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportTable from "./ReportTable";

export default function Reports() {
  const supplierData = [
    { name: "Supplier A", startDate: "2024-01-01", months: ["✅", "✅", "✅", "✅", "✅", "✅", "✅"] },
    { name: "Supplier B", startDate: "2024-02-15", months: ["X", "✅", "✅", "✅", "✅", "✅", "✅"] },
  ];

  const bankData = [
    { name: "Bank X", startDate: "2024-01-01", months: ["✅", "✅", "✅", "✅", "✅", "✅", "✅"] },
    { name: "Bank Y", startDate: "2024-03-01", months: ["X", "X", "✅", "✅", "✅", "✅", "✅"] },
  ];

  const otherDocsData = [
    { name: "Document 1", startDate: "2024-01-01", months: ["✅", "✅", "✅", "✅", "✅", "✅", "✅"] },
    { name: "Document 2", startDate: "2024-02-01", months: ["X", "✅", "✅", "✅", "✅", "✅", "✅"] },
  ];

  return (
    <div className="p-4 w-full ">
      <h1 className="text-xl font-bold mb-4">Reports</h1>
      <Tabs defaultValue="suppliers">
        <TabsList>
          <TabsTrigger value="suppliers">Suppliers Statement Reports</TabsTrigger>
          <TabsTrigger value="banks">Banks Statement Reports</TabsTrigger>
          <TabsTrigger value="others">Other Docs Statement Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="suppliers">
        <Tabs defaultValue="docs">
        <TabsList>
          <TabsTrigger value="docs">Suppliers Statement Documents</TabsTrigger>
          <TabsTrigger value="balance">Suppliers Statement Closing Balance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="docs">
          <ReportTable data={supplierData} title="Suppliers Report" />
        </TabsContent>
        
        <TabsContent value="balance">
          {/* <ReportTable data={bankData} title="Banks Report" /> */}
        </TabsContent>
      </Tabs>
        </TabsContent>
        
        <TabsContent value="banks">
          <ReportTable data={bankData} title="Banks Report" />
        </TabsContent>

        <TabsContent value="others">
          <ReportTable data={otherDocsData} title="Other Documents Report" />
        </TabsContent>
      </Tabs>
    </div>
  );
}