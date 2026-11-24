import type { ReactNode } from "react";
import { Sarah } from "../swipe/VideoResumeDemo";
import {
  abs,
  Avatar,
  Back,
  Body,
  Button,
  C,
  Card,
  Chevron,
  Chip,
  EmployerTabs,
  Field,
  FitBadge,
  Icon,
  ICONS,
  Input,
  Label,
  Modal,
  Radio,
  Screen,
  Sheet,
  Spot,
  StatusBar,
  StepTag,
  Sub,
  t,
  Title,
  W,
  Wordmark,
  type FitLevel,
} from "./kit";

/**
 * The employer's screens, from New Colors and the wireframes: Jonathan
 * posting a job at his grocery and getting from a shortlist to a
 * conversation. Copy is the file's; the people and the business are the case
 * study's stand-ins.
 */

const JOB = { title: "Store Associate", hours: "Part-time", days: "Weekends", pay: "$16.00", ends: "Post Ends: 7 days" };
const APPLICANTS: { name: string; age: number; fit: FitLevel; tone: string }[] = [
  { name: "Sarah Anderson", age: 31, fit: "best", tone: C.sage },
  { name: "Marcus Bell", age: 27, fit: "good", tone: "#8c7a5b" },
  { name: "Elena Ruiz", age: 44, fit: "questionable", tone: "#7a8fa6" },
];

function Header({ title, filter = true }: { title: string; filter?: boolean }) {
  return (
    <>
      <div style={abs({ left: 24, top: 52, ...t(26, 600) })}>{title}</div>
      {filter && (
        <div style={abs({ right: 24, top: 60, display: "flex", alignItems: "center", gap: 6, ...t(12, 700), letterSpacing: "0.06em" })}>
          <Icon d={ICONS.filter} size={16} />
          FILTER
        </div>
      )}
    </>
  );
}

function SectionCaps({ children, top }: { children: ReactNode; top: number }) {
  return <div style={abs({ left: 24, top, ...t(11.5, 700, C.grey), letterSpacing: "0.1em" })}>{children}</div>;
}

function JobSummary({ top = 96 }: { top?: number }) {
  return (
    <div style={abs({ left: 0, right: 0, top: 0, height: top + 150, background: "#fff", borderBottom: `1px solid ${C.line}` })}>
      <Back />
      <div style={abs({ left: 24, top, ...t(24, 600) })}>{JOB.title}</div>
      <div style={abs({ left: 24, top: top + 46, display: "flex", flexDirection: "column", gap: 8, ...t(13.5, 400, C.grey) })}>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Icon d={ICONS.clock} size={16} color={C.grey} /> {JOB.hours}
        </span>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Icon d={ICONS.cal} size={16} color={C.grey} /> {JOB.days}
        </span>
      </div>
      <div style={abs({ right: 24, top: top + 48, textAlign: "right" })}>
        <div style={t(10.5, 700, C.grey)}>HOURLY</div>
        <div style={t(26, 600)}>{JOB.pay}</div>
      </div>
      <div style={abs({ left: 24, top: top + 112, ...t(12.5, 500, C.greenDark) })}>{JOB.ends}</div>
    </div>
  );
}

/* ---------- Another way in ---------- */

/** The email Fortuna sent to businesses it saw hiring, before they'd signed up. */
export function GhostEmail() {
  return (
    <Screen bg="#f2f0eb">
      <div style={abs({ left: 0, right: 0, top: 58, display: "flex", justifyContent: "center" })}>
        <Wordmark size={22} />
      </div>
      <div style={abs({ left: 36, right: 36, top: 100, textAlign: "center", fontFamily: "var(--f-display)", fontSize: 20, lineHeight: 1.2, color: C.forest })}>
        The <span style={{ color: C.orange }}>fastest</span> way to hire the right people in your community
      </div>
      <div style={abs({ left: 16, right: 16, top: 178, bottom: 0, background: "#fff", borderRadius: "10px 10px 0 0", padding: "22px 20px", boxSizing: "border-box", textAlign: "center" })}>
        <div style={t(16, 700)}>We have great candidates for you 🎉</div>
        <div style={{ ...t(12.5, 400, C.grey), marginTop: 8, lineHeight: 1.45 }}>
          We noticed you are looking for a new employee to fill the position of <b style={{ color: C.ink }}>Store Associate</b> and have found some great potential employees that fit your needs.
        </div>
        <div style={{ ...t(13.5, 700), marginTop: 18 }}>Meet Your Candidates</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          {[...APPLICANTS, { name: "Dev Patel", tone: "#9a7d8d" }].map((a) => (
            <div key={a.name} style={{ border: `1.5px solid ${C.greenLight}`, borderRadius: 6, padding: "12px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
              <Avatar name={a.name} size={40} tone={a.tone} />
              <span style={t(11.5, 600)}>{a.name}</span>
            </div>
          ))}
        </div>
        <div style={{ ...t(12, 500, C.grey), marginTop: 18 }}>To connect with them, follow these 2 steps</div>
        <div style={{ background: C.creamDeep, borderRadius: 6, padding: "12px 14px", marginTop: 10 }}>
          <div style={t(10.5, 700, C.grey)}>STEP 1</div>
          <div style={{ margin: "8px auto 0", width: 180, height: 32, borderRadius: 16, background: C.green, display: "grid", placeItems: "center", ...t(12.5, 600, "#fff") }}>Download The App</div>
        </div>
        <div style={{ background: C.creamDeep, borderRadius: 6, padding: "12px 14px", marginTop: 8 }}>
          <div style={t(10.5, 700, C.grey)}>STEP 2</div>
          <div style={{ ...t(12, 400, C.grey), marginTop: 6 }}>Activate your account using your email and this code</div>
          <div style={{ ...t(18, 700), letterSpacing: "0.4em", marginTop: 6 }}>AJ1S</div>
        </div>
      </div>
    </Screen>
  );
}

/* ---------- Post a job ---------- */

export function JobsEmpty() {
  return (
    <Screen>
      <Header title="Job Posts" />
      <div style={abs({ left: 0, right: 0, top: 280, textAlign: "center", fontSize: 54 })}>😎</div>
      <div style={abs({ left: 0, right: 0, top: 358, textAlign: "center", ...t(21, 600) })}>Start by posting a job!</div>
      <Sub top={398} center>
        You have no ongoing job posts. Tap below to start hiring
      </Sub>
      <Button top={490} left={88} width={200} height={46}>
        + Add New Job
      </Button>
      <EmployerTabs on="jobs" />
    </Screen>
  );
}

export function PostStep1() {
  return (
    <Screen>
      <Back />
      <Title top={90}>Create Job Post</Title>
      <StepTag top={132}>STEP 1 / 2</StepTag>
      <Sub top={154}>Enter your job’s information. This information will be available to job seekers.</Sub>
      <Body top={222}>
        <Field label="Job Title*" gap={14}>
          <Input value={JOB.title} />
        </Field>
        <Field label="Hourly Wage*" gap={14}>
          <Input value="16" prefix="$" focus />
          <div style={{ ...t(11.5, 400, C.grey), marginTop: 6 }}>The minimum wage allowed is $10.00</div>
        </Field>
        <Field label="Job Description*" gap={14}>
          <Input height={84} value="Help keep the store running on busy weekends: deliveries, restocking, the register." />
        </Field>
        <Label>Work Availability*</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          <Radio label="Full-time" />
          <Radio label="Part-time" on />
          <div style={{ display: "flex", gap: 8, paddingLeft: 32 }}>
            <Chip small on={false}>
              Mornings
            </Chip>
            <Chip small on={false}>
              Nights
            </Chip>
            <Chip small>Weekends</Chip>
          </div>
        </div>
        <Field label="Post Duration*" gap={0}>
          <Input value="1 Week" right={<Chevron />} />
        </Field>
      </Body>
      <Button top={742} left={24} width={154} height={46} kind="light">
        Cancel
      </Button>
      <Button top={742} left={197} width={154} height={46}>
        Continue
      </Button>
    </Screen>
  );
}

export function PostStep2() {
  return (
    <Screen>
      <Back />
      <Title top={90}>Candidate Preferences</Title>
      <StepTag top={132}>STEP 2 / 2</StepTag>
      <Sub top={154}>Set your preferences to let us know exactly what candidates you’re looking for.</Sub>
      <Body top={222}>
        <Field label="Amount Of Candidates Needed*" gap={14}>
          <Input value="3" right={<Chevron />} focus />
          <div style={{ ...t(11.5, 400, C.grey), marginTop: 6 }}>Select the number of candidates to choose from</div>
        </Field>
        <Field label="Education Level*" gap={14}>
          <Input value="No preference" right={<Chevron />} />
        </Field>
        <Field label="Industry Experience*" gap={14}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Chip on={false}>🛒 Retail</Chip>
            <span style={{ marginLeft: "auto", ...t(12, 700), textDecoration: "underline" }}>EDIT</span>
          </div>
        </Field>
        <Field label="Years Of Experience*" gap={14}>
          <Input value="No preference" right={<Chevron />} />
          <div style={{ ...t(11.5, 400, C.grey), marginTop: 6 }}>How many years of relevant experience do you require?</div>
        </Field>
        <Label>Candidate’s Attributes*</Label>
        <div style={{ display: "flex", gap: 8 }}>
          <Chip>Dependable</Chip>
          <Chip>Punctual</Chip>
        </div>
      </Body>
      <Button top={742} left={24} width={154} height={46} kind="light">
        Cancel
      </Button>
      <Button top={742} left={197} width={154} height={46}>
        Post
      </Button>
    </Screen>
  );
}

export function Posted() {
  return (
    <Screen>
      <div style={abs({ left: 0, right: 0, top: 150, textAlign: "center", ...t(25, 600) })}>Your job was posted!</div>
      <div style={abs({ left: 0, right: 0, top: 214, display: "flex", justifyContent: "center" })}>
        <Spot kind="newspaper" size={190} />
      </div>
      <Sub top={420} center>
        Candidates are applying to your job as we speak! Sit back while we pick the best ones for you.
      </Sub>
      <Button top={520} left={100} width={175} height={46}>
        Thanks!
      </Button>
    </Screen>
  );
}

export function Picking() {
  return (
    <Screen bg={C.cream}>
      <JobSummary />
      <div style={abs({ left: 0, right: 0, top: 330, display: "flex", justifyContent: "center" })}>
        <Spot kind="folder" size={150} />
      </div>
      <div style={abs({ left: 40, right: 40, top: 494, textAlign: "center", ...t(19, 600) })}>We are picking the best candidates for you</div>
      <Sub top={556} center>
        You will see the best applicants for this position here shortly.
      </Sub>
      <div style={abs({ left: 0, right: 0, top: 722, textAlign: "center", ...t(14, 600, C.red) })}>Delete Job</div>
    </Screen>
  );
}

export function Applicants() {
  return (
    <Screen>
      <JobSummary />
      <SectionCaps top={268}>APPLICANTS</SectionCaps>
      <div style={abs({ right: 24, top: 266, ...t(13, 700, C.greenDark) })}>3/3</div>
      <div style={abs({ left: 24, right: 24, top: 298, display: "flex", flexDirection: "column", gap: 14 })}>
        {APPLICANTS.map((a, i) => (
          <Card key={a.name} style={{ display: "flex", gap: 14, alignItems: "center", padding: "16px 16px", border: i === 0 ? `1.5px solid ${C.green}` : "1.5px solid transparent" }}>
            <Avatar name={a.name} size={56} tone={a.tone} />
            <div style={{ flex: 1 }}>
              <div style={t(16.5, 600)}>{a.name}</div>
              <div style={{ ...t(12.5, 400, C.grey), marginTop: 3 }}>{a.age} years old</div>
              <div style={{ ...t(12.5, 400, C.grey) }}>Highschool Degree</div>
              <div style={{ marginTop: 9 }}>
                <FitBadge fit={a.fit} />
              </div>
            </div>
            <Icon d="M9 6l6 6-6 6" size={18} color={C.soft} />
          </Card>
        ))}
      </div>
      <div style={abs({ left: 0, right: 0, top: 740, textAlign: "center", ...t(14, 600, C.red) })}>Delete Job</div>
    </Screen>
  );
}

function CandidateTop() {
  return (
    <>
      <Back />
      <div style={abs({ left: W / 2 - 38, top: 58 })}>
        <Avatar name="Sarah Anderson" size={76} />
      </div>
      <div style={abs({ left: 0, right: 0, top: 146, textAlign: "center", ...t(22, 600) })}>Sarah Anderson</div>
      <div style={abs({ left: 0, right: 0, top: 180, display: "flex", justifyContent: "center" })}>
        <FitBadge fit="best" />
      </div>
    </>
  );
}

function InfoRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div>
      <div style={t(12, 600, C.grey)}>{k}</div>
      <div style={{ ...t(14, 400), marginTop: 3 }}>{v}</div>
    </div>
  );
}

export function Candidate() {
  return (
    <Screen>
      <CandidateTop />
      <div style={abs({ left: 0, right: 0, top: 224, height: 44, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", ...t(11.5, 700), letterSpacing: "0.1em" })}>
        CANDIDATE INFO <Chevron />
      </div>
      <div style={abs({ left: 24, right: 24, top: 286, display: "flex", flexDirection: "column", gap: 14 })}>
        <InfoRow k="Education" v="Highschool degree" />
        <InfoRow k="About Me" v="Receptionist for four years. Quick to learn, and great with people." />
        <InfoRow k="Work Availability" v="Part-time: Weekends" />
        <div>
          <div style={t(12, 600, C.grey)}>Attributes</div>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <Chip small>Dedicated</Chip>
            <Chip small>Loyal</Chip>
            <Chip small>Friendly</Chip>
          </div>
        </div>
        <div>
          <div style={t(12, 600, C.grey)}>Work History</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, ...t(14, 600) }}>
            Receptionist <span style={t(13, 400, C.grey)}>4 Years</span>
          </div>
          <div style={t(12.5, 400, C.grey)}>🗄️ Administration</div>
        </div>
      </div>
      <div style={abs({ left: 0, right: 0, top: 590, height: 44, borderTop: `1px solid ${C.line}`, display: "flex", alignItems: "center", padding: "0 24px", ...t(11.5, 700), letterSpacing: "0.1em" })}>VIDEO RESUME</div>
      <div style={abs({ left: 24, right: 24, top: 634, height: 76, borderRadius: 8, overflow: "hidden" })}>
        <Sarah still />
        <div style={abs({ left: 10, bottom: 8, height: 24, padding: "0 9px", borderRadius: 12, background: "rgba(20,30,27,0.6)", display: "flex", alignItems: "center", gap: 5, ...t(11, 600, "#fff") })}>
          <Icon d={ICONS.play} size={10} color="#fff" stroke={3} /> 00:54
        </div>
      </div>
      <Button top={734}>Contact</Button>
    </Screen>
  );
}

export function VideoPlayer() {
  return (
    <div style={{ position: "relative", width: W, height: 812, overflow: "hidden", background: "#000" }}>
      <Sarah />
      <StatusBar light />
      <svg style={{ position: "absolute", right: 22, top: 54 }} width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div style={abs({ left: 0, right: 0, top: 640, bottom: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.55))" })} />
      <div style={abs({ left: 24, top: 720 })}>
        <Icon d="M7 5h3v14H7zM14 5h3v14h-3z" size={20} color="#fff" stroke={2.4} />
      </div>
      <div style={abs({ left: 56, right: 24, top: 729, height: 5, borderRadius: 3, background: "#aec6ba" })}>
        <div style={{ width: "42%", height: 5, borderRadius: 3, background: C.greenDark }} />
      </div>
      <div style={abs({ right: 24, top: 746, ...t(12, 400, "#fff") })}>00:23 / 00:54</div>
    </div>
  );
}

function ScheduleFields({ filled }: { filled: boolean }) {
  const opts = filled
    ? [
        ["03/14/2022", "10:30 AM"],
        ["03/15/2022", "02:00 PM"],
      ]
    : [["mm/dd/yyyy", "hh:mm"]];
  return (
    <div style={abs({ left: 24, right: 24, top: 120, display: "flex", flexDirection: "column", gap: 14 })}>
      <div>
        <Label>Interview Type</Label>
        <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: `1.5px solid ${C.greenDark}` }}>
          {["In Person", "Phone Call"].map((k, i) => {
            const on = filled && i === 0;
            return (
              <div key={k} style={{ flex: 1, height: 40, display: "grid", placeItems: "center", background: on ? C.greenDark : "#fff", ...t(14, 600, on ? "#fff" : C.greenDark) }}>
                {k}
              </div>
            );
          })}
        </div>
      </div>
      {opts.map(([d, tm], i) => (
        <div key={i} style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1.4 }}>
            <Label>Date</Label>
            <Input value={filled ? d : undefined} placeholder={d} right={<Icon d={ICONS.cal} size={16} color={C.sage} />} />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Time (ET)</Label>
            <Input value={filled ? tm : undefined} placeholder={tm} />
          </div>
        </div>
      ))}
      <div style={{ ...t(13, 700, C.greenDark), letterSpacing: "0.04em" }}>+ ADD OPTION</div>
    </div>
  );
}

export function Schedule({ filled = false }: { filled?: boolean }) {
  return (
    <Screen>
      <CandidateTop />
      <Sheet top={filled ? 286 : 360}>
        <div style={abs({ left: 24, top: 34, ...t(21, 600) })}>Schedule Interview</div>
        <div style={abs({ left: 24, right: 24, top: 70, ...t(13, 400, C.grey), lineHeight: 1.4 })}>Choose your interview type and at least one possible date and time.</div>
        <ScheduleFields filled={filled} />
        <Button top={filled ? 432 : 358}>Confirm</Button>
      </Sheet>
    </Screen>
  );
}

export function Connected() {
  return (
    <Screen>
      <CandidateTop />
      <Modal top={236} height={368}>
        <div style={{ margin: "34px 30px 0", ...t(23, 600), lineHeight: 1.2 }}>You’ve been connected!</div>
        <div style={{ display: "flex", justifyContent: "center", margin: "14px 0 4px" }}>
          <Spot kind="envelope" size={130} />
        </div>
        <div style={{ margin: "0 30px", ...t(14, 400, C.grey), lineHeight: 1.45 }}>
          We sent Sarah’s contact information to <span style={{ color: C.ink }}>jonathan@example.com</span>
        </div>
        <Button top={296} left={52} width={196} height={44}>
          Thanks!
        </Button>
      </Modal>
    </Screen>
  );
}

export function Candidates() {
  return (
    <Screen>
      <Header title="Candidates" />
      <SectionCaps top={116}>LATEST CONNECTIONS</SectionCaps>
      <div style={abs({ left: 24, right: 24, top: 146, display: "flex", flexDirection: "column", gap: 14 })}>
        {[
          { name: "Sarah Anderson", job: "Store Associate", fit: "best" as const, tone: C.sage },
          { name: "Luis Romero", job: "Cashier", fit: "good" as const, tone: "#8c7a5b" },
          { name: "Grace Kim", job: "Store Associate", fit: "good" as const, tone: "#7a8fa6" },
        ].map((c, i) => (
          <Card key={c.name} style={{ padding: "16px", border: i === 0 ? `1.5px solid ${C.green}` : "1.5px solid transparent" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={t(16, 600)}>{c.name}</div>
                <div style={{ ...t(12.5, 400, C.grey), marginTop: 3 }}>Applying for {c.job}</div>
              </div>
              <Avatar name={c.name} size={50} tone={c.tone} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
              <FitBadge fit={c.fit} />
              <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                {[ICONS.mail, ICONS.phone].map((d) => (
                  <span key={d} style={{ width: 32, height: 32, borderRadius: 6, background: C.greenDark, display: "grid", placeItems: "center" }}>
                    <Icon d={d} size={16} color="#fff" />
                  </span>
                ))}
              </span>
            </div>
          </Card>
        ))}
      </div>
      <EmployerTabs on="candidates" />
    </Screen>
  );
}

/* ---------- Before: the interview era, as the wireframes had it ---------- */

export function WireCreateInterview() {
  return (
    <Screen wire>
      <Back />
      <Title top={90}>Create Interview</Title>
      <StepTag top={132}>STEP 3 / 3</StepTag>
      <Sub top={154}>Create the interview you will be sending to the selected candidates.</Sub>
      <Body top={222}>
        <Label>Question 1*</Label>
        <Input placeholder="Select a question" right={<Chevron />} focus />
        <div style={{ borderRadius: 6, background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,0.12)", marginTop: 6, overflow: "hidden" }}>
          {["Why are you interested in working at Jonathan’s Grocery?", "What are your strengths?", "What are your weaknesses?", "Why should we hire you?"].map((q, i) => (
            <div key={q} style={{ padding: "13px 14px", borderTop: i ? "1px solid #e6e6e6" : "none", ...t(13.5, 400) }}>
              {q}
            </div>
          ))}
        </div>
        <div style={{ ...t(13, 700), marginTop: 18 }}>+ ADD QUESTION</div>
      </Body>
      <Button top={720}>Post</Button>
    </Screen>
  );
}

export function WireMyInterviews() {
  const rows = [
    ["Store Associate", "Jonathan’s Grocery", "$16.00"],
    ["Cashier", "STL Cafe", "$25.00"],
    ["Crew", "Trader Joe’s", "$19.00"],
  ];
  return (
    <Screen wire>
      <Back />
      <Title top={96}>My Interviews</Title>
      <SectionCaps top={150}>NEW INTERVIEWS</SectionCaps>
      <div style={abs({ left: 24, right: 24, top: 180, display: "flex", flexDirection: "column", gap: 14 })}>
        {rows.map(([j, p, pay]) => (
          <Card key={j} style={{ padding: "16px 18px", border: "1.5px solid #222" }}>
            <div style={t(18, 600)}>{j}</div>
            <div style={{ ...t(13, 400, C.grey), marginTop: 2 }}>{p}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
              <span style={t(15, 600)}>{pay}</span>
              <span style={{ padding: "6px 12px", borderRadius: 5, background: "#222", ...t(12, 600, "#fff") }}>Send your response!</span>
            </div>
          </Card>
        ))}
      </div>
    </Screen>
  );
}

export function WirePlayAnswer() {
  return (
    <Screen wire>
      <Back />
      <div style={abs({ left: W / 2 - 38, top: 58, width: 76, height: 76, borderRadius: "50%", background: "#cfcfcf" })} />
      <div style={abs({ left: 0, right: 0, top: 146, textAlign: "center", ...t(22, 600) })}>Sarah Anderson</div>
      <div style={abs({ left: 0, right: 0, top: 200, height: 44, borderTop: "1px solid #e0e0e0", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", ...t(11.5, 700), letterSpacing: "0.1em" })}>
        CANDIDATE INFO <Chevron />
      </div>
      <div style={abs({ left: 0, right: 0, top: 244, height: 44, borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", padding: "0 24px", ...t(11.5, 700), letterSpacing: "0.1em" })}>INTERVIEW</div>
      <div style={abs({ left: 24, right: 24, top: 312, display: "flex", flexDirection: "column", gap: 16 })}>
        {["1. Why are you interested in working at Jonathan’s Grocery?", "2. What are your strengths?", "3. Why should we hire you?"].map((q) => (
          <div key={q}>
            <div style={t(14, 600)}>{q}</div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8, padding: "7px 14px", borderRadius: 5, background: "#222", ...t(13, 600, "#fff") }}>
              <Icon d={ICONS.play} size={12} color="#fff" stroke={3} /> Play Answer
            </span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

export function WireInterviewSent() {
  return (
    <Screen wire>
      <JobSummary />
      <div style={abs({ left: 24, right: 24, top: 298, display: "flex", flexDirection: "column", gap: 14 })}>
        {APPLICANTS.map((a) => (
          <Card key={a.name} style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#cfcfcf" }} />
            <div>
              <div style={t(16.5, 600)}>{a.name}</div>
              <div style={{ marginTop: 8 }}>
                <FitBadge fit={a.fit} />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Modal top={230} height={360}>
        <div style={{ margin: "34px 30px 0", ...t(23, 600) }}>Interview sent!</div>
        <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 4px" }}>
          <Spot kind="clipboard" size={120} />
        </div>
        <div style={{ margin: "0 34px", ...t(14, 400, C.grey), lineHeight: 1.45 }}>
          You can interview <b style={{ color: C.ink }}>2 more candidates</b> for this position. Pick wisely!
        </div>
        <Button top={290} left={52} width={196} height={44}>
          Got it!
        </Button>
      </Modal>
    </Screen>
  );
}
