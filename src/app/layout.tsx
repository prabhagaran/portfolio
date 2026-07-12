import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ChromeNavbar, ChromeFooter } from "@/components/chrome";
import { CursorEffects } from "@/components/cursor-effects";
import { site } from "@/data/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${site.name} · ${site.role}`,
  description: site.tagline,
  keywords: site.keywords,
  authors: [{ name: site.name, url: site.githubUrl }],
  openGraph: {
    title: `${site.name} · ${site.role}`,
    description: site.tagline,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[10px] focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        <CursorEffects />
        <ChromeNavbar />
        <div id="main" className="flex-1">
          {children}
        </div>
        <ChromeFooter />
      </body>
    </html>
  );
}
