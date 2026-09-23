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
export type Tone = "cream" | "cream-deep" | "card" | "forest";

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
  | { wordmark: true }
  | { text: string; tone: "orange" | "green" | "brown" | "dim" };

export type Rich = string | Token[];

export type Block =
  | { kind: "text"; text: Rich }
  /** Set in italics in the doc — rendered as a serif pull-quote. */
  | { kind: "quote"; text: Rich }
  /** The tinted box: one line that needs to land harder than body copy. */
  | { kind: "callout"; text: Rich; reveal?: boolean }
  | { kind: "subheading"; text: string }
  | { kind: "list"; ordered?: boolean; items: string[] }
  /** A labelled step with an arrow flow and its own explanation. */
  | { kind: "step"; n: number; title: string; flow?: string; text: string[] }
  /** A note to self in the doc about a visual that does not exist yet. */
  | { kind: "figure"; note: string };

export type Section = {
  id: string;
  heading: string;
  /** The doc says "Title" where Kai has not named the section yet. */
  headingPending?: boolean;
  tone: Tone;
  /** Centred sections read as a statement; left ones read as an argument. */
  align?: "left" | "center";
  draft?: string;
  blocks: Block[];
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
          { wordmark: true },
          ", I was part of an ambitious project to redesign and ",
          { text: "modernize", tone: "orange" },
          " the way we find work.",
        ],
      },
    ],
  },
  {
    id: "many-pots",
    heading: "Many pots on the stove",
    tone: "cream-deep",
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
      { kind: "callout", text: "Fortuna launched in Miami in summer 2022." },
      { kind: "subheading", text: "Our high level goals for the app were to:" },
      {
        kind: "list",
        ordered: true,
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
    heading: "Early UX research",
    headingPending: true,
    tone: "cream",
    blocks: [
      {
        kind: "text",
        text: "I partnered with our other product designer Yvonne, to explore how job seekers go about applying for work. We spoke to seven job seekers based in Miami and drew up Sarah, a persona based on our collection of insights.",
      },
      {
        kind: "callout",
        text: "Sarah didn't think the job applications were horrid. They just assumed she had time to search when she didn't.",
      },
      { kind: "figure", note: "Draw up framework" },
    ],
  },
  {
    id: "reflections",
    heading: "Personal reflections on issues",
    headingPending: true,
    tone: "card",
    blocks: [
      {
        kind: "text",
        text: "If you really get into the nitty gritty of what Sarah needs, it isn't really a job. The jobs? They're out there. Sarah? She's there too. But between these two things are lengthy commutes, childcare stuff, a carousel of applications, a waiting game. But all that really just boils down to friction. Sarah just needs to reduce the friction between her current reality and the life she wants to build.",
      },
      {
        kind: "quote",
        text: "So the challenge is not to “help Sarah apply to jobs”, but “how do we reduce the cognitive, emotional and logistical costs of getting back to work?”",
      },
      {
        kind: "text",
        text: "What I find most compelling about Sarah is how she changed the way I understood the product itself. Fortuna isn't fundamentally in the business of matching people to jobs: it's more in the business of reducing the friction between someone's current reality and the life they want to build.",
      },
    ],
  },
  {
    id: "data-frameworks",
    heading: "Data frameworks on research",
    headingPending: true,
    tone: "cream",
    draft: "Add later",
    blocks: [],
  },
  {
    id: "hamster-wheel",
    heading: "Running on a hamster wheel in a rat race",
    tone: "forest",
    blocks: [
      {
        kind: "text",
        text: "Job seekers were vexed by the apply → wait → hear nothing → apply again hamster wheel.",
      },
      {
        kind: "text",
        text: "Searching for work had become work itself. Every step demanded something from the job seeker: attention to search, judgement to filter, effort to tailor, patience to wait. So by the time someone finally reached an application, they had already spent hours working just to get there. We didn't just want to make applying faster. We wanted to make the work of looking for work feel lighter.",
      },
      {
        kind: "quote",
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
    heading: "Introducing Fortuna",
    tone: "cream",
    blocks: [
      {
        kind: "quote",
        text: "Looking for work shouldn't feel like another job. Apply with a swipe and respond to employer interest with an in-app video introduction.",
      },
      { kind: "figure", note: "More added" },
    ],
  },
  {
    id: "how-we-got-there",
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
      { kind: "callout", text: "Swipe right to apply, and swipe left to dismiss." },

      { kind: "subheading", text: "Swiping error" },
      {
        kind: "text",
        text: "The swipe interaction was familiar, but its outcome wasn't. When a job card disappeared, there was no immediate feedback to indicate whether the action had been an application or a dismissal. The interaction looked and felt like something users already understood, but without a perceivable confirmation, it broke the mental model they brought to it.",
      },

      { kind: "subheading", text: "Wait, come back" },
      {
        kind: "text",
        text: "Testers were swiping through listings so fast that they wouldn't realize they skimmed past a potentially interesting job until it was too late.",
      },
      {
        kind: "text",
        text: "We'd spent weeks stripping friction out of Fortuna, but that made it easy to get lost in the sauce of the swipe, so to speak. Driving the cost towards zero had cheapened the interaction. The psychological delta between a thirty minute application process and a one second swipe was large enough to stop users from caring.",
      },
      {
        kind: "text",
        text: "My friend Athena brought up Chesterson's Fence, which says that you shouldn't tear down a fence or tradition without understanding why it was put there in the first place.",
      },
      {
        kind: "text",
        text: "Was there a reason the fence was up? We removed the friction fence because it drove the interaction cost up. But some of that friction had been quietly doing a job. It pushed people to pause long enough to make deliberate decisions.",
      },
      {
        kind: "quote",
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
    heading: "New feature ideas",
    headingPending: true,
    tone: "cream",
    draft: "Will remove",
    blocks: [],
  },
  {
    id: "testing-job-seeker",
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
    heading: "From the job seeker to the employer",
    tone: "forest",
    blocks: [
      {
        kind: "text",
        text: "Fortuna had two users, but they were trapped in the same system. Job seekers were spending hours searching and applying with little feedback. Employers were spending hours sorting, interviewing, and coordinating with candidates who might never be a fit.",
      },
      {
        kind: "quote",
        text: "If Fortuna was going to make hiring faster, we couldn't optimize only one side. We had to remove work from both.",
      },
    ],
  },
  {
    id: "employer-flow",
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
    heading: "Branding",
    headingPending: true,
    tone: "cream-deep",
    draft: "Add later — may move to the front",
    blocks: [],
  },
  { id: "website", heading: "Website", headingPending: true, tone: "cream", draft: "Add later", blocks: [] },
  { id: "video-resume", heading: "Video resume", headingPending: true, tone: "cream-deep", draft: "Add later", blocks: [] },
  { id: "app-store", heading: "App Store screens", headingPending: true, tone: "cream", draft: "Add later — A and B testing", blocks: [] },
  { id: "promo", heading: "Promotional video shoots + flyers", headingPending: true, tone: "card", draft: "Add later", blocks: [] },
  { id: "closing", heading: "Closing reflection", headingPending: true, tone: "forest", draft: "Add later", blocks: [] },
];
