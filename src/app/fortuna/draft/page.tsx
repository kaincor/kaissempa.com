import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SECTIONS } from "@/content/fortuna";
import FortunaCaseStudy from "@/components/fortuna/CaseStudy";

export const metadata: Metadata = {
  title: "Fortuna (draft)",
  robots: { index: false, follow: false },
};

/**
 * The whole manuscript, slots and notes to self included, for working out
 * what is still to add. Local only: in production this route does not exist.
 */
export default function FortunaDraftPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <FortunaCaseStudy sections={SECTIONS} />;
}
