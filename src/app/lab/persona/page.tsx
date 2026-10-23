import "../../fortuna/theme.css";
import { Band } from "@/components/fortuna/Prose";
import { PersonaAnnotated, PersonaCard, PersonaEditorial } from "@/components/fortuna/PersonaOptions";
import { SARAH } from "@/content/fortuna";

/** Three layouts for Sarah's persona sheet, side by side, to choose from. */
export default function Page() {
  const label = (t: string) => (
    <p style={{ margin: "0 0 28px", fontFamily: "var(--f-grotesk)", fontWeight: 600, fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--f-forest-deep)", textAlign: "center" }}>
      {t}
    </p>
  );
  return (
    <main className="fortuna flex-1" style={{ overflowX: "clip" }}>
      <Band id="a" tone="green">
        {label("A · Editorial")}
        <PersonaEditorial p={SARAH} />
      </Band>
      <Band id="b" tone="green">
        {label("B · Persona card")}
        <PersonaCard p={SARAH} />
      </Band>
      <Band id="c" tone="green">
        {label("C · Annotated")}
        <PersonaAnnotated p={SARAH} />
      </Band>
    </main>
  );
}
