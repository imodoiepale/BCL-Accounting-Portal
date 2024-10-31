// @ts-nocheck
"use client"


import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CoinsIcon,
  FileIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  User2Icon,
  VoicemailIcon
} from "lucide-react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { useState } from "react"

import { useAuth } from "@clerk/clerk-react"


const adminNavItems = [
  { href: "/admin", icon: LayoutDashboardIcon, label: "Admin Dashboard" },
  { href: "/mail", icon: LayoutDashboardIcon, label: "Mail" },
  { href: "/admin/registry", icon: User2Icon, label: "Registry" },
  { href: "/admin/documents", icon: FileIcon, label: "Document Management" },
  { href: "/admin/reports", icon: FileIcon, label: "Report Management" },
  { href: "/admin/settings", icon: SettingsIcon, label: "Admin Settings" },
]

const userNavItems = [
  { href: "/", icon: LayoutDashboardIcon, label: "Dashboard" },
  { href: "/profile", icon: User2Icon, label: "Profile" },
  { href: "/documents", icon: FileIcon, label: "Monthly Documents" },
  { href: "/reports", icon: FileIcon, label: "Reports" },
  { href: "/checklist", icon: CheckIcon, label: "Checklist" },
  { href: "/communication", icon: VoicemailIcon, label: "Communication & Ticket" },
  { href: "/pettycash", icon: CoinsIcon, label: "Petty Cash" },
  { href: "/settings", icon: SettingsIcon, label: "Settings" },
]


export function Sidebar() {

  const { userId } = useAuth()
  const isAdmin = userId === "user_2jgO1OWpZw3kf1BUnpLpzTiaMhE"
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(true)

  const navItems = isAdmin ? adminNavItems : userNavItems

  return (
    <aside className={`bg-gray-100 transition-all duration-300 ease-in-out ${isExpanded ? 'w-52' : 'w-16'} p-2 hidden md:block relative h-screen`}>
      <div className={`flex items-center mb-6 ${isExpanded ? '' : 'justify-center'}`}>
        {isExpanded && <span className="text-lg font-bold">BCL Portal</span>}
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center p-2 rounded text-sm ${
              pathname === item.href
                ? "text-blue-600 bg-blue-100"
                : "text-gray-700 hover:bg-gray-200"
            } ${isExpanded ? '' : 'justify-center'}`}
            prefetch={false}
          >
            <item.icon className="w-4 h-4 mr-2" />
            {isExpanded && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </nav>
      <button
        className="absolute top-2 right-1 p-1 rounded-full bg-gray-200 hover:bg-gray-300"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronLeftIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
      </button>
    </aside>
  )
}