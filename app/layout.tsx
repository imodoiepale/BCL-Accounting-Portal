import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/component/sidebar";
import { Navbar } from '@/components/component/navbar';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BCL Client Portal",
  description: "BCL Client Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body className={inter.className}>
        <div className="flex gap-4" style={{ transform: 'scale(0.8)', transformOrigin: 'top left', minHeight: '125vh', width: '125%' }}>
          <Sidebar/>
          <div className="flex flex-col w-full"> {/* Full height column */}
            <Navbar/>
              {children}
          </div>
        </div>
        </body>
    </html>
    </ClerkProvider>
  );
}
