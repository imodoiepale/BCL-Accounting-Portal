
//@ts-nocheck
import { BankStatement } from "./columns"

export const bankData: BankStatement[] = [
  {
    id: "728ed52f",
    accountNumber: "1234567890",
    bankName: "ABC Bank",
    statementDate: "2023-07-31",
    balance: 10000,
    currency: "USD",
    uploadStatus: "Uploaded",
  },
  {
    id: "489e1d42",
    accountNumber: "0987654321",
    bankName: "XYZ Bank",
    statementDate: "2023-07-31",
    balance: 15000,
    currency: "EUR",
    uploadStatus: "Pending",
  },
]