//@ts-nocheck 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ReportTable = ({ data }) => (
  <table className="min-w-full bg-white border border-gray-300">
    <thead>
      <tr className="bg-gray-100">
        <th className="border p-2">Supplier</th>
        <th className="border p-2">Start Date</th>
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
          <th key={month} className="border p-2">{month}-24</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {data.map((row, index) => (
        <tr key={index}>
          <td className="border p-2">{row.supplier}</td>
          <td className="border p-2">{row.startDate}</td>
          {row.months.map((value, idx) => (
            <td key={idx} className="border p-2 text-center">{value}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);


export default function Reports() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Statements Reports</h1>
      <Tabs defaultValue="suppliers">
        <TabsList className="mb-4">
          <TabsTrigger value="suppliers">Suppliers Statement Reports</TabsTrigger>
          <TabsTrigger value="banks">Banks Statement Reports</TabsTrigger>
          <TabsTrigger value="others">Other Docs Statement Reports</TabsTrigger>
        </TabsList>
       
        <TabsContent value="suppliers">
          <h2 className="text-xl font-semibold mb-2">Suppliers</h2>
         
        </TabsContent>
        
        <TabsContent value="banks">
          <h2 className="text-xl font-semibold mb-2">Banks</h2>
          <p>Bank report content goes here.</p>
        </TabsContent>

        <TabsContent value="others">
          <h2 className="text-xl font-semibold mb-2">Other Docs</h2>
          <p>Other documents report content goes here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}