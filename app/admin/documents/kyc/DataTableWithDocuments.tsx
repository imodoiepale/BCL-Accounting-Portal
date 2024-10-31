// @ts-nocheck
"use client";
import React from "react";
import DocsTable from "./documenttable"; // Ensure the path is correct

const DataTableWithDocuments = ({ category, showDirectors, documents }: { category: string, showDirectors: boolean, documents: any[] }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{category} Documents</h3>
      <DocsTable category={category} showDirectors={showDirectors} documents={documents} />
    </div>
  );
};

export default DataTableWithDocuments;