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
    icon: [
      { url: "/avas-icon.svg", type: "image/svg+xml" },
    ],
    apple: "/avas-icon.svg",
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
