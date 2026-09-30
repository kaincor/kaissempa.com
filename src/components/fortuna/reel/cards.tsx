import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import FortunaWordmark from "../FortunaWordmark";

/**
 * The job cards, as markup, in the app's own units.
 *
 * Built rather than exported because they move, and text that moves has to
 * stay text: a card photographed out of Figma blurs the moment it scales.
 * The big card is the app's 315 x 511; the small one is the website's
 * 239 x 348.
 */

export const GREEN = "#69bd45";
export const ORANGE = "#f58120";
export const FOREST = "#32443e";
export const CREAM = "#f7f5f0";

export type Job = {
  title: string;
  place: string;
  rating: string;
  hours: string;
  days: string;
  area: string;
  distance: string;
  pay: string;
  photo: string;
};

/** The five on the website's reel, in the order they sit across it. */
export const JOBS: Job[] = [
  { title: "Printer", place: "Construction", rating: "4.6", hours: "Part Time Job", days: "Nights", area: "Dave County", distance: "1.2 miles away", pay: "$21", photo: "/fortuna/reel/job-printer.webp" },
  { title: "Waiter", place: "Mary's Bugers", rating: "4.7", hours: "Part Time Job", days: "Nights", area: "Dave County", distance: "1.2 miles away", pay: "$21", photo: "/fortuna/reel/job-waiter.webp" },
  { title: "Carpenter", place: "Red Moose Engineering", rating: "4.8", hours: "Part Time Job", days: "Weekends", area: "Dave County", distance: "3.5 miles away", pay: "$32", photo: "/fortuna/reel/job-carpenter.webp" },
  { title: "Forklift Driver", place: "Bunnings Warehouse", rating: "4.5", hours: "Part Time Job", days: "Nights", area: "Dave County", distance: "1.2 miles away", pay: "$21", photo: "/fortuna/reel/job-forklift.webp" },
  { title: "Barista", place: "Cafe & Co", rating: "4.9", hours: "Part Time Job", days: "Nights", area: "Dave County", distance: "1.2 miles away", pay: "$21", photo: "/fortuna/reel/job-barista.webp" },
];

/** The job the swipe promo's phone shows. */
export const DINER: Job = {
  title: "Waiter / Waitress",
  place: "Al Mac's Diner",
  rating: "4.8",
  hours: "Part Time Job",
  days: "Weekends",
  area: "Dave County",
  distance: "3.5 miles away",
  pay: "$16",
  photo: "/fortuna/reel/job-diner.webp",
};

function Photo({ src, style }: { src: string; style: CSSProperties }) {
  return (
    <div style={{ position: "absolute", overflow: "hidden", ...style }}>
      <Image
        src={src}
        alt=""
        fill
        sizes="320px"
        unoptimized
        draggable={false}
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}

/** The app's job card, 315 x 511. */
export function BigCard({ job, children }: { job: Job; children?: ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        width: 315,
        height: 511,
        borderRadius: 16,
        overflow: "hidden",
        background: "#fffdf9",
        boxShadow: "0 10px 26px rgba(40, 40, 30, 0.14)",
        fontFamily: "var(--f-body)",
        color: "#111",
      }}
    >
      <Photo src={job.photo} style={{ left: 6, top: 6, right: 6, height: 280, borderRadius: 12 }} />
      <div style={{ position: "absolute", left: 24, right: 24, top: 304 }}>
        <div style={{ fontSize: 23, fontWeight: 500, letterSpacing: "-0.01em" }}>{job.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, fontSize: 16, fontWeight: 500 }}>
          {job.place}
          <span style={{ background: ORANGE, color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
            ★ {job.rating}
          </span>
        </div>
        <div style={{ height: 1, background: "#e4ded6", margin: "15px 0 12px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>
            <Row icon={<Clock />}>{job.hours}</Row>
            <Row icon={<Calendar />}>{job.days}</Row>
            <Row icon={<Pin />} tone={ORANGE}>
              {job.area}
              <br />
              {job.distance}
            </Row>
          </div>
          <div style={{ textAlign: "right", paddingBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em" }}>HOURLY</div>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>{job.pay}</div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

/** The website's smaller card, 239 x 348. */
export function MiniCard({ job }: { job: Job }) {
  return (
    <div
      style={{
        position: "relative",
        width: 239,
        height: 348,
        borderRadius: 10,
        overflow: "hidden",
        background: "#ffffff",
        boxShadow: "0 8px 22px rgba(40, 40, 30, 0.1)",
        fontFamily: "var(--f-body)",
        color: "#1a1a1a",
      }}
    >
      <Photo src={job.photo} style={{ left: 9.5, top: 9.5, width: 220, height: 173, borderRadius: 8 }} />
      <div style={{ position: "absolute", left: 19, top: 198, fontSize: 18, fontWeight: 500 }}>{job.title}</div>
      <div style={{ position: "absolute", left: 19, top: 226, fontSize: 11, fontWeight: 600 }}>{job.place}</div>
      <div style={{ position: "absolute", left: 19, right: 19, top: 259, height: 1, background: "#ebe6de" }} />
      <div style={{ position: "absolute", left: 19, top: 276, fontSize: 9, lineHeight: "19px" }}>
        {job.hours}
        <br />
        {job.days}
        <br />
        <span style={{ color: ORANGE }}>{job.distance}</span>
      </div>
      <div style={{ position: "absolute", right: 17, top: 278, textAlign: "right" }}>
        <div style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: "0.1em" }}>HOURLY</div>
        <div style={{ fontSize: 17, fontWeight: 600, marginTop: 3 }}>{job.pay}</div>
      </div>
    </div>
  );
}

/**
 * The applied face laid over a big card: the brand green, the tick and the
 * "Apply" stamp, as on the swipe promo. Its parts are separate so the reel
 * can bring them up in turn.
 */
export function AppliedFace({ refs }: { refs: (key: string) => (el: HTMLElement | null) => void }) {
  return (
    <>
      <div ref={refs("apply-green")} style={{ position: "absolute", inset: 0, background: GREEN, opacity: 0 }} />
      <svg
        ref={refs("apply-tick") as unknown as React.Ref<SVGSVGElement>}
        width="120"
        height="120"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ position: "absolute", left: 97, top: 76, opacity: 0, transformOrigin: "60px 60px" }}
      >
        <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div
        ref={refs("apply-stamp")}
        style={{
          position: "absolute",
          left: 68,
          top: 214,
          width: 180,
          height: 62,
          border: "4px solid #fff",
          borderRadius: 6,
          color: "#fff",
          fontFamily: "var(--f-body)",
          fontSize: 38,
          fontWeight: 600,
          display: "grid",
          placeItems: "center",
          opacity: 0,
          transformOrigin: "50% 50%",
        }}
      >
        Apply
      </div>
    </>
  );
}

/** The job seeker's home screen furniture: header and the two buttons. */
export function AppChrome() {
  return (
    <>
      <svg style={{ position: "absolute", left: 32, top: 56 }} width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
        <circle cx="12" cy="9" r="6" fill={GREEN} />
        <path d="M1 27c0-6.6 5-11 11-11s11 4.4 11 11z" fill={GREEN} />
        <circle cx="24" cy="4" r="3" fill={ORANGE} />
      </svg>
      <div style={{ position: "absolute", left: 129, top: 59, display: "flex", fontSize: 22.5, lineHeight: 0 }}>
        <FortunaWordmark title="fortuna" />
      </div>
      <svg style={{ position: "absolute", right: 32, top: 58 }} width="28" height="26" viewBox="0 0 28 26" aria-hidden="true">
        <rect x="1" y="7" width="26" height="18" rx="4" fill="#6f8b81" />
        <rect x="9" y="2" width="10" height="7" rx="2" fill="none" stroke="#6f8b81" strokeWidth="2.4" />
      </svg>
      <div style={{ ...BUTTON, left: 98, background: "#ff8989" }}>
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 7l10 10M17 7L7 17" stroke="#b01212" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ ...BUTTON, left: 214, background: "#ade495" }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#298800" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
}

const BUTTON: CSSProperties = {
  position: "absolute",
  top: 671,
  width: 64,
  height: 64,
  borderRadius: 16,
  display: "grid",
  placeItems: "center",
  boxShadow: "0 6px 14px rgba(40, 40, 30, 0.12)",
};

function Row({ icon, tone, children }: { icon: ReactNode; tone?: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", color: tone, marginTop: 3 }}>
      <span style={{ width: 14, display: "inline-flex", justifyContent: "center", paddingTop: 4 }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function Clock() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
      <path
        d="M5.5 0C2.46169 0 0 2.46169 0 5.5C0 8.53831 2.46169 11 5.5 11C8.53831 11 11 8.53831 11 5.5C11 2.46169 8.53831 0 5.5 0ZM5.5 9.93548C3.03831 9.93548 1.06452 7.96169 1.06452 5.5C1.06452 3.06048 3.03831 1.06452 5.5 1.06452C7.93952 1.06452 9.93548 3.06048 9.93548 5.5C9.93548 7.96169 7.93952 9.93548 5.5 9.93548ZM6.85282 7.62903C6.98589 7.71774 7.14113 7.69556 7.22984 7.5625L7.65121 7.00806C7.73992 6.875 7.71774 6.71976 7.58468 6.63105L6.12097 5.54435V2.39516C6.12097 2.2621 5.9879 2.12903 5.85484 2.12903H5.14516C4.98992 2.12903 4.87903 2.2621 4.87903 2.39516V6.05444C4.87903 6.12097 4.90121 6.20968 4.96774 6.25403L6.85282 7.62903Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Calendar() {
  return (
    <svg width="11" height="12" viewBox="0 0 11 12" aria-hidden="true">
      <path
        d="M9.82143 1.5H8.64286V0.28125C8.64286 0.140625 8.49554 0 8.34821 0H7.36607C7.1942 0 7.07143 0.140625 7.07143 0.28125V1.5H3.92857V0.28125C3.92857 0.140625 3.78125 0 3.63393 0H2.65179C2.47991 0 2.35714 0.140625 2.35714 0.28125V1.5H1.17857C0.515625 1.5 0 2.01563 0 2.625V10.875C0 11.5078 0.515625 12 1.17857 12H9.82143C10.4598 12 11 11.5078 11 10.875V2.625C11 2.01563 10.4598 1.5 9.82143 1.5ZM9.67411 10.875H1.32589C1.22768 10.875 1.17857 10.8281 1.17857 10.7344V3.75H9.82143V10.7344C9.82143 10.8281 9.74777 10.875 9.67411 10.875Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Pin() {
  return (
    <svg width="9" height="12" viewBox="0 0 9 12" aria-hidden="true">
      <path
        d="M4.03125 11.7541C4.24219 12.082 4.73438 12.082 4.94531 11.7541C8.36719 6.83707 9 6.32195 9 4.49561C9 2.01366 6.98438 0 4.5 0C1.99219 0 0 2.01366 0 4.49561C0 6.32195 0.609375 6.83707 4.03125 11.7541Z"
        fill={ORANGE}
      />
    </svg>
  );
}
