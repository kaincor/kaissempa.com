/**
 * Scrolls a section of the home page to the top of the screen.
 *
 * The blocks on the home page parallax: how far each one is lifted depends on
 * where the page is scrolled, so a section's position measured before the
 * scroll is not where it will be at the end of it. A native smooth scroll
 * aimed at the measured spot overshoots and has to back up. So the glide is
 * driven here instead, re-measuring the section every frame and easing
 * toward wherever it is now; it arrives once, without the bounce-back.
 */
export async function scrollToSection(id: string, behavior: ScrollBehavior) {
  const el = document.getElementById(id);
  if (!el) return false;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const dest = () => Math.max(0, window.scrollY + el.getBoundingClientRect().top - margin);

  if (behavior === "smooth") await glide(dest);

  // Settle any remainder without motion: a pixel or two after the glide, or
  // the whole way when motion is reduced.
  for (let i = 0; i < 4; i++) {
    const to = dest();
    if (Math.abs(to - window.scrollY) < 2) break;
    window.scrollTo({ top: to, behavior: "instant" });
    await frames(3);
  }
  return true;
}

/** Ease-in-out, quick to get going and soft to land. */
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function glide(dest: () => number) {
  return new Promise<void>((resolve) => {
    const from = window.scrollY;
    const distance = Math.abs(dest() - from);
    // Longer for further, within reason.
    const duration = Math.min(1100, Math.max(450, distance * 0.35));
    const start = performance.now();
    // Any input from the reader takes the scroll back.
    const cancel = () => (stopped = true);
    let stopped = false;
    window.addEventListener("wheel", cancel, { passive: true, once: true });
    window.addEventListener("touchstart", cancel, { passive: true, once: true });
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      if (!stopped) window.scrollTo({ top: from + (dest() - from) * ease(t), behavior: "instant" });
      if (t < 1 && !stopped) requestAnimationFrame(tick);
      else {
        window.removeEventListener("wheel", cancel);
        window.removeEventListener("touchstart", cancel);
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

function frames(n: number) {
  return new Promise<void>((resolve) => {
    const step = () => (--n <= 0 ? resolve() : requestAnimationFrame(step));
    requestAnimationFrame(step);
  });
}
