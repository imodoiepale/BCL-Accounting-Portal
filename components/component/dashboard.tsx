// @ts-nocheck
"use client"

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CoinsIcon, GroupIcon, LeafIcon, OptionIcon, ReceiptCentIcon, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User as UserIcon,
  Upload as UploadIcon,
  Check as CheckIcon,
  BarChart as BarChartIcon,
  DollarSign as BanknoteIcon,
  Settings as SettingsIcon,
  Wallet as WalletIcon,
  Users as UsersIcon,
  ChevronRight as ChevronRightIcon,
  Circle as CircleIcon,
  AlertTriangle as AlertTriangleIcon
} from "lucide-react";
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { supabase } from '@/lib/supabaseClient'



const gettingStartedSteps = [
  {
    id: 1,
    title: "Complete Profile",
    description: "Update company information",
    status: "Incomplete",
    icon: UserIcon,
    badgeColor: "border-red-800",
    badgeTextColor: "fill-red-300 text-green-300",
    link: "/profile"
  },
  {
    id: 2,
    title: "Upload Documents",
    description: "Submit monthly statements and receipts",
    status: "In Progress",
    icon: UploadIcon,
    badgeColor: "border-yellow-600",
    badgeTextColor: "fill-yellow-300 text-yellow-300",
    link: "/documents"
  },
  {
    id: 3,
    title: "Manage Suppliers",
    description: "Add or update suppliers",
    status: "In Progress",
    icon: UsersIcon,
    badgeColor: "border-yellow-600",
    badgeTextColor: "fill-yellow-300 text-yellow-300",
    link: "/profile"
  },
  {
    id: 5,
    title: "Manage Banks",
    description: "Add or update bank accounts",
    status: "In Progress",
    icon: BanknoteIcon,
    badgeColor: "border-yellow-600",
    badgeTextColor: "fill-yellow-300 text-yellow-300",
    link: "/profile"
  },
  {
    id: 4,
    title: "View Reports",
    description: "Access financial reports and analytics",
    status: "Complete",
    icon: BarChartIcon,
    badgeColor: "border-green-600",
    badgeTextColor: "fill-green-300 text-green-300",
    link: "/reports"
  },
  {
    id: 6,
    title: "Set Preferences",
    description: "Customize your account settings ",
    status: "Incomplete",
    icon: SettingsIcon,
    badgeColor: "border-red-600",
    badgeTextColor: "fill-red-300 text-red-300",
    link: "/settings"
  },
  // { 
  //   id: 7, 
  //   title: "Track Expenses", 
  //   description: "Log and categorize your business expenses", 
  //   status: "Complete",
  //   icon: WalletIcon,
  //   badgeColor: "border-green-600",
  //   badgeTextColor: "fill-green-300 text-green-300",
  //   link: "/expenses"
  // },
  // { 
  //   id: 8, 
  //   title: "Verify Transactions", 
  //   description: "Review and approve pending transactions", 
  //   status: "Complete",
  //   icon: CheckIcon,
  //   badgeColor: "border-green-600",
  //   badgeTextColor: "fill-green-300 text-green-300",
  //   link: "/transactions"
  // },
];


const iconMapping = {
  "Pending Verification": <CheckIcon />,
  "Pending Monthly Documents": <ReceiptCentIcon />,
  "Total Banks": <CoinsIcon />,
  "Employees": <GroupIcon />,
  "Directors": <OptionIcon />,
  "Suppliers": <LeafIcon />,
};

export function Dashboard() {
  const { userId } = useAuth();
  const [showReminder, setShowReminder] = useState(true);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState({
    suppliers: [],
    employees: [],
    banks: []
  });

  useEffect(() => {
    const fetchCompanyData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('acc_portal_company')
          .select('*')
          .eq('userid', userId)
          .single();

        if (error) throw error;

        const requiredFields = [
          'company_name', 'company_type', 'description', 'registration_number', 'date_established', 'kra_pin_number',
          'industry', 'employees', 'annual_revenue', 'fiscal_year', 'website',
          'email', 'phone', 'street', 'city', 'postal_code', 'country'
        ];

        const missing = requiredFields.filter(field => !data || !data[field]);
        setMissingFields(missing);
        setIsProfileIncomplete(missing.length > 0);
      } catch (error) {
        console.error('Error fetching company data:', error);
        setIsProfileIncomplete(true);
        setMissingFields([
          'company_name', 'company_type', 'description', 'registration_number', 'date_established', 'kra_pin_number',
          'industry', 'employees', 'annual_revenue', 'fiscal_year', 'website',
          'email', 'phone', 'street', 'city', 'postal_code', 'country'
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const [
          { data: pendingVerification },
          { data: pendingMonthlyDocs },
          { data: totalBanks },
          { data: employees },
          { data: directors },
          { data: suppliers },
          { data: pendingSuppliers },
          { data: pendingEmployees },
          { data: pendingBanks }
        ] = await Promise.all([
          supabase
            .from('acc_portal_kyc_docs')
            .select('count', { count: 'exact' })
            .eq('status', 'pending')
            .eq('userid', userId),
          supabase
            .from('acc_portal_kyc_docs')
            .select('count', { count: 'exact' })
            .eq('document_type', 'renewal')
            .eq('status', 'pending')
            .eq('userid', userId),
          supabase
            .from('acc_portal_banks')
            .select('count', { count: 'exact' })
            .eq('userid', userId),
          supabase
            .from('acc_portal_employees')
            .select('count', { count: 'exact' })
            .eq('userid', userId),
          supabase
            .from('acc_portal_directors')
            .select('count', { count: 'exact' })
            .eq('userid', userId),
          supabase
            .from('acc_portal_suppliers')
            .select('count', { count: 'exact' })
            .eq('userid', userId),
          supabase
            .from('acc_portal_suppliers')
            .select('*')
            .eq('verified', false)
            .eq('userid', userId),
          supabase
            .from('acc_portal_employees')
            .select('*')
            .eq('verified', false)
            .eq('userid', userId),
          supabase
            .from('acc_portal_banks')
            .select('*')
            .eq('verified', false)
            .eq('userid', userId)
        ]);
    
        setStats([
          { title: "Pending Verification", value: pendingVerification[0]?.count || 0 },
          { title: "Employees", value: employees[0]?.count || 0 },
          { title: "Total Banks", value: totalBanks[0]?.count || 0 },
          { title: "Pending Monthly Documents", value: pendingMonthlyDocs[0]?.count || 0 },
          { title: "Directors", value: directors[0]?.count || 0 },
          { title: "Suppliers", value: suppliers[0]?.count || 0 },
        ]);
    
        setPendingVerifications({
          suppliers: pendingSuppliers || [],
          employees: pendingEmployees || [],
          banks: pendingBanks || []
        });
    
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    
    if (userId) {
      fetchCompanyData();
      fetchStats();
    }
  }, [userId]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });

  const handleCloseReminder = () => {
    setShowReminder(false);
  };

  const StatSkeleton = () => (
    <Card className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
      <CardHeader className="p-4 bg-gray-50 border-b border-gray-200">
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent className="p-4">
        <Skeleton className="h-8 w-16 mx-auto" />
      </CardContent>
    </Card>
  );

  const GettingStartedSkeleton = () => (
    <Card className="col-span-1">
      <CardHeader>
        <div className="flex justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between rounded-lg bg-background p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );

  const AlertSkeleton = () => (
    <Alert className="mb-6 bg-gray-100 border border-gray-300 rounded-lg shadow-lg">
      <Skeleton className="h-5 w-5 mr-2" />
      <div className="w-full">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-5/6 mb-1" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </Alert>
  );

  const PendingVerificationCard = ({ title, data, columns }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={`${data.length === 0 ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'} shadow-md rounded-lg overflow-hidden transition-transform transform hover:scale-105`}>
            <CardHeader className={`p-4 ${data.length === 0 ? 'bg-green-200 border-b border-green-300' : 'bg-red-200 border-b border-red-300'}`}>
              <CardTitle className={`flex items-center space-x-3 ${data.length === 0 ? 'text-green-800' : 'text-red-800'}`}>
                <div className="flex-shrink-0">
                  <CheckIcon />
                </div>
                <span className="font-medium text-lg">{title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${data.length === 0 ? 'text-green-900' : 'text-red-900'} text-center`}>{data.length}</p>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-[400px] p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>{item[column.toLowerCase()]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="flex">
      <main className="flex-1 p-6 bg-gray-50 h-[100vh]">
        <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
        {isLoading ? (
          <>
            <AlertSkeleton />
            <AlertSkeleton />
          </>
        ) : (
          <div>
            {isProfileIncomplete && (
              <Alert className="mb-6 bg-yellow-100 border-2 border-red-500 rounded-lg shadow-lg">
                <AlertTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <AlertTitle className="text-yellow-900 font-bold text-md">Incomplete Company Profile</AlertTitle>
                <AlertDescription className="text-yellow-700 mt-2 text-sm">
                  <p>Your company profile is incomplete. The following information is missing:</p>
                  <ul className="grid grid-cols-8 gap-2 mt-2">
                    {missingFields.map((field, index) => (
                      <li key={index} className="list-disc list-inside">{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>
                    ))}
                  </ul>
                  <p className="mt-2">
                    <Link href="/profile" className="text-blue-600 hover:underline font-bold uppercase" >
                      Click here to complete your profile
                    </Link>
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {showReminder && (
              <Alert className="relative mb-6 bg-teal-100 border-2 border-red-500 rounded-lg shadow-lg">
                <AlertTitle className="text-purple-900 font-bold text-md">Reminder</AlertTitle>
                <AlertDescription className="text-purple-700 mt-2 text-sm">
                  <p className="mb-2">
                    Please make sure to keep up with the following deadlines:
                  </p>
                  <ul className="list-disc list-inside mb-2">
                    <li>Submit monthly financial documents before the 5th.</li>
                    <li>Upload bank statements before the 5th.</li>
                    <li>Submit supplier statements before the 10th.</li>
                    <li>Paye submissions for employees should be done before the 20th.</li>
                    {/* Add any other deadlines or tasks here */}
                  </ul>
                  <p className="mt-2 text-red-600 font-bold uppercase">
                    Additionally, make sure you check your notifications for any updates or further instructions.
                  </p>
                </AlertDescription>
                <button
                  onClick={handleCloseReminder}
                  className="absolute top-2 right-2 p-2 bg-orange-500 text-white rounded-full hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <X size={18} />
                </button>
              </Alert>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-6">
          {isLoading
            ? Array(6).fill(0).map((_, index) => <StatSkeleton key={index} />)
            : (
              <>
                <PendingVerificationCard
                  title="Pending Suppliers"
                  data={pendingVerifications.suppliers}
                  columns={["Name", "Contact", "Category"]}
                />
                <PendingVerificationCard
                  title="Pending Employees"
                  data={pendingVerifications.employees}
                  columns={["Name", "Position", "Department"]}
                />
                <PendingVerificationCard
                  title="Pending Banks"
                  data={pendingVerifications.banks}
                  columns={["Name", "Account Number", "Branch"]}
                />
                {stats.slice(3).map((stat) => (
                  <Card key={stat.title} className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 transition-transform transform hover:scale-105">
                    <CardHeader className="p-4 bg-gray-50 border-b border-gray-200">
                      <CardTitle className="flex items-center space-x-3 text-gray-800">
                        <div className="flex-shrink-0">
                          {iconMapping[stat.title]}
                        </div>
                        <span className="font-medium text-lg">{stat.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-2xl font-bold text-gray-900 text-center">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
        </div>
        <div className="grid grid-cols-1 gap-4 bg-muted/40 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {isLoading
            ? Array(6).fill(0).map((_, index) => <GettingStartedSkeleton key={index} />)
            : gettingStartedSteps.map(({ id, title, description, status, icon: Icon, badgeColor, badgeTextColor, link }) => (
              <Card key={id} className="col-span-1">
                <CardHeader>
                  <div className="flex justify-between">
                    <CardTitle>{title}</CardTitle>
                    <Badge variant="outline" className={`${badgeColor} bg-background`}>
                      <CircleIcon className={`h-3 w-3 -translate-x-1 animate-pulse ${badgeTextColor}`} />
                      {status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Link href={link} className="flex items-center justify-between rounded-lg bg-background p-4 transition-colors hover:bg-accent hover:text-accent-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{description}</div>
                      </div>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            ))}
        </div>
      </main>
    </div>
  )
}
