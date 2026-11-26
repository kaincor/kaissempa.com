import type { GridItem } from "@/components/fortuna/screens/ScreenGrid";
import type { FlowStep } from "@/components/fortuna/screens/FlowMap";
import type { Pair } from "@/components/fortuna/screens/BeforeAfter";

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
      /**
       * Stand-in copy Kai has yet to write. Rendered faded and tagged, so it
       * reads as a placeholder on the page and cannot ship by mistake.
       */
      filler?: boolean;
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
  | { kind: "step"; n: number; title: string; flow?: string; text: string[]; filler?: boolean }
  /** A note to self in the doc about a visual that does not exist yet. */
  | { kind: "figure"; note: string }
  | { kind: "brand-mark" }
  /** The f, drawn in outline and refined, then filled in with its dot. */
  | { kind: "f-mark-reel" }
  /** The wordmark as a construction sheet, its proportions measured off. */
  | { kind: "wordmark-spec" }
  /** The three primary colours, a card whose edges keep sliding. */
  | { kind: "palette-reel" }
  | { kind: "store-strip" }
  | { kind: "site-switch" }
  | { kind: "flyer-flip" }
  /**
   * The Miami globe. Its caption belongs to it rather than sitting above it
   * as its own paragraph, because the globe's animation is what lights it.
   */
  | { kind: "globe"; caption: Rich }
  /** The research persona, rebuilt as the sheet it came from. */
  | { kind: "persona"; persona: PersonaSheet }
  /** The looping reel that reveals the product. */
  | { kind: "reveal" }
  /**
   * A phone on a dot grid, playing one of the swipe interactions the way a
   * screen recording would. One per beat of "How we got there".
   */
  | { kind: "swipe-demo"; demo: "spine" | "error" | "comeback"; caption?: string }
  /** The video resume, recorded on the phone from the empty slot to the upload. */
  | { kind: "video-demo" }
  /** Screens two by two, each with a name and a line on what it's doing. */
  | { kind: "screens"; title?: string; items: GridItem[] }
  /** A whole flow as one zoomable board, stepped through with arrows. */
  | { kind: "flow-map"; steps: FlowStep[] }
  /** The same moments before and after a decision, behind one switch. */
  | { kind: "before-after"; pairs: Pair[] }

export type Section = {
  id: string;
  /** Left out where the section speaks for itself, as the reel does. */
  heading?: string;
  /** The doc says "Title" where Kai has not named the section yet. */
  headingPending?: boolean;
  tone: Tone;
  /** Centred sections read as a statement; left ones read as an argument. */
  align?: Align;
  /** Fade the heading and paragraphs in, staggered, as the section arrives. */
  reveal?: boolean;
  draft?: string;
  /**
   * Left off the live page until it has what it needs (its pictures, mostly).
   * Still shown in the draft at /fortuna/draft.
   */
  hold?: boolean;
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
 * The persona sheet, as the research produced it — Figma's "Persona - Job
 * Seeker" frame, word for word.
 *
 * Rebuilt rather than dropped in as a picture: a screenshot of a deliverable
 * is unreadable on a phone, unselectable and invisible to search. On the page
 * it starts as a sliver of the sheet that can be opened out to the whole of
 * it.
 */
export type PersonaSheet = {
  /** The sheet's header label. */
  label: string;
  portrait: { src: string; alt: string };
  /** Name, age, job, location — under the portrait. */
  facts: { label: string; value: string }[];
  /**
   * The two prose columns at the top of the sheet. In `body`, an empty string
   * is a blank line between paragraphs; otherwise lines run straight on.
   */
  notes: { title: string; body: string[] }[];
  /** Goals, needs, frustrations — the three card columns underneath. */
  columns: { title: string; tone: "white" | "amber" | "rose"; items: string[] }[];
};

export const SARAH: PersonaSheet = {
  label: "Persona / Job seeker",
  portrait: {
    src: "/images/sarah-persona-photo.webp",
    alt: "Sarah, the job seeker persona",
  },
  facts: [
    { label: "Name", value: "Sarah Anderson" },
    { label: "Age", value: "31" },
    { label: "Job", value: "Unemployed" },
    { label: "Located", value: "Miami, FL" },
  ],
  notes: [
    {
      title: "User-persona situation:",
      body: [
        "Sarah is a 31-year-old administrative assistant. She worked as a receptionist for the last 4 years but recently lost her job. Sarah is a fast learner person who can adapt to different work enviroments. As a people person, she has excellent communication skills, and is always ready to face the day with a positive attitude. In fact, in her last job, she was recognized as the smiliest worker.",
        "Sarah is a single mother of a 2-year-old girl and lack of time is a daily worry as she is currently paying for a babysitter. Finding a job within the neighbourhood would mean spending more time with her daughter. She wants to get a gig as fast as possible while looking for another job.",
      ],
    },
    {
      title: "Situation related needs:",
      body: [
        "Sarah needs to find a job as fast as possible given the fact she is a single mother. In the meantime, getting a gig seems a really good idea.",
        "",
        "As she wants to spend more time with her daughter, Sarah needs to find a job that’s not far from the neighbourhood.",
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
        "Don’t know where to start searching and feel overwhelmed with all the different job searching apps.",
        "Searching in conventional recruiting apps takes her too much time as she needs to think and search for the specific type of job that she needs",
        "Apply for each job and waiting to hear back from them makes her anxious as she needs an income as soon as possible",
        "Attending to an inverview means she needs to pay for a baby sitter while she is gone, and she doesn’t have the income to cover that.",
      ],
    },
  ],
};

export const HERO = {
  title: "A Tale of Two Users",
  intro:
    "We built a swipe to work app in Miami. I worked on the brand, the app… and everything in between. It's the project I think about first when I talk about my work.",
};

export const SECTIONS: Section[] = [
  {
    // Proof first, story second: the product, the brand and the facts up
    // front, before the narrative asks the reader for their attention.
    id: "overview",
    tone: "cream",
    align: "center",
    reveal: true,
    blocks: [
      { kind: "reveal" },
      { kind: "wordmark-spec" },
    ],
  },
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
        text: "I partnered with our other product designer Yvonne, to explore how job seekers go about applying for work. We sat down with seven job seekers based in Miami, most of them in person and a few over Zoom, and drew up Sarah, a persona based on our collection of insights.",
      },
      { kind: "persona", persona: SARAH },
      {
        kind: "text",
        text: "Sarah didn't think the job applications were horrid. They just assumed she had time to search when she didn't.",
      },
    ],
  },
  {
    id: "reflections",
    heading: "Seeing Sarah",
    // Forest, the hamster wheel's colour: Seeing Sarah and the wheel run on
    // as one dark stretch, the green research above handing over to it.
    tone: "forest",
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
          { br: true },
          "The jobs? They're out there. But sitting between Sarah and a job are lengthy commutes, childcare stuff, a carousel of applications, a waiting game (that may all lead to nothing). It all really just boils down to friction.",
          { br: true },
          "Sarah just needs to reduce the friction between her current reality and the life she wants to build.",
        ],
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
            // Fortuna's orange: on the forest the sentence is already cream,
            // so cream would not stand out, and orange holds more contrast
            // against it than the light green did.
            tone: "orange",
            italic: true,
            fill: true,
          },
        ],
      },
      {
        kind: "quote",
        rules: true,
        text: "How do we reduce the cost of getting back to work?",
      },
    ],
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
    // The fork in the road: the app has two sides, and the job seeker's
    // comes first. Holds the sitemap, so everything after it has a place on
    // the map before the mechanics start.
    id: "two-sides",
    heading: "Two sides, one app",
    tone: "cream",
    align: "center",
    reveal: true,
    blocks: [
      {
        kind: "text",
        text: "Fortuna was a marketplace, so it had two sides: job seekers looking for work and employers looking for help. They met in the same matches, but almost everything else was different: the goals, the screens, and the story behind them.",
      },
      {
        kind: "text",
        text: "We'll start with the job seeker. That's the side with the swipe, the onboarding, the bio and the video resume, and it's where most of Sarah's friction lived.",
      },
      { kind: "figure", note: "Sitemap: the job seeker side, from the splash screen to hearing back from an employer" },
    ],
  },
  {
    id: "the-swipe",
    align: "center",
    reveal: true,
    heading: "Tinder's spine",
    tone: "cream-deep",
    blocks: [
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
      {
        kind: "text",
        text: "The fix was small. As a card leaves, it washes green with a check and the word Apply, or red with a cross and the word Dismiss. The colour says what happened at a glance, and the word makes sure nobody has to guess what the colour means.",
      },

      { kind: "subheading", text: "Wait, come back" },
      {
        kind: "text",
        text: "Testers were swiping through listings so fast that they wouldn't realize they skimmed past a potentially interesting job until it was too late.",
      },
      { kind: "swipe-demo", demo: "comeback", caption: "Users were swiping wayyy too fast" },
      {
        kind: "text",
        text: "Fortuna was a young pup back then, and every listing came from us knocking on doors around Miami (and it probably would be that way until the app gained some traction). So when users flew through the feed, they could run out of jobs in a single sitting before locking in and looking with more intention.",
      },
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
        text: "My friend Athena brought up Chesterton's Fence, a concept that warns against eliminating a rule or tradition before understanding why it was established in the first place.",
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

      { kind: "figure", note: "Whiteboard photo: the effort / intention spectrum — from a 30-minute application to a one-second swipe" },
      { kind: "figure", note: "New how might we's, relating to swiping issues — add later" },

      // The question Wait, come back raises; What we shipped answers it.
      { kind: "subheading", text: "A maybe in the middle" },
      {
        kind: "text",
        text: "Swipes on Tinder work because attraction is often immediate, but choosing a job is a little different. It means considering the commute, reading responsibilities, weighing tradeoffs, and imagining your future. These are slower cognitive tasks that don't always lend themselves to an immediate yes or no.",
      },
      {
        kind: "text",
        text: "Maybe some users wanted to save a job for later, or maybe they wanted to compare it to another listing. Maybe they just wanted a little bit more time to think on it. Maybe we needed a maybe.",
      },

      { kind: "subheading", text: "What we shipped" },
      {
        kind: "text",
        text: "Testing showed that reducing the number of steps did exactly what we wanted: users could move through opportunities quickly, without the usual application fatigue. But that efficiency came with a tradeoff. When the cost of a decision approached zero, some decisions started to feel disposable. Users would swipe quickly, sometimes realizing only afterward that they had passed over a job they were interested in.",
      },
      {
        kind: "text",
        text: "So the answer wasn't a third option. It was making the two we already had count.",
      },
      {
        kind: "text",
        text: "We gave the swipe a ceiling: a set number of right swipes a day, reset at midnight. When a swipe might be one of your last for the day, it's worth a second look.",
      },
      {
        kind: "text",
        text: "The undo button sat alongside it, bringing back the last job you dismissed. Undos were limited too, and topped back up within the day, so reversing a decision was a way to recover from a mistake rather than a habit. They were small interactions, but together they restored something we had accidentally designed away: intentionality.",
      },
      { kind: "figure", note: "Mockup: the undo, and how many are left today" },
    ],
  },
  {
    id: "job-seeker-flow",
    heading: "The job seeker flow",
    tone: "cream-deep",
    align: "center",
    reveal: true,
    blocks: [
      {
        kind: "text",
        text: "With the swipe settled, here's the whole job seeker side, from opening the app to landing an interview. Most of it was built to get out of the way.",
      },
      {
        kind: "step",
        n: 1,
        title: "Getting in",
        flow: "Splash → job seeker or employer → sign up → phone verification → location",
        text: [
          "Sign-up asked for only what we needed: a name, a birthday, an email and a password, then a phone number and a quick verification code.",
          "Location did the most work. It decided which jobs you'd see — and, outside Miami, whether you could use Fortuna at all. Being a young pup meant one city, so anyone further afield landed on a waitlist instead of an empty feed.",
        ],
      },
      {
        kind: "screens",
        items: [
          { screen: "welcome", label: "Welcome", caption: "One app, two doors. Businesses Fortuna had already emailed got a third: Activate Account." },
          { screen: "phone", label: "Phone number", caption: "After the basics, a phone number and a six-digit code to confirm it." },
          { screen: "location", label: "Location", caption: "Where you are decides what's in the feed: jobs within reach of home." },
          { screen: "waitlist", label: "Waitlist", caption: "Anywhere outside Miami, a waitlist instead of an empty feed." },
        ],
      },
      {
        kind: "step",
        n: 2,
        title: "Three screens of setting expectations",
        flow: "Complete your profile → record your video resume → swipe to apply → I'm ready",
        text: [
          "Before the first card, three quick screens told job seekers what to expect: fill out a profile, record a short video, then swipe. No surprises later about why we were asking for a video.",
        ],
      },
      {
        kind: "screens",
        items: [
          { screen: "onboard1", label: "Complete your profile", caption: "First, the profile: the kinds of jobs you're after." },
          { screen: "onboard2", label: "Record your video resume", caption: "Then the video, explained before anyone is asked to make one." },
          { screen: "onboard3", label: "Swipe to apply", caption: "Then the one gesture the whole app runs on." },
          { screen: "homeNudge", label: "The nudge", caption: "Skip ahead, and the feed keeps a reminder above the first card until the profile is done." },
        ],
      },
      {
        kind: "step",
        n: 3,
        title: "The bio",
        flow: "Name, location, max distance → industry, availability, wage → education, about me, attributes",
        text: [
          "The bio was the job seeker's side of the match. Distance, industry, full or part time and a minimum wage on a sliding scale decided what showed up in the feed; education, an about me and a handful of attributes — dedicated, loyal, punctual — were what employers saw.",
        ],
      },
      {
        kind: "screens",
        items: [
          { screen: "bioProfile", label: "Profile", caption: "What employers see: education, the video resume, a few lines about you, your attributes." },
          { screen: "bioPrefs", label: "Job preferences", caption: "What shapes the feed: location, how far you'll go, industries, when you can work, a minimum wage." },
          { screen: "bioPrefsAny", label: "The wage slider", caption: "Drag the wage all the way down and it reads No Preference, not $0." },
          { screen: "attributes", label: "Attributes", caption: "A handful of words, picked rather than written." },
        ],
      },
      {
        kind: "step",
        n: 4,
        title: "The video resume",
        flow: "Tips → camera and mic → record → play back → confirm and upload → uploaded",
        text: [
          "This was the heart of the job seeker side. Instead of a cover letter, a 90-second video introduction: a chance to stand out for people whose best qualities don't fit on a resume.",
          "Most of the design went into making it less intimidating — tips up front (somewhere quiet and well lit, a plain background, no sunglasses or hats), one big record button, a playback before anything is sent, and a clear message while it uploads so no one closes the app halfway through.",
        ],
      },
      { kind: "video-demo" },
      {
        kind: "step",
        n: 5,
        title: "The feed, and hearing back",
        flow: "Home → swipe → all caught up → my applications → connected",
        text: [
          "Then the feed, swiped until it runs dry: “All Caught Up!” Every right swipe lands in My Applications, marked Submitted.",
          "When an employer wants to meet, the application turns to Connected, and an email arrives with the times they've suggested for a call or an interview in person.",
        ],
      },
      {
        kind: "screens",
        items: [
          { screen: "home", label: "The feed", caption: "One card at a time: the job, the pay, the hours and how far away it is." },
          { screen: "swipeLimit", label: "The daily limit", caption: "Out of right swipes for today. They come back at midnight." },
          { screen: "myApplications", label: "My Applications", caption: "Every right swipe lands here as Submitted, and turns to Connected when an employer wants to meet." },
          { screen: "connectedEmail", label: "Hearing back", caption: "The connection arrives by email too: the interview type and the times the employer suggested." },
        ],
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
    id: "meet-jonathan",
    heading: "Meet Jonathan",
    headingPending: true,
    tone: "cream",
    align: "center",
    reveal: true,
    blocks: [
      {
        kind: "text",
        text: "On the other side of the marketplace was Jonathan, a 38-year-old grocery store owner in Miami who had been running his family's store for almost 15 years. Jonathan didn't need to hire constantly. He needed someone dependable who could step in when the store got busy: running deliveries, picking up supplies, cleaning, or covering whatever needed doing that day. His problem wasn't a lack of applicants. It was that finding the right person required more time than he had. Sorting through candidates, figuring out who was actually a fit, and coordinating interviews all competed with the work of running the store.",
      },
      {
        kind: "quote",
        text: "For Jonathan, the ideal hiring experience wasn't one with more tools. It was one that helped him make the right decision with as little administrative work as possible.",
      },
      { kind: "figure", note: "Jonathan's persona sheet, rebuilt like Sarah's so the two sides mirror each other — add later" },
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
        text: "Jonathan's side of Fortuna had one job: get him from an open position to a conversation with the right person, without hiring turning into a second job on top of running the store.",
      },
      {
        kind: "flow-map",
        steps: [
          { focus: [], title: "The employer side, end to end", text: "Thirteen screens from an empty job board to a conversation, plus the email that brought some businesses in before they'd signed up. Step through it with the arrows." },
          { focus: ["jobsEmpty", "post1"], title: "Post a job", text: "Jonathan starts on an empty board. Step one is the job itself: a title, an hourly wage checked against the minimum, a description, when the work happens, and how long the post stays up." },
          { focus: ["post2"], title: "Then, the person", text: "Step two describes the candidate instead: how many he wants to choose from, education, industry experience, years of experience and attributes. That's the whole post, in two steps." },
          { focus: ["posted", "picking"], title: "Then, nothing to do", text: "“Sit back while we pick the best ones for you.” Until the applicants arrive, the job's own page says the same." },
          { focus: ["applicants"], title: "A shortlist, ranked", text: "The applicants arrive ranked: Best Fit, Good Fit or Questionable. Three of three, the number he asked for, instead of a stack to sort." },
          { focus: ["candidate", "video"], title: "More signal, one tap at a time", text: "A candidate opens on the essentials: education, availability, attributes, work history. Under them, the video resume, for the person behind the application." },
          { focus: ["schedule", "scheduleFilled"], title: "Contact means scheduling", text: "Contact doesn't open a chat. It opens the interview: in person or a phone call, and at least one date and time, with room to offer more." },
          { focus: ["connected"], title: "Connected", text: "Fortuna sends Sarah's details to Jonathan by email, and the app's part is done." },
          { focus: ["candidates"], title: "Pinned", text: "Everyone he's connected with stays pinned under Candidates, with their fit and a way to email or call." },
          { focus: ["connectedEmail"], title: "Sarah hears back", text: "On her side, the same moment arrives as an email: the job, the interview type, and the times he suggested." },
          { focus: ["ghostEmail"], title: "Another way in", text: "Fortuna also designed a way in for businesses that hadn't signed up yet. It made accounts for local businesses it saw hiring, then emailed them a shortlist and a code to activate: “We have great candidates for you.” The team settled on four candidates, because four looked better than five." },
        ],
      },
      { kind: "subheading", text: "The job, then the person" },
      {
        kind: "text",
        text: "We separated the job from the candidate. Employers described the role first, then told Fortuna what a good candidate looked like.",
      },
      {
        kind: "text",
        text: "Asking how many candidates he needed, up front, changed what came back. Not everyone who applied, but a ranked shortlist the size he asked for.",
      },
      { kind: "subheading", text: "Information, in layers" },
      {
        kind: "text",
        text: "Once the job was posted, the challenge became one of information density. An employer shouldn't have to open a dozen full applications just to figure out where to start. The shortlist gave Jonathan an initial signal about fit; opening a candidate revealed their experience and attributes; and the video resume gave him a more personal sense of the person behind the application.",
      },
      {
        kind: "text",
        text: "Rather than presenting everything at once, the flow let Jonathan decide how much information he needed before moving to the next step.",
      },
      { kind: "subheading", text: "Interest into action" },
      {
        kind: "text",
        text: "Expressing interest shouldn't create another administrative task. Once Jonathan found someone he was interested in, the next source of friction was coordination: another round of messages, phone calls, and back-and-forth scheduling.",
      },
      {
        kind: "text",
        text: "So Contact was the scheduling. He chose an interview type, offered a time or two, and Fortuna sent both sides each other's details. The product's job wasn't to manage the entire employment relationship. It was to remove enough friction to get two people who wanted to talk to each other into the same room, or onto the same call.",
      },
      { kind: "figure", note: "Intentions surrounding the employer flow — add later" },
      { kind: "figure", note: "Design challenges that ensued — add later" },
      { kind: "figure", note: "Whiteboard photo: the employer flow, sketched — add later" },
    ],
  },
  {
    // The foundations: the work behind the screens that the narrative
    // above only shows the result of.
    id: "under-the-hood",
    heading: "Under the hood",
    // Every paragraph here introduces a picture that does not exist yet.
    hold: true,
    tone: "cream-deep",
    align: "center",
    reveal: true,
    blocks: [
      {
        kind: "text",
        text: "None of these screens happened in one pass. Behind the final app are rounds of prototypes, a UI kit built from scratch, and a pile of assets made by hand.",
      },
      { kind: "subheading", text: "The UI kit" },
      {
        kind: "text",
        text: "One set of colours, type and components shared by both sides, so the job seeker and employer apps felt like the same product.",
      },
      { kind: "figure", note: "UI kit: colours, type, buttons, cards and form fields" },
      { kind: "subheading", text: "From prototype to final" },
      {
        kind: "text",
        text: "Every round of testing fed the next prototype. Here's how the core screens changed on the way to the version we shipped.",
      },
      { kind: "figure", note: "Prototypes: early, middle and final versions of the core screens, side by side" },
      { kind: "figure", note: "The final prototype, clicked through" },
      { kind: "subheading", text: "Assets" },
      {
        kind: "text",
        text: "The icons, illustrations and imagery that gave Fortuna its personality. The industry illustrations came from a licensed set, and we tweaked and edited some of them to fit.",
      },
      { kind: "figure", note: "Assets: icons, illustrations and imagery" },
    ],
  },
  {
    // The nuance: what made the sprint, what got cut, and why.
    id: "cutting-room-floor",
    heading: "On the cutting-room floor",
    tone: "cream",
    align: "center",
    reveal: true,
    blocks: [
      {
        kind: "text",
        text: "Not everything we designed made it into the app, and some of what got cut taught us the most.",
      },
      { kind: "subheading", text: "Ideas we designed and didn't ship" },
      {
        kind: "text",
        text: "Run out of swipes, and the plan was to invite friends to earn more: five extra swipes for every friend who joined. We designed the whole thing, from the contact list to “Accepted! 5 swipes added”, and it never shipped.",
      },
      {
        kind: "text",
        text: "Chat went the same way, and so did rating employers. Ratings raised a question that got written straight onto the canvas: why would a job seeker rate an employer they probably hadn't even met yet?",
      },
      {
        kind: "text",
        text: "None of them were bad ideas. We just didn't have the time or the people to chase every good idea at once. Fortuna was riding the strongest current it had, and some of these ideas were rabbit holes we didn't want to go down just yet, so they went on the back burner for another day. In the end it was the CEO's call, and the CEO's bet: a clear vision of where Fortuna was headed, and the most direct route there.",
      },
      { kind: "subheading", text: "The interview that became a video resume" },
      {
        kind: "text",
        text: "Fortuna started with interviews. An employer picked interview questions for each job from a set list, Fortuna ranked the applicants by fit, the employer chose who to interview, and each of them answered the questions on video. That meant a new set of videos for every job you were picked for, and questions to set before anyone could be interviewed.",
      },
      {
        kind: "text",
        text: "So the interview became a video resume: one 90-second video on your profile, seen by every employer you apply to. Posting a job went from three steps to two, and My Interviews became My Applications.",
      },
      {
        kind: "before-after",
        pairs: [
          { before: "wireCreateInterview", after: "post2", label: "Posting a job", beforeCaption: "Step 3 of 3: pick the questions every applicant would answer on video.", afterCaption: "Two steps. The questions are gone, and the post ends on who you're looking for." },
          { before: "wireMyInterviews", after: "bioProfileVideo", label: "Applying", beforeCaption: "A new recording for every job you were picked for: Send your response!", afterCaption: "One 90-second video on the profile, seen by every employer you apply to." },
          { before: "wirePlayAnswer", after: "candidate", label: "Reviewing", beforeCaption: "The employer played back an answer per question, per candidate.", afterCaption: "The video resume sits on the profile, under everything else, and Contact moves things forward." },
          { before: "wireInterviewSent", after: "scheduleFilled", label: "Choosing", beforeCaption: "Three interviews per job, and a warning to spend them carefully: Pick wisely!", afterCaption: "Contact goes straight to setting up the real interview." },
        ],
      },
    ],
  },
  {
    // The full brand chapter: the overview teased it, this pays it off.
    id: "brand",
    heading: "Brand in the world",
    tone: "cream-deep",
    align: "center",
    reveal: true,
    blocks: [
      {
        kind: "text",
        text: "Fortuna spoke to two people at once, so the brand had to as well, without turning into two brands. Job seekers got orange, employers got green, and wherever the two sides met, the same serif and the same orange full stop held them together.",
      },
      { kind: "subheading", text: "The mark" },
      {
        kind: "text",
        text: "The first app icon was a four-leaf clover: three white leaves, and an orange dot for the fourth. Luck, for a company named after the goddess of it. Then the clover gave way to the f from the wordmark, and the orange dot came along with it.",
      },
      { kind: "brand-mark" },
      { kind: "f-mark-reel" },
      { kind: "palette-reel" },
      { kind: "subheading", text: "App Store screens" },
      {
        kind: "text",
        text: "For most people, the store listing would be the first Fortuna they ever saw, and it had ten slides to sell both sides. Every slide says who it's for before it says anything else: Job Seekers in orange, Employers in green, and both at once for the one moment they share, getting matched.",
      },
      {
        kind: "text",
        text: "It took three sets to get there. The first was retired along with the video interview it described. The last one brought in the cream, the serif headlines and the illustrations.",
      },
      { kind: "store-strip" },
      { kind: "subheading", text: "The website" },
      {
        kind: "text",
        text: "The website gave each side a page of its own, with a switch in the header to cross over. Job seekers were promised their next job in Miami, a swipe away. Employers were promised the fastest way to hire the right people in their community.",
      },
      { kind: "site-switch" },
      { kind: "subheading", text: "Flyers" },
      {
        kind: "text",
        text: "On paper, the switch became a flip. Each 4×6 card had employers on the front and job seekers on the back, with a tab in the corner, “Need a job?” or “Need to hire?”, telling you to turn it over. Each side carried its own QR code to its own page.",
      },
      {
        kind: "text",
        text: "The headlines got shorter with every round. “Need a job fast?” became “Looking for a job?”, and then just “Need a job?”",
      },
      { kind: "flyer-flip" },
      { kind: "subheading", text: "Promotional shoots" },
      { kind: "figure", note: "Promotional video shoots — add later" },
    ],
  },
  {
    id: "closing",
    heading: "Closing reflection",
    headingPending: true,
    tone: "forest",
    align: "center",
    reveal: true,
    blocks: [
      {
        kind: "text",
        filler: true,
        text: "Outcomes — any numbers you have — then what you'd do differently, and what you carried into later work.",
      },
    ],
  },
];

/**
 * The sections as they go live: the manuscript above with the notes to self
 * taken out. Figures that are only a note, stand-in copy, held sections, and
 * any subheading or section left with nothing under it are dropped, so the
 * page can ship while the draft keeps every slot for what is still to come.
 */
export function publishedSections(sections: Section[] = SECTIONS): Section[] {
  return sections.flatMap((s) => {
    if (s.hold) return [];
    const kept = s.blocks.filter(
      (b) => b.kind !== "figure" && !("filler" in b && b.filler),
    );
    // A subheading with nothing after it before the next one, or the end.
    const blocks = kept.filter(
      (b, i) =>
        b.kind !== "subheading" ||
        (i + 1 < kept.length && kept[i + 1].kind !== "subheading"),
    );
    if (!blocks.some((b) => b.kind !== "subheading")) return [];
    return [{ ...s, blocks, draft: undefined, headingPending: false }];
  });
}
