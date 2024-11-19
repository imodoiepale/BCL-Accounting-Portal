"use client"

import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CoinsIcon,
  FileIcon,
  LayoutDashboardIcon,
  Mail,
  SettingsIcon,
  User2Icon,
  UserPlusIcon,
  VoicemailIcon
} from "lucide-react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { useState } from "react"

import { useAuth } from "@clerk/clerk-react"

const adminNavItems = [
  { href: "/admin", icon: LayoutDashboardIcon, label: "Admin Dashboard" },
  { href: "/mail", icon: Mail, label: "Mail" },
  { href: "/admin/registry", icon: User2Icon, label: "Registry" },
  { href: "/admin/overallview", icon: LayoutDashboardIcon, label: "Overall TableView" },  
  { href: "/admin/documents/kyc", icon: FileIcon, label: "Kyc Documents" },
  { href: "/admin/documents/monthly", icon: FileIcon, label: "Monthly Documents" },
  { href: "/admin/companies", icon: User2Icon, label: "Companies" },
  { 
    href: "/admin/documents", 
    icon: FileIcon, 
    label: "Document Management",
    children: [
      { href: "/admin/documents/company-kyc", icon: FileIcon, label: "Company KYC Documents" },
      { href: "/admin/documents/director-kyc", icon: FileIcon, label: "Director KYC Documents" },
      { href: "/admin/documents/others", icon: FileIcon, label: "Other Documents" }
    ]
  },
  { href: "/admin/reports", icon: FileIcon, label: "Report Management" },
  { href: "/admin/settings", icon: SettingsIcon, label: "Admin Settings" },
  { href: "/admin/onboarding", icon: UserPlusIcon, label: "Onboarding" },
]

const userNavItems = [
  { href: "/", icon: LayoutDashboardIcon, label: "Dashboard" },
  { href: "/profile", icon: User2Icon, label: "Profile" },
  { href: "/mail", icon: Mail, label: "Mail" },
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const navItems = isAdmin ? adminNavItems : userNavItems

  const toggleDropdown = (href: string) => {
    setOpenDropdown(openDropdown === href ? null : href)
  }

  const renderNavItem = (item: any) => {
    const isActive = pathname === item.href
    const hasChildren = item.children && item.children.length > 0

    // Base item rendering
    const baseItemClassName = `flex items-center p-2 rounded text-sm ${
      isActive
        ? "text-blue-600 bg-blue-100"
        : "text-gray-700 hover:bg-gray-200"
    } ${isExpanded ? '' : 'justify-center'}`;

    if (hasChildren) {
      return (
        <div key={item.href} className="relative">
          <button
            onClick={() => toggleDropdown(item.href)}
            className={`${baseItemClassName} w-full`}
          >
            <item.icon className="w-4 h-4 mr-2" />
            {isExpanded && (
              <div className="flex justify-between items-center w-full">
                <span className="truncate">{item.label}</span>
                {isExpanded && (
                  hasChildren ? (
                    openDropdown === item.href ? 
                      <ChevronUpIcon className="w-3 h-3" /> : 
                      <ChevronDownIcon className="w-3 h-3" />
                  ) : null
                )}
              </div>
            )}
          </button>
          {isExpanded && hasChildren && openDropdown === item.href && (
            <div className="pl-6 space-y-1 mt-1">
              {item.children.map((childItem: any) => (
                <Link
                  key={childItem.href}
                  href={childItem.href}
                  className={`flex items-center p-2 rounded text-sm ${
                    pathname === childItem.href
                      ? "text-blue-600 bg-blue-100"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                  prefetch={false}
                >
                  <childItem.icon className="w-4 h-4 mr-2" />
                  <span className="truncate">{childItem.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={baseItemClassName}
        prefetch={false}
      >
        <item.icon className="w-4 h-4 mr-2" />
        {isExpanded && <span className="truncate">{item.label}</span>}
      </Link>
    )
  }

  return (
    <aside className={`bg-gray-100 transition-all duration-300 ease-in-out ${isExpanded ? 'w-52' : 'w-16'} p-2 hidden md:block relative h-screen`}>
      <div className={`flex items-center mb-6 ${isExpanded ? '' : 'justify-center'}`}>
        {isExpanded && <span className="text-lg font-bold">BCL Portal</span>}
      </div>
      <nav className="space-y-1">
        {navItems.map(renderNavItem)}
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