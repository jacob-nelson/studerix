import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";

import { RegisterPWA } from "@/components/register-pwa";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AcademyProvider } from "@/lib/store";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tech Masters Academy",
    template: "%s · Tech Masters",
  },
  description:
    "Internal academy desk for enquiries, admissions, fee collections, expenses and placements.",
  applicationName: "Tech Masters Academy",
  appleWebApp: {
    capable: true,
    title: "Tech Masters",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1b3350",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <TooltipProvider>
          <AcademyProvider>
            <RegisterPWA />
            {children}
            <Toaster position="top-right" />
          </AcademyProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
