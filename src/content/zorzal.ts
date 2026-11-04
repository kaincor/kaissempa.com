/**
 * The Zorzal case study, as data.
 *
 * Ported from Kai's draft (assets/Case Studies/Zorzal/zorzal-draft.md, kept
 * out of the repo). Inline text takes **bold** and *italic*, nothing else.
 *
 * Three kinds of stand-in are marked so they cannot pass for the finished
 * page: `motion` slots for the motion graphics Kai and Claude will make,
 * the chapter `icon` square beside each title (Kai is hand drawing the real
 * ones, after his animal stamps in Figma 3346:2027), and `placeholder`, a
 * plain white card with black text for a photo still to come.
 */

/** A chapter icon to come: the animal, as a working label. */
export type Icon = string;

export type Figure = {
  src: string;
  alt: string;
  caption?: string;
  /** Show it inside a phone frame. */
  phone?: boolean;
};

export type Block =
  | { t: "p"; text: string; small?: boolean }
  | { t: "h3"; text: string }
  | { t: "quote"; text: string }
  | { t: "list"; items: string[] }
  | ({ t: "img"; wide?: boolean } & Figure)
  | { t: "gallery"; items: Figure[]; caption?: string }
  | { t: "motion"; text: string; label?: string }
  | { t: "placeholder"; text: string; aspect?: string };

export type Tone = "cream" | "sand" | "forest";

export type Section = {
  id: string;
  title: string;
  icon: Icon;
  tone: Tone;
  /** A part heading over this section: "Phase one", "Phase two". */
  part?: string;
  blocks: Block[];
};

export const FACTS: { label: string; value: string }[] = [
  { label: "Client", value: "Zorzal Cacao · Reserva Zorzal, Dominican Republic" },
  { label: "Role", value: "UX/UI design and front-end · wireframes, prototyping, responsive CSS" },
  { label: "Team", value: "Lyna Kim, Simi Aluko, Alice Chen, Kristy Chan and me, through Stanford's Engineers for a Sustainable World" },
  { label: "Timeline", value: "January – June 2022" },
  { label: "Stack", value: "React · TypeScript · Firebase · Material UI · Figma" },
];

export const OUTCOME =
  "We shipped a mobile-responsive, Spanish-language version of Zorzal's cacao tracker. It went live, and Zorzal still uses it today, with later teams building on top of it.";

const COVID =
  "(I presented one of these from COVID isolation, having woken up on my laptop keyboard seconds before.)";

export const SECTIONS: Section[] = [
  {
    id: "why",
    title: "Why tracking cacao is worth doing well",
    icon: "thrush on a branch",
    tone: "cream",
    blocks: [
      { t: "p", text: "There are levels to chocolate. Most cacao gets sold by the ton as a commodity. Zorzal's goes to artisan chocolate makers, so they're a little more avant-garde about it. They grow it on Reserva Zorzal, a 1,019-acre bird sanctuary in the Dominican Republic and the country's first private reserve. (\"Zorzal\" is Spanish for thrush.) Seventy percent of the land is left untouched, and the cacao is what pays for the forest." },
      { t: "p", text: "Fine-flavor cacao is fussy. How long it ferments, how long it dries in the sun, which farm it came from: every one of those changes how the chocolate looks, tastes and smells. That's the difference between specialty and commodity, so Zorzal needs to know all of it, for every bag." },
      { t: "p", text: "Their first system was paper slips taped to the boxes. The slips were scribbled in a hurry, hard to read, and fell off on the way from one station to the next. Shipments moved through production untracked, the records came out wrong, and the transparency Zorzal wanted to offer its customers just wasn't possible." },
      { t: "p", text: "Two earlier Stanford teams had already built the fix: a React and Firebase web app that gives every box a barcode and logs it through each checkpoint (fermentation, drying, warehouse, containers). By the time our team picked it up, the hard backend problems were solved. The app *worked*." },
      { t: "p", text: "It just didn't work where the work actually happened." },
      { t: "p", small: true, text: "(The hero art on this page is mine, drawn for this case study.)" },
    ],
  },
  {
    id: "team",
    title: "Five friends and a bird sanctuary",
    icon: "rabbit (Rupert)",
    tone: "sand",
    blocks: [
      { t: "p", text: "I joined the team a week and a half late, in the middle of January, which is how I learned the most important thing about this group: they'd already picked the group chat, and it already had a 🤩 in the name." },
      { t: "p", text: "There were five of us. Lyna was our captain and the one who kept the whole thing on rails. Alice led the code, Kristy ran client engagement (and, per our own final report, was a \"wireframe wizard & code genie\"), and Simi and I ran design. We were friends before we were a team, and it showed. We had a standing mascot situation: my rabbit, Rupert, came to meetings and hopped around the table eating our snacks, and my friend Kayla's puppy, Zazu, made guest appearances. One night Lyna got stuck in an elevator on her way to our meeting and had to be rescued by the fire department. Her message to the chat: \"Everyone should go home.\" (We did not go home.)" },
      { t: "p", text: "That mattered more than it sounds, because the next six months would test our patience. Showing up every week to a room with friends (and a rabbit) is what kept us laughing through it." },
      { t: "placeholder", text: "Rupert on the meeting table — photo to come", aspect: "4 / 3" },
      {
        t: "gallery",
        items: [
          { src: "/zorzal/team-night-meeting.webp", alt: "The five of us around a conference table at night" },
          { src: "/zorzal/team-selfie.webp", alt: "Four of us in masks, with the fifth on a laptop over Zoom" },
        ],
        caption: "A night meeting in February, and the usual line-up: four in the room, one on Zoom.",
      },
    ],
  },
  {
    id: "inherited",
    title: "Inheriting someone else's system",
    icon: "box with a barcode",
    tone: "cream",
    blocks: [
      { t: "p", text: "Before we decided anything, we spent our first weeks learning the codebase and grilling the two engineers who'd built it, Austin and Mark. That call reshaped how we saw the app. The decisions we'd inherited weren't arbitrary:" },
      { t: "p", text: "**Checkpoints are places, not steps.** Fermentation, drying, warehouse and containers are each a different physical location on the reserve. The app's structure mirrors the geography." },
      { t: "p", text: "**The data model mirrors the supply chain.** Boxes get IDs, boxes get grouped into lots, and lots go into containers. Every scan is a record attached to an ID. To add a new production step, you add one object to the database, with no code changes. The previous team once got a diagram of the supply chain and had a running app the next day." },
      { t: "p", text: "**Search mostly proves the app works.** Floor workers record. They almost never look anything up. Search was there so Chuck, Zorzal's founder, could see the big picture." },
      { t: "p", text: "**The app is the first thing to go.** This was the big one. Shipments come in bursts: nothing for two weeks, then a flood of boxes. When workers are slammed and the app gives them trouble, they don't troubleshoot. They put the phone down and move cacao. Recording loses to the real work, every time." },
      { t: "p", text: "That last point became the rule for everything after it: *the tool has to cost the worker almost nothing, or it doesn't get used at all.*" },
      { t: "motion", text: "A single bag of beans with a barcode riding along the supply chain (farm → fermentation → drying → warehouse, where bags merge into a lot → container), drawn in as you scroll." },
      { t: "img", wide: true, src: "/zorzal/supply-chain.webp", alt: "Swimlane diagram of the checkpoints: fermentation, drying, containers and warehouse", caption: "The supply chain the app was built around, one swimlane per checkpoint." },
    ],
  },
  {
    id: "problem",
    title: "The problem, held up to reality",
    icon: "phone with a crack",
    tone: "cream",
    blocks: [
      { t: "p", text: "The app had been designed for a desktop browser, and Zorzal's employees used it almost entirely on their phones: one-handed, mid-task, in the heat, during those harvest bursts. On a phone, it fell apart. The checkpoint sidebar didn't collapse, so it ate half the screen. Rows of tabs ran off the edge, form fields got cut off, and the buttons were tiny. On top of that, the whole thing was in English, for a team that works in Spanish." },
      { t: "p", text: "So the brief was narrow and pretty unglamorous: make the tracker genuinely usable on the phones and in the language of the people it was built for. The interesting part is how close we came to doing something much flashier instead." },
      { t: "motion", text: "The old desktop app squeezing narrower and narrower until it breaks at phone width." },
      { t: "img", wide: true, src: "/zorzal/old-app-400px.webp", alt: "The old Record page squeezed to 400 pixels wide, with its tabs and form cut off", caption: "The old Record page at 400px wide: the tabs run off the edge and the form goes with them." },
      {
        t: "gallery",
        items: [
          { src: "/zorzal/old-record-iphone.webp", alt: "The old Record page on an iPhone, overflowing", phone: true },
          { src: "/zorzal/old-record-iphone-scrolled.webp", alt: "The same page scrolled sideways, with the heading cut off", phone: true },
          { src: "/zorzal/fermentation-clipped.webp", alt: "The fermentation form on a phone, its fields clipped at the right edge", phone: true },
        ],
        caption: "The same app on an actual phone.",
      },
    ],
  },
  {
    id: "garden",
    part: "Phase one: deciding what to build",
    title: "Plant a garden",
    icon: "missing-person poster, or an owl",
    tone: "forest",
    blocks: [
      { t: "p", text: "Here's the part nobody warns you about with client work: sometimes the client goes quiet." },
      { t: "p", text: "We emailed Chuck. We emailed him again. For most of winter quarter we couldn't get him on a call, so we had no feedback on anything we were making. Our winter slides said it plainly: \"Haven't talked to Chuck at all this quarter.\" I made a missing-person poster for him and put it in our presentation, misery-loves-company style. Simi, wisely, asked me to tone it down, so the poster went and I \"changed my tone.\" When Lyna finally sent what she called a \"passive aggressive email\" in week nine, he replied in five minutes. Then he cancelled the meeting he'd proposed. (\"Chuck tricked us, I fear,\" I told the group.) Lyna's email chain and Simi's texts were our only lines to Zorzal, and they did a lot of heroic chasing." },
      { t: "motion", label: "✱ Motion / image", text: "The missing-person poster, recreated with no face: a silhouette with a question mark, \"HAVE YOU SEEN THIS MAN?\", \"Last seen: Week 1\", \"Reward: one reply email\". Maybe a phone ringing on loop beside it, never picked up." },
      { t: "p", text: "Honestly, at first the silence was kind of fun. No strict guidelines, no rubric, just the creative reins and room to go any direction. It was like being told to plant a garden: no specifics, just plant a garden. So you do. You pick the plants, arrange them, style them, make it look good. Then weeks later, while everything's flowering, someone walks by and says: oh wait, these are the wrong plants, I should've told you. That's rain on a parade. And after the first round of pushback, every round after it is harder to start. Our excitement tapered off and eventually leveled out into frustration." },
      { t: "p", text: COVID },
    ],
  },
  {
    id: "wireframes",
    title: "Five brains, five wireframes",
    icon: "fox",
    tone: "cream",
    blocks: [
      { t: "p", text: "While we waited, we each sketched our own version of a mobile Zorzal, and the sketches showed how differently we each read the same problem. Alice built around a master menu with long-press shortcuts. Kristy went for big labelled buttons and a circular palette for flicking between checkpoints. Lyna was obsessed with orientation: always knowing where you are, and jumping between levels fast. Simi leaned on visual cues and a menu tucked into a long-press." },
      { t: "p", text: "Mine was the minimalist one: a floating back button (borrowed from Android, which the workers already knew), a home button in the corner, oversized buttons that fill the screen so a thumb can't miss, a muted grey-and-blue palette, and as little on screen as I could get away with. Utility over information density. I was, frankly, excited to make this thing *beautiful*. Hold that thought." },
      { t: "p", text: "We merged the best of them into one direction, a full redesign, and built it as an interactive Figma prototype." },
      { t: "motion", text: "The wireframes dealt out like a hand of cards (the same pile as the home page), each with a one-line label of its big idea." },
      { t: "img", wide: true, src: "/zorzal/wireframe-kai.webp", alt: "Kai's wireframe flow in Figma: splash, home, record, search and error screens", caption: "Mine: as little on screen as I could get away with." },
      {
        t: "gallery",
        items: [
          { src: "/zorzal/wireframe-simi.webp", alt: "Simi's hand-drawn wireframes", caption: "Simi" },
          { src: "/zorzal/wireframe-alice.webp", alt: "Alice's fermentation flow on grid paper", caption: "Alice" },
          { src: "/zorzal/wireframe-kristy.webp", alt: "Kristy's wireframe of the home, record and create screens", caption: "Kristy" },
        ],
      },
      { t: "img", wide: true, src: "/zorzal/early-hifi.webp", alt: "An early high-fidelity Record screen with palette swatches", caption: "An early high-fidelity pass at the Record screen." },
    ],
  },
  {
    id: "testing",
    title: "Testing it, finding by finding",
    icon: "magnifying glass, or a hen",
    tone: "sand",
    blocks: [
      { t: "p", text: "We wanted to test with Zorzal's employees, but we couldn't reach them. So we tested the prototype on whoever we had: classmates, roommates and a TA from a human-centered design course. We gave everyone the same three tasks from the app's real core loop: **create a box in fermentation, create a lot in the warehouse, fill out the FCCI quality form.**" },
      { t: "p", text: "People got through them and warmed up quickly. The failures taught us the most:" },
      { t: "p", text: "**Everyone expected Search to search everything.** Asked to create a box, several testers went straight to Search and typed \"fermentation.\" One said: \"I would assume that you can search for fermentation.\" People's habit of using search to navigate is stronger than any layout." },
      { t: "p", text: "**\"Add to Lot\" vs. \"Create Lot\" was a coin flip.** Two near-identical labels, side by side, doing different things. That was a naming problem pretending to be a layout problem." },
      { t: "p", text: "**Pages needed to announce themselves.** Testers landed on screens and paused: \"kind of confused on what I was supposed to do — not too many words, but maybe a heading.\" My minimalism had tipped over into ambiguity." },
      { t: "p", text: "**The forms button was invisible.** On the FCCI task, people went to Settings first. Forms belonged *inside* each checkpoint, not in a separate bucket." },
      { t: "p", text: "**People wanted more life.** Nearly everyone, unprompted, asked for more color, pictures, maybe animation. (Hold that thought too.)" },
      { t: "placeholder", text: "The prototype's Aggregate screen, with \"Add to Lot\" and \"Create Lot\" circled — screenshot to come", aspect: "16 / 9" },
    ],
  },
  {
    id: "critique",
    title: "The critique that killed our favorite design",
    icon: "crow",
    tone: "cream",
    blocks: [
      { t: "p", text: "Then we put the redesign in front of Taylor Lallas, a TA for Stanford's CS 147, and she took it apart. Correctly." },
      { t: "p", text: "First, **we'd designed the wrong kind of thing.** Our prototype behaved like a native mobile app, with bottom bars and app-style navigation, when the brief was a *web app that works on any device*. We'd drifted into designing what was fun instead of what was asked." },
      { t: "p", text: "Second, and this was the deep one, **we hadn't earned the right to change this much.** The workers already knew the existing layout. We had almost no window into how they actually used it. Every layout change was a bet placed with someone else's money, and if the app annoys a worker mid-harvest, it's the first thing to go. Her rule: keep the existing layout wherever you can, and only change something when you can say exactly why it's better." },
      { t: "p", text: "She also gave us the sharpest rule of the whole project: **Record is where the money is.** Logging boxes at each checkpoint is the entire job of this tool, so count the taps to get there. Our beautiful redesign took **four screens to get from Home to Create Box**, the most common action in the whole system. \"You want as few clicks as possible.\"" },
      { t: "quote", text: "Our beautiful redesign took four screens to reach the most common action in the app. That's not a style problem. That's the whole problem." },
      { t: "motion", text: "A tap counter. A thumb taps through the redesign, screen after screen, and the counter ticks to four. Then the slimmed-down version gets there in fewer." },
    ],
  },
  {
    id: "decision",
    title: "Rebuild, buy, or modify",
    icon: "scale, or an elephant",
    tone: "cream",
    blocks: [
      { t: "p", text: "The critique forced the real question. We had three paths, and we ran them as an actual evaluation instead of a vibe:" },
      { t: "p", text: "**Rebuild from scratch, with our redesign.** Best-looking and the riskiest. It was untested with real users, it was the wrong kind of app, and it took longer to reach the main actions. It would also run well past our two quarters." },
      { t: "p", text: "**Move to a no-code platform.** We gave Retool a serious look. It had a built-in barcode scanner and some Firebase support. But every checkpoint would have been its own separate app, stitched together, it's built for internal tools (which kills any future customer-facing version), it's drag-and-drop in name and JavaScript-heavy in practice, and it would have cost a monthly fee. We also wrote down one question that stuck: *does this do justice to the work previous teams already put in?*" },
      { t: "p", text: "**Modify the existing codebase.** The least glamorous option. It keeps the layout workers already know, keeps the clean architecture, keeps the customer-facing future open, fits the timeline, and does no harm to a workflow we couldn't test directly." },
      { t: "p", text: "Modify won on paper. Then, at the start of spring, we finally got Chuck on a call and showed him both prototypes. He reacted just like our testers: he found the redesign clearer and more user-friendly than the existing app. He also said he'd take an app if we could deliver it by the end of the quarter. We couldn't promise that, so he went with the modified version. The person who had to live with the decision ended up where we had." },
      { t: "p", text: COVID },
      { t: "motion", text: "The team's traffic-light decision matrix, with Kristy's scribbled objections drawing themselves on top, stroke by stroke." },
      {
        t: "gallery",
        items: [
          { src: "/zorzal/decision-matrix.webp", alt: "A traffic-light matrix comparing changing the codebase, a drag-and-drop tool and a new app" },
          { src: "/zorzal/decision-matrix-scribbles.webp", alt: "The same matrix with Kristy's scribbled objections" },
        ],
        caption: "The matrix, and Kristy's take on it.",
      },
    ],
  },
  {
    id: "grief",
    title: "The five stages of shelving a redesign",
    icon: "bull",
    tone: "forest",
    blocks: [
      { t: "p", text: "I'd love to say I took it gracefully. I went through all of it:" },
      {
        t: "list",
        items: [
          "**Anger,** mostly at the communication. We'd spent a quarter planting the garden.",
          "**Denial.** It *does* fit the bill.",
          "**Bargaining.** What if we just tweak this, keep that, ship half of it?",
          "**Acceptance.** Okay. They want this instead.",
        ],
      },
      { t: "p", text: "The silver lining: what Chuck wanted was a much more stripped-down version of what we already had, which turned out to be the simplest thing for us to deliver. I came in wanting to make it beautiful, and the work kept asking me to make it invisible." },
    ],
  },
  {
    id: "overcomplicated",
    part: "Phase two: the build, decision by decision",
    title: "“We overcomplicated the whole converting-to-mobile process!”",
    icon: "snake, or a knot",
    tone: "cream",
    blocks: [
      { t: "p", text: "We got full access to the code and the database at the start of spring and turned \"do no harm\" into screens. This is the part I'd want another designer or engineer to read: the small decisions, and why each one went the way it did." },
      { t: "p", text: "For a while, implementation went sideways. We'd assumed the whole app was broken on phones and were trying to fix everything at once. Our interim fix was even to tell the browser to render the site at 75% zoom, which worked, but it's not a mobile product. It's a desktop product held at arm's length." },
      { t: "p", text: "Then Alice and Kristy audited the app page by page and wrote up what they found. Their memo opens, in all caps: **\"WE OVERCOMPLICATED THE WHOLE CONVERTING-TO-MOBILE PROCESS!\"** Most pages were fine. The breakage was concentrated in a few places: the checkpoint components (Create Box and drying especially), sub-checkpoints that didn't load, and text fields with **fixed pixel widths** that ignored the screen they were on. Some forms even showed the same fields in a *different order* on mobile and desktop, which meant someone, somewhere, had built two different versions." },
      { t: "p", text: "That memo turned a vague goal (\"make it responsive\") into a checklist." },
      { t: "placeholder", text: "The \"WE OVERCOMPLICATED…\" memo, mess and all — screenshot to come", aspect: "16 / 10" },
      { t: "motion", text: "A long tangled to-do list that untangles itself into four checkboxes." },
    ],
  },
  {
    id: "belt",
    title: "The sliding belt",
    icon: "camel",
    tone: "sand",
    blocks: [
      { t: "p", text: "The worst offender on mobile was the checkpoint navigation: a wide bar of buttons that either ran off the screen or squashed itself unreadable. We could hide the checkpoints behind a hamburger menu, but that buries the app's main structure two taps deep. A drawer has the same problem. So we turned the bar into a **horizontal sliding belt** across the top: every checkpoint stays on screen and in thumb's reach, and the overflow slides instead of breaking. It kept the mental model workers already had (checkpoints in a row, in supply-chain order) and let it survive a four-inch screen. We used the same pattern for the actions inside each checkpoint." },
      { t: "motion", text: "A phone, in the style of the Fortuna mockups, with the belt sliding through Fermentación, Secado, Almacén and Contenedores under a flicking thumb." },
      {
        t: "gallery",
        items: [
          { src: "/zorzal/belt-phone.webp", alt: "The stacked checkpoint belt on a phone", phone: true },
          { src: "/zorzal/belt-desktop.webp", alt: "The same build on a desktop, with larger tabs" },
        ],
        caption: "The belt on a phone, and the same build on a desktop.",
      },
    ],
  },
  {
    id: "stack",
    title: "Stack everything, and size it to the screen",
    icon: "giraffe",
    tone: "cream",
    blocks: [
      { t: "p", text: "The forms were laid out sideways (*Farm · Quantity · Submit* across one row), which is fine at 1280px and chaos at 375px. Alice rebuilt them as a single column, every label above its field. On the Aggregate page, \"Complete Lot\" moved *below* the list of scanned boxes, matching the order of the task (scan, scan, scan, complete) and ending the misclicks." },
      { t: "p", text: "I worked on the responsive CSS with Kristy and Alice. Alice and Kristy owned the breakpoints that replaced the 75% zoom, and we swapped fixed pixel widths for relative ones so every field fits the screen it's on. Unsexy work, and the difference between genuinely mobile and a desktop site zoomed out." },
      { t: "motion", text: "A form whose fields slide from a single row into a column as the screen narrows." },
    ],
  },
  {
    id: "spanish",
    title: "Spanish first",
    icon: "dove",
    tone: "cream",
    blocks: [
      { t: "p", text: "Kristy's first code change of the whole project put the navigation into Spanish. She celebrated with ice cream. From there the translation went through the app in passes: checkpoints and buttons, then notifications, then forms. None of us were fluent (Simi's plan B: \"we can just Google translate our way through life\"), so we checked against Spanish-speaking friends." },
      { t: "p", text: "One honest boundary: a *full* translation reaches into the database itself, because every action, checkpoint and form name is stored as data, not code. We translated the interface and documented the database side for the next team, rather than pretending it was done." },
      { t: "img", phone: true, src: "/zorzal/spanish-labels.webp", alt: "Spanish field labels on a phone: Nombre del que Trabaja, Hora de Salida", caption: "\"Nombre del que Trabaja,\" \"Hora de Salida.\"" },
    ],
  },
  {
    id: "phones",
    title: "Real phones, not simulators",
    icon: "deer",
    tone: "sand",
    blocks: [
      { t: "p", text: "To see the app break the way phones actually break it, we ran the database locally and tunneled it out with ngrok, so the work in progress opened on a real Android and a real iPhone without deploying anything. (That's also how I learned what \"ERR_NGROK_3200\" means.) Watching a real thumb miss a real button beats a resized browser window every time." },
      { t: "img", phone: true, src: "/zorzal/ngrok-error.webp", alt: "An Android phone showing an ngrok tunnel-not-found error", caption: "ERR_NGROK_3200: the tunnel had closed before the phone got there." },
    ],
  },
  {
    id: "create-box",
    title: "Fix Create Box before adding anything",
    icon: "ram",
    tone: "cream",
    blocks: [
      { t: "p", text: "Create Box is the front door of the whole system: the first action in fermentation, the moment a batch of cacao enters the record. It was also the buggiest. We made that one function boringly reliable before shipping anything new, because of the rule from week one: if the app fails a worker mid-burst, the app gets abandoned, not the cacao." },
    ],
  },
  {
    id: "chuck",
    title: "Meet Chuck where he already is",
    icon: "sheep",
    tone: "cream",
    blocks: [
      { t: "p", text: "Chuck is the one who actually analyzes the data, and midway through the build we found out he's very good with spreadsheets. The \"proper\" answer would have been dashboards and charts inside the app, but that would have taken longer than we had and been maintained by no one. So we **wired the database to a Google Sheet** and added a Report page with a one-click \"Export to Google Sheets.\" He gets live production data in the tool he already lives in, and future teams can automate whichever of his charts turn out to matter. We built *less*, on purpose." },
      { t: "motion", text: "A busy dashboard mockup (charts, filters, tabs) that collapses into one button: \"Export to Google Sheets.\"" },
      { t: "img", src: "/zorzal/chuck-dashboard.webp", alt: "Phone sketches of a dashboard for Chuck, with an update-database button and a checkpoint timeline", caption: "Simi's and my dashboard sketches for Chuck." },
    ],
  },
  {
    id: "reserve",
    title: "What the reserve told us",
    icon: "llama",
    tone: "forest",
    blocks: [
      { t: "p", text: "Remember the testers asking for color and animation? Later in the spring, the team went down to the Dominican Republic to work alongside Zorzal. What came back, through Chuck (the closest thing we had to the workers' voice), pointed the other way: the job was speed, in Spanish, on the phone already in their hand, in the layout they already knew. Our testers were design-fluent students who wanted delight. Our users were people for whom the app competes with actual cacao. When those two audiences disagree, the users win." },
      { t: "p", text: "So we kept the visual refresh modest. The whole team picked a warm chocolate palette to replace the placeholder greys, with an apricot accent, and we spent the effort we saved on reliability." },
      { t: "quote", text: "Our testers asked for more color and animation. The people actually using it needed fewer taps. Knowing which audience to listen to was the most important design decision of the project." },
      { t: "placeholder", text: "A photo from the Dominican Republic trip — to come", aspect: "3 / 2" },
    ],
  },
  {
    id: "shipped",
    title: "What shipped",
    icon: "hen with chicks",
    tone: "cream",
    blocks: [
      { t: "p", text: "By the end, the tracker worked across screen sizes and in Spanish. Create Box was stable, the FCCI form no longer slid off the edge, the checkpoint and action menus compressed cleanly at every size, the forms were stacked, the chocolate palette was in, and Chuck had his Google Sheets export. On a phone, you now land straight on Record, greeted by \"Select a Checkpoint\" and the belt: the fewest-taps rule from the critique, made real." },
      { t: "p", text: "We presented it on the last day of May in Sweet Hall, with QR codes so the room could open it on their own phones." },
      { t: "motion", label: "✱ Demo reel", text: "A short motion piece of the Zorzal work: the shipped screens, the palette, the belt, the wireframes. Kai is putting this together." },
      {
        t: "gallery",
        items: [
          { src: "/zorzal/final-phone-placeholder.webp", alt: "The final Record screen, in the chocolate palette", phone: true },
          { src: "/zorzal/final-laptop-screen.webp", alt: "The final Record screen on a laptop, with Spanish labels" },
        ],
        caption: "The shipped Record screen. Stand-in shots, taken off a laptop at the final demo; clean phone screenshots to come.",
      },
      { t: "p", text: "It went live, and Zorzal still uses it today. Later teams kept building on top of it. What we could control was the handoff: an operations manual covering the code's structure, the local database workflow and the data model, so the next team got a map instead of an archaeology project, like we had. We also left them a direction. Simi and I sketched the first customer-facing view: scan the code on your chocolate and see the farms it came from and how long it spent at each checkpoint. That's the transparency the whole system was always pointed at." },
      { t: "motion", text: "The \"Start → You!\" journey drawn as one line, a bean travelling along it." },
      { t: "img", src: "/zorzal/customer-journey.webp", alt: "A sketch of a cacao batch's journey from the farm to the customer", caption: "The customer-facing view, sketched: from the farm to \"You!\"" },
    ],
  },
  {
    id: "today",
    title: "Zorzal today",
    icon: "bird in flight",
    tone: "sand",
    blocks: [
      { t: "p", text: "Zorzal is thriving. They were featured in a documentary, *The Birds and the Beans*. They run chocolate excursions where cacao lovers come down to the rainforest for a hands-on walk through the same supply chain our app tracks. They have new buildings, merch, collaborations with chocolatiers, and Chuck is out travelling, telling the story of how a protected bird sanctuary became one of the world's most distinctive fine-flavor origins. A mobile-friendly form tool didn't do that; they did. But it's a good feeling to have built a small working piece of a company you'd want to see win." },
    ],
  },
  {
    id: "taught",
    title: "What it taught me",
    icon: "setting sun",
    tone: "cream",
    blocks: [
      { t: "p", text: "Three things I still carry:" },
      { t: "p", text: "**Count the taps to the money screen.** Every interface has one action that is the entire job. Our redesign was prettier and put that action four screens away. Distance to the core action is the metric that keeps taste honest." },
      { t: "p", text: "**The loudest feedback isn't the truest.** Testers asked for color and animation, and real users needed fewer taps in their own language. Learning whose voice outranks whose, and letting the people on the other end outvote my eye, was worth more than any pattern library." },
      { t: "p", text: "**Restraint is a deliverable.** The best design decision we made was a rebuild we didn't do. The most useful thing I worked on is something nobody who uses it will ever notice." },
      { t: "p", text: "On deadline day, I told the group chat the final report \"WILL BE FINISHED BY SUNDOWN.\" I submitted it at 11:57pm. \"Not a moment too soon! The sun just set.\"" },
    ],
  },
];
