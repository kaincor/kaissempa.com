import FanDeck, { type FanDeckCard } from "@/components/FanDeck";

/**
 * Photos are served from /public rather than framerusercontent.com. Hotlinking
 * the Framer CDN would tie this page's images to a site we are replacing.
 *
 * Originals live in assets/Images at ~3000px; these are capped at 1400 on the
 * long edge, which still covers a 240x360 card at 3x. Order here is the
 * left-to-right order in the fan.
 */
const PHOTOS: FanDeckCard[] = [
  { src: "/photos/bay-to-breakers.jpg", alt: "Kai at Bay to Breakers" },
  { src: "/photos/eating-breakfast-in-utah.jpg", alt: "Eating breakfast in Utah" },
  { src: "/photos/irving-raghad-cyprien-kai.jpg", alt: "Irving, Raghad, Cyprien and Kai" },
  { src: "/photos/kai-and-dia.jpg", alt: "Kai and Dia" },
  { src: "/photos/kai-in-lake-lagunita.jpg", alt: "Kai in Lake Lagunita" },
  { src: "/photos/kai-with-stick.jpg", alt: "Kai holding a stick" },
  { src: "/photos/snowboarding-with-ben.jpg", alt: "Snowboarding with Ben" },
];

/**
 * Kaicords has no typographic apostrophe (U+2019) and no em dash, so this copy
 * uses straight quotes only. A curly one renders as tofu.
 */
const PARAGRAPHS = [
  "I grew up in rural Uganda.",
  "My parents devoted their careers to public health work in remote villages & I grew up working alongside them.",
  "At Stanford, I study design & computer science. I'm also on the leadership team for the Black Student Engineers Club.",
  "I try to put a piece of myself into my work: assets from scratch. Illustrations. Custom fonts. I hand drew this font I'm using right now.",
  "I enjoy bodybuilding, mountain biking & embroidery.",
];

export default function About() {
  return (
    <section
      style={{
        background: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 30,
        padding: "0 30px 140px",
      }}
    >
      <FanDeck cards={PHOTOS} frameHeight={460} />

      <div
        className="display"
        style={{
          maxWidth: 686,
          width: "100%",
          color: "#d4d4d4",
          fontSize: "clamp(17px, 2vw, 25px)",
          lineHeight: 1.45,
          display: "flex",
          flexDirection: "column",
          gap: "1.1em",
        }}
      >
        {PARAGRAPHS.map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>
    </section>
  );
}
