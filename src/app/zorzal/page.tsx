import type { Metadata, Viewport } from "next";
import { mobileThemeColor } from "@/lib/theme-color";
import { publishedSections } from "@/content/zorzal";
import ZorzalCaseStudy from "@/components/zorzal/CaseStudy";

/** The top of the hero sky, behind the starry band. Phones only; see lib/theme-color. */
export const viewport: Viewport = { themeColor: mobileThemeColor("#cdd9e7") };

export const metadata: Metadata = {
  title: "Zorzal Cacao — Cacao Tracker",
  description:
    "Making a supply-chain tool work where the work actually happens: a mobile, Spanish-language cacao tracker for Zorzal Cacao, on a bird sanctuary in the Dominican Republic.",
};

/** The live cut: the motion slots, photos to come and icon stand-ins left out. */
export default function ZorzalPage() {
  return <ZorzalCaseStudy sections={publishedSections()} />;
}
