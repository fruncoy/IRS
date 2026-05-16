import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";

const poppins = localFont({
  src: [
    {
      path: "./fonts/poppins-latin-300-normal.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/poppins-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/poppins-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/poppins-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/poppins-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "IRS – ID Recovery System | Recover Your Lost ID Card",
  description: "A secure digital recovery system helping people reconnect with their lost IDs quickly and safely. Privacy-first ID recovery platform.",
  keywords: ["ID recovery", "lost ID", "found ID", "national ID", "secure recovery", "IRS"],
  authors: [{ name: "IRS Team" }],
  openGraph: {
    title: "IRS – ID Recovery System",
    description: "Recover your lost national ID card safely and quickly. A secure bridge between finders and owners.",
    type: "website",
    siteName: "IRS",
  },
  twitter: {
    card: "summary_large_image",
    title: "IRS – ID Recovery System",
    description: "Recover your lost national ID card safely and quickly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} font-sans h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-white text-slate-900" suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
