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
  { src: "/photos/eating-breakfast-in-utah.jpg", alt: "Eating breakfast in Utah" },
  { src: "/photos/snowboarding-with-ben.jpg", alt: "Snowboarding with Ben" },
  { src: "/photos/kai-and-dia.jpg", alt: "Kai and Dia" },
  { src: "/photos/kai-with-stick.jpg", alt: "Kai holding a stick" },
  { src: "/photos/bay-to-breakers.jpg", alt: "Kai at Bay to Breakers" },
  { src: "/photos/kai-in-lake-lagunita.jpg", alt: "Kai in Lake Lagunita" },
  { src: "/photos/irving-raghad-cyprien-kai.jpg", alt: "Irving, Raghad, Cyprien and Kai" },
];

const BODY = "#6E6E6E";
/** Stanford cardinal. */
const CARDINAL = "#8C1515";
const HIGHLIGHT = "#D9D9D9";

type Segment = { text: string; color?: string };

/**
 * Kaicords has no typographic apostrophe (U+2019) and no em dash, so this copy
 * uses straight quotes only. A curly one renders as tofu.
 */
const COPY: Segment[][] = [
  [
    { text: "I'm currently studying design & computer science at " },
    { text: "Stanford", color: CARDINAL },
    { text: "." },
  ],
  [
    { text: "I love using both " },
    // Highlighted as one phrase, ampersand included, so the pairing reads as a
    // unit rather than two white words with a grey join between them.
    { text: "design & development", color: HIGHLIGHT },
    { text: " to make things that are fun & functional." },
  ],
  [{ text: "I also enjoy mountain biking & do it competitively." }],
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
          width: "100%",
          maxWidth: 686,
          color: BODY,
          textAlign: "center",
          fontSize: "clamp(17px, 2vw, 25px)",
          lineHeight: 1.45,
          display: "flex",
          flexDirection: "column",
          gap: "1.1em",
        }}
      >
        {COPY.map((line, i) => (
          <p key={i}>
            {line.map((seg, j) => (
              <span key={j} style={seg.color ? { color: seg.color } : undefined}>
                {seg.text}
              </span>
            ))}
          </p>
        ))}
      </div>
    </section>
  );
}
