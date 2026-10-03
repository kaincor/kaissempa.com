import HeroScene from "@/components/hero/HeroScene";

/**
 * The hero scene on its own, for tuning and for retaking the posters. In
 * dev, `window.__heroPoster(w, h, phone)` returns a PNG of the opening
 * frame; the posters in public/hero are that at 1920x800 and 3840x1600
 * (wide) and 800x800 and 1600x1600 (phone), encoded to AVIF and WebP.
 */
export default function Page() {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#d4d4d4", zIndex: 1000 }}>
      <HeroScene />
    </div>
  );
}
