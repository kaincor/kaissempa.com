import type { Metadata } from "next";
import "./theme.css";
import { HERO, SECTIONS } from "@/content/fortuna";
import {
  Band,
  Eyebrow,
  Display,
  Figure,
  renderBlock,
  toneIsDark,
} from "@/components/fortuna/Prose";

export const metadata: Metadata = {
  title: "Fortuna — A Tale of Two Users",
  description:
    "A case study in making job seeking feel less like work. Kai Ssempa on designing Fortuna, a swipe-to-work app launched in Miami in 2022.",
};

export default function FortunaPage() {
  return (
    <main className="fortuna flex-1">
      {/* Bare bones on purpose. Kai is rewriting this hero; it exists so the
          page has a top, not because it is finished. */}
      <header
        style={{
          padding: "clamp(120px, 22vh, 220px) 0 clamp(48px, 8vh, 96px)",
        }}
      >
        <div
          style={{
            width: "min(var(--f-measure), 100% - 28px)",
            margin: "0 auto",
          }}
        >
          <Eyebrow>{HERO.eyebrow}</Eyebrow>
          <h1
            style={{
              margin: "0 0 20px",
              fontFamily: "var(--f-display)",
              fontWeight: 600,
              fontSize: "clamp(40px, 8vw, 78px)",
              lineHeight: 1.05,
              letterSpacing: "-0.015em",
              textWrap: "balance",
            }}
          >
            {HERO.title}
            <span style={{ color: "var(--f-green)" }}>.</span>
          </h1>
          <p
            style={{
              margin: "0 0 40px",
              maxWidth: "var(--f-measure-body)",
              fontFamily: "var(--f-serif)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "clamp(19px, 2.6vw, 26px)",
              lineHeight: 1.45,
              letterSpacing: "-0.02em",
              color: "var(--f-muted)",
            }}
          >
            {HERO.standfirst}
          </p>
          <p
            style={{
              margin: "0 0 18px",
              maxWidth: "var(--f-measure-body)",
              fontFamily: "var(--f-body)",
              fontSize: "clamp(17px, 2vw, 20px)",
              lineHeight: 1.7,
              letterSpacing: "-0.02em",
            }}
          >
            {HERO.intro}
          </p>
          <p
            style={{
              margin: "36px 0 0",
              maxWidth: "var(--f-measure-body)",
              fontFamily: "var(--f-serif)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "clamp(18px, 2.3vw, 22px)",
              lineHeight: 1.55,
              letterSpacing: "-0.02em",
              borderLeft: "2px solid var(--f-green)",
              paddingLeft: "clamp(18px, 3vw, 30px)",
            }}
          >
            {HERO.pullquote}
          </p>
        </div>
      </header>

      {SECTIONS.map((section) => {
        const dark = toneIsDark(section.tone);
        return (
          <Band key={section.id} id={section.id} tone={section.tone}>
            <Display align={section.align}>
              {section.heading}
              {/* The doc says "Title" wherever Kai has not named it yet. Marked
                  rather than silently rendered, so it cannot slip past. */}
              {section.headingPending ? (
                <span
                  style={{
                    marginLeft: 12,
                    fontFamily: "var(--f-grotesk)",
                    fontWeight: 600,
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    verticalAlign: "middle",
                    color: dark ? "var(--f-green)" : "var(--f-orange)",
                  }}
                >
                  needs a title
                </span>
              ) : null}
            </Display>

            {section.draft ? (
              <Figure note={section.draft} dark={dark} />
            ) : null}

            {section.blocks.map((block, i) =>
              renderBlock(block, i, dark, section.align),
            )}
          </Band>
        );
      })}
    </main>
  );
}
