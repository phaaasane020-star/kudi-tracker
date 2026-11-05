import type { Metadata, Viewport } from "next";
import "./globals.css";
import Intro from "@/components/Intro";
import { OfflineSupport } from "@/components/Offline";
import VisitTracker from "@/components/VisitTracker";

export const metadata: Metadata = {
  title: "Kudi Tracker",
  description: "Track every cedi you spend and earn.",
  applicationName: "Kudi Tracker",
  appleWebApp: { capable: true, title: "Kudi", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh font-sans antialiased">
        <Intro />
        <OfflineSupport />
        <VisitTracker />
        {children}
      </body>
    </html>
  );
}
