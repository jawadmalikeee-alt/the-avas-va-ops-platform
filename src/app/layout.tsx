import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The AVAS — Real Estate VA Operations Platform",
  description: "Enterprise-grade virtual assistant operations platform for real estate professionals. Manage clients, VAs, time tracking, quality, and service delivery from one command center.",
  keywords: ["The AVAS", "Virtual Assistant", "Real Estate VA", "Operations Platform", "Enterprise SaaS", "CRM", "Cold Calling"],
  authors: [{ name: "The AVAS" }],
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='4' fill='%231a1f3d'/%3E%3Cpath d='M7 16L12 6L17 16M9 13H15' stroke='%23c9a961' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  },
  openGraph: {
    title: "The AVAS — Real Estate VA Operations Platform",
    description: "Trained real-estate VAs who cold-call, run your CRM, and follow up with leads.",
    siteName: "The AVAS",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
