/**
 * The Pond Mage case study, from Kai's project write-up and process deck
 * (assets/Case Studies/Pond Mage), retold in his voice. Process images are
 * the deck's own, at the size they were embedded.
 */

import type { RosePlace } from "@/components/pond-mage/RoseHeading";

export type Figure = {
  src: string;
  w: number;
  h: number;
  caption: string;
  /** Shown printed on handmade paper instead (scripts/pond-mage-paper.py). */
  paper?: { src: string; w: number; h: number };
};
export type Section = {
  id: string;
  title: string;
  /** Kept for screen readers only: the section runs straight on from the rule above. */
  hideTitle?: boolean;
  body: string[];
  figures?: Figure[];
  /** One of Kai's roses, growing on a letter of the heading. */
  rose?: RosePlace;
  /** Photos to swipe through, in place of figures. */
  deck?: { src: string; alt: string }[];
  /** Carries on from the section before: no heading, and no drop cap. */
  cont?: boolean;
  /** One caption under all the figures, in place of their own. */
  caption?: string;
  /** Photos printed on handmade paper, dealt out like cards. */
  paper?: { src: string; alt: string; w: number; h: number }[];
};

const pr = (name: string, w: number, h: number, caption: string): Figure => ({
  src: `/pond-mage/process/${name}.jpg`,
  w,
  h,
  caption,
});

export const LEDE = "A young mage practices her magic by the pond’s edge";

export const SECTIONS: Section[] = [
  {
    id: "idea",
    title: "Ideation",
    hideTitle: true,
    rose: { c: "D", at: 0, u: 0.15, v: 0.92, w: 1.1, mirror: true },
    body: [
      "I love mixed media, like 2D characters in a 3D setting, or a blend of stylized and realistic aesthetics. So I knew from the beginning I was going for a blend of both for the scene.",
      "Having a little lake or swamp there would be a great way to show off Cycles’ ray-tracing capabilities. I was thinking dim area lighting coupled with stronger point lighting to illuminate the character.",
      "To be human or not to be human became the big question for my mage, who was set to star as the main piece of geometry. Uncanny valley can be pretty hard to avoid and the last thing I wanted was an off-putting model. I forwent uncanny valley entirely by choosing to make our mage a whimsical creature.",
    ],
    figures: [
      {
        ...pr("bed", 1183, 599, "An early version of our scene had the mage sitting atop a bed floating in the middle of a lake. As for how she got there? We’ll never know."),
        paper: { src: "/pond-mage/process/bed-paper.webp", w: 1800, h: 1035 },
      },
    ],
  },
  {
    id: "lagunita",
    title: "Lake Lagunita",
    cont: true,
    body: [
      "Lake Lagunita is one of my favorite spots on campus. It’s seen my sunset bike rides, my Valentine’s day dinner dates, my heavy bench side conversations, my Bible study bonfires.",
      "I have a truck ton of pictures of the lake 🛻 I based the scene’s setting off of it.",
    ],
    paper: [
      { src: "/pond-mage/lagunita/paper-2861.webp", w: 710, h: 1200, alt: "A plate of lunch held up over the marshy lake" },
      { src: "/pond-mage/lagunita/paper-5888.webp", w: 900, h: 1200, alt: "Dusk at Lake Lagunita, reeds dark against the lit water" },
      { src: "/pond-mage/lagunita/paper-6383.webp", w: 900, h: 1200, alt: "Lake Lagunita full and blue, with green grass on its banks" },
      { src: "/pond-mage/lagunita/paper-0456.webp", w: 1200, h: 942, alt: "Lake Lagunita as a marsh, pools of water in tall green grass" },
    ],
  },
  {
    id: "mage",
    title: "The Field, the Mage, and the Magic.",
    rose: { c: "B", at: 8, u: 0.9, v: 0.2, w: 0.44 },
    body: [
      "The mage was the main piece of geometry, so most of the time went into booleans, slight sculpting, and LoopTools. I slowed down a timelapse tutorial to 0.25x for reference.",
      "When I showed some friends an early version, not one of them read her hat as a hat. Everyone saw a horn. Adding a little brim fixed it.",
    ],
    figures: [
      pr("base", 1531, 1600, "A tadpole: the base of the mage."),
      pr("horn", 1344, 689, "A later version of the mage, with the hat everyone read as a horn."),
    ],
    caption:
      "A tadpole, a later version of the mage. Viewers felt like the mage’s hat looked like a horn—not a single person thought it was a hat. I reworked it to have a hat-like brim.",
  },
  {
    id: "landscape",
    title: "The field",
    cont: true,
    body: [
      "For the landscape, I placed a singular grass model into a geometry node system so we could spread it around the plane.",
    ],
    figures: [
      pr("geometry-nodes", 1277, 655, "A peek into the handy geometry nodes we arranged to spread the greenery across the landscape. On the right of the screen sits the sliders I created to allow myself to adjust the density of the grass and red flowers on the fly. Working with geometry nodes saved me tons of time."),
    ],
  },
  {
    id: "wand",
    title: "The wand",
    cont: true,
    body: [
      "The wand makes up a small part of the final scene, but it’s still pretty instrumental. I started off with a cylinder, stretched and subdivided it, then scraped and sanded it down. Then I UV-unwrapped it and gave it a material as stick-like as a stick could be.",
    ],
    figures: [pr("wand", 974, 588, "Sculpting the wand.")],
  },
  {
    id: "magic",
    title: "The magic",
    cont: true,
    body: [
      "The spell is a particle system of a handful of icospheres with an emission layer to give it that glowy effect. Viewers felt that this version looked more like a peculiar pillar of fireflies than a magical aura. I reworked it so it looks like it’s emanating from the wand itself.",
    ],
    figures: [pr("fireflies", 997, 488, "The first particle system: the pillar of fireflies.")],
  },
  {
    id: "camera",
    title: "The camera",
    rose: { c: "C", at: 9, u: 1.05, v: -0.3, w: 1.01, mirror: true },
    body: [
      "Depth of field keeps the mage and the frog sharp and lets everything else go soft, which makes the frame feel more cinematic, and a little like a toy. An alternate take used a different angle and an orthographic camera, but the blur swallowed the frog.",
    ],
    figures: [
      {
        src: "/pond-mage/alternate.jpg",
        w: 1920,
        h: 1080,
        caption: "The alternate take. The frog, top right, all but lost to the blur.",
      },
    ],
  },
  {
    id: "cut",
    title: "What didn't make it",
    rose: { c: "D", at: 0, u: 0.1, v: 0.95, w: 1.06 },
    body: [
      "I spent a long time with the physics engine trying to give her a cloth outfit, with a fabric material to go with it. Neither made the final render, but working out the physics was half the fun. Nor did a green mage with a metaball frog, or a very cute cartoon frog, which I swapped for a realistic one when people kept not recognising it as a frog.",
    ],
    figures: [
      pr("cloth", 1383, 1008, "Testing a cloth simulation for her outfit."),
      pr("wicked", 1185, 717, "The mage looking very Wicked, with a metaball frog in front."),
      pr("cute-frog", 1344, 690, "The cute frog, before a realistic one replaced it."),
    ],
  },
];

/** Photos of the work in progress, at home and on campus. */
/** The rose on the "At the desk" heading. */
export const DESK_ROSE: RosePlace = { c: "B", at: 0, u: 0.12, v: 0.2, w: 0.48 };

export const DESK = [
  { src: "3067", w: 788, h: 1400 },
  { src: "3158", w: 788, h: 1400 },
  { src: "3174", w: 788, h: 1400 },
  { src: "3175", w: 788, h: 1400 },
  { src: "3181", w: 788, h: 1400 },
  { src: "3068", w: 788, h: 1400 },
];

export const CREDITS: { label: string; items: { name: string; href: string }[] }[] = [
  {
    label: "Models",
    items: [
      { name: "Grass and flowers by ChuckCG", href: "https://chuckcg.gumroad.com/l/joGTC" },
      { name: "Frog from Free3D", href: "https://free3d.com/3d-model/frog-v1--64825.html" },
    ],
  },
  {
    label: "Tutorials",
    items: [
      { name: "SouthernShotty", href: "https://youtu.be/BZWlD3d17WA" },
      { name: "Glen Madden", href: "https://youtu.be/BIHvaJPwrsU" },
      { name: "ChuckCG", href: "https://youtu.be/7pGcFvcSE1c" },
      { name: "Doodlephile", href: "https://youtu.be/xTf_3F9wIr8" },
    ],
  },
];
