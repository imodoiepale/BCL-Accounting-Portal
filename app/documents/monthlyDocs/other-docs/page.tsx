//@ts-nocheck
import { columns } from "./columns"
import { DataTable } from "../data-table"
import { otherDocsData } from "./data"

export default function OtherDocs() {
  return (
    <div className="">
      <DataTable columns={columns} data={otherDocsData} />
    </div>
  )
}