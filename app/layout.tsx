import { ClerkProvider } from '@clerk/nextjs'
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
          <div className="flex h-screen overflow-hidden">
            <div className="flex-shrink-0">
              <Sidebar />
            </div>
            <div className="flex flex-col flex-grow overflow-hidden">
              <Navbar />
              <main className="flex-grow overflow-auto">
                <div className="min-w-[640px] p-4">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}