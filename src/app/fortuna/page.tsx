import type { Metadata, Viewport } from "next";
import { mobileThemeColor } from "@/lib/theme-color";
import { publishedSections } from "@/content/fortuna";
import FortunaCaseStudy from "@/components/fortuna/CaseStudy";

/** The page's cream. Phones only; see lib/theme-color. */
export const viewport: Viewport = { themeColor: mobileThemeColor("#f7f5f0") };

export const metadata: Metadata = {
  title: "Fortuna — A Tale of Two Users",
  description:
    "A case study in making job seeking feel less like work. Kai Ssempa on designing Fortuna, a swipe-to-work app launched in Miami in 2022.",
};

/** The live cut: everything written so far, without the notes to self. */
export default function FortunaPage() {
  return <FortunaCaseStudy sections={publishedSections()} />;
}
