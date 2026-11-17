/**
 * The Mark of the Witch case study, from the team's write-up, rules, group
 * chat and Kai's ideation (assets/Case Studies/Mark of the Witch), told in
 * Kai's voice. One line through it: a pitch, two prototypes that broke, the
 * pivot that made the game, and the box Kai made to put it in.
 */

const C = "/mark-of-the-witch/cards/";

/** The thirteen spells, in the order they fan out of the box (Peek on top). */
export const SPELLS = [
  { src: `${C}peek.webp`, name: "Peek" },
  { src: `${C}divination.webp`, name: "Divination" },
  { src: `${C}curse.webp`, name: "Curse" },
  { src: `${C}swap.webp`, name: "Swap" },
  { src: `${C}confuse.webp`, name: "Confuse" },
  { src: `${C}counter-hex.webp`, name: "Counter Hex" },
  { src: `${C}swim-the-witch.webp`, name: "Swim the Witch" },
  { src: `${C}mass-hysteria.webp`, name: "Mass Hysteria" },
  { src: `${C}false-witness.webp`, name: "False Witness" },
  { src: `${C}familiars-bond.webp`, name: "Familiar’s Bond" },
  { src: `${C}banishment.webp`, name: "Banishment" },
  { src: `${C}repentance.webp`, name: "Repentance" },
  { src: `${C}warding-circle.webp`, name: "Warding Circle" },
];

export const LEDE =
  "A social deduction game set in a fourteenth-century witch hunt. Five of us made it in under three weeks for a Stanford game design class. I made the box, and the renders.";

export type Block =
  | { kind: "p"; text: string }
  | { kind: "pull"; text: string }
  | { kind: "cards"; names: string[]; caption: string }
  | { kind: "figure"; src: string; w: number; h: number; caption: string; narrow?: boolean }
  | { kind: "pair"; items: { src: string; w: number; h: number }[]; caption: string }
  | { kind: "renders" }
  | { kind: "placeholder"; text: string };

export type Section = { id: string; title: string; blocks: Block[] };

export const SECTIONS: Section[] = [
  {
    id: "pitch",
    title: "The pitch",
    blocks: [
      {
        kind: "p",
        text: "My first pitch was a whodunnit. Everyone pulls an identical token out of a little felt bag, and one of them, turned over, carries the mark of the witch. You read out a testimony card, lie your way through its gaps, and the town votes someone to the pyre. If the pyre lights up, you burned the witch. If it doesn’t, a new day begins, and the town has blood on its hands.",
      },
      { kind: "p", text: "The team loved the witch hunt. Almost everything else had to go." },
    ],
  },
  {
    id: "prototypes",
    title: "Two prototypes that broke",
    blocks: [
      {
        kind: "p",
        text: "To see how drawing and playing cards would sit next to a trial, we modded Love Letter. It had too many rules and moved too slowly, and across two playtests we barely got anyone to a trial, which was the whole point.",
      },
      {
        kind: "p",
        text: "Our narrative version was a murder mystery in a village called Ashwood Hollow, with testimony cards for every character. It was fun exactly once. After that, you knew everyone’s alibi.",
      },
    ],
  },
  {
    id: "pivot",
    title: "The pivot",
    blocks: [
      {
        kind: "p",
        text: "So we split the town into teams. You’re a witch or a villager, and you only know your own role, so the witches have to find each other too. Then there’s the Martyr, who wins by getting burned.",
      },
      {
        kind: "p",
        text: "Every card became a spell for getting information. On your turn you draw, then either cast a spell or throw one away to put someone on trial. Each player gets one sentence of testimony, then the whole table votes at once, on the count of three. One finger, innocent. Two, guilty.",
      },
      {
        kind: "cards",
        names: ["Peek", "Divination", "Swim the Witch"],
        caption: "Peek at a hand, divine a role, or skip the testimony and swim the witch.",
      },
      { kind: "pull", text: "Speak, deceive, survive." },
    ],
  },
  {
    id: "box",
    title: "The box",
    blocks: [
      {
        kind: "p",
        text: "I took on the packaging. I wanted it to look like it had been printed by someone who believed in witches: a woodcut in black ink on old paper, townsfolk at the edges, a goat leaping over a cottage, and the title in red. I drew it in Procreate and finished it in Facetune.",
      },
      {
        kind: "p",
        text: "The box is the size of a deck of cards, so the whole game fits in a pocket.",
      },
      {
        kind: "pair",
        items: [
          { src: "/mark-of-the-witch/cover.webp", w: 1072, h: 1500 },
          { src: "/mark-of-the-witch/box-front.webp", w: 1042, h: 1458 },
        ],
        caption: "An earlier cover, left, and the one we printed, with the title in red and the tagline along the foot.",
      },
    ],
  },
  {
    id: "renders",
    title: "The renders",
    blocks: [
      {
        kind: "p",
        text: "Then I set the box and the cards in a studio and rendered them. Each render took over half an hour on my laptop, so I moved to the iMacs in the computer cluster, which were a lot quicker.",
      },
      { kind: "renders" },
    ],
  },
  {
    id: "shelved",
    title: "What we shelved",
    blocks: [
      {
        kind: "p",
        text: "We also designed a few pieces to make by hand, laser cut, 3D printed and turned on a lathe. A couple got made before we shelved them.",
      },
      { kind: "placeholder", text: "I can’t find the pictures right now, but I’ll upload them soon." },
    ],
  },
];

/** The renders, 1 to 12 (public/mark-of-the-witch/renders), all 4:3. */
export const RENDERS = Array.from({ length: 12 }, (_, i) => ({
  src: `/mark-of-the-witch/renders/${i + 1}.jpg`,
  w: 2000,
  h: i === 0 ? 1511 : 1500,
}));

export const TEAM = [
  { name: "Kai Ssempa", part: "Packaging and renders" },
  { name: "Hannah Yu", part: "Playbook and spell cards" },
  { name: "Izzy Meyerson", part: "Research and spell cards" },
  { name: "Zander Majercik", part: "Rules and balance" },
  { name: "Gracielly Abreu", part: "Role cards and the tagline" },
];
