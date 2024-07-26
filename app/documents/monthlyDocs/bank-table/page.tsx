//@ts-nocheck
"use client";

import { columns } from "./columns";
import { bankData } from "./data";
import { DataTable } from "./data-table";

export default function BankTable() {
  return (
    <div className="">
      <DataTable columns={columns} data={bankData} />
    </div>
  );
}