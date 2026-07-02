import type { Metadata } from "next";
import { Geist, Geist_Mono, Baloo_2 } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://voice-under-scrutiny.vercel.app";

const DESCRIPTION =
  "Practice pitches and public speaking: get a topic, record yourself, listen back, and read the transcript. No accounts — recordings stay in your browser.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Voice Under Scrutiny — practice speaking out loud",
    template: "%s · Voice Under Scrutiny",
  },
  description: DESCRIPTION,
  keywords: [
    "public speaking practice",
    "pitch practice",
    "speech transcription",
    "impromptu speaking",
    "elevator pitch",
  ],
  openGraph: {
    title: "Voice Under Scrutiny",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Voice Under Scrutiny",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Voice Under Scrutiny",
    description: DESCRIPTION,
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${baloo.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-frame p-2 sm:p-3">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <div className="flex min-h-[calc(100vh-1rem)] flex-col overflow-hidden rounded-[1.75rem] bg-background text-foreground sm:min-h-[calc(100vh-1.5rem)]">
          <Nav />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
