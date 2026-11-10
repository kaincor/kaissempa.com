import type { Metadata, Viewport } from "next";
import { mobileThemeColor } from "@/lib/theme-color";
import MagazineStage from "@/components/mint/MagazineStage";
import { MINT_GREY } from "@/components/mint/colors";

/** The backdrop's grey. Phones only; see lib/theme-color. */
export const viewport: Viewport = { themeColor: mobileThemeColor(MINT_GREY) };

export const metadata: Metadata = {
  title: "Mint Magazine",
  description: "Kai Ssempa's photography for Mint, a student-run magazine, as an issue you can page through.",
};

export default function MintPage() {
  return (
    <main className="mint flex-1" style={{ background: MINT_GREY }}>
      <MagazineStage />
    </main>
  );
}
