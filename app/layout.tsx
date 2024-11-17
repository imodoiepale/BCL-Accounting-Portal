"use client"

import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/component/sidebar";
import { Navbar } from '@/components/component/navbar';
import { Toaster } from 'sonner'; 
// import { Toaster } from "react-hot-toast"
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  // Check if current path starts with /mail/policy-terms
  const isPolicyPage = pathname?.startsWith('/mail/policy-terms');

  // If it's a policy/terms page, render without the main app layout
  if (isPolicyPage) {
    return (
      <ClerkProvider>
        <html lang="en">
          <body className={inter.className}>
            {children}
            <Toaster position="top-right" />
          </body>
        </html>
      </ClerkProvider>
    );
  }

  // Regular app layout
  return (
    <ClerkProvider>
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
    </ClerkProvider>
  );
}