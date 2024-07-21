// @ts-nocheck
"use client"

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
import { FileIcon, VoicemailIcon, LayoutDashboardIcon, CheckIcon, CoinsIcon, ReceiptIcon, SettingsIcon, UsersIcon } from "lucide-react"


export function Sidebar() {
  return (
    <div className="flex h-screen">
      <aside className="w-72 p-4 bg-gray-100 hidden md:block">
        <div className="flex items-center mb-8">
          {/* <Image src="/placeholder.svg" alt="Logo" className="w-10 h-10 mr-2" /> */}
          <span className="text-xl font-bold">BCL Client Portal</span>
        </div>
        <nav className="space-y-2">
          <Link href="/" className="flex items-center p-2 text-blue-600 bg-blue-100 rounded" prefetch={false}>
            <LayoutDashboardIcon className="w-5 h-5 mr-2" />
            Dashboard
          </Link>
          <Link href="#" className="flex items-center p-2 text-gray-700" prefetch={false}>
            <UsersIcon className="w-5 h-5 mr-2" />
            Customers
          </Link>
          <Link href="/documents" className="flex items-center p-2 text-gray-700" prefetch={false}>
            <FileIcon className="w-5 h-5 mr-2" />
            Documents
          </Link>
          <Link href="#" className="flex items-center p-2 text-gray-700" prefetch={false}>
            <CheckIcon className="w-5 h-5 mr-2" />
            Checklist
          </Link>
          
          <Link href="#" className="flex items-center p-2 text-gray-700" prefetch={false}>
            <VoicemailIcon className="w-5 h-5 mr-2" />
            Communication & Ticket
          </Link>
          <Link href="#" className="flex items-center p-2 text-gray-700" prefetch={false}>
            <ReceiptIcon className="w-5 h-5 mr-2" />
            Invoices
          </Link>
          <Link href="#" className="flex items-center p-2 text-gray-700" prefetch={false}>
            <ReceiptIcon className="w-5 h-5 mr-2" />
            Proforma Invoices
          </Link>
          <Link href="#" className="flex items-center p-2 text-gray-700" prefetch={false}>
            <CoinsIcon className="w-5 h-5 mr-2" />
            Petty Cash
          </Link>
          <Link href="#" className="flex items-center p-2 text-gray-700" prefetch={false}>
            <ReceiptIcon className="w-5 h-5 mr-2" />
            Expenses
          </Link>
          
          <Link href="#" className="flex items-center p-2 text-gray-700" prefetch={false}>
            <SettingsIcon className="w-5 h-5 mr-2" />
            Settings
          </Link>
        </nav>
      </aside>
    </div>
  )
}
