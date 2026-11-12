/**
 * The Pond Mage case study, from Kai's project write-up and process deck
 * (assets/Case Studies/Pond Mage), retold in his voice. Process images are
 * the deck's own, at the size they were embedded.
 */

export type Figure = { src: string; w: number; h: number; caption: string };
export type Section = {
  id: string;
  title: string;
  body: string[];
  figures?: Figure[];
  /** Photos to swipe through, in place of figures. */
  deck?: { src: string; alt: string }[];
};

const pr = (name: string, w: number, h: number, caption: string): Figure => ({
  src: `/pond-mage/process/${name}.jpg`,
  w,
  h,
  caption,
});

export const LEDE = "A young mage sneaks out to the pond at night to practise her magic, and a frog floats up off the water.";

export const FACTS = [
  { label: "Role", value: "3D modeling, texturing and lighting" },
  { label: "Year", value: "2024" },
  { label: "Tools", value: "Blender, rendered in Cycles" },
  { label: "Scope", value: "Every object modelled and textured from scratch, except the grass and the frog" },
];

export const SECTIONS: Section[] = [
  {
    id: "idea",
    title: "The idea",
    body: [
      "I wanted a stylised character in a realistic world, by water, so the scene could show off what Cycles' ray tracing does with reflections, under dim area light with stronger point lights picking out the character. Early ideas went from a murky swamp to a raft on a moonlit river. One version had the mage sitting on a bed in the middle of a lake. How she got there, nobody knows.",
      "The bigger question was whether she'd be human. People in 3D fall into the uncanny valley fast, even for studios with far bigger budgets, so I stepped around it: she's a whimsical little creature instead. The last nudge was a photo in my camera roll of a frog in a witch's hat.",
    ],
    figures: [pr("bed", 1183, 599, "An early version: the mage on a bed, floating in the middle of a lake.")],
  },
  {
    id: "lagunita",
    title: "Lake Lagunita",
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
    body: [
      "It's a sliver of the frame, but it's the whole reason the frog is floating, so it got extra attention. I started from a cylinder, stretched and subdivided it, then scraped and sanded it with the sculpt tools until it read as a slim stick. Then I UV-unwrapped it and gave it a material as stick-like as a stick can be.",
    ],
    figures: [pr("wand", 974, 588, "Sculpting the wand.")],
  },
  {
    id: "magic",
    title: "The magic",
    body: [
      "The spell is a particle system: a handful of icospheres with an emission layer for the glow, scattered through a field around the frog. The first version stood straight up, and people saw a peculiar pillar of fireflies, not magic. I moved it so it streams from the wand instead.",
    ],
    figures: [pr("fireflies", 997, 488, "The first particle system: the pillar of fireflies.")],
  },
  {
    id: "camera",
    title: "The camera",
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
