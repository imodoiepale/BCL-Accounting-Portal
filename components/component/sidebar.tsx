// @ts-nocheck
"use client"

import { useState } from "react"
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
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "lucide-react"

const navItems = [
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
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="flex h-[150vh]">
      <aside className={`bg-gray-100 transition-all duration-300 ease-in-out ${isExpanded ? 'w-72' : 'w-20'} p-4 hidden md:block relative`}>
        <div className={`flex items-center mb-8 ${isExpanded ? '' : 'justify-center'}`}>
          {isExpanded && <span className="text-xl font-bold">BCL Client Portal</span>}
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
              } ${isExpanded ? '' : 'justify-center'}`}
              prefetch={false}
            >
              <item.icon className="w-5 h-5 mr-2" />
              {isExpanded && item.label}
            </Link>
          ))}
        </nav>
        <button
          className="absolute top-2 right-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronLeftIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
        </button>
      </aside>
    </div>
  )
}