/**
 * The Fortuna case study, as written.
 *
 * Kept apart from the components on purpose: the page is a renderer, this is
 * the manuscript. Adding a paragraph, changing a band colour or filling in one
 * of the drafts is an edit here and nowhere else.
 *
 * `tone` picks the band's background from the Fortuna palette. `draft` marks a
 * section the doc leaves as "add later" — it still renders, as a visible slot,
 * so the shape of the finished piece is legible while it is being written.
 */
export type Tone = "cream" | "cream-deep" | "card" | "forest" | "green";

/** Which edge a section's contents hang from. */
export type Align = "left" | "center" | "right";

/** Palette names a section can reach for directly. Resolved as `var(--f-…)`. */
export type BrandColor =
  | "orange"
  | "green"
  | "brown"
  | "cream"
  | "forest-deep"
  | "red"
  | "ink";

/**
 * Inline runs inside a paragraph.
 *
 * A plain string is the common case. The objects are for the places a word has
 * to behave differently from the sentence around it: the wordmark standing in
 * for "Fortuna", a word carrying a brand colour, or an aside set back at half
 * strength.
 */
export type Token =
  | string
  /**
   * `dot: false` drops the lockup's orange full stop, for mid-sentence use.
   *
   * The lockup is drawn in brand green, which is right on cream and invisible
   * on the green band — same colour, exactly. `tone` overrides it there.
   */
  | { wordmark: true; dot?: boolean; tone?: BrandColor }
  /**
   * A line break inside a paragraph.
   *
   * Not a paragraph of its own: the two clauses belong to the same thought
   * and should sit on the same block of text, a line apart rather than a
   * paragraph apart.
   */
  | { br: true }
  | {
      text: string;
      /** Left off to keep the sentence's own colour. */
      tone?: "orange" | "green" | "brown" | "cream" | "dim";
      italic?: boolean;
      /**
       * Starts the colour of the sentence and floods in, left to right, as
       * the reader scrolls the line up the screen.
       */
      fill?: boolean;
    };

export type Rich = string | Token[];

/**
 * Whether a run has anything in it that floods with colour.
 *
 * Here rather than beside the component that does the flooding, because the
 * server renderer has to ask the question in order to decide which renderer
 * to use — and a plain function exported from a "use client" module is a
 * client reference, not a function the server can call. It typechecks and
 * lints clean either way; it fails at request time.
 */
export function hasFill(nodes: Rich) {
  return (
    typeof nodes !== "string" &&
    nodes.some((n) => typeof n !== "string" && "fill" in n && n.fill === true)
  );
}

export type Block =
  | {
      kind: "text";
      text: Rich;
      /**
       * Short centred rules above and below, with room around them. For a
       * line that is a finding rather than a step in the argument.
       */
      rules?: boolean;
    }
  /** Set in italics in the doc — rendered as a serif pull-quote. */
  /** `tone` picks a brand colour for a line that has to land harder. */
  | {
      kind: "quote";
      text: Rich;
      tone?: BrandColor;
      /** The same centred rules a ruled finding gets, above and below. */
      rules?: boolean;
    }
  /** The tinted box: one line that needs to land harder than body copy. */
  | { kind: "callout"; text: Rich; reveal?: boolean }
  | { kind: "subheading"; text: string }
  | {
      kind: "list";
      ordered?: boolean;
      /** Overrides the section's alignment for this block alone. */
      align?: "left" | "center" | "right";
      /**
       * Set the items in the display face and bubble them in one at a time.
       * For a list that is the point of its section rather than a supporting
       * run of detail.
       */
      emphasis?: boolean;
      items: string[];
    }
  /** A labelled step with an arrow flow and its own explanation. */
  | { kind: "step"; n: number; title: string; flow?: string; text: string[] }
  /** A note to self in the doc about a visual that does not exist yet. */
  | { kind: "figure"; note: string }
  /**
   * The Miami globe. Its caption belongs to it rather than sitting above it
   * as its own paragraph, because the globe's animation is what lights it.
   */
  | { kind: "globe"; caption: Rich }
  /** The research persona, rebuilt as the sheet it came from. */
  | { kind: "persona"; persona: PersonaSheet }
  /**
   * The looping reel that reveals the product. Two cuts of it for now,
   * labelled, so they can be compared on the page: the bouncy one, and one
   * built the way the Kindred reel is.
   */
  | { kind: "reveal"; variant?: "kindred"; label?: string }
  /**
   * A phone on a dot grid, playing one of the swipe interactions the way a
   * screen recording would. One per beat of "How we got there".
   */
  | { kind: "swipe-demo"; demo: "spine" | "error" | "comeback"; caption?: string }

export type Section = {
  id: string;
  heading: string;
  /** The doc says "Title" where Kai has not named the section yet. */
  headingPending?: boolean;
  tone: Tone;
  /** Centred sections read as a statement; left ones read as an argument. */
  align?: Align;
  /** Fade the heading and paragraphs in, staggered, as the section arrives. */
  reveal?: boolean;
  draft?: string;
  /**
   * Sweep this band's colour up over the one above it as the reader arrives,
   * instead of letting the boundary simply scroll past.
   */
  rise?: boolean;
  /** Put a star field in the colour that sweeps up. Needs `rise`. */
  sky?: boolean;
  /** Hold the whole screen, with the content centred in it. */
  full?: boolean;
  /** Paint the heading in a brand colour rather than the band's running ink. */
  headingTone?: BrandColor;
  /** Override the band's running text colour, numerals included. */
  bodyTone?: BrandColor;
  /** Close the band right up around its content. */
  tight?: boolean;
  blocks: Block[];
};

/**
 * The persona sheet, as the research produced it.
 *
 * Rebuilt rather than dropped in as a picture: a screenshot of a deliverable
 * is unreadable on a phone, unselectable, invisible to search and impossible
 * to animate. The colours, the wording and the spacing are the artefact's own.
 */
export type PersonaSheet = {
  portrait: { src: string; alt: string };
  /** The two prose columns at the top of the sheet. */
  notes: { title: string; body: string[] }[];
  /** Goals, needs, frustrations — the three card columns underneath. */
  columns: { title: string; tone: "white" | "amber" | "rose"; items: string[] }[];
};

export const SARAH: PersonaSheet = {
  portrait: {
    src: "/images/sarah-persona.png",
    alt: "Sarah, the job seeker persona",
  },
  notes: [
    {
      title: "User-persona situation:",
      body: [
        "Sarah is a 31-year-old administrative assistant and former receptionist who recently lost her job. As a single mother of a two year old, time is tight and childcare is expensive, so finding work nearby would give her more time with her daughter.",
        "She's eager to find a gig quickly while continuing her search for a longer-term job.",
      ],
    },
  ],
  columns: [
    {
      title: "Goals",
      tone: "white",
      items: ["Being a present mother for her daughter", "Economic stability"],
    },
    {
      title: "Needs",
      tone: "amber",
      items: [
        "Find a job near her home as she needs to be available in case of an emergency",
        "Have an assured income while looking for a long term job",
        "Find a short term job fast",
        "Having free time to spend with her daughter",
      ],
    },
    {
      title: "Frustrations",
      tone: "rose",
      items: [
        "Doesn't know where to start searching, and feels overwhelmed by all the different job searching apps",
        "Searching in conventional recruiting apps takes her too much time, as she has to think about and then search for the specific type of job she needs",
        "Applying for each job and waiting to hear back makes her anxious, as she needs an income as soon as possible",
        "Attending an interview means paying for a babysitter while she is gone, and she doesn't have the income to cover that",
      ],
    },
  ],
};

export const HERO = {
  eyebrow: "Case study — 2022",
  title: "A Tale of Two Users",
  standfirst: "A case study in making job seeking feel less like work.",
  intro:
    "We built a swipe to work app in Miami. I worked on the brand, the app… and everything in between. It's the project I think about first when I talk about my work.",
  pullquote:
    "The pandemic exposed a disconnect between small businesses trying to hire and local job seekers trying to find work. Most small businesses still relied on offline hiring. I joined Fortuna to design a faster, simpler way for both sides to connect.",
};

export const SECTIONS: Section[] = [
  {
    id: "clunky",
    heading: "The job search is clunky",
    tone: "cream",
    align: "center",
    reveal: true,
    blocks: [
      {
        kind: "text",
        text: [
          "I personally remember filling out an application for a job lifting boxes at the back of a warehouse when I was in high school only to get a response halfway through college (",
          // The aside sits back; the brackets stay at full strength so the
          // sentence keeps its punctuation.
          { text: "it was a no", tone: "dim" },
          ").",
        ],
      },
      {
        kind: "callout",
        reveal: true,
        text: [
          "With ",
          // No full stop on the mark here — the sentence supplies its own
          // punctuation immediately after it.
          { wordmark: true, dot: false },
          ", I was part of an ambitious project to redesign and ",
          { text: "modernize", tone: "orange", fill: true },
          " the way we find work.",
        ],
      },
    ],
  },
  {
    id: "many-pots",
    heading: "Many pots on the stove",
    // Same cream as "The job search is clunky" above it. They are two halves
    // of the same run-up, and the green band below is the only colour change
    // this stretch of the page should be making.
    tone: "cream",
    align: "center",
    reveal: true,
    blocks: [
      {
        kind: "text",
        text: "I came on as a product designer, but knew from the interviews that I'd be wearing a handful of hats.",
      },
      {
        kind: "text",
        text: "I worked on the design of Fortuna from early 2022 to fall 2022. I initially collaborated with another designer before taking ownership of product design across the job seeker and employer experience.",
      },
      {
        kind: "text",
        text: "There were just a few of us. I worked alongside that other designer, a couple software engineers, and a product manager who doubled as our co-CEO. Fortuna was an early stage startup, so roles bent and blurred. We all stepped outside our job description to keep the product moving.",
      },
      // Out of the tinted box: it is the next sentence, not an aside, and the
      // globe beneath it is what gives it its weight. It slides in partway
      // through the globe's entrance, already green — the wipe it used to do
      // was a second event competing with the pin for the same moment.
      {
        kind: "globe",
        caption: [
          { wordmark: true, dot: false },
          " ",
          { text: "launched in Miami in summer 2022.", tone: "green" },
        ],
      },
    ],
  },
  {
    // The brief's one full-colour moment. Green sweeps up over the cream as
    // the reader leaves the globe, and the goals arrive on it.
    id: "goals",
    heading: "Our North Stars",
    tone: "green",
    align: "center",
    reveal: true,
    rise: true,
    sky: true,
    // Not `full`: holding a whole screen left the goals swimming in green.
    // The sweep is what makes the moment, and it happens above this band
    // regardless of how tall the band itself is.
    tight: true,
    // Everything in the band's deep forest. The heading does not need a
    // second colour to outrank the goals — it already outranks them by size.
    headingTone: "forest-deep",
    blocks: [
      { kind: "text", text: "Our high level goals for the app were to:" },
      {
        kind: "list",
        ordered: true,
        emphasis: true,
        items: [
          "Drive the cost of every interaction towards zero.",
          "Automate the work so every tap is reserved for a decision.",
          "Keep the experience on one distraction-free path.",
          "Give users speed as a product; hired in hours, not weeks.",
        ],
      },
    ],
  },
  {
    id: "early-research",
    heading: "Field interviews",
    // Green too, so the goals and the research they came out of read as one
    // stretch of the page. No `rise` — the band above is already this colour,
    // so there is nothing for a sweep to reveal.
    tone: "green",
    align: "center",
    // The heading arrives, then the paragraph under it. Only those two: the
    // persona below them brings its own entrance.
    reveal: true,
    blocks: [
      {
        kind: "text",
        text: "I partnered with our other product designer Yvonne, to explore how job seekers go about applying for work. We spoke to seven job seekers based in Miami and drew up Sarah, a persona based on our collection of insights.",
      },
      { kind: "persona", persona: SARAH },
      {
        kind: "quote",
        rules: true,
        text: "Sarah didn't think the job applications were horrid. They just assumed she had time to search when she didn't.",
      },
      { kind: "figure", note: "Draw up framework" },
    ],
  },
  {
    id: "reflections",
    heading: "Seeing Sarah",
    // Green as well, so the research runs as one stretch of colour from the
    // goals to here. Data frameworks below it keeps its cream and ends the run.
    tone: "green",
    // Centred, like the two green sections above it. The whole green run now
    // reads as one held statement rather than an argument that changes its
    // mind about where the left edge is halfway down.
    align: "center",
    // Title, the first half, the question, then the second half — four beats
    // a third of a second apart, so the section states its problem before it
    // answers it.
    reveal: true,
    blocks: [
      {
        kind: "text",
        // Broken on its own turns rather than run together. The three clauses
        // are one thought, so they stay in one paragraph and are separated by
        // a line rather than by a paragraph's worth of air.
        text: [
          "If you really get into the nitty gritty of what Sarah needs, it isn't really a job.",
          { br: true },
          "The jobs? They're out there. But sitting between Sarah and a job are lengthy commutes, childcare stuff, a carousel of applications, a waiting game (that may all lead to nothing). It all really just boils down to friction.",
          { br: true },
          "Sarah just needs to reduce the friction between her current reality and the life she wants to build.",
        ],
      },
      {
        kind: "quote",
        rules: true,
        text: "How do we reduce the cost of getting back to work?",
      },
      {
        kind: "text",
        text: [
          "I feel like I was finally seeing Sarah's situation, she changed the way I wanted the product to work. Fundamentally, Fortuna isn't just job matching. It's more of a means to reduce the friction between someone's current reality and the life they want to build.",
          { br: true },
          "So the challenge is not to just ",
          { text: "“help Sarah apply to jobs”", italic: true },
          ", but rather ",
          {
            text: "“how do we reduce the cognitive, emotional, and logistical costs of getting back to work?”",
            tone: "cream",
            italic: true,
            fill: true,
          },
        ],
      },
    ],
  },
  {
    id: "data-frameworks",
    heading: "Data frameworks on research",
    headingPending: true,
    tone: "cream",
    reveal: true,
    draft: "Add later",
    blocks: [],
  },
  {
    id: "hamster-wheel",
    // Centred and staggered from here down, so the back half of the
    // piece is read the same way as the front. `align` reaches the
    // heading, the body, subheadings, callouts and lists; the employer
    // flow's numbered steps keep their own left-aligned layout, which
    // is right for a sequence of stages.
    align: "center",
    reveal: true,
    heading: "Running on a hamster wheel in a rat race",
    tone: "forest",
    blocks: [
      {
        kind: "text",
        text: "We expanded Sarah's persona to get a clearer picture of Job Seekers in Miami. Job Seekers were vexed by the apply ➡️ wait ➡️ hear nothing ➡️ apply again hamster wheel.",
      },
      {
        kind: "text",
        text: "Searching for work had become work itself. Every step demanded something from the Job Seeker: attention to search, judgement to filter, patience to wait. So basically by the time someone finally reached an application, they'd already spent hours working just to get there.",
      },
      {
        kind: "text",
        text: "We didn't just want to make applying faster. We wanted Fortuna to make the work of looking for work feel lighter.",
      },
      {
        kind: "quote",
        rules: true,
        text: "How might we make job seeking feel less like work?",
      },
      {
        kind: "text",
        text: "The answer started with making job applications cost next to nothing.",
      },
    ],
  },
  {
    id: "introducing-fortuna",
    align: "center",
    reveal: true,
    heading: "Introducing Fortuna",
    tone: "cream",
    blocks: [
      {
        kind: "quote",
        rules: true,
        text: "Looking for work shouldn't feel like another job. Apply with a swipe and respond to employer interest with an in-app video introduction.",
      },
      { kind: "reveal", label: "A · Bouncy" },
      { kind: "reveal", variant: "kindred", label: "B · After Kindred" },
    ],
  },
  {
    id: "how-we-got-there",
    align: "center",
    reveal: true,
    heading: "How we got there",
    headingPending: true,
    tone: "cream-deep",
    blocks: [
      { kind: "figure", note: "Questions that informed design strategy — add later" },

      { kind: "subheading", text: "Tinder's spine" },
      {
        kind: "text",
        text: "Job applications are full of small costs: read a job post, hit apply, reroute to another site, fill out another form. Individually these costs are trivial, but together it's enough to spur a job seeker from submitting an application.",
      },
      {
        kind: "text",
        text: "Fortuna had to cost one gesture instead of several. Swiping already had a familiar mental model, so we hinged the user flow on it.",
      },
      { kind: "swipe-demo", demo: "spine", caption: "Swipe right to apply, and swipe left to dismiss." },

      { kind: "subheading", text: "Swiping error" },
      {
        kind: "text",
        text: "The swipe interaction was familiar, but its outcome wasn't. When a job card disappeared, there was no immediate feedback to indicate whether the action had been an application or a dismissal. The interaction looked and felt like something users already understood, but without a perceivable confirmation, it broke the mental model they brought to it.",
      },
      { kind: "swipe-demo", demo: "error", caption: "No interaction confirmation = confused users" },

      { kind: "subheading", text: "Wait, come back" },
      {
        kind: "text",
        text: "Testers were swiping through listings so fast that they wouldn't realize they skimmed past a potentially interesting job until it was too late.",
      },
      { kind: "swipe-demo", demo: "comeback", caption: "Users were swiping wayyy too fast" },
      {
        kind: "text",
        text: "We'd spent weeks stripping friction out of Fortuna, but that made it easy to get lost in the sauce of the swipe, so to speak. Driving the cost towards zero had cheapened the interaction. The psychological delta between a thirty minute application process and a one second swipe was large enough to stop users from caring.",
      },
      {
        kind: "quote",
        rules: true,
        text: "The psychological delta between a 30-minute application process and a one-second swipe was large enough to stop users from caring.",
      },
      {
        kind: "text",
        text: "My friend Athena brought up Chesterson's Fence, which says that you shouldn't tear down a fence or tradition without understanding why it was put there in the first place.",
      },
      {
        kind: "text",
        text: "Was there a reason the fence was up? We removed the friction fence because it drove the interaction cost up. But some of that friction had been quietly doing a job. It pushed people to pause long enough to make deliberate decisions.",
      },
      // A line on its own rather than a pull-quote: the conclusion of the
      // paragraph above, a beat apart from it, in the run of the text.
      {
        kind: "text",
        text: "So we'd removed the effort, but we'd also removed some of the intention.",
      },

      { kind: "subheading", text: "Maybe in the middle" },
      {
        kind: "text",
        text: "Swipes on Tinder work because attraction is often immediate, but choosing a job is a little different. It means considering the commute, reading responsibilities, weighing tradeoffs, and imagining your future. These are slower cognitive tasks that don't always lend themselves to an immediate yes or no.",
      },
      {
        kind: "text",
        text: "Maybe some users wanted to save a job for later, or maybe they wanted to compare it to another listing. Maybe they just wanted a little bit more time to think on it. Maybe we needed a maybe.",
      },

      { kind: "figure", note: "Spectrums and situations framework — add later" },
      { kind: "figure", note: "New how might we's, relating to swiping issues — add later" },
    ],
  },
  {
    id: "new-feature-ideas",
    align: "center",
    reveal: true,
    heading: "New feature ideas",
    headingPending: true,
    tone: "cream",
    draft: "Will remove",
    blocks: [],
  },
  {
    id: "testing-job-seeker",
    align: "center",
    reveal: true,
    heading: "Testing on the job seeker flow",
    tone: "cream",
    blocks: [
      {
        kind: "text",
        text: "Testing showed that reducing the number of steps did exactly what we wanted: users could move through opportunities quickly, without the usual application fatigue. But that efficiency came with a tradeoff. When the cost of a decision approached zero, some decisions started to feel disposable. Users would swipe quickly, sometimes realizing only afterward that they had passed over a job they were interested in.",
      },
      {
        kind: "text",
        text: "The undo interaction became a small counterweight to that speed. It gave users a way to recover from a mistake, but limiting the number of undos available each day meant that reversing a decision still carried some weight. It was a small interaction, but it helped restore something we had accidentally designed away: intentionality.",
      },
    ],
  },
  {
    id: "two-sided",
    align: "center",
    reveal: true,
    heading: "From the job seeker to the employer",
    tone: "forest",
    blocks: [
      {
        kind: "text",
        text: "Fortuna had two users, but they were trapped in the same system. Job seekers were spending hours searching and applying with little feedback. Employers were spending hours sorting, interviewing, and coordinating with candidates who might never be a fit.",
      },
      {
        kind: "quote",
        rules: true,
        text: "If Fortuna was going to make hiring faster, we couldn't optimize only one side. We had to remove work from both.",
      },
    ],
  },
  {
    id: "employer-flow",
    align: "center",
    reveal: true,
    heading: "Employer flow",
    tone: "cream",
    blocks: [
      {
        kind: "text",
        text: "On the other side of the marketplace was Jonathan, a 38-year-old grocery store owner in San Francisco. Jonathan didn't need to hire constantly. He needed someone dependable who could step in when the store got busy: running deliveries, picking up supplies, cleaning, or covering whatever needed doing that day. His problem wasn't a lack of applicants. It was that finding the right person required more time than he had. Sorting through candidates, figuring out who was actually a fit, and coordinating interviews all competed with the work of running the store.",
      },
      {
        kind: "quote",
        text: "For Jonathan, the ideal hiring experience wasn't one with more tools. It was one that helped him make the right decision with as little administrative work as possible.",
      },
      {
        kind: "step",
        n: 1,
        title: "Post a job",
        flow: "Post a job → define candidate preferences",
        text: [
          "We separated the job from the candidate. Employers described the role first, then told Fortuna what a good candidate looked like.",
        ],
      },
      {
        kind: "step",
        n: 2,
        title: "Surface the signal",
        flow: "Candidate list → profile → video → interview response",
        text: [
          "Instead of asking employers to work through a stack of applications, Fortuna surfaced progressively more information about each candidate, from fit and experience to video and interview responses.",
          "Once the job was posted, the challenge became one of information density. An employer shouldn't have to open a dozen full applications just to figure out where to start. The candidate list gave Jonathan an initial signal about fit; opening a candidate revealed their experience and attributes; and the video resume gave him a more personal sense of the person behind the application.",
          "Rather than presenting everything at once, the flow let Jonathan decide how much information he needed before moving to the next step.",
        ],
      },
      {
        kind: "step",
        n: 3,
        title: "Interest into action",
        flow: "Contact → interview type → available times → confirmation",
        text: [
          "Expressing interest shouldn't create another administrative task. Once Jonathan found someone he was interested in, the next source of friction was coordination. Contacting a candidate could easily become another round of messages, phone calls, and back-and-forth scheduling.",
          "Fortuna kept that process inside the same flow. Jonathan could choose an interview type, provide one or more possible times, and confirm, without leaving the candidate experience. Finding the right candidate shouldn't create a new administrative task just to get an interview on the calendar.",
        ],
      },
      {
        kind: "figure",
        note: "Show this visually: Contact → Phone/In Person → Date → Time → Add another option → Confirm → Connected",
      },
      {
        kind: "step",
        n: 4,
        title: "Keep it moving",
        flow: "Interviews → connect → contact information",
        text: [
          "Once both sides were interested, Fortuna made the connection explicit and handed the relationship off to the employer and candidate.",
          "The product's job wasn't to manage the entire employment relationship. It was to remove enough friction to get two people who wanted to talk to each other into the same room, or onto the same call.",
        ],
      },
      { kind: "figure", note: "Intentions surrounding the employer flow — add later" },
      { kind: "figure", note: "Employer persona — add later" },
      { kind: "figure", note: "Design challenges that ensued — add later" },
      { kind: "figure", note: "Whiteboard sketches — add later" },
      { kind: "figure", note: "Employer flow pictures — add later" },
    ],
  },
  {
    id: "branding",
    align: "center",
    reveal: true,
    heading: "Branding",
    headingPending: true,
    tone: "cream-deep",
    draft: "Add later — may move to the front",
    blocks: [],
  },
  { id: "website", heading: "Website", headingPending: true, tone: "cream", draft: "Add later", align: "center", reveal: true, blocks: [] },
  { id: "video-resume", heading: "Video resume", headingPending: true, tone: "cream-deep", draft: "Add later", align: "center", reveal: true, blocks: [] },
  { id: "app-store", heading: "App Store screens", headingPending: true, tone: "cream", draft: "Add later — A and B testing", align: "center", reveal: true, blocks: [] },
  { id: "promo", heading: "Promotional video shoots + flyers", headingPending: true, tone: "card", draft: "Add later", align: "center", reveal: true, blocks: [] },
  { id: "closing", heading: "Closing reflection", headingPending: true, tone: "forest", draft: "Add later", align: "center", reveal: true, blocks: [] },
];
