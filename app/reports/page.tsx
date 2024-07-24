//@ts-nocheck

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportTable from "./ReportTable";

export default function Reports() {
  const supplierData = [
    { name: "Supplier A", startDate: "2024-01-01", months: [100, 150, 200, 180, 220, 190, 210] },
    { name: "Supplier B", startDate: "2024-02-15", months: [0, 80, 120, 150, 160, 140, 170] },
  ];

  const bankData = [
    { name: "Bank X", startDate: "2024-01-01", months: [5000, 5200, 4800, 5100, 5300, 5150, 5400] },
    { name: "Bank Y", startDate: "2024-03-01", months: [0, 0, 3000, 3200, 3100, 3300, 3500] },
  ];

  const otherDocsData = [
    { name: "Document 1", startDate: "2024-01-01", months: [10, 15, 12, 18, 20, 16, 22] },
    { name: "Document 2", startDate: "2024-02-01", months: [0, 5, 8, 7, 9, 11, 13] },
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
          {/* <ReportTable data={supplierData} title="Suppliers Report" /> */}
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
