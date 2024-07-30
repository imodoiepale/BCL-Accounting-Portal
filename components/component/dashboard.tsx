// @ts-nocheck
"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const sampleData = [
  { month: "January", banks_statements: 186, suppliers_statements : 123, others_docs: 45 },
  { month: "February", banks_statements: 305, suppliers_statements: 234, others_docs: 78 },
  { month: "March", banks_statements: 237, suppliers_statements: 176, others_docs: 56 },
  { month: "April", banks_statements: 73, suppliers_statements: 95, others_docs: 23 },
  { month: "May", banks_statements: 209, suppliers_statements: 145, others_docs: 67 },
  { month: "June", banks_statements: 214, suppliers_statements: 198, others_docs: 89 },
];

const stats = [
  { title: "Pending Verification", value: 10 },
  { title: "Pending Monthly Documents", value: 5 },
  { title: "Total Banks", value: 8 },
  { title: "Employees", value: 20 },
  { title: "Directors", value: 4 },
  { title: "Suppliers", value: 15 },
];

const iconMapping = {
  "Pending Verification": <CheckIcon />,
  "Pending Monthly Documents": <ReceiptIcon />,
  "Total Banks": <CoinsIcon />,
  "Employees": <GroupIcon />,
  "Directors": <OptionIcon />,
  "Suppliers": <LeafIcon />,
};

export function Dashboard() {
  const [alienData, setAlienData] = useState(null);
  const [showReminder, setShowReminder] = useState(true);

  useEffect(() => {
    // Using sample data instead of fetching from a database
    setAlienData(sampleData);
  }, []);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });

  const handleCloseReminder = () => {
    setShowReminder(false);
  };

  return (
    <div className="flex">
      <main className="flex-1 p-6 bg-gray-50 h-screen">
        <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
        
          {showReminder && (
            <Alert className="relative mb-6 bg-teal-100 border border-teal-500 rounded-lg shadow-lg">
              <AlertTitle className="text-purple-900 font-bold text-lg">Reminder</AlertTitle>
              <AlertDescription className="text-purple-700 mt-2">
                Please make sure to upload your monthly documents and any pending documents on time.
              </AlertDescription>
              <button
                onClick={handleCloseReminder}
                className="absolute top-2 right-2 p-2 bg-orange-500 text-white rounded-full hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <X size={18} />
              </button>
            </Alert>
          )}


        <div className="grid grid-cols-3 gap-6 mb-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {iconMapping[stat.title]}
                  <span>{stat.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold">Monthly Document Uploads</h2>
          {alienData ? (
            <ResponsiveContainer width="65%" height={400}>
              <LineChart data={alienData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="banks_statements" stroke="#8884d8" />
                <Line type="monotone" dataKey="suppliers_statements" stroke="#82ca9d" />
                <Line type="monotone" dataKey="others_docs" stroke="#ffc658" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div>Loading data...</div>
          )}
        </div>
      </main>
    </div>
  )
}

function CheckIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}


function CoinsIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  )
}

function GroupIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7V5c0-1.1.9-2 2-2h2" />
      <path d="M17 3h2c1.1 0 2 .9 2 2v2" />
      <path d="M21 17v2c0 1.1-.9 2-2 2h-2" />
      <path d="M7 21H5c-1.1 0-2-.9-2-2v-2" />
      <rect width="7" height="5" x="7" y="7" rx="1" />
      <rect width="7" height="5" x="10" y="12" rx="1" />
    </svg>
  )
}

function OptionIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3h6l6 18h6" />
      <path d="M14 3h7" />
    </svg>
  )
}

function LeafIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  )
}

function ReceiptIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 17.5v-11" />
    </svg>
  )
}