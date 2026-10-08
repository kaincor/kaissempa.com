"use client";

import Image from "next/image";
import {
  AnimatePresence,
  animate,
  motion,
  motionValue,
  useInView,
  useReducedMotion,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "motion/react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * A stack of photographs you swipe through, like a run of photos sent in
 * iMessage: drag the top one off to either side, or tap it, and it tucks in
 * at the back while the next comes up to the front.
 *
 * The cards pop in when the deck comes into view, and then, so the gesture is
 * discoverable without buttons, a small hand slides back and forth saying
 * "Swipe" while the top card demonstrates once by jumping to the back on its
 * own. Both stop for good the moment the reader touches the deck.
 */

export type SwipeCard = { src: string; alt: string };

/** Where a card sits at a given depth in the stack, px and degrees. */
export type Pose = { x: number; y: number; rot: number; scale?: number };

/** A loose pile: the front card nearly square, each one behind it a little more askew. */
function defaultPose(slot: number): Pose {
  if (slot === 0) return { x: 0, y: 0, rot: -2 };
  const k = Math.min(slot, 4);
  const side = k % 2 ? 1 : -1;
  return { x: side * (5 + k * 4), y: -k * 3, rot: side * (3 + k * 1.8), scale: 1 - k * 0.02 };
}

/** Past this far, or this fast, a drag sends the card to the back. */
const THROW_DISTANCE = 70;
const THROW_VELOCITY = 450;
/** When the cards start popping in once the deck is in view, and their spacing. */
const POP_STAGGER = 0.07;
/** How long after the pop the hint comes up, s. */
const HINT_AFTER = 0.5;
/** How long the hint stays up, and when in that time the top card demonstrates, s. */
const HINT_FOR = 1;
const DEMO_AT = 0.35;

const SETTLE = { type: "spring", stiffness: 320, damping: 28 } as const;
const POP = { type: "spring", stiffness: 420, damping: 22 } as const;

export default function SwipeDeck({
  cards,
  poses,
  sizes,
  radius = 14,
  shadow = "0 18px 40px rgba(0, 0, 0, 0.45)",
  label = "Photos",
  onFrontChange,
  style,
}: {
  cards: SwipeCard[];
  /** One pose per depth, front first. Depths past the end reuse the last. */
  poses?: Pose[];
  /** The `sizes` for the images, as next/image wants it. */
  sizes: string;
  radius?: number;
  shadow?: string;
  label?: string;
  /** Called with the index of the card now on top. */
  onFrontChange?: (index: number) => void;
  /** Sizes the deck. The cards fill it. */
  style?: CSSProperties;
}) {
  const n = cards.length;
  const reduced = !!useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const inView = useInView(box, { once: true, amount: 0.6 });
  const shown = reduced || inView;

  /** Card indices, front first. */
  const [order, setOrder] = useState(() => cards.map((_, i) => i));
  const orderRef = useRef(order);

  /** Each card's sideways offset from its pose: the drag, and the throw. */
  const [xs] = useState(() => cards.map(() => motionValue(0)));
  const busy = useRef(false);

  /** Hint: up briefly after the pop, and gone early at the first touch. */
  const [hint, setHint] = useState(false);
  const touched = useRef(false);
  /** Whether the pop is over, after which a change of depth has no delay. */
  const [popped, setPopped] = useState(false);
  const dismiss = useCallback(() => {
    touched.current = true;
    setHint(false);
    setPopped(true);
  }, []);

  useEffect(() => {
    orderRef.current = order;
    onFrontChange?.(order[0]);
  }, [order, onFrontChange]);

  /** Sends the top card off to one side, then to the back of the stack. */
  const cycle = useCallback(
    async (dir: number) => {
      if (busy.current || n < 2) return;
      busy.current = true;
      const front = orderRef.current[0];
      const x = xs[front];
      const w = box.current?.offsetWidth ?? 300;
      await animate(x, dir * w * 1.05, { duration: 0.22, ease: [0.3, 0, 0.6, 1] });
      setOrder((o) => [...o.slice(1), o[0]]);
      animate(x, 0, SETTLE);
      busy.current = false;
    },
    [n, xs],
  );

  // After the pop: the hint comes up, and the top card shows the move once.
  useEffect(() => {
    if (!shown || reduced || n < 2) return;
    const after = (POP_STAGGER * n + HINT_AFTER) * 1000;
    const a = setTimeout(() => {
      setPopped(true);
      if (!touched.current) setHint(true);
    }, after);
    const b = setTimeout(() => !touched.current && cycle(-1), after + DEMO_AT * 1000);
    const c = setTimeout(() => setHint(false), after + HINT_FOR * 1000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
    };
  }, [shown, reduced, n, cycle]);

  const poseAt = (slot: number): Pose =>
    poses ? poses[Math.min(slot, poses.length - 1)] : defaultPose(slot);

  const onDragEnd = (i: number, info: PanInfo) => {
    const { offset, velocity } = info;
    if (Math.abs(offset.x) > THROW_DISTANCE || Math.abs(velocity.x) > THROW_VELOCITY) {
      cycle(Math.sign(offset.x || velocity.x));
    } else {
      animate(xs[i], 0, SETTLE);
    }
  };

  return (
    <div
      ref={box}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${label}. Swipe, tap, or use the arrow keys to see the next.`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        dismiss();
        cycle(e.key === "ArrowLeft" ? -1 : 1);
      }}
      style={{ position: "relative", outline: "none", ...style }}
    >
      {cards.map((card, i) => {
        const slot = order.indexOf(i);
        const pose = poseAt(slot);
        const at = { x: pose.x, y: pose.y, rotate: pose.rot, scale: pose.scale ?? 1 };
        return (
          <motion.div
            key={card.src}
            initial={reduced ? false : { ...at, opacity: 0, scale: 0.6, y: pose.y + 24 }}
            animate={shown ? { ...at, opacity: 1 } : undefined}
            // The pop runs back to front so the top card lands last.
            transition={
              popped
                ? SETTLE
                : { ...POP, delay: (n - 1 - slot) * POP_STAGGER, opacity: { duration: 0.2, delay: (n - 1 - slot) * POP_STAGGER } }
            }
            style={{ position: "absolute", inset: 0, zIndex: n - slot }}
          >
            <Card
              card={card}
              x={xs[i]}
              front={slot === 0}
              sizes={sizes}
              radius={radius}
              // Only the cards that can show one. Deeper in the pile a blurred
              // shadow is hidden under the cards above it but still painted.
              shadow={slot < 3 ? shadow : "none"}
              priority={slot < 2}
              onDragStart={dismiss}
              onDragEnd={(info) => onDragEnd(i, info)}
              onTap={() => {
                dismiss();
                cycle(-1);
              }}
            />
          </motion.div>
        );
      })}

      {/* Off the page entirely once it has faded, not just transparent: its
          frosted blur is costly to keep composited on a phone, and it was
          being redrawn behind the deck on every frame of a scroll past. */}
      <AnimatePresence>{hint && <Hint key="hint" />}</AnimatePresence>
    </div>
  );
}

function Card({
  card,
  x,
  front,
  sizes,
  radius,
  shadow,
  priority,
  onDragStart,
  onDragEnd,
  onTap,
}: {
  card: SwipeCard;
  x: MotionValue<number>;
  front: boolean;
  sizes: string;
  radius: number;
  shadow: string;
  priority: boolean;
  onDragStart: () => void;
  onDragEnd: (info: PanInfo) => void;
  onTap: () => void;
}) {
  // Leans into the drag, the way a photo pivots under a thumb.
  const rotate = useTransform(x, [-240, 0, 240], [-10, 0, 10]);
  return (
    <motion.div
      drag={front ? "x" : false}
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={(_, info) => onDragEnd(info)}
      onTap={front ? onTap : undefined}
      style={{
        x,
        rotate,
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        overflow: "hidden",
        boxShadow: shadow,
        background: "#1a1a1a",
        cursor: front ? "grab" : undefined,
        // Vertical swipes still scroll the page on a phone.
        touchAction: "pan-y",
        // Its own layer only on top, the one card that moves under a finger.
        willChange: front ? "transform" : undefined,
      }}
      whileDrag={{ cursor: "grabbing" }}
    >
      <Image
        src={card.src}
        alt={card.alt}
        fill
        sizes={sizes}
        quality={85}
        loading={priority ? "eager" : "lazy"}
        style={{ objectFit: "cover", pointerEvents: "none" }}
        draggable={false}
      />
    </motion.div>
  );
}

/** A roughly drawn pointing hand and "SWIPE!", sliding back and forth over the bottom of the deck. */
function Hint() {
  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "12%",
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <motion.div
        animate={{ x: [-18, 18] }}
        transition={{ duration: 0.5, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
        className="display"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "6px 14px 6px 9px",
          borderRadius: 999,
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          color: "#f2f2f2",
          fontSize: 15,
          lineHeight: 1,
          letterSpacing: "0.04em",
        }}
      >
        <SketchHand />
        SWIPE!
      </motion.div>
    </motion.div>
  );
}

/**
 * A pointing hand drawn the way a pen would: a wobbly outline that does not
 * quite close, a second pass slightly off the first, and the knuckle lines
 * stopping short.
 */
function SketchHand() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 32 32"
      fill="none"
      stroke="#f2f2f2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        strokeWidth="1.7"
        d="M12.9 3.3C14.5 2.5 16 3.5 16.1 5.1l.3 8.4c.5-1.3 2.8-1.3 3.2.3.7-1.1 2.8-.8 3.1 1 .9-.8 2.8-.3 2.9 1.7l-.2 5c-.3 4.4-3.3 7.3-7.7 7.4l-2.4-.1c-2.7-.1-4.3-1.3-5.7-3l-4.1-5.6c-.8-1.2-.4-2.6.9-3 1-.3 1.9.2 2.6 1.1l1.5 1.9-.2-15.1c0-1.2 1-1.9 2.4-2.1"
      />
      <path
        strokeWidth="1"
        opacity="0.5"
        d="M10.9 5.6c.2-1.7 1.6-2.6 3.3-2.5M25.8 18.4c.1 4.9-2.8 9.9-8.3 10.4M5.8 18.1c.6-.3 1.4-.1 2.1.5"
      />
      <path strokeWidth="1.3" d="M16.4 13.6l.2 3.4M19.6 14l.1 3.2M22.7 15.3l-.1 2.6" />
    </svg>
  );
}
