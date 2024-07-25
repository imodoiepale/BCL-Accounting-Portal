//@ts-nocheck
import { columns } from "./columns"
import { DataTable } from "../data-table"
import { bankData } from "./data"

export default function BankTable() {
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={bankData} />
    </div>
  )
}