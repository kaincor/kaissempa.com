"use client";

import { useState } from "react";

/**
 * A row of panels where one is open and the rest are pills.
 *
 * Hover opens a panel on a mouse, but hover is not the mechanism — click and
 * keyboard are, and hover is layered on top. A hover-only version is
 * unreachable by keyboard and does nothing at all on a phone, and the whole
 * point of the row is that the text inside it can be read.
 *
 * The widths are CSS. Each panel carries a `--grow` and the stylesheet
 * animates `flex-grow`, so nothing is measured here, the row reflows itself at
 * any container width, and below tablet a media query turns the whole thing
 * into a plain stack with every panel open. React only tracks which index is
 * current.
 */
export default function PanelRow({
  items,
  /** CSS custom property prefix for this row's colour ramp, e.g. `--f-need`. */
  ramp,
  label,
}: {
  items: string[];
  ramp: string;
  label: string;
}) {
  const [open, setOpen] = useState(0);

  return (
    <div className="f-panels" role="group" aria-label={label}>
      {items.map((text, i) => {
        const isOpen = i === open;
        return (
          <button
            key={text}
            type="button"
            className="f-panel"
            data-open={isOpen}
            // Not `aria-expanded`: nothing is hidden from a screen reader here.
            // The text of every panel is in the document at all times — only
            // its width changes — so announcing three of the four as collapsed
            // would describe a problem the markup does not have.
            aria-current={isOpen}
            style={{
              ["--grow" as string]: isOpen ? 1 : 0,
              background: `var(${ramp}-${i + 1})`,
            }}
            onMouseEnter={() => setOpen(i)}
            onFocus={() => setOpen(i)}
            onClick={() => setOpen(i)}
          >
            <span className="f-panel-tab" aria-hidden="true">
              {i + 1}
            </span>
            <span className="f-panel-body">{text}</span>
          </button>
        );
      })}
    </div>
  );
}
