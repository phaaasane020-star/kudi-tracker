import type { Metadata, Viewport } from "next";
import "./globals.css";
import Intro from "@/components/Intro";
import { INTRO_FLAG } from "@/lib/intro";

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
      <head>
        {/* Hides the intro instantly if it already played in this session, so it never flashes. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("${INTRO_FLAG}")==="1")document.documentElement.dataset.intro="done"}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <Intro />
        {children}
      </body>
    </html>
  );
}
