import type { Metadata } from "next";
import { DM_Sans, Outfit, Lora } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "SkyWay AI Chatbox",
  description:
    "Airport operational assistant for SOPs, pass rules, and shift procedures.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${outfit.variable} ${lora.variable} min-h-screen bg-[#010103] font-sans antialiased text-slate-100`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
