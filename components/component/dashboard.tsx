// @ts-nocheck
"use client"

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { CartesianGrid, XAxis, Line, LineChart } from "recharts"
import { ChartTooltipContent, ChartTooltip, ChartContainer } from "@/components/ui/chart"
import Image from "next/image"


import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

const url = "https://wcmrsrnjtkrmfcjxmxpc.supabase.co"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbXJzcm5qdGtybWZjanhteHBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMjcwNTA2NywiZXhwIjoyMDE4MjgxMDY3fQ.FNNRgt4R-lWE9OWRkO22DbdaKy9Y3HKYs2U1u6XvSXI"

const supabase = createClient(url, key);


export function Dashboard() {
  const [alienData, setAlienData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('aaa_applications_alien_id')
        .select('*');
      
      if (error) {
        setError(error.message);
      } else {
        setAlienData(data);
      }
    }

    fetchData();
  }, []);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });

  return (
    <div className="flex">
      <main className="flex-1 p-6 bg-gray-50 h-screen">
        <div className="mb-6 font-semibold flex justify-between">
          <div className='text-2xl'>
            <p> Welcome ABC Limited</p>
          </div>
          <div className="flex text-md items-center gap-8">
          {currentDate}
            {/* <Button variant="secondary">Customize This App</Button> */}
            <Avatar>
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>J</AvatarFallback>
            </Avatar>
          </div>
        </div>
        {/* {error ? (
          <div className="mb-6 text-red-600">Error: {error}</div>
        ) : alienData ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Alien ID Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto max-h-60">{JSON.stringify(alienData, null, 2)}</pre>
            </CardContent>
          </Card>
        ) : (
          <div className="mb-6">Loading alien data...</div>
        )} */}
        <header className="flex justify-end mb-6">
          <div className="flex items-center space-x-4">
            {/* <Button variant="outline">Main</Button> */}
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="KES" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kes">KES</SelectItem>
                <SelectItem value="US">USD</SelectItem>
                <SelectItem value="eur">Euro</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="English" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                {/* <SelectItem value="gr">Gujrati</SelectItem> */}
              </SelectContent>
            </Select>
          </div>
          
        </header>
        {/* <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>This Month</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">$13.00</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Proforma Invoices</CardTitle>
              <CardDescription>This Month</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">$0.00</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Petty Cash</CardTitle>
              <CardDescription>This Month</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">$0.00</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Unpaid</CardTitle>
              <CardDescription>Not Paid</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="destructive">$13.00</Badge>
            </CardContent>
          </Card>
        </div> */}
        {/* <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Draft</span>
                  <span>100%</span>
                </div>
                <Progress value={100} className="w-full" />
                <div className="flex items-center justify-between">
                  <span>Pending</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
                <div className="flex items-center justify-between">
                  <span>Unpaid</span>
                  <span>100%</span>
                </div>
                <Progress value={100} className="w-full bg-orange-500" />
                <div className="flex items-center justify-between">
                  <span>Overdue</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
                <div className="flex items-center justify-between">
                  <span>Partially</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
                <div className="flex items-center justify-between">
                  <span>Paid</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Proforma Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Draft</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
                <div className="flex items-center justify-between">
                  <span>Pending</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
                <div className="flex items-center justify-between">
                  <span>Sent</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
                <div className="flex items-center justify-between">
                  <span>Declined</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
                <div className="flex items-center justify-between">
                  <span>Accepted</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
                <div className="flex items-center justify-between">
                  <span>Expired</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Petty Cash</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Draft</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
                <div className="flex items-center justify-between">
                  <span>Pending</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
                <div className="flex items-center justify-between">
                  <span>Sent</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
                <div className="flex items-center justify-between">
                  <span>Declined</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
                <div className="flex items-center justify-between">
                  <span>Accepted</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
                <div className="flex items-center justify-between">
                  <span>Expired</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell>James epale</TableCell>
                    <TableCell>$13.00</TableCell>
                    <TableCell>Draft</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No data
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div> */}
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


function LayoutDashboardIcon(props) {
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
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
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


function LinechartChart(props) {
  return (
    <div {...props}>
      <ChartContainer
        config={{
          desktop: {
            label: "Desktop",
            color: "hsl(var(--chart-1))",
          },
        }}
      >
        <LineChart
          accessibilityLayer
          data={[
            { month: "January", desktop: 186 },
            { month: "February", desktop: 305 },
            { month: "March", desktop: 237 },
            { month: "April", desktop: 73 },
            { month: "May", desktop: 209 },
            { month: "June", desktop: 214 },
          ]}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Line dataKey="desktop" type="natural" stroke="var(--color-desktop)" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartContainer>
    </div>
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


function SettingsIcon(props) {
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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}


function ShoppingCartIcon(props) {
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
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}


function StoreIcon(props) {
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
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
    </svg>
  )
}


function UsersIcon(props) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}


function XIcon(props) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
