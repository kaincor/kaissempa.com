"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { MOBILE_MQ } from "@/lib/theme-color";

/**
 * Kai's layered landscape (Figma 3417:9), pieced together on load.
 *
 * public/zorzal/hero-landscape.svg keeps the Figma layer order and wraps every
 * piece in <g class="zp" data-l="n">, where n is its layer: 0 grounds, 1 plots,
 * 2 trees, 3 walls, 4 roofs, 5 windows, 6 front trees. Each piece flies in
 * from the screen edge nearest to where it lands, one layer after another,
 * so the picture is laid down back to front like a tapestry.
 *
 * The SVG is fetched and injected rather than inlined, so the 230 KB of paths
 * stay out of the HTML. With reduced motion it simply appears.
 *
 * Once it is in, every piece is lifted out into its own small <svg>, cropped
 * to the piece and pinned in place by percentages, and it is those wrappers
 * that fly. Moving a group inside one big SVG makes the browser redraw the
 * whole landscape, all 1,100-odd paths, on every frame (desktop Safari showed
 * it as faint white flicker); moving a separate element lets the GPU slide a
 * finished picture of the piece. The pieces stay vectors, so nothing softens.
 */

const VIEW_W = 1251;
const VIEW_H = 427;
const SVG_NS = "http://www.w3.org/2000/svg";
// When each layer starts, in ms: ground first, the front trees last.
const LAYER_START = [0, 380, 760, 1060, 1260, 1440, 1580];

export default function TapestryLandscape({ style }: { style?: CSSProperties }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const anims: Animation[] = [];

    fetch("/zorzal/hero-landscape.svg")
      .then((r) => r.text())
      .then((text) => {
        const el = host.current;
        if (cancelled || !el) return;
        el.innerHTML = text;
        const svg = el.querySelector("svg");
        if (!svg) return;
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");
        svg.style.cssText = "display:block;width:100%;height:auto;overflow:visible";

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const frame = (el.closest("header") ?? document.body).getBoundingClientRect();
        const scale = svg.getBoundingClientRect().width / VIEW_W;
        const pieces = split(svg);

        if (!reduce && scale > 0) {
          // A fixed seed keeps the choreography the same on every visit.
          let seed = 7;
          const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
          const margin = 40;
          // On a phone every piece comes in from the side, never from below:
          // a piece waiting under the fold was in plain view to anyone who
          // scrolled while the picture was still coming together. Off the
          // side it is out of sight however far the page has moved.
          const phone = window.matchMedia(MOBILE_MQ).matches;

          pieces.forEach(({ wrap, b }) => {
            const cx = b.left + b.width / 2;
            const cy = b.top + b.height / 2;
            const gaps = {
              left: cx - frame.left,
              right: frame.right - cx,
              top: cy - frame.top,
              bottom: frame.bottom - cy,
            };
            const edge = phone
              ? gaps.left <= gaps.right
                ? "left"
                : "right"
              : (Object.keys(gaps) as (keyof typeof gaps)[]).reduce((a, k) =>
                  gaps[k] < gaps[a] ? k : a,
                );

            // Far enough that the whole piece starts off-screen, plus a little
            // sideways drift so the pieces don't travel in straight rails.
            const drift = (rand() - 0.5) * 160;
            const layer = Number(wrap.dataset.l ?? 0);
            const turn = (rand() - 0.5) * 18;
            // How far a corner of the piece swings past its box at that tilt.
            const swing = phone
              ? Math.abs(Math.sin((turn * Math.PI) / 180)) * Math.max(b.width, b.height) * 0.5
              : 0;
            let dx = 0;
            let dy = 0;
            const clear = margin + swing;
            if (edge === "left" || edge === "right") {
              dx = edge === "left" ? -(b.right - frame.left + clear) : frame.right - b.left + clear;
              dy = drift;
            } else {
              dy = edge === "top" ? -(b.bottom - frame.top + clear) : frame.bottom - b.top + clear;
              dx = drift;
            }

            anims.push(
              wrap.animate(
                [
                  { transform: `translate(${dx}px, ${dy}px) rotate(${turn}deg)` },
                  { transform: "translate(0px, 0px) rotate(0deg)" },
                ],
                {
                  duration: 1050 + rand() * 350,
                  delay: LAYER_START[layer] + rand() * 300,
                  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                  fill: "backwards",
                },
              ),
            );
          });
        }
        el.style.visibility = "visible";
      })
      .catch(() => {
        // The hero still has the sky and the wordmark; leave the ground empty.
      });

    return () => {
      cancelled = true;
      anims.forEach((a) => a.cancel());
    };
  }, []);

  return <div ref={host} aria-hidden="true" style={{ visibility: "hidden", ...style }} />;
}

/**
 * Lifts each <g class="zp"> out of the landscape into its own <svg>, cropped
 * to the piece (strokes included) and placed by percentages over a box of the
 * landscape's proportions, keeping the Figma stacking order. Returns each
 * wrapper with where the piece sat on screen, measured before the move.
 */
function split(svg: SVGSVGElement) {
  const stage = document.createElement("div");
  stage.style.cssText = `position:relative;width:100%;aspect-ratio:${VIEW_W} / ${VIEW_H};overflow:visible`;
  const out: { wrap: HTMLDivElement; b: DOMRect }[] = [];

  svg.querySelectorAll<SVGGElement>(".zp").forEach((p) => {
    const b = p.getBoundingClientRect();
    const g = p.getBBox();
    // getBBox leaves out strokes, so pad by half the widest one, plus a
    // pixel for antialiasing.
    let sw = 0;
    p.querySelectorAll("[stroke-width]").forEach((n) => {
      sw = Math.max(sw, Number(n.getAttribute("stroke-width")) || 0);
    });
    if (!sw && p.querySelector("[stroke]")) sw = 1;
    const pad = sw / 2 + 1;
    const x = g.x - pad;
    const y = g.y - pad;
    const w = g.width + pad * 2;
    const h = g.height + pad * 2;

    const wrap = document.createElement("div");
    wrap.dataset.l = p.dataset.l ?? "0";
    wrap.style.cssText =
      `position:absolute;left:${(x / VIEW_W) * 100}%;top:${(y / VIEW_H) * 100}%;` +
      `width:${(w / VIEW_W) * 100}%;height:${(h / VIEW_H) * 100}%`;
    const one = document.createElementNS(SVG_NS, "svg");
    one.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
    one.setAttribute("preserveAspectRatio", "none");
    one.setAttribute("fill", "none");
    one.setAttribute("focusable", "false");
    one.style.cssText = "display:block;width:100%;height:100%;overflow:visible";
    one.appendChild(p);
    wrap.appendChild(one);
    stage.appendChild(wrap);
    out.push({ wrap, b });
  });

  svg.replaceWith(stage);
  return out;
}
