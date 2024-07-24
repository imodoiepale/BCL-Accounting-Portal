// @ts-nocheck
"use client"

import Link from "next/link"
import { usePathname } from 'next/navigation'
import {
  LayoutDashboardIcon,
  User2Icon,
  UsersIcon,
  FileIcon,
  CheckIcon,
  VoicemailIcon,
  ReceiptIcon,
  CoinsIcon,
  SettingsIcon
} from "lucide-react"

const navItems = [
  { href: "/", icon: LayoutDashboardIcon, label: "Dashboard" },
  { href: "/profile", icon: User2Icon, label: "Profile" },
  // { href: "/customers", icon: UsersIcon, label: "Customers" },
  { href: "/documents", icon: FileIcon, label: "Monthly Documents" },
  { href: "/reports", icon: FileIcon, label: "Reports" },
  { href: "/checklist", icon: CheckIcon, label: "Checklist" },
  { href: "/communication", icon: VoicemailIcon, label: "Communication & Ticket" },
  // { href: "/invoices", icon: ReceiptIcon, label: "Invoices" },
  // { href: "/proforma-invoices", icon: ReceiptIcon, label: "Proforma Invoices" },
  // { href: "/petty-cash", icon: CoinsIcon, label: "Petty Cash" },
  // { href: "/expenses", icon: ReceiptIcon, label: "Expenses" },
  { href: "/settings", icon: SettingsIcon, label: "Settings" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen">
      <aside className="w-72 p-4 bg-gray-100 hidden md:block">
        <div className="flex items-center mb-8">
          <span className="text-xl font-bold">BCL Client Portal</span>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center p-2 rounded ${
                pathname === item.href
                  ? "text-blue-600 bg-blue-100"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
              prefetch={false}
            >
              <item.icon className="w-5 h-5 mr-2" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  )
}