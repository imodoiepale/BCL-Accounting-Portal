//@ts-nocheck
"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Page = () => {
  return (
    <main className="p-4 bg-gray-100 min-h-screen">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="flex justify-start px-6 py-4 border-b">
            <TabsTrigger value="dashboard" className="text-gray-700">Dashboard</TabsTrigger>
            <TabsTrigger value="monthly-documents" className="text-gray-700">Monthly Documents</TabsTrigger>
            <TabsTrigger value="reports" className="text-gray-700">Reports</TabsTrigger>
            <TabsTrigger value="analytics" className="text-gray-700">Analytics</TabsTrigger>
          </TabsList>

          <div className="p-4">
            <TabsContent value="dashboard">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Dashboard</h3>
              {/* Add dashboard content here */}
            </TabsContent>

            <TabsContent value="monthly-documents">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Monthly Documents</h3>
              {/* Add monthly documents content here */}
            </TabsContent>

            <TabsContent value="reports">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Reports</h3>
              {/* Add reports content here */}
            </TabsContent>

            <TabsContent value="analytics">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Analytics</h3>
              {/* Add analytics content here */}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>
  );
};

export default Page;