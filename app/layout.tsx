"use client"

import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/component/sidebar"
import { Navbar } from '@/components/component/navbar'
import { Toaster } from 'sonner'
import { usePathname } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const inter = Inter({ subsets: ["latin"] })
const queryClient = new QueryClient()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname()

  // Check if current path starts with /mail/policy-terms
  const isPolicyPage = pathname?.startsWith('/mail/policy-terms')

  // If it's a policy/terms page, render without the main app layout
  if (isPolicyPage) {
    return (
      <ClerkProvider>
        <QueryClientProvider client={queryClient}>
          <html lang="en">
            <body className={inter.className}>
              {children}
              <Toaster position="top-right" />
            </body>
          </html>
        </QueryClientProvider>
      </ClerkProvider>
    )
  }

  // Regular app layout
  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <html lang="en" suppressHydrationWarning>
          <body className={inter.className}>
            <div className="flex h-screen overflow-hidden">
              <div className="flex-shrink-0">
                <Sidebar />
              </div>
              <div className="flex flex-col flex-grow overflow-hidden">
                <Navbar />
                <main className="flex-grow overflow-auto">
                  <div className="min-w-[640px] p-4">
                    {children}
                    <Toaster />
                  </div>
                </main>
              </div>
            </div>
          </body>
        </html>
      </QueryClientProvider>
    </ClerkProvider>
  )
}