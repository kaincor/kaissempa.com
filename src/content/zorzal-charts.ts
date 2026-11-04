/**
 * The data behind the Zorzal case study's charts, redrawn from the team's own
 * planning documents (sources noted on each). Kept apart from the prose so
 * either can be rewritten without touching the other.
 */

/** Planned vs actual. Plan: the 20-week work plan in our Design Assessment.
 *  Actual: dates from the team's meeting notes. */
export const TIMELINE: { when: string; plan: string; actual: string; mark?: boolean }[] = [
  { when: "Winter · wk 1–3", plan: "React onboarding, brainstorm, wireframes", actual: "Kickoff (Jan 7). A call with Austin and Mark, who built the app (Jan 20)" },
  { when: "wk 5", plan: "Wireframes to Chuck for feedback", actual: "Emails to Chuck. No call", mark: true },
  { when: "wk 6–8", plan: "Start the mobile transition. Risk register", actual: "Wireframe review and risk register. Kristy's first Spanish commit (Feb 16). The TA critique (Feb 24)" },
  { when: "wk 9–10", plan: "“Well-defined criticisms from Zorzal”", actual: "Our winter slides: “Haven't talked to Chuck at all this quarter” (Mar 2)" },
  { when: "Spring · wk 12", plan: "Build", actual: "The first call with Chuck (Apr 8). We decide to modify (Apr 12)", mark: true },
  { when: "wk 16–18", plan: "Prototype to the client", actual: "Export to Google Sheets ships (May 18)" },
  { when: "wk 20", plan: "A thoroughly tested product", actual: "Final design review, then the final report (Jun 5)" },
];

/** ENERGY 177A Zorzal Risk Register.xlsx: the register we inherited and
 *  extended. Score = probability × impact, in dollars a year. */
export const RISKS: { risk: string; score: number; worker?: boolean }[] = [
  { risk: "Upsetting the status quo: shipments back up for a week", score: 750, worker: true },
  { risk: "Training time: four hours each, for ten people", score: 500, worker: true },
  { risk: "Slowing workers down", score: 375, worker: true },
  { risk: "Misrepresented data leads to bad decisions", score: 250 },
  { risk: "The value lands in the wrong place", score: 250 },
  { risk: "It breaks in the future", score: 250 },
  { risk: "It costs more than the value it adds", score: 250 },
  { risk: "No one can maintain it after we leave", score: 200 },
];
export const RISK_TOTAL = { count: 21, perYear: 4040 };

/** Spring Final Report, Fig. 4, and the shipped prototype. */
export const TAPS = {
  redesign: ["Home", "Record", "Fermentation", "Create Box"],
  shipped: ["Record (where it opens)", "Fermentación → Create Box"],
};

/** Prototype Eval.docx: the three core tasks and what went wrong in each. */
export const TESTS: { task: string; outcome: "Detour" | "Mix-up"; note: string }[] = [
  { task: "Create a box in fermentation", outcome: "Detour", note: "Went to Search first: “I would assume that you can search for fermentation.”" },
  { task: "Create a lot in the warehouse", outcome: "Mix-up", note: "Quick, but “Add to Lot” and “Create Lot” were a coin flip." },
  { task: "Fill out the FCCI form", outcome: "Detour", note: "Went to Settings first. The forms were in a separate bucket." },
];

/** Retool Evaluation.docx. */
export const RETOOL = {
  pros: ["A barcode scanner built in", "Some Firebase support"],
  cons: [
    { group: "Architecture", text: "One app per checkpoint and sub-checkpoint, with data passed through URLs and separate desktop and mobile versions" },
    { group: "Data", text: "Unclear data handling and sync, and Zorzal depends on Retool staying up" },
    { group: "Fit", text: "Built for internal tools, so no customer-facing future. JavaScript-heavy, so Chuck couldn't configure it" },
    { group: "Cost", text: "A monthly fee, and it throws away the previous teams' work" },
  ],
};

/** Bill of Materials.xlsx (our year), Project Budget.xlsx (the year before),
 *  Partner Call 1 (commercial agtech). */
export const BUDGET = {
  cap: 1000,
  spent: 67.1,
  items: [
    { label: "Barcode labels", amount: 13.9 },
    { label: "Firebase, just in case", amount: 50 },
    { label: "Figma, VS Code, a React course", amount: 0 },
    { label: "Tax", amount: 3.2 },
  ],
  compare: [
    { label: "The year before us: scanner, label printer, tablet", amount: "$737" },
    { label: "Commercial agtech", amount: "six figures a year" },
  ],
};

/** Meeting notes, 4/7/22 (our ranked questions for Chuck) and 4/12/22 (what
 *  he said). */
export const PRIORITIES: { ours: string; after: string; kept?: boolean }[] = [
  { ours: "A flexible, configurable codebase", after: "Dropped. His checkpoints weren't changing" },
  { ours: "Mobile responsiveness", after: "Kept. It was the whole job", kept: true },
  { ours: "A consumer-facing interface", after: "Handed to the next team" },
  { ours: "Something new", after: "One button: Export to Google Sheets", kept: true },
  { ours: "Better search", after: "—" },
];

/** AKTry.docx: Alice and Kristy's audit, reduced to its fix list. */
export const MEMO_FIXES = [
  "Collapse the checkpoint sidebar",
  "Stack every form field in one column",
  "Swap fixed pixel widths for percentages",
  "One field order, on mobile and desktop",
];
