import Image from "next/image";

/**
 * Behind the scenes, after the magazine: all sixteen shots in three columns
 * (two on a phone), each at its own shape. The columns are split so each
 * mixes portraits and landscapes and their heights come out close (worked
 * out over every split of the three shapes); the shorter ones then stretch
 * their photos a few per cent, trimming the overflow, so all end exactly
 * level. Hovering a photo picks it with the page's red corner squares.
 */

const PHOTOS: { src: string; w: number; h: number }[] = [
  { src: "9598", w: 506, h: 760 },
  { src: "9618", w: 506, h: 760 },
  { src: "9636", w: 760, h: 506 },
  { src: "9676", w: 506, h: 760 },
  { src: "9701", w: 760, h: 506 },
  { src: "9702", w: 506, h: 760 },
  { src: "9713", w: 506, h: 760 },
  { src: "9726", w: 760, h: 506 },
  { src: "9782", w: 760, h: 506 },
  { src: "9790", w: 760, h: 506 },
  { src: "9821", w: 506, h: 760 },
  { src: "9830", w: 570, h: 760 },
  { src: "9851", w: 760, h: 506 },
  { src: "9863", w: 506, h: 760 },
  { src: "9865", w: 506, h: 760 },
  { src: "9869", w: 760, h: 506 },
];

const at = (src: string) => PHOTOS.findIndex((p) => p.src === src);
/** Three columns: 3 portrait + 2 landscape, 2 + 3 and the 3:4, 3 + 2. */
const DESKTOP = [
  ["9598", "9636", "9702", "9790", "9863"],
  ["9618", "9701", "9782", "9821", "9830", "9869"],
  ["9676", "9713", "9726", "9851", "9865"],
].map((c) => c.map(at));
/** Two columns on a phone: 3 portrait, 5 landscape and the 3:4; 5 + 2. */
const PHONE = [
  ["9598", "9636", "9702", "9726", "9782", "9830", "9851", "9863", "9869"],
  ["9618", "9676", "9701", "9713", "9790", "9821", "9865"],
].map((c) => c.map(at));
const RED = "#b7272b";

export default function MintGallery() {
  return (
    <section
      aria-label="Behind the scenes"
      className="mint-gallery"
      style={{ position: "relative", zIndex: 3 }}
    >
      {/* Fahkwang Bold in capitals, in the page's red, like the caption. */}
      <h2
        style={{
          margin: "0 auto 28px",
          maxWidth: 1140,
          textAlign: "center",
          color: RED,
          fontFamily: "var(--font-fahkwang), serif",
          fontWeight: 700,
          textTransform: "uppercase",
          fontSize: 15,
          letterSpacing: "0.06em",
          lineHeight: 1.5,
        }}
      >
        More pictures from the gallery
      </h2>
      <Grid
        cols={DESKTOP}
        className="mint-gallery-3"
        sizes="(max-width: 1200px) 31vw, 370px"
      />
      <Grid cols={PHONE} className="mint-gallery-2" sizes="48vw" />
      <style>{`
        .mint-gallery { padding: 14svh 24px 18svh; }
        .mint-gallery-grid { display: flex; gap: 8px; max-width: 1140px; margin: 0 auto; align-items: stretch; }
        .mint-gallery-col { flex: 1 1 0; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
        .mint-gallery-item { display: flex; flex-direction: column; overflow: hidden; }
        .mint-gallery-item img { flex: 1 1 auto; min-height: 0; object-fit: cover; }
        .mint-gallery-2 { display: none; }
        @media (max-width: 639px) {
          .mint-gallery { padding: 10svh 12px 14svh; }
          .mint-gallery-3 { display: none; }
          .mint-gallery-2 { display: flex; gap: 5px; }
          .mint-gallery-2 .mint-gallery-col { gap: 5px; }
        }
        .mint-gallery-item { position: relative; overflow: visible; }
        .mint-gallery-frame { position: relative; flex: 1 1 auto; display: flex; flex-direction: column; overflow: hidden; }
        .mint-gallery-corners { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 450ms ease-out; }
        @media (hover: hover) {
          .mint-gallery-item:hover .mint-gallery-corners { opacity: 1; transition-duration: 200ms; }
        }
      `}</style>
    </section>
  );
}

function Grid({
  cols,
  className,
  sizes,
}: {
  cols: number[][];
  className: string;
  sizes: string;
}) {
  return (
    <div className={`mint-gallery-grid ${className}`}>
      {cols.map((items, c) => (
        <div key={c} className="mint-gallery-col">
          {items.map((i) => {
            const p = PHOTOS[i];
            return (
              <figure
                key={p.src}
                className="mint-gallery-item"
                style={{ margin: 0, flex: `${p.h / p.w} 1 auto` }}
              >
                <div className="mint-gallery-frame">
                  <Image
                    src={`/mint/bts/${p.src}.jpg`}
                    alt=""
                    width={p.w}
                    height={p.h}
                    sizes={sizes}
                    quality={85}
                    style={{ display: "block", width: "100%", height: "auto" }}
                  />
                </div>
                <div className="mint-gallery-corners" aria-hidden="true">
                  {[
                    { left: -10, top: -10 },
                    { right: -10, top: -10 },
                    { left: -10, bottom: -10 },
                    { right: -10, bottom: -10 },
                  ].map((pos, k) => (
                    <span
                      key={k}
                      style={{
                        position: "absolute",
                        width: 6,
                        height: 6,
                        background: RED,
                        ...pos,
                      }}
                    />
                  ))}
                </div>
              </figure>
            );
          })}
        </div>
      ))}
    </div>
  );
}
