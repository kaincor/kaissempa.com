import FMarkReel from "./FMarkReel";
import PaletteReel from "./PaletteReel";

/**
 * The f being drawn on the left and the palette on the right, under the
 * billboard: the mark and the colours it was set in, side by side.
 *
 * Each keeps its own shape, 16:9 and 4:5, and they stand the same height:
 * a flex item's share of the row is its width over its height, so growing
 * each by its aspect ratio lines their tops and bottoms up. On a phone they
 * stack.
 */
export default function MarkAndPalette() {
  return (
    <figure className="f-wide f-mark-palette" style={{ marginTop: 0, marginBottom: "clamp(28px, 5vw, 56px)" }}>
      <div style={{ flex: `${16 / 9} 1 0`, minWidth: 0 }}>
        <FMarkReel bare />
      </div>
      <div style={{ flex: `${4 / 5} 1 0`, minWidth: 0 }}>
        <PaletteReel bare />
      </div>
    </figure>
  );
}
