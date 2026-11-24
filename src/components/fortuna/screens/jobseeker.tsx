import { AppChrome, BigCard, BUTTON, CrossIcon, TickIcon, type Job } from "../reel/cards";
import { Sarah } from "../swipe/VideoResumeDemo";
import {
  abs,
  Back,
  Body,
  Button,
  C,
  Card,
  Chevron,
  Chip,
  Close,
  Field,
  Icon,
  ICONS,
  Input,
  Label,
  Modal,
  Radio,
  Screen,
  Sheet,
  Slider,
  Spot,
  Sub,
  t,
  Title,
  W,
  Wordmark,
} from "./kit";

/**
 * The job seeker's screens, from New Colors: welcome and sign-up, the three
 * onboarding screens, the bio's two tabs, the feed and what comes after it.
 * Copy is the file's, word for word, except where it named a sample person.
 */

const SARAH = "Sarah Anderson";
export const CASHIER: Job = {
  title: "Cashier",
  place: "STL Cafe",
  rating: "4.4",
  hours: "Full Time Job",
  days: "Weekdays",
  area: "Dade County",
  distance: "2.4 miles away",
  pay: "$25",
  photo: "/fortuna/reel/job-cashier-card.webp",
};

/* ---------- Getting in ---------- */

export function Welcome() {
  const option = (top: number, emoji: string, title: string, sub: string) => (
    <div style={abs({ left: 32, right: 32, top, height: 92, borderRadius: 10, background: "#fff", boxShadow: "0 4px 16px rgba(40,40,30,0.08)", display: "flex", alignItems: "center", gap: 18, padding: "0 22px" })}>
      <span style={{ fontSize: 30 }}>{emoji}</span>
      <span>
        <div style={t(17, 600)}>{title}</div>
        <div style={t(13, 400, C.grey)}>{sub}</div>
      </span>
    </div>
  );
  return (
    <Screen>
      <div style={abs({ left: 0, right: 0, top: 112, display: "flex", justifyContent: "center" })}>
        <Wordmark size={40} />
      </div>
      <Title top={196} center>
        Welcome to Fortuna!
      </Title>
      <Sub top={234} center>
        Choose an option to get started
      </Sub>
      {option(296, "💼", "Job Seeker", "I am looking for a job")}
      {option(408, "📋", "Employer", "I want to hire someone")}
      <div style={abs({ left: 0, right: 0, top: 584, textAlign: "center", ...t(13.5, 400, C.grey) })}>
        I have an activation code. <u style={{ color: C.ink }}>Activate Account.</u>
      </div>
      <div style={abs({ left: 0, right: 0, top: 640, textAlign: "center", ...t(13.5, 500), textDecoration: "underline" })}>I have an account. Log In</div>
    </Screen>
  );
}

function Keypad({ top }: { top: number }) {
  const keys = [
    ["1", ""],
    ["2", "ABC"],
    ["3", "DEF"],
    ["4", "GHI"],
    ["5", "JKL"],
    ["6", "MNO"],
    ["7", "PQRS"],
    ["8", "TUV"],
    ["9", "WXYZ"],
  ];
  return (
    <div style={abs({ left: 0, right: 0, top, bottom: 0, background: "#d2d5db", padding: "8px 6px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7, alignContent: "start" })}>
      {keys.map(([n, l]) => (
        <div key={n} style={{ height: 46, borderRadius: 5, background: "#fff", boxShadow: "0 1px 0 #898a8d", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={t(22, 400)}>{n}</span>
          <span style={{ ...t(8.5, 600), letterSpacing: "0.12em" }}>{l}</span>
        </div>
      ))}
      <div />
      <div style={{ height: 46, borderRadius: 5, background: "#fff", boxShadow: "0 1px 0 #898a8d", display: "grid", placeItems: "center", ...t(22, 400) }}>0</div>
    </div>
  );
}

export function PhoneNumber() {
  return (
    <Screen>
      <Back />
      <Title top={110}>Enter your phone number</Title>
      <Sub top={150}>We&apos;ll send a 6 digits code to your phone to verify your number for protection.</Sub>
      <Body top={228}>
        <Field label="Phone Number">
          <Input value="(305) 555-0142" prefix="+1" focus />
        </Field>
      </Body>
      <Button top={330}>Send Code</Button>
      <Keypad top={560} />
    </Screen>
  );
}

export function Location({ waitlist = false }: { waitlist?: boolean }) {
  return (
    <Screen>
      <Back />
      <Title top={94}>Enter a location to begin</Title>
      <Sub top={134}>We will use it to find jobs around you</Sub>
      <Body top={182}>
        <Input value={waitlist ? "Austin, TX, USA" : "Miami, FL, USA"} focus right={<Icon d={ICONS.pin} size={18} color={C.sage} />} />
      </Body>
      {!waitlist && (
        <div style={abs({ left: 24, right: 24, top: 236, borderRadius: 8, background: "#fff", boxShadow: "0 6px 18px rgba(40,40,30,0.1)", overflow: "hidden" })}>
          {["Miami, FL, USA", "Miami Beach, FL, USA", "Miami Gardens, FL, USA"].map((p, i) => (
            <div key={p} style={{ padding: "13px 14px", borderTop: i ? `1px solid ${C.line}` : "none", display: "flex", gap: 10, alignItems: "center", ...t(14, i ? 400 : 600) }}>
              <Icon d={ICONS.pin} size={16} color={C.sage} />
              {p}
            </div>
          ))}
        </div>
      )}
      {!waitlist && (
        <div style={abs({ left: 0, right: 0, top: 420, display: "flex", justifyContent: "center", opacity: 0.9 })}>
          <Spot kind="map" size={170} />
        </div>
      )}
      <Button top={737}>Save Location</Button>
      {waitlist && (
        <Sheet top={392}>
          <div style={abs({ left: 0, right: 0, top: 40, textAlign: "center", ...t(22, 600) })}>Coming to your area soon</div>
          <div style={abs({ left: 0, right: 0, top: 84, display: "flex", justifyContent: "center" })}>
            <Spot kind="map" size={130} />
          </div>
          <div style={abs({ left: 40, right: 40, top: 224, textAlign: "center", ...t(14.5, 400, C.grey), lineHeight: 1.45 })}>
            Join our waitlist to get notified when we launch in your area!
          </div>
          <Button top={300}>Join the Waitlist</Button>
          <div style={abs({ left: 0, right: 0, top: 368, textAlign: "center", ...t(14, 500), textDecoration: "underline" })}>Change Location</div>
        </Sheet>
      )}
    </Screen>
  );
}

/* ---------- Onboarding ---------- */

export function Onboard({ n }: { n: 1 | 2 | 3 }) {
  const page = {
    1: { title: "Complete Your Profile 📝", body: "Complete your profile and specify the types of jobs your interested in", spot: "profile" as const, cta: "Next" },
    2: { title: "Record Your Video Resume 📹", body: "Introduce yourself to potential employers and stand out from other candidates", spot: "camera" as const, cta: "Next" },
    3: { title: "Swipe to Apply 🎉", body: "Swipe right to apply for a job or left to dismiss it", spot: "cards" as const, cta: "I’m ready!" },
  }[n];
  return (
    <Screen>
      <Title top={140} center size={23}>
        {page.title}
      </Title>
      <div style={abs({ left: 0, right: 0, top: 230, display: "flex", justifyContent: "center" })}>
        <Spot kind={page.spot} size={230} />
      </div>
      <Sub top={500} center>
        {page.body}
      </Sub>
      <div style={abs({ left: 0, right: 0, top: 650, display: "flex", justifyContent: "center", gap: 8 })}>
        {[1, 2, 3].map((i) => (
          <span key={i} style={{ width: 8, height: 8, borderRadius: 4, background: i === n ? C.greenDark : "#cfd8d3" }} />
        ))}
      </div>
      <Button top={720}>{page.cta}</Button>
    </Screen>
  );
}

/** Home, before the bio is done: the nudge above the first card. */
export function HomeNudge() {
  return (
    <Screen>
      <AppChrome buttons />
      <div style={abs({ left: 29, top: 101, width: 317, height: 52, borderRadius: 8, border: `1px solid ${C.green}`, background: "#fff", display: "flex", alignItems: "center", gap: 12, padding: "0 14px 0 18px", boxSizing: "border-box", ...t(11.5, 400), lineHeight: 1.35 })}>
        <span style={{ fontSize: 18 }}>📝</span>
        <span>Complete your profile to have more success when applying for jobs</span>
      </div>
      <div style={abs({ left: 30, top: 166 })}>
        <BigCard job={CASHIER} />
      </div>
    </Screen>
  );
}

/* ---------- The bio ---------- */

function ProfileHead({ tab }: { tab: "profile" | "prefs" }) {
  return (
    <>
      <Back />
      <div style={abs({ left: W / 2 - 40, top: 62, width: 80, height: 80, borderRadius: "50%", background: "#d9ead0", overflow: "hidden" })}>
        <svg width="80" height="80" viewBox="0 0 86 86" aria-hidden="true">
          <circle cx="43" cy="34" r="15" fill={C.green} />
          <path d="M14 86c2-20 14-30 29-30s27 10 29 30z" fill={C.green} />
        </svg>
      </div>
      <div style={abs({ left: 0, right: 0, top: 154, textAlign: "center", ...t(22, 600) })}>{SARAH}</div>
      <div style={abs({ left: 0, right: 0, top: 196, height: 40, display: "flex", borderBottom: `1px solid ${C.line}` })}>
        <div style={{ flex: 1, textAlign: "center", ...t(14, tab === "profile" ? 600 : 400, tab === "profile" ? C.ink : C.soft), borderBottom: tab === "profile" ? `3px solid ${C.greenDark}` : "none" }}>Profile</div>
        <div style={{ flex: 1, textAlign: "center", ...t(14, tab === "prefs" ? 600 : 400, tab === "prefs" ? C.ink : C.soft), borderBottom: tab === "prefs" ? `3px solid ${C.greenDark}` : "none" }}>Job Preferences</div>
      </div>
    </>
  );
}

export function BioProfile({ video = false }: { video?: boolean }) {
  return (
    <Screen>
      <ProfileHead tab="profile" />
      <Body top={258}>
        <Field label="Full Name" gap={14}>
          <Input value={SARAH} />
        </Field>
        <Field label="Education" gap={14}>
          <Input value="Highschool Degree" right={<Chevron />} />
        </Field>
        <Label>Video Resume</Label>
        {video ? (
          <div style={{ position: "relative", height: 112, borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
            <Sarah still />
            <div style={abs({ left: 10, bottom: 8, height: 24, padding: "0 9px", borderRadius: 12, background: "rgba(20,30,27,0.6)", display: "flex", alignItems: "center", gap: 5, ...t(11, 600, "#fff") })}>
              <Icon d={ICONS.play} size={10} color="#fff" stroke={3} /> 00:54
            </div>
          </div>
        ) : (
          <div style={{ height: 112, borderRadius: 8, background: C.greenTint, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
            <Icon d="M12 16V4M7 9l5-5 5 5M4 15v5h16v-5" size={26} color={C.sage} stroke={2} />
            <span style={t(12.5, 500, C.sage)}>Upload Video Resume</span>
          </div>
        )}
        <Field label="About Me" gap={14}>
          <Input height={74} value="Receptionist for four years. Quick to learn, and great with people." />
        </Field>
        <Label>Attributes</Label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Chip>Dedicated</Chip>
          <Chip>Loyal</Chip>
          <span style={{ marginLeft: "auto", ...t(12, 700), textDecoration: "underline" }}>EDIT</span>
        </div>
      </Body>
    </Screen>
  );
}

export function BioPrefs({ wage = "$16" }: { wage?: string }) {
  return (
    <Screen>
      <ProfileHead tab="prefs" />
      <Body top={256} gap={16}>
        <Card style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", ...t(14, 600) }}>
          Location <span style={t(14, 400)}>Miami, Florida</span>
        </Card>
        <Card style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, ...t(14, 600) }}>
            Maximum Distance <span style={t(14, 400)}>10 mi.</span>
          </div>
          <Slider at={0.28} />
        </Card>
        <Card style={{ padding: "14px 16px" }}>
          <div style={{ ...t(14, 600), marginBottom: 12 }}>Industry Preference</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Chip on={false}>🛒 Retail</Chip>
            <Chip on={false}>🍽️ Food Service</Chip>
            <span style={{ marginLeft: "auto", ...t(12, 700), textDecoration: "underline" }}>EDIT</span>
          </div>
        </Card>
        <Card style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={t(14, 600)}>Work Availability</div>
          <Radio label="Full-time" />
          <Radio label="Part-time" on />
          <Radio label="Mornings" on />
        </Card>
        <Card style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, ...t(14, 600) }}>
            Wage Preference (Min.) <span style={t(14, 400)}>{wage}</span>
          </div>
          <Slider at={wage === "No Preference" ? 0 : 0.34} />
        </Card>
      </Body>
    </Screen>
  );
}

export function Attributes() {
  const all = ["Dedicated", "Loyal", "Punctual", "Self-Manageable", "Friendly", "Organized", "Fast Learner", "Team Player", "Patient", "Driven", "Honest", "Creative"];
  const on = new Set(["Dedicated", "Loyal", "Fast Learner", "Friendly"]);
  return (
    <Screen>
      <Close />
      <Title top={96}>Attributes</Title>
      <div style={abs({ left: 24, right: 24, top: 150, display: "flex", flexWrap: "wrap", gap: 10 })}>
        {all.map((a) => (
          <Chip key={a} on={on.has(a)}>
            {a}
          </Chip>
        ))}
      </div>
      <div style={abs({ left: 24, top: 330, ...t(13, 500, C.grey) })}>4 selected</div>
      <Button top={720}>Save</Button>
    </Screen>
  );
}

/* ---------- The feed, and after ---------- */

export function Home() {
  return (
    <Screen>
      <AppChrome buttons profileDone />
      <div style={abs({ left: 30, top: 123 })}>
        <BigCard job={CASHIER} />
      </div>
    </Screen>
  );
}

/** Out of swipes for the day. */
export function SwipeLimit() {
  return (
    <Screen>
      <AppChrome buttons={false} profileDone />
      <div style={abs({ left: 30, top: 123, opacity: 0.5 })}>
        <BigCard job={CASHIER} />
      </div>
      <div style={{ ...BUTTON, top: 677, left: 98, background: "#ff8989", opacity: 0.5 }}>
        <CrossIcon />
      </div>
      <div style={{ ...BUTTON, top: 677, left: 214, background: "#ade495", opacity: 0.5 }}>
        <TickIcon />
      </div>
      <Modal top={226} height={340}>
        <div style={{ margin: "34px 30px 0", ...t(21, 600), lineHeight: 1.25 }}>You&apos;ve reached your application limit today</div>
        <div style={{ display: "flex", justifyContent: "center", margin: "18px 0 6px" }}>
          <Spot kind="clipboard" size={110} />
        </div>
        <Button top={274} left={52} width={196} height={44}>
          Wait until tomorrow
        </Button>
      </Modal>
    </Screen>
  );
}

export function MyApplications() {
  const rows: { job: string; place: string; pay: string; hours: string; status: "Connected" | "Submitted" }[] = [
    { job: "Store Associate", place: "Jonathan’s Grocery", pay: "$16.00", hours: "Part-time · Weekends", status: "Connected" },
    { job: "Cashier", place: "STL Cafe", pay: "$25.00", hours: "Full-time · Weekdays", status: "Submitted" },
    { job: "Package Clerk", place: "St. Thomas University", pay: "$21.00", hours: "Full-time · Weekdays", status: "Submitted" },
    { job: "Crew", place: "Trader Joe’s", pay: "$19.00", hours: "Full-time · Weekdays", status: "Submitted" },
  ];
  return (
    <Screen>
      <Back />
      <Title top={96}>My Applications</Title>
      <div style={abs({ left: 24, right: 24, top: 150, display: "flex", flexDirection: "column", gap: 14 })}>
        {rows.map((r) => (
          <Card key={r.job} style={{ padding: "16px 18px", border: r.status === "Connected" ? `1.5px solid ${C.green}` : "1.5px solid transparent" }}>
            <div style={t(17, 600)}>{r.job}</div>
            <div style={{ ...t(13, 400, C.grey), marginTop: 2 }}>{r.place}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  borderRadius: 4,
                  background: r.status === "Connected" ? C.greenDark : C.greenTint,
                  ...t(11.5, 700, r.status === "Connected" ? "#fff" : C.forest),
                }}
              >
                <Icon d={ICONS.check} size={12} color={r.status === "Connected" ? "#fff" : C.forest} stroke={3} />
                {r.status}
              </span>
              <span style={t(15, 600)}>{r.pay}</span>
            </div>
            <div style={{ ...t(12, 400, C.soft), marginTop: 6 }}>{r.hours}</div>
          </Card>
        ))}
      </div>
    </Screen>
  );
}

/** The email that tells her she's been connected, on her phone. */
export function ConnectedEmail() {
  const slot = (day: string, time: string) => (
    <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 6, background: "#fff", border: `1px solid ${C.line}`, ...t(13.5, 500) }}>
      <Icon d={ICONS.cal} size={16} color={C.sage} />
      {day}
      <span style={{ marginLeft: "auto", ...t(13.5, 400, C.grey) }}>{time}</span>
    </div>
  );
  return (
    <Screen bg={C.creamDeep}>
      <div style={abs({ left: 0, right: 0, top: 54, height: 40, display: "flex", alignItems: "center", gap: 10, padding: "0 20px", ...t(13, 500, C.grey) })}>
        <Icon d="M15 6l-6 6 6 6" size={20} color="#2f7bf6" />
        <span style={{ color: "#2f7bf6" }}>Inbox</span>
      </div>
      <div style={abs({ left: 16, right: 16, top: 104, bottom: 0, background: "#fff", borderRadius: "12px 12px 0 0", padding: "26px 22px", boxSizing: "border-box" })}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Wordmark size={24} />
        </div>
        <div style={{ ...t(22, 600), textAlign: "center", marginTop: 26 }}>Congratulations! 🎉</div>
        <div style={{ ...t(14, 400, C.grey), textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
          You have been connected through Fortuna for the position of <b style={{ color: C.ink }}>Store Associate</b> at <b style={{ color: C.ink }}>Jonathan’s Grocery</b>.
        </div>
        <div style={{ ...t(12, 700, C.greenDark), letterSpacing: "0.08em", marginTop: 26, marginBottom: 10 }}>IN PERSON INTERVIEW</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {slot("Mon, Mar 14", "10:30 AM")}
          {slot("Tue, Mar 15", "2:00 PM")}
        </div>
        <div style={{ marginTop: 26, ...t(13, 400, C.grey), textAlign: "center" }}>Have a great day,</div>
        <div style={{ ...t(13, 600), textAlign: "center" }}>Fortuna</div>
      </div>
    </Screen>
  );
}
