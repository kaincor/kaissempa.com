import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SECTIONS } from "@/content/zorzal";
import ZorzalCaseStudy from "@/components/zorzal/CaseStudy";

export const metadata: Metadata = {
  title: "Zorzal (draft)",
  robots: { index: false, follow: false },
};

/**
 * The whole draft, with every stand-in: the motion slots, the photos still to
 * come and the chapter icon squares. For working out what is left to make.
 * Local only: in production this route does not exist.
 */
export default function ZorzalDraftPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ZorzalCaseStudy sections={SECTIONS} draft />;
}
