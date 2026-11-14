/**
 * The Pond Mage case study, from Kai's project write-up and process deck
 * (assets/Case Studies/Pond Mage), retold in his voice. Process images are
 * the deck's own, at the size they were embedded.
 */

import type { RosePlace } from "@/components/pond-mage/RoseHeading";

export type Figure = { src: string; w: number; h: number; caption: string };
export type Section = {
  id: string;
  title: string;
  body: string[];
  figures?: Figure[];
  /** One of Kai's roses, growing on a letter of the heading. */
  rose?: RosePlace;
  /** Photos to swipe through, in place of figures. */
  deck?: { src: string; alt: string }[];
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
    rose: { c: "D", at: 0, u: 0.15, v: 0.92, w: 1.1, mirror: true },
    body: [
      "I love mixed media, like 2D characters in a 3D setting, or (other example). So since this project had to be entirely in 3D, I knew from the beginning I was going for a blend of stylized + realistic.",
      "Having a little lake or swamp there too would be one of the best ways for us to show off Cycles’ ray-tracing capabilities. I also wanted to explore dramatic lighting setups: dim area lighting coupled with stronger point lighting to illuminate our character.",
      "I've seen a lot of Reels with Blender art so I feel like I already had plenty of stuff to pull from.",
      "My early ideas bounced between a murky swamp, a raft on a moonlit river, or somewhere on campus—like Lake Lagunita. It just had to be by a body of water.",
      "To be human or not to be human became the big question for my mage, who was set to star as our lead character and main piece of geometry. Uncanny valley can be pretty hard to avoid, and the last thing I wanted was an off-putting model. I forwent uncanny valley entirely by choosing to make our mage a whimsical, fantastical creature.",
    ],
    figures: [pr("bed", 1183, 599, "An early version: the mage on a bed, floating in the middle of a lake.")],
  },
  {
    id: "lagunita",
    title: "Lake Lagunita",
    rose: { c: "E", at: 12, u: 1.3, v: 1.08, w: 1.5 },
    body: [
      "I wanted the scene to be modelled on somewhere at Stanford, and Lake Lagunita felt like the right choice, because I love it. It ebbs and flows with the seasons: the winter rain fills it, by summer it drains back to a meadow, and every time I go it's somewhere in between, blue or marshy or gold, often under one of the best sunsets on campus.",
      "I love it so much I have a whole album of it. Here's most of it.",
    ],
    deck: [
      { src: "6383", alt: "Lake Lagunita full and blue, with green grass on its banks" },
      { src: "5887", alt: "Sunset over Lake Lagunita, the sky pink and orange in the water" },
      { src: "0456", alt: "Lake Lagunita as a marsh, pools of water in tall green grass" },
      { src: "4387", alt: "A bike leaning on a lamp post by the path along Lake Lagunita" },
      { src: "5888", alt: "Dusk at Lake Lagunita, reeds dark against the lit water" },
      { src: "4385", alt: "Lake Lagunita drying out, a thin sheet of water on the grass" },
      { src: "0459", alt: "Tall grass where Lake Lagunita has drained, under a clear sky" },
      { src: "2861", alt: "A plate of lunch held up over the marshy lake" },
      { src: "1780", alt: "A takeout box on the grass by the lake at sunset" },
      { src: "9736", alt: "The sun going down behind the trees across Lake Lagunita" },
    ],
  },
  {
    id: "mage",
    title: "The mage",
    rose: { c: "C", at: 4, u: 0.55, v: -0.28, w: 1.01 },
    body: [
      "She's the main piece of geometry and where most of the hours went. I learned booleans, sculpting and the LoopTools add-on on her, partly by following a modelling time-lapse slowed to a quarter speed.",
      "When I showed people a later version, not one of them read her hat as a hat. Everyone saw a horn. A brim fixed it.",
    ],
    figures: [
      pr("base", 1531, 1600, "The base of the mage, where the scene began."),
      pr("horn", 1344, 689, "A later version, with the hat everyone read as a horn."),
      pr("skin-nodes", 1022, 509, "The shader nodes behind her skin."),
    ],
  },
  {
    id: "landscape",
    title: "The field",
    rose: { c: "B", at: 8, u: 0.9, v: 0.2, w: 0.44 },
    body: [
      "The field is one grass model, scattered across the ground with geometry nodes instead of placed by hand. I gave the setup sliders for how dense the grass and the red flowers grow, with some randomness, so I could thin and thicken patches on the fly and keep it from looking planted in rows. It saved hours of nudging blades around.",
      "Under the surface, the ground dips below zero so the pond can fill the hollow.",
    ],
    figures: [
      pr("geometry-nodes", 1277, 655, "The geometry nodes, with the density sliders on the right."),
      pr("ground", 1344, 691, "Below ground, the plane dips so the pond can fill it."),
    ],
  },
  {
    id: "wand",
    title: "The wand",
    rose: { c: "D", at: 4, u: 0.3, v: 0.0, w: 0.97 },
    body: [
      "It's a sliver of the frame, but it's the whole reason the frog is floating, so it got extra attention. I started from a cylinder, stretched and subdivided it, then scraped and sanded it with the sculpt tools until it read as a slim stick. Then I UV-unwrapped it and gave it a material as stick-like as a stick can be.",
    ],
    figures: [pr("wand", 974, 588, "Sculpting the wand.")],
  },
  {
    id: "magic",
    title: "The magic",
    rose: { c: "E", at: 8, u: 1.45, v: 1.0, w: 1.41 },
    body: [
      "The spell is a particle system: a handful of icospheres with an emission layer for the glow, scattered through a field around the frog. The first version stood straight up, and people saw a peculiar pillar of fireflies, not magic. I moved it so it streams from the wand instead.",
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
