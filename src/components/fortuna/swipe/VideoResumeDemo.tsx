"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import { CREAM, FOREST, GREEN, ORANGE } from "../reel/cards";
import { clamp01, easeInOut, easeOut, lerp, seg, spring } from "../reel/motion";
import PhoneMockup, { DotField } from "./PhoneMockup";

/**
 * The video resume, recorded for the reader: Sarah's way through Front End's
 * "Video Flow" board, from the empty video slot on her profile to the video
 * sitting in it.
 *
 *   profile → tips → Camera → camera and mic → record → preview → uploading
 *   → uploaded → profile, with the video
 *
 * The screens are the board's, in the app's own units, on the cream the app
 * shipped with. The person on camera is drawn rather than the board's stock
 * footage: Sarah, in the palette of the app.
 *
 * A caption under the phone says what each beat is for, and changes with it.
 *
 * One clock, as in SwipeDemo: a requestAnimationFrame loop writes styles
 * straight to the elements, nothing re-renders while it plays, and the clock
 * stops while the phone is off screen.
 */

/** How long each beat holds, in seconds, in order. */
const BEATS = {
  profile: 1.9,
  tips: 2.9,
  sheet: 1.3,
  cam: 1.15,
  mic: 1.15,
  record: 3.7,
  preview: 2.7,
  uploading: 2.1,
  uploaded: 1.8,
  done: 2.6,
  reset: 0.7,
};
type Beat = keyof typeof BEATS;
/** When each beat starts. */
const AT = (() => {
  const at = {} as Record<Beat, number>;
  let t = 0;
  for (const k of Object.keys(BEATS) as Beat[]) {
    at[k] = t;
    t += BEATS[k];
  }
  return at;
})();
const PERIOD = AT.reset + BEATS.reset;

/** The taps, as a screen recording shows them: when, and where on the screen. */
const TAPS = {
  tile: { t: AT.profile + 1.3, x: 187, y: 378 },
  gotIt: { t: AT.tips + 2.4, x: 187, y: 725 },
  camera: { t: AT.sheet + 0.95, x: 187, y: 698 },
  camOk: { t: AT.cam + 0.8, x: 254, y: 466 },
  micOk: { t: AT.mic + 0.8, x: 254, y: 466 },
  recStart: { t: AT.record + 0.75, x: 187, y: 694 },
  recStop: { t: AT.record + 3.25, x: 187, y: 694 },
  confirm: { t: AT.preview + 2.2, x: 187, y: 667 },
  thanks: { t: AT.uploaded + 1.35, x: 187, y: 578 },
};
const TAP_LIST = Object.values(TAPS);

/** What each beat is for, under the phone. */
const CAPTIONS: { from: number; text: string }[] = [
  { from: 0, text: "Sarah starts on her profile" },
  { from: AT.tips, text: "Tips up front, before the camera opens" },
  { from: AT.sheet, text: "Camera and mic, asked for once" },
  { from: AT.record, text: "One big button, 90 seconds at most" },
  { from: AT.preview, text: "Watch it back before it's sent" },
  { from: AT.uploading, text: "A clear message while it uploads" },
  { from: AT.done, text: "On her profile, for every employer" },
];

/** The board's green for buttons, and the system blue. */
const BUTTON_GREEN = "#298800";
const IOS_BLUE = "#007aff";
const RED = "#f34545";
const INK = "#111";

const abs = (s: CSSProperties): CSSProperties => ({ position: "absolute", ...s });
const text = (size: number, weight = 400, color = INK): CSSProperties => ({
  fontFamily: "var(--f-body)",
  fontSize: size,
  fontWeight: weight,
  color,
  letterSpacing: "-0.01em",
});

export default function VideoResumeDemo({ caption = true }: { caption?: boolean }) {
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const caps = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    // The elements it moves, found by name under the phone.
    const el = <T extends Element = HTMLElement>(k: string) => ({ current: root.querySelector<T & HTMLElement>(`[data-k="${k}"]`) });
    const r = {
      tile: el("tile"),
      tileVideo: el("tileVideo"),
      tileGlow: el("tileGlow"),
      tips: el("tips"),
      dim: el("dim"),
      sheet: el("sheet"),
      camAlert: el("camAlert"),
      micAlert: el("micAlert"),
      camera: el("camera"),
      person: el<SVGGElement>("person"),
      mouth: el<SVGEllipseElement>("mouth"),
      recordUI: el("recordUI"),
      recInner: el("recInner"),
      timer: el("timer"),
      timerText: el("timerText"),
      recDot: el("recDot"),
      previewUI: el("previewUI"),
      progress: el("progress"),
      previewTime: el("previewTime"),
      uploading: el("uploading"),
      modalDim: el("modalDim"),
      modal: el("modal"),
      touch: el("touch"),
      slabs: { current: Array.from(root.querySelectorAll<HTMLElement>('[data-k="slab"]')) },
      captions: { current: Array.from(caps.current?.children ?? []) as HTMLElement[] },
    };
    const o = (el: HTMLElement | SVGElement | null, v: number) => {
      if (el) el.style.opacity = v.toFixed(3);
    };
    const tf = (el: HTMLElement | SVGElement | null, v: string) => {
      if (el) el.style.transform = v;
    };
    const clock = (s: number) => `00:${String(Math.min(59, Math.floor(s))).padStart(2, "0")}`;

    const draw = (t: number) => {
      // Back to the start: the video in the tile gives way to the empty slot.
      const back = seg(t, AT.reset, PERIOD);

      // The profile, under everything. The tile dips as it is tapped, then
      // holds the video once it is up, with a glow as it arrives.
      const tilePress = 1 - 0.035 * Math.sin(Math.PI * seg(t, TAPS.tile.t - 0.05, TAPS.tile.t + 0.3));
      tf(r.tile.current, `scale(${tilePress.toFixed(4)})`);
      o(r.tileVideo.current, seg(t, AT.done, AT.done + 0.45) * (1 - back));
      const glow = seg(t, AT.done + 0.3, AT.done + 1.6);
      o(r.tileGlow.current, Math.sin(Math.PI * glow) * 0.9);

      // Tips: up from the bottom as a sheet, gone once the camera covers it.
      const tipsIn = easeOut(seg(t, AT.tips, AT.tips + 0.45));
      const tipsGone = t >= AT.record + 0.4;
      tf(r.tips.current, `translateY(${tipsGone ? 801 : ((1 - tipsIn) * 801).toFixed(1)}px)`);

      // The dim behind the action sheet and the alerts.
      o(r.dim.current, seg(t, AT.sheet, AT.sheet + 0.25) * (t < AT.record + 0.4 ? 1 : 0));

      // The action sheet: up, Camera tapped, down.
      const sheetIn = easeOut(seg(t, AT.sheet, AT.sheet + 0.35));
      const sheetOut = easeInOut(seg(t, TAPS.camera.t + 0.1, TAPS.camera.t + 0.4));
      tf(r.sheet.current, `translateY(${((1 - sheetIn + sheetOut) * 200).toFixed(1)}px)`);

      // The two permission alerts, the way iOS pops them.
      for (const [el, at, ok] of [
        [r.camAlert.current, AT.cam, TAPS.camOk.t],
        [r.micAlert.current, AT.mic, TAPS.micOk.t],
      ] as const) {
        const pop = easeOut(seg(t, at + 0.05, at + 0.3));
        const out = seg(t, ok + 0.12, ok + 0.3);
        o(el, clamp01(seg(t, at + 0.05, at + 0.2)) * (1 - out));
        tf(el, `scale(${lerp(1.14, 1, pop).toFixed(4)})`);
      }

      // The camera: full screen for the recording, and again for the preview.
      const camIn = seg(t, AT.record, AT.record + 0.35);
      o(r.camera.current, camIn * (t >= AT.uploading + 0.3 ? 0 : 1));
      o(r.recordUI.current, 1 - seg(t, AT.preview, AT.preview + 0.25));
      o(r.previewUI.current, seg(t, AT.preview, AT.preview + 0.3));

      // Recording: the button turns to a red stop square, and the timer runs
      // (quickened: the full take would be most of a minute).
      const rec = seg(t, TAPS.recStart.t, TAPS.recStart.t + 0.2) * (1 - seg(t, TAPS.recStop.t, TAPS.recStop.t + 0.2));
      const inner = r.recInner.current;
      if (inner) {
        const size = lerp(56, 28, easeOut(rec));
        inner.style.width = inner.style.height = `${size.toFixed(2)}px`;
        inner.style.left = inner.style.top = `${((64 - size) / 2).toFixed(2)}px`;
        inner.style.borderRadius = `${lerp(28, 6, rec).toFixed(2)}px`;
        inner.style.background = rec > 0.5 ? RED : "#fff";
      }
      const took = seg(t, TAPS.recStart.t, TAPS.recStop.t) * 54;
      if (r.timerText.current) r.timerText.current.textContent = clock(took);
      o(r.recDot.current, rec > 0 ? (Math.sin(t * 9) > -0.2 ? 1 : 0.25) : 0);

      // Sarah talking: while she records, and in the playback.
      const talking = (t > TAPS.recStart.t && t < TAPS.recStop.t) || (t > AT.preview + 0.3 && t < AT.uploading);
      const sway = talking ? Math.sin(t * 2.3) * 1.6 : 0;
      const nod = talking ? Math.sin(t * 3.1) * 3 : 0;
      tf(r.person.current, `translate(0px, ${nod.toFixed(2)}px) rotate(${sway.toFixed(2)}deg)`);
      if (r.mouth.current) {
        const open = talking ? Math.max(0, Math.sin(t * 13) * Math.sin(t * 4.7)) : 0;
        r.mouth.current.style.transform = `scaleY(${(0.15 + 0.85 * open).toFixed(3)})`;
      }

      // The preview plays: the bar fills and the time counts up.
      const played = seg(t, AT.preview + 0.3, AT.uploading) * 9;
      if (r.progress.current) r.progress.current.style.width = `${((played / 54) * 279).toFixed(2)}px`;
      if (r.previewTime.current) r.previewTime.current.textContent = `${clock(played)} / 00:54`;

      // Uploading, then the modal over it, then both give way to the profile.
      const leave = seg(t, AT.done, AT.done + 0.45);
      o(r.uploading.current, seg(t, AT.uploading, AT.uploading + 0.3) * (1 - leave));
      r.slabs.current.forEach((el, i) => {
        const w = Math.max(0, Math.sin(Math.PI * 2 * (t * 1.25 - i * 0.16)));
        tf(el, `translateY(${(-12 * w * w).toFixed(2)}px)`);
      });
      o(r.modalDim.current, seg(t, AT.uploaded, AT.uploaded + 0.25) * (1 - leave));
      const pop = spring(seg(t, AT.uploaded, AT.uploaded + 0.7), 0.45);
      o(r.modal.current, seg(t, AT.uploaded, AT.uploaded + 0.15) * (1 - leave));
      tf(r.modal.current, `translateY(${((1 - pop) * 30).toFixed(2)}px) scale(${lerp(0.86, 1, pop).toFixed(4)})`);

      // The touch: whichever tap is nearest.
      const tap = TAP_LIST.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a));
      const on = seg(t, tap.t - 0.42, tap.t - 0.26) * (1 - seg(t, tap.t + 0.14, tap.t + 0.32));
      const press = 1 - 0.2 * Math.sin(Math.PI * seg(t, tap.t - 0.12, tap.t + 0.2));
      if (r.touch.current) {
        r.touch.current.style.opacity = on.toFixed(3);
        r.touch.current.style.transform = `translate(${tap.x - 24}px, ${tap.y - 24}px) scale(${press.toFixed(3)})`;
      }

      // The caption for the beat, crossfading into the next.
      CAPTIONS.forEach((c, i) => {
        const next = CAPTIONS[i + 1]?.from ?? AT.reset;
        const k = seg(t, c.from, c.from + 0.3) * (1 - seg(t, next, next + 0.3));
        // The first one stays over the reset, so the loop seams.
        const v = i === 0 ? Math.max(k, back) : i === CAPTIONS.length - 1 ? k * (1 - back) : k;
        o(r.captions.current[i], v);
        tf(r.captions.current[i], `translateY(${((1 - easeOut(seg(t, c.from, c.from + 0.35))) * 6).toFixed(2)}px)`);
      });
    };

    // Held still, the most telling frame: the playback, mid-way.
    if (reduced) {
      draw(AT.preview + 1.4);
      return;
    }
    draw(0);

    let raf = 0;
    let last = performance.now();
    let time = 0;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.25 });
    if (host.current) io.observe(host.current);
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!visible) return;
      time = (time + dt) % PERIOD;
      draw(time);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [reduced]);

  return (
    <DotField captioned={caption}>
      <div
        ref={host}
        role="img"
        aria-label="The Fortuna app recording a video resume: from the empty slot on the job seeker's profile, through the tips, the camera and microphone permissions, recording and playing it back, to the upload and the video on the profile."
      >
        <PhoneMockup width="min(300px, 68vw)" grow>
          <Profile />

          {/* Tips, as a sheet over the profile. */}
          <div data-k="tips" style={abs({ inset: 0, background: CREAM, transform: "translateY(801px)", willChange: "transform" })}>
            <Tips />
          </div>

          <div data-k="dim" style={abs({ inset: 0, background: "rgba(0,0,0,0.4)", opacity: 0 })} />
          <div data-k="sheet" style={abs({ left: 0, right: 0, top: 0, bottom: 0, transform: "translateY(200px)", pointerEvents: "none" })}>
            <ActionSheet />
          </div>
          <Alert k="camAlert" title={"“Fortuna” Would Like to Access the Camera"} body="Fortuna needs access to your photo library to save captured videos and photos." />
          <Alert k="micAlert" title={"“Fortuna” Would Like To Access the Microphone"} body="Fortuna needs access to your Microphone to record videos with audio" />

          {/* The camera, full screen. */}
          <div data-k="camera" style={abs({ inset: 0, opacity: 0, background: "#000" })}>
            <Sarah />
            <div data-k="recordUI" style={abs({ inset: 0 })}>
              <RecordControls />
            </div>
            <div data-k="previewUI" style={abs({ inset: 0, opacity: 0 })}>
              <PreviewControls />
            </div>
          </div>

          <div data-k="uploading" style={abs({ inset: 0, opacity: 0, background: CREAM })}>
            <Uploading />
          </div>
          <div data-k="modalDim" style={abs({ inset: 0, opacity: 0, background: "rgba(0,0,0,0.3)" })} />
          <div data-k="modal" style={abs({ left: 38, top: 230, width: 300, height: 390, opacity: 0, transformOrigin: "50% 50%" })}>
            <Uploaded />
          </div>

          {/* The touch, as a screen recording shows it. */}
          <div
            data-k="touch"
            aria-hidden="true"
            style={abs({
              left: 0,
              top: 0,
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(60, 60, 60, 0.28)",
              border: "2px solid rgba(255, 255, 255, 0.65)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              zIndex: 10,
              opacity: 0,
            })}
          />
        </PhoneMockup>
      </div>
      {caption && (
        // As under the swipe demos: one row of the grid below the phone, up
        // into place once the phone has arrived. The line changes with the beat.
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 1 }}
          transition={{ type: "spring", stiffness: 170, damping: 13, mass: 0.9, delay: 0.55, opacity: { duration: 0.35, delay: 0.55 } }}
          ref={caps}
          aria-hidden="true"
          style={{
            position: "relative",
            margin: "14px 0 0",
            height: "1.5em",
            width: "100%",
            textAlign: "center",
            fontFamily: "var(--f-body)",
            fontSize: "clamp(13px, 1.1vw, 14.5px)",
            lineHeight: 1.5,
            letterSpacing: "-0.02em",
          }}
        >
          {CAPTIONS.map((c, i) => (
            <span
              key={c.text}
              style={{ position: "absolute", left: 0, right: 0, top: 0, opacity: i === 0 ? 1 : 0, whiteSpace: "nowrap" }}
            >
              {c.text}
            </span>
          ))}
        </motion.p>
      )}
    </DotField>
  );
}

/* ---------- The screens ---------- */

function Profile() {
  const label = (y: number, s: string) => <div style={abs({ left: 22, top: y, ...text(13, 600, "#3b3b3b") })}>{s}</div>;
  return (
    <div style={abs({ inset: 0, background: CREAM })}>
      <div style={abs({ left: 22, top: 58 })}>
        <BackArrow />
      </div>
      {/* The placeholder avatar, with its edit badge. */}
      <div style={abs({ left: 144, top: 66, width: 86, height: 86, borderRadius: "50%", background: "#d9ead0", overflow: "hidden" })}>
        <svg width="86" height="86" viewBox="0 0 86 86" aria-hidden="true">
          <circle cx="43" cy="34" r="15" fill={GREEN} />
          <path d="M14 86c2-20 14-30 29-30s27 10 29 30z" fill={GREEN} />
        </svg>
      </div>
      <div style={abs({ left: 206, top: 66, width: 30, height: 30, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.12)", display: "grid", placeItems: "center" })}>
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M2 12l.6-3L9.5 2.1l2.4 2.4L5 11.4z" fill="none" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={abs({ left: 0, right: 0, top: 164, textAlign: "center", ...text(24, 500) })}>Sarah Anderson</div>
      {/* The tabs. */}
      <div style={abs({ left: 0, right: 0, top: 212, height: 40, display: "flex", borderBottom: "1px solid #ddd8cc" })}>
        <div style={{ flex: 1, textAlign: "center", ...text(14, 500, INK), borderBottom: `3px solid ${BUTTON_GREEN}` }}>Profile</div>
        <div style={{ flex: 1, textAlign: "center", ...text(14, 400, "#8a8a8a") }}>Job Preferences</div>
      </div>

      {label(272, "Video Resume")}
      <div data-k="tile" style={abs({ left: 20, top: 296, width: 335, height: 172, transformOrigin: "50% 50%" })}>
        <div style={abs({ inset: 0, borderRadius: 8, background: "#dfeadb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 })}>
          <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
            <path d="M15 20V5M9 11l6-6 6 6M5 19v6h20v-6" fill="none" stroke="#5c7a6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={text(12.5, 500, "#5c7a6a")}>Upload Video Resume</div>
        </div>
        <div data-k="tileVideo" style={abs({ inset: 0, borderRadius: 8, overflow: "hidden", opacity: 0 })}>
          <Sarah still />
          {/* Play and the length, in the corner, clear of her face. */}
          <div style={abs({ left: 10, bottom: 10, height: 28, padding: "0 10px 0 8px", borderRadius: 14, background: "rgba(20,30,27,0.6)", display: "flex", alignItems: "center", gap: 6, ...text(12, 600, "#fff"), fontVariantNumeric: "tabular-nums" })}>
            <PlayIcon size={12} color="#fff" />
            00:54
          </div>
        </div>
        <div data-k="tileGlow" style={abs({ inset: -5, borderRadius: 12, boxShadow: `0 0 0 3px ${GREEN}55, 0 0 22px ${GREEN}66`, opacity: 0 })} />
      </div>

      {label(492, "About Me")}
      <div style={abs({ left: 20, top: 516, width: 335, height: 84, borderRadius: 6, background: "#fff", border: "1px solid #ddd8cc", boxSizing: "border-box", padding: "10px 12px", ...text(12, 400, "#a3a3a3") })}>
        Add a description about yourself...
      </div>

      {label(620, "Attributes")}
      <div style={abs({ left: 20, top: 644, display: "flex", gap: 8 })}>
        {["Dedicated", "Loyal", "Punctual"].map((a) => (
          <div key={a} style={{ padding: "6px 12px", borderRadius: 4, background: GREEN, ...text(12, 600, "#fff") }}>
            {a}
          </div>
        ))}
      </div>
      <div style={abs({ left: 20, top: 700, width: 335, height: 44, borderRadius: 5, border: `1px solid ${FOREST}`, boxSizing: "border-box", display: "grid", placeItems: "center", ...text(13, 500) })}>
        + Add Work Experience
      </div>
    </div>
  );
}

function Tips() {
  const box = (y: number, items: string[]) => (
    <div style={abs({ left: 30, top: y, width: 314, height: 88, borderRadius: 4, background: "#ebe8e0", padding: "14px 14px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 5 })}>
      {items.map((s) => (
        <div key={s} style={text(12.5, 600, "#222")}>
          • {s}
        </div>
      ))}
    </div>
  );
  return (
    <>
      <div style={abs({ left: 326, top: 50 })}>
        <CloseIcon />
      </div>
      <div style={abs({ left: 0, right: 0, top: 84, textAlign: "center", ...text(23, 500) })}>Record Your Video Resume</div>
      <div style={abs({ left: 31, top: 130, width: 313, height: 196, borderRadius: 8, overflow: "hidden" })}>
        <Sarah still />
      </div>
      <div style={abs({ left: 0, right: 0, top: 336, textAlign: "center", ...text(12, 400, "#616161") })}>Maximum video duration: 90 seconds</div>

      <div style={abs({ left: 30, top: 376, display: "flex", alignItems: "center", gap: 10, ...text(16, 600) })}>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 10.5l4.5 4.5L17 5" fill="none" stroke={BUTTON_GREEN} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Tips
      </div>
      {box(406, ["Find a quiet, well-lit place", "Use plain or white background", "Frame your upper body and face"])}

      <div style={abs({ left: 30, top: 514, display: "flex", alignItems: "center", gap: 10, ...text(16, 600) })}>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 5l10 10M15 5L5 15" fill="none" stroke={RED} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        Avoid
      </div>
      {box(544, ["Avoid wearing sunglasses or hats", "Avoid interruptions and unwanted noises", "Avoid special effects"])}

      <GreenButton top={700}>Got it!</GreenButton>
    </>
  );
}

function ActionSheet() {
  const platter: CSSProperties = { position: "absolute", left: 10, width: 355, borderRadius: 14, display: "grid", placeItems: "center", fontFamily: "-apple-system, var(--f-body)", fontSize: 20 };
  return (
    <>
      <div style={{ ...platter, top: 668, height: 58, background: "rgba(248,248,248,0.96)", color: IOS_BLUE }}>Camera</div>
      <div style={{ ...platter, top: 734, height: 56, background: "#fff", color: IOS_BLUE, fontWeight: 600 }}>Cancel</div>
    </>
  );
}

function Alert({ k, title, body }: { k: string; title: string; body: string }) {
  const sys: CSSProperties = { fontFamily: "-apple-system, var(--f-body)", color: "#000", textAlign: "center" };
  return (
    <div data-k={k} style={abs({ left: 52, top: 312, width: 270, height: 176, borderRadius: 14, background: "rgba(242,242,242,0.97)", opacity: 0, overflow: "hidden" })}>
      <div style={{ ...sys, position: "absolute", left: 16, right: 16, top: 19, fontSize: 16.5, fontWeight: 600, lineHeight: 1.3 }}>{title}</div>
      <div style={{ ...sys, position: "absolute", left: 16, right: 16, top: 66, fontSize: 12.5, lineHeight: 1.35 }}>{body}</div>
      <div style={abs({ left: 0, right: 0, top: 132, height: 1, background: "rgba(60,60,67,0.3)" })} />
      <div style={abs({ left: 135, top: 132, width: 1, height: 44, background: "rgba(60,60,67,0.3)" })} />
      <div style={{ ...sys, position: "absolute", left: 0, width: 135, top: 132, height: 44, display: "grid", placeItems: "center", color: IOS_BLUE, fontSize: 16.5 }}>Don’t Allow</div>
      <div style={{ ...sys, position: "absolute", left: 135, width: 135, top: 132, height: 44, display: "grid", placeItems: "center", color: IOS_BLUE, fontSize: 16.5, fontWeight: 600 }}>Ok</div>
    </div>
  );
}

function RoundButton({ left, top, children }: { left: number; top: number; children: ReactNode }) {
  return <div style={abs({ left, top, width: 48, height: 48, borderRadius: "50%", background: FOREST, display: "grid", placeItems: "center" })}>{children}</div>;
}

function RecordControls() {
  return (
    <>
      <div style={abs({ left: 0, right: 0, top: 0, height: 130, background: "linear-gradient(rgba(0,0,0,0.35), transparent)" })} />
      <div style={abs({ left: 0, right: 0, bottom: 0, height: 200, background: "linear-gradient(transparent, rgba(0,0,0,0.35))" })} />
      <div style={abs({ left: 326, top: 50 })}>
        <CloseIcon color="#fff" />
      </div>
      <div data-k="timer" style={abs({ left: 0, right: 0, top: 54, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, ...text(32, 500, "#fff"), textShadow: "0 1px 6px rgba(0,0,0,0.3)", fontVariantNumeric: "tabular-nums" })}>
        <span data-k="recDot" style={{ width: 11, height: 11, borderRadius: "50%", background: RED, opacity: 0 }} />
        <span data-k="timerText">00:00</span>
      </div>
      {/* The tips, the record button, and the flip. */}
      <RoundButton left={19} top={670}>
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <path d="M11 2.5a6 6 0 0 0-3.5 10.9V16h7v-2.6A6 6 0 0 0 11 2.5zM8.5 19h5" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </RoundButton>
      <div style={abs({ left: 151, top: 658, width: 72, height: 72, borderRadius: "50%", border: "4px solid #fff", boxSizing: "border-box" })}>
        <div data-k="recInner" style={abs({ left: 4, top: 4, width: 56, height: 56, borderRadius: 28, background: "#fff" })} />
      </div>
      <RoundButton left={307} top={670}>
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <path d="M4 8.5A7.5 7.5 0 0 1 17.6 6M18 13.5A7.5 7.5 0 0 1 4.4 16M17.8 2.5V6.3H14M4.2 19.5v-3.8H8" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </RoundButton>
    </>
  );
}

function PreviewControls() {
  return (
    <>
      <div style={abs({ left: 326, top: 50 })}>
        <CloseIcon color="#fff" />
      </div>
      {/* The board's black overlay, so the controls read over any picture. */}
      <div style={abs({ left: 0, right: 0, top: 534, bottom: 0, borderRadius: "10px 10px 0 0", background: "rgba(0,0,0,0.3)" })} />
      <div style={abs({ left: 40, top: 572 })}>
        <PlayIcon size={18} color="#fff" />
      </div>
      <div style={abs({ left: 70, top: 579, width: 279, height: 5, borderRadius: 3, background: "#aec6ba", overflow: "hidden" })}>
        <div data-k="progress" style={{ width: 0, height: 5, background: BUTTON_GREEN }} />
      </div>
      <div style={abs({ right: 26, top: 596, ...text(12, 400, "#fff"), fontVariantNumeric: "tabular-nums" })}>
        <span data-k="previewTime">00:00 / 00:54</span>
      </div>
      <GreenButton top={642}>Confirm and Upload Video!</GreenButton>
      <div style={abs({ left: 0, right: 0, top: 712, textAlign: "center", ...text(14, 500, "#fff"), textDecoration: "underline", textUnderlineOffset: 3 })}>Record Again</div>
    </>
  );
}

function Uploading() {
  return (
    <>
      <div style={abs({ left: 0, right: 0, top: 220, textAlign: "center", ...text(23, 500) })}>Uploading your video...</div>
      <div style={abs({ left: 72, top: 320, width: 232, height: 150, display: "flex", justifyContent: "space-between", alignItems: "flex-end" })}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            data-k="slab"
            style={{ position: "relative", width: 62, height: 118 }}
          >
            {/* A panel, face and edge. */}
            <div style={abs({ left: 0, top: 6, width: 52, height: 110, background: "#6f8f82", borderRadius: 2 })} />
            <div style={abs({ left: 52, top: 0, width: 10, height: 110, background: FOREST, transform: "skewY(-30deg)", transformOrigin: "0 100%", borderRadius: 1 })} />
          </div>
        ))}
      </div>
      <div style={abs({ left: 52, right: 52, top: 520, textAlign: "center", ...text(14, 400), lineHeight: 1.4 })}>
        Please don’t close the app while the video is uploading. This could take a few minutes.
      </div>
    </>
  );
}

function Uploaded() {
  return (
    <div style={abs({ inset: 0, borderRadius: 12, background: "#fff", boxShadow: "0 18px 40px rgba(0,0,0,0.18)" })}>
      <div style={abs({ left: 20, right: 20, top: 34, textAlign: "center", ...text(23, 600), lineHeight: 1.25 })}>Video Resume uploaded!</div>
      {/* The board's video placeholder: a green screen with its play button. */}
      <div style={abs({ left: 72, top: 118, width: 156, height: 112 })}>
        <div style={abs({ left: 0, top: 6, width: 146, height: 104, borderRadius: 4, background: GREEN })} />
        <div style={abs({ left: 146, top: 0, width: 10, height: 104, background: "#4f9a33", transform: "skewY(-30deg)", transformOrigin: "0 100%" })} />
        <div style={abs({ left: 73 - 22, top: 58 - 22, width: 44, height: 44, borderRadius: "50%", background: "#2f7a1c", display: "grid", placeItems: "center" })}>
          <PlayIcon size={16} color={GREEN} />
        </div>
      </div>
      <div style={abs({ left: 34, right: 34, top: 252, textAlign: "center", ...text(14, 400), lineHeight: 1.4 })}>
        Your video was successfully uploaded. One step away from success, good luck!
      </div>
      <div style={abs({ left: 52, top: 326, width: 196, height: 44, borderRadius: 5, background: BUTTON_GREEN, display: "grid", placeItems: "center", ...text(16, 600, "#fff") })}>Thanks!</div>
    </div>
  );
}

function GreenButton({ top, children }: { top: number; children: ReactNode }) {
  return (
    <div style={abs({ left: 30, top, width: 314, height: 50, borderRadius: 5, background: BUTTON_GREEN, display: "grid", placeItems: "center", ...text(16, 600, "#fff") })}>
      {children}
    </div>
  );
}

/* ---------- Sarah, on camera ---------- */

/**
 * Sarah at home, filmed on her phone: drawn in the app's palette rather than
 * the stock footage the board used. Drawn on the full portrait screen; the
 * landscape boxes she also sits in (the tips preview, the profile thumbnail)
 * take a wider view of the same room, head and shoulders.
 */
export function Sarah({ still = false }: { still?: boolean }) {
  const id = useId().replace(/:/g, "");
  const SKIN = "#c98d68";
  const SKIN_SHADE = "#b37754";
  const HAIR = "#3a2a23";
  return (
    <svg viewBox={still ? "-110 268 595 372" : "0 0 375 801"} preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efe9dd" />
          <stop offset="1" stopColor="#e0d6c4" />
        </linearGradient>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fffaf0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fffaf0" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* The room: a wall, a window with its blinds, a plant. */}
      <rect x="-240" width="855" height="801" fill={`url(#${id}w)`} />
      <rect x="-10" y="150" width="150" height="330" fill="#f8f4ea" stroke="#d6cbb6" strokeWidth="6" />
      {Array.from({ length: 22 }, (_, i) => (
        <line key={i} x1="-10" x2="140" y1={162 + i * 14.5} y2={162 + i * 14.5} stroke="#e3d9c6" strokeWidth="2" />
      ))}
      <rect x="0" y="150" width="260" height="420" fill={`url(#${id}l)`} />
      <rect x="292" y="520" width="56" height="64" rx="6" fill="#c7b496" />
      {[
        [306, 520, -28],
        [322, 506, 4],
        [338, 518, 32],
        [314, 492, -12],
        [332, 490, 18],
      ].map(([x, y, a], i) => (
        <ellipse key={i} cx={x} cy={y - 26} rx="11" ry="30" fill={i % 2 ? "#5a9a3b" : GREEN} transform={`rotate(${a} ${x} ${y})`} />
      ))}

      <g data-k={still ? undefined : "person"} style={{ transformOrigin: "187px 801px", transformBox: "view-box" }}>
        {/* Hair, behind. */}
        <path d="M104 420c-6-90 40-140 84-140s92 46 86 140c-2 40 6 110 18 150H86c12-40 20-110 18-150z" fill={HAIR} />
        {/* Shoulders, in Fortuna orange. */}
        <path d="M22 801c4-120 50-200 120-214h90c70 14 116 94 122 214z" fill={ORANGE} />
        <path d="M142 587h90l-45 56z" fill={SKIN_SHADE} />
        <rect x="163" y="470" width="48" height="124" rx="20" fill={SKIN_SHADE} />
        {/* Head and ears. */}
        <ellipse cx="124" cy="428" rx="11" ry="17" fill={SKIN_SHADE} />
        <ellipse cx="250" cy="428" rx="11" ry="17" fill={SKIN_SHADE} />
        <ellipse cx="187" cy="418" rx="63" ry="78" fill={SKIN} />
        {/* The fringe. */}
        <path d="M122 412c-4-78 36-108 70-108 40 0 72 32 66 104-14-36-44-62-80-64-22 18-40 40-56 68z" fill={HAIR} />
        {/* Face. */}
        <path d="M152 404q12-7 24 0M198 404q12-7 24 0" fill="none" stroke={HAIR} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="164" cy="424" r="5" fill="#2b201b" />
        <circle cx="210" cy="424" r="5" fill="#2b201b" />
        <ellipse cx="150" cy="450" rx="10" ry="6" fill="#e07a5f" opacity="0.3" />
        <ellipse cx="224" cy="450" rx="10" ry="6" fill="#e07a5f" opacity="0.3" />
        <path d="M184 432q3 12-4 16" fill="none" stroke={SKIN_SHADE} strokeWidth="3" strokeLinecap="round" />
        <path d="M170 462q17 13 34 0" fill="none" stroke="#8a3b2c" strokeWidth="3.5" strokeLinecap="round" />
        {!still && <ellipse data-k="mouth" cx="187" cy="468" rx="10" ry="7" fill="#6e2a21" style={{ transformOrigin: "187px 463px", transformBox: "view-box", transform: "scaleY(0.15)" }} />}
      </g>
    </svg>
  );
}

/* ---------- Icons ---------- */

function CloseIcon({ color = INK }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BackArrow() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 3l12 7-12 7z" fill={color} strokeLinejoin="round" />
    </svg>
  );
}
