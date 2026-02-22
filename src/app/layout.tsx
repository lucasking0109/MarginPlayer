import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavSidebar } from "@/components/nav-sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MarginPlayer — Margin Call Monitor",
  description: "Monitor your margin account health, track day trading P&L, and get liquidation recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="flex min-h-screen">
          <NavSidebar />
          <main className="flex-1 ml-64 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
