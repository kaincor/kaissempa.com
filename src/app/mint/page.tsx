import type { Metadata, Viewport } from "next";
import { Fahkwang } from "next/font/google";
import { mobileThemeColor } from "@/lib/theme-color";
import MagazineStage from "@/components/mint/MagazineStage";
import { ROOM_TOP } from "@/components/mint/colors";

/** Fahkwang Bold, for the page's captions, set in capitals. */
const fahkwang = Fahkwang({ weight: "700", subsets: ["latin"], variable: "--font-fahkwang" });

/** The room's wall, up by the window. Phones only; see lib/theme-color. */
export const viewport: Viewport = { themeColor: mobileThemeColor(ROOM_TOP) };

export const metadata: Metadata = {
  title: "Mint Magazine",
  description: "Kai Ssempa's photography for Mint, a student-run magazine, as an issue you can page through.",
};

export default function MintPage() {
  return (
    <main className={`mint flex-1 ${fahkwang.variable}`} style={{ background: ROOM_TOP }}>
      {/* The navbar sits outside this page's wrapper, so the face is handed
          to it on :root as well. */}
      <style>{`:root { --mint-fahkwang: ${fahkwang.style.fontFamily}; }`}</style>
      <MagazineStage />
    </main>
  );
}
