import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { AppFrame } from "@/components/AppFrame";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = localFont({
  src: [
    { path: "./fonts/LibertinusSans-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/LibertinusSans-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-libertinus",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Danube Property Advisor (prototype)",
  description: "A Property Advisor that profiles, recommends, and books Danube apartments in Dubai. Prototype.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbf7ef",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
