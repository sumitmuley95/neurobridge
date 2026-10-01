import type { Metadata } from "next";
import { Lexend, Atkinson_Hyperlegible, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AccessibilityProvider } from "@/lib/accessibility/accessibility-context";
import { AccessibilityToolbar } from "@/components/accessibility/AccessibilityToolbar";
import { ReadingGuide } from "@/components/accessibility/ReadingGuide";

// Headings: Lexend — built specifically to improve reading fluency and
// reduce cognitive load.
const lexend = Lexend({
  variable: "--font-heading",
  subsets: ["latin"],
});

// Body copy: Atkinson Hyperlegible — designed by the Braille Institute for
// maximum letterform distinction (a vs o, l vs I vs 1, b vs d).
const atkinson = Atkinson_Hyperlegible({
  variable: "--font-body",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeuroBridge - Adaptive Learning Platform",
  description: "Specialized learning platform for cognitive empowerment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${lexend.variable} ${atkinson.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AccessibilityProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground focus:font-medium"
          >
            Skip to main content
          </a>
          {children}
          <ReadingGuide />
          <AccessibilityToolbar />
        </AccessibilityProvider>
      </body>
    </html>
  );
}
