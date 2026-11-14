import CAPS from "@/content/pond-mage-dropcaps.json";

/**
 * An illuminated capital for the start of a section: the letter in Kaisteel
 * on a rough black block, with vines, leaves, pebbles and flowers round it.
 * The A is Kai's own (Figma: Pond Mage, Drop Cap Block); the rest were grown
 * to match it. Every colour is a CSS variable (theme.css, .pm-cap), so the
 * set can be recoloured in one place.
 *
 * Rendered on the server, so only the letters a page uses are sent.
 */

type Cap = { ground: string[]; letter: string; art: ([string, string] | [string, string, number])[] };

const FILL: Record<string, string> = {
  leaf: "var(--pm-cap-leaf)",
  red: "var(--pm-cap-red)",
  dark: "var(--pm-cap-dark)",
};

export default function DropCap({ text }: { text: string }) {
  const ch = text[0];
  const cap = (CAPS as unknown as Record<string, Cap>)[ch.toUpperCase()];
  if (!cap) return <>{text}</>;
  return (
    <>
      <svg className="pm-cap" viewBox="0 0 195 203" aria-hidden="true" focusable="false">
        {cap.ground.map((d, i) => (
          <path key={`g${i}`} d={d} fill="var(--pm-cap-ground)" />
        ))}
        {cap.art.map(([c, d, sw], i) =>
          sw ? (
            <path key={i} d={d} fill="none" stroke={FILL[c]} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path key={i} d={d} fill={FILL[c]} />
          ),
        )}
        <path d={cap.letter} fill="var(--pm-cap-letter)" />
      </svg>
      <span className="sr-only">{ch}</span>
      {text.slice(1)}
    </>
  );
}
