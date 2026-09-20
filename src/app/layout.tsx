import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist } from "next/font/google";
import "./globals.css";

// Display face. Limited glyph set (no @ # % [ ] * + = _, no en/em dash or
// ellipsis), so it is headings only — never body copy.
const kaicords = localFont({
  src: "../fonts/Kaicords-Regular.woff2",
  variable: "--font-display",
  weight: "400",
  style: "normal",
  display: "swap",
});

const geist = Geist({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const DESCRIPTION =
  "Kai is a designer and engineer at Stanford. View his technical case studies, professional experience and even his Letterboxd reviews here.";

export const metadata: Metadata = {
  metadataBase: new URL("https://kaissempa.com"),
  title: {
    default: "Kai Ssempa — Designer & Developer",
    template: "%s — Kai Ssempa",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: "https://kaissempa.com",
    siteName: "Kai Ssempa",
    title: "Kai Ssempa — Designer & Developer",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Kai Ssempa — Designer & Developer",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${kaicords.variable} ${geist.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
