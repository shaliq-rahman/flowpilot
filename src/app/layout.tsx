import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FlowPilot — Project Management",
  description: "Navigate your projects with clarity. Track tasks, milestones, and team progress.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-full antialiased" style={{ fontFamily: 'var(--font-sans)' }}>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
