import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppFrame } from "@/components/AppFrame";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Danube Property Advisor (prototype)",
  description: "A Property Advisor that profiles, recommends, and books Danube apartments in Dubai. Prototype.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07131f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
