import type { Metadata } from "next";
import AboutMore from "@/components/AboutMore";
import MoreAboutMe from "@/components/MoreAboutMe";
import RidgeDivider from "@/components/RidgeDivider";
import SocialLinks from "@/components/SocialLinks";
import { rangeById } from "@/data/mountainRanges";

export const metadata: Metadata = {
  title: "About",
  description: "About Kai Ssempa: growing up in rural Uganda, studying design and computer science at Stanford, and life outside of work.",
};

/**
 * About: More about me as the page's opening, then more photographs and a
 * little more about Kai, closing out into the same footer as the home page.
 */
export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col">
      <MoreAboutMe range={rangeById(1)} heading="About" headingAs="h1" topPad="clamp(110px, 18svh, 170px)" />
      <AboutMore />
      <RidgeDivider range={rangeById(4)} rise={45} sectionColor="#d4d4d4" scrollOffset={["start end", "end end"]}>
        <SocialLinks />
      </RidgeDivider>
    </main>
  );
}
