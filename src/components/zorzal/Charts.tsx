import type { CSSProperties, ReactNode } from "react";
import { BUDGET, MEMO_FIXES, PRIORITIES, RETOOL, RISK_TOTAL, RISKS, TAPS, TESTS, TIMELINE } from "@/content/zorzal-charts";

/**
 * The Zorzal case study's infographics, redrawn from the team's planning
 * documents in the case study's palette. Each one is plain HTML so it stays
 * crisp, selectable and readable on a phone. Data lives in
 * src/content/zorzal-charts.ts.
 */

export type ChartKind = "timeline" | "risks" | "taps" | "tests" | "retool" | "budget" | "priorities" | "memo";

const WIDE = "min(1040px, 100% - 28px)";
const MEASURE = "min(680px, 100% - 40px)";

const label: CSSProperties = {
  fontFamily: "var(--font-grotesk)",
  fontWeight: 600,
  fontSize: 11.5,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};
const text: CSSProperties = { fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.5 };

function Card({ title, wide, caption, dark, children }: { title: string; wide?: boolean; caption?: string; dark: boolean; children: ReactNode }) {
  return (
    <figure style={{ width: wide ? WIDE : MEASURE, margin: "clamp(28px, 5vh, 48px) auto" }}>
      <div
        style={{
          borderRadius: 18,
          border: "1px solid var(--z-band-rule)",
          background: dark ? "rgba(254, 252, 240, 0.05)" : "rgba(255, 255, 255, 0.55)",
          padding: "clamp(20px, 3vw, 32px)",
        }}
      >
        <p style={{ ...label, margin: "0 0 18px", color: dark ? "var(--z-apricot)" : "var(--z-terracotta)" }}>{title}</p>
        {children}
      </div>
      {caption ? (
        <figcaption style={{ ...text, fontSize: 14, marginTop: 12, textAlign: "center", color: "var(--z-band-muted)" }}>{caption}</figcaption>
      ) : null}
    </figure>
  );
}

export function Chart({ kind, caption, dark }: { kind: ChartKind; caption?: string; dark: boolean }) {
  const accent = dark ? "var(--z-apricot)" : "var(--z-wine)";
  switch (kind) {
    case "timeline":
      return (
        <Card title="The plan vs. what happened" wide caption={caption} dark={dark}>
          <div className="z-tl" style={{ display: "grid", gap: 0 }}>
            <div className="z-tl-row z-tl-head" style={{ ...label, color: "var(--z-band-muted)" }}>
              <span />
              <span>The plan</span>
              <span>What happened</span>
            </div>
            {TIMELINE.map((r) => (
              <div key={r.when} className="z-tl-row" style={{ borderTop: "1px solid var(--z-band-rule)" }}>
                <span style={{ ...label, color: r.mark ? accent : "var(--z-band-muted)" }}>{r.when}</span>
                <span style={{ ...text, color: "var(--z-band-muted)" }}>
                  <span className="z-tl-tag" style={label}>Plan · </span>
                  {r.plan}
                </span>
                <span style={{ ...text, fontWeight: r.mark ? 600 : 400, color: r.mark ? accent : undefined }}>
                  <span className="z-tl-tag" style={{ ...label, color: "var(--z-band-muted)" }}>Actual · </span>
                  {r.actual}
                </span>
              </div>
            ))}
          </div>
        </Card>
      );

    case "risks": {
      const max = RISKS[0].score;
      return (
        <Card title={`Risk register · ${RISK_TOTAL.count} risks · about $${RISK_TOTAL.perYear.toLocaleString("en-US")} a year`} caption={caption} dark={dark}>
          <div style={{ display: "grid", gap: 12 }}>
            {RISKS.map((r) => (
              <div key={r.risk}>
                <div style={{ ...text, fontSize: 14, display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 5 }}>
                  <span style={{ fontWeight: r.worker ? 600 : 400 }}>{r.risk}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--z-band-muted)", whiteSpace: "nowrap" }}>${r.score}/yr</span>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: "var(--z-band-rule)" }}>
                  <div
                    style={{
                      width: `${(r.score / max) * 100}%`,
                      height: "100%",
                      borderRadius: 5,
                      background: r.worker ? "var(--z-wine)" : "var(--z-muted)",
                      opacity: r.worker ? 1 : 0.55,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p style={{ ...text, fontSize: 13, margin: "16px 0 0", color: "var(--z-band-muted)" }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "var(--z-wine)", marginRight: 8 }} />
            Risks to how the workers already work. Score = probability × impact.
          </p>
        </Card>
      );
    }

    case "taps":
      return (
        <Card title="Steps to Create Box" caption={caption} dark={dark}>
          <div style={{ display: "grid", gap: 22 }}>
            {(
              [
                ["The redesign", TAPS.redesign, false],
                ["What shipped", TAPS.shipped, true],
              ] as const
            ).map(([name, steps, good]) => (
              <div key={name}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ ...text, fontWeight: 600 }}>{name}</span>
                  <span style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 26, color: good ? "var(--z-forest)" : accent }}>
                    {steps.length} <span style={{ ...text, fontSize: 14, fontWeight: 400, color: "var(--z-band-muted)" }}>screens</span>
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                  {steps.map((s, i) => (
                    <span key={s} style={{ display: "contents" }}>
                      {i > 0 ? <span style={{ color: "var(--z-band-muted)" }}>→</span> : null}
                      <span
                        style={{
                          ...text,
                          fontSize: 14,
                          padding: "6px 12px",
                          borderRadius: 999,
                          border: `1.5px solid ${i === steps.length - 1 ? (good ? "var(--z-forest)" : accent) : "var(--z-band-rule)"}`,
                          fontWeight: i === steps.length - 1 ? 600 : 400,
                        }}
                      >
                        {s}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      );

    case "tests":
      return (
        <Card title="Three tasks, and where people got lost" caption={caption} dark={dark}>
          <div style={{ display: "grid" }}>
            {TESTS.map((t, i) => (
              <div
                key={t.task}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: "6px 16px",
                  padding: "14px 0",
                  borderTop: i ? "1px solid var(--z-band-rule)" : undefined,
                }}
              >
                <span style={{ ...text, fontWeight: 600 }}>{t.task}</span>
                <span
                  style={{
                    ...label,
                    fontSize: 10.5,
                    alignSelf: "start",
                    padding: "4px 9px",
                    borderRadius: 999,
                    background: t.outcome === "Detour" ? "var(--z-apricot)" : "var(--z-terracotta)",
                    color: t.outcome === "Detour" ? "var(--z-ink)" : "#fff",
                  }}
                >
                  {t.outcome}
                </span>
                <span style={{ ...text, fontSize: 14, color: "var(--z-band-muted)", gridColumn: "1 / -1" }}>{t.note}</span>
              </div>
            ))}
          </div>
        </Card>
      );

    case "retool":
      return (
        <Card title="Retool, weighed" wide caption={caption} dark={dark}>
          <div className="z-split">
            <div>
              <p style={{ ...text, fontWeight: 600, margin: "0 0 10px" }}>
                For <span style={{ color: "var(--z-forest)" }}>({RETOOL.pros.length})</span>
              </p>
              {RETOOL.pros.map((p) => (
                <p key={p} style={{ ...text, margin: "0 0 8px" }}>
                  <span style={{ color: "var(--z-forest)", fontWeight: 700, marginRight: 8 }}>+</span>
                  {p}
                </p>
              ))}
            </div>
            <div>
              <p style={{ ...text, fontWeight: 600, margin: "0 0 10px" }}>Against</p>
              {RETOOL.cons.map((c) => (
                <p key={c.group} style={{ ...text, margin: "0 0 12px" }}>
                  <span style={{ ...label, display: "block", color: accent, marginBottom: 2 }}>{c.group}</span>
                  {c.text}
                </p>
              ))}
            </div>
          </div>
        </Card>
      );

    case "budget":
      return (
        <Card title={`What the year cost · $${BUDGET.spent.toFixed(2)} of $${BUDGET.cap.toLocaleString("en-US")}`} caption={caption} dark={dark}>
          <div style={{ height: 18, borderRadius: 9, background: "var(--z-band-rule)", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ width: `${(BUDGET.spent / BUDGET.cap) * 100}%`, minWidth: 8, height: "100%", background: "var(--z-wine)" }} />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {BUDGET.items.map((it) => (
              <div key={it.label} style={{ ...text, fontSize: 14, display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>{it.label}</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>${it.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--z-band-rule)", marginTop: 14, paddingTop: 12, display: "grid", gap: 6 }}>
            {BUDGET.compare.map((c) => (
              <div key={c.label} style={{ ...text, fontSize: 14, display: "flex", justifyContent: "space-between", gap: 12, color: "var(--z-band-muted)" }}>
                <span>{c.label}</span>
                <span style={{ whiteSpace: "nowrap" }}>{c.amount}</span>
              </div>
            ))}
          </div>
        </Card>
      );

    case "priorities":
      return (
        <Card title="Our priorities, before and after one call with Chuck" caption={caption} dark={dark}>
          <div style={{ display: "grid" }}>
            {PRIORITIES.map((p, i) => (
              <div
                key={p.ours}
                className="z-pri"
                style={{ padding: "12px 0", borderTop: i ? "1px solid var(--z-band-rule)" : undefined }}
              >
                <span style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 20, color: "var(--z-band-muted)" }}>{i + 1}</span>
                <span style={{ ...text, textDecoration: p.kept ? "none" : "line-through", textDecorationColor: "var(--z-band-muted)", color: p.kept ? undefined : "var(--z-band-muted)" }}>
                  {p.ours}
                </span>
                <span style={{ ...text, fontSize: 14, fontWeight: p.kept ? 600 : 400, color: p.kept ? "var(--z-forest)" : "var(--z-band-muted)" }}>{p.after}</span>
              </div>
            ))}
          </div>
        </Card>
      );

    case "memo":
      return (
        <Card title="The memo, as a checklist" caption={caption} dark={dark}>
          <div style={{ display: "grid", gap: 12 }}>
            {MEMO_FIXES.map((f) => (
              <div key={f} style={{ ...text, display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  aria-hidden="true"
                  style={{
                    flex: "0 0 auto",
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background: "var(--z-forest)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  ✓
                </span>
                {f}
              </div>
            ))}
          </div>
        </Card>
      );
  }
}
