import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist, Hanken_Grotesk, Source_Serif_4 } from "next/font/google";
import Navbar from "@/components/Navbar";
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

// Fortuna's pairing. Twenty-one of that project's twenty-three text styles are
// built on these two, so they are the case study's real typography rather than
// a fallback — Tiempos Headline and Graphik cover only the display and body
// styles on top. Loaded here because next/font has to run at module scope.
const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-grotesk",
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
      className={`${kaicords.variable} ${geist.variable} ${sourceSerif.variable} ${hanken.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
