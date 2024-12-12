import React, { useState } from "react";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CoinsIcon,
  FileIcon,
  LayoutDashboardIcon,
  Mail,
  SettingsIcon,
  User2Icon,
  UserPlusIcon,
  VoicemailIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { useAuth } from "@clerk/clerk-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const adminNavItems = [
  { href: "/admin", icon: LayoutDashboardIcon, label: "Admin Dashboard" },
  { href: "/mail", icon: Mail, label: "Mail" },
  { href: "/admin/registry", icon: User2Icon, label: "Registry" },
  { href: "/admin/overallview", icon: LayoutDashboardIcon, label: "Overall TableView" },
  { href: "/admin/companies", icon: User2Icon, label: "Companies" },
  {
    href: "/admin/documents",
    icon: FileIcon,
    label: "KYC Document Management",
    children: [
      { href: "/admin/documents/company-kyc", icon: FileIcon, label: "Company KYC Documents" },
      { href: "/admin/documents/company_receipts", icon: FileIcon, label: "Company Receipts" },
      { href: "/admin/documents/directors_docs", icon: FileIcon, label: "Director KYC Documents" },
      { href: "/admin/documents/suppliers_doc", icon: FileIcon, label: "Suppliers KYC Documents" },
      { href: "/admin/documents/bank_kyc", icon: FileIcon, label: "Bank KYC Documents" },
     
      { href: "/admin/documents/others", icon: FileIcon, label: "Other Documents" }
    ]
  },
  { href: "/admin/template", icon: FileIcon, label: "Templates" },
  { href: "/admin/reports", icon: FileIcon, label: "Report Management" },
  { href: "/admin/settings", icon: SettingsIcon, label: "Admin Settings" },
  // { label: "Table Settings", href: "/settings/table", icon: SettingsIcon },
  { href: "/admin/onboarding", icon: UserPlusIcon, label: "Onboarding" },
];

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
];

export function Sidebar() {
  const { userId } = useAuth();
  const isAdmin = userId === "user_2jgO1OWpZw3kf1BUnpLpzTiaMhE";
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const renderNavItem = (item: any) => {
    const isActive = pathname === item.href;
    const hasChildren = item.children && item.children.length > 0;

    const baseItemClassName = `
      flex items-center p-3 rounded-lg text-sm transition-all duration-200
      ${isActive ? "text-blue-600 bg-blue-100" : "text-gray-700 hover:bg-gray-200"}
      ${isExpanded ? "w-full" : "justify-center w-10"}
    `;

    if (hasChildren) {
      return (
        <Popover key={item.href}>
          <PopoverTrigger asChild>
            <button className={baseItemClassName}>
              <item.icon className="w-4 h-4 min-w-4" />
              {isExpanded && (
                <span className="ml-3 truncate">{item.label}</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 p-2 ml-2"
            side="right"
            align="start"
            sideOffset={-40}
          >
            <div className="flex flex-col space-y-1">
              {item.children.map((childItem: any) => (
                <Link
                  key={childItem.href}
                  href={childItem.href}
                  className={`
                    flex items-center p-2 rounded-md text-sm transition-colors
                    ${pathname === childItem.href
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-700 hover:bg-gray-100"}
                  `}
                  prefetch={false}
                >
                  <childItem.icon className="w-4 h-4 mr-2" />
                  <span className="truncate">{childItem.label}</span>
                </Link>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={baseItemClassName}
        prefetch={false}
      >
        <item.icon className="w-4 h-4 min-w-4" />
        {isExpanded && <span className="ml-3 truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside className={`
      bg-white shadow-lg transition-all duration-300 ease-in-out
      ${isExpanded ? 'w-64' : 'w-16'}
      p-4 hidden md:flex flex-col h-screen sticky top-0
      border-r border-gray-200
    `}>
      <div className={`
        flex items-center mb-6 h-12
        ${isExpanded ? '' : 'justify-center'}
      `}>
        {isExpanded && (
          <span className="text-xl font-semibold text-blue-800">BCL Portal</span>
        )}
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map(renderNavItem)}
      </nav>

      <button
        className="absolute top-4 -right-3 p-1.5 rounded-full bg-white shadow-md 
                   hover:bg-gray-50 transition-colors border border-gray-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
        )}
      </button>
    </aside>
  );
}

export default Sidebar;