import type { Metadata } from "next";
import { Fraunces, Source_Serif_4, Inter } from "next/font/google";
import { JOURNAL, siteUrl } from "@/lib/constants";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${JOURNAL.title} — ${JOURNAL.tagline}`,
    template: `%s | ${JOURNAL.title}`,
  },
  description:
    "UNILAG Communication Review is a peer-reviewed academic journal publishing original research in communication, media, and sociocultural studies. Published by the Faculty of Communication and Media Studies, University of Lagos.",
  alternates: {
    types: {
      "application/rss+xml": `${siteUrl()}/feed.xml`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${sourceSerif.variable} ${inter.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
