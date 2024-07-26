
//@ts-nocheck
import { BankStatement } from "./columns";

export const bankData: BankStatement[] = [
  {
    id: "728ed52f",
    accountNumber: "1234567890",
    bankName: "ABC Bank",
    statementDate: "2023-07-31",
    balance: 10000,
    currency: "USD",
    uploadStatus: "Uploaded",
    bankStatus: "Active",
    startDate: "2020-01-01",
    bclVerification: true,
    uploadDate: "2023-08-01",
    periodFrom: "2023-07-01",
    periodTo: "2023-07-31",
    startRangeVerification: true,
    closingBalance: 10000,
    closingBalanceVerified: true,
  },
  {
    id: "489e1d42",
    accountNumber: "0987654321",
    bankName: "XYZ Bank",
    statementDate: "2023-07-31",
    balance: 15000,
    currency: "EUR",
    uploadStatus: "Pending",
    bankStatus: "Inactive",
    startDate: "2019-06-15",
    bclVerification: false,
    uploadDate: "",
    periodFrom: "",
    periodTo: "",
    startRangeVerification: false,
    closingBalance: 15000,
    closingBalanceVerified: false,
  },
];