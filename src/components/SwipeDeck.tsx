"use client";

import Image from "next/image";
import {
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
/** How long after the pop the hint and the demonstration begin, s. */
const HINT_AFTER = 0.5;

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

  /** Hint: on after the pop, off for good at the first touch. */
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
    const b = setTimeout(() => !touched.current && cycle(-1), after + 700);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
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
              shadow={shadow}
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

      <Hint on={hint} />
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
        willChange: "transform",
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

/** A pointing hand and "Swipe", sliding back and forth over the bottom of the deck. */
function Hint({ on }: { on: boolean }) {
  return (
    <motion.div
      aria-hidden="true"
      initial={false}
      animate={{ opacity: on ? 1 : 0 }}
      transition={{ duration: 0.35 }}
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
        animate={on ? { x: [-22, 22] } : { x: 0 }}
        transition={on ? { duration: 1.1, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" } : { duration: 0.3 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 14px 7px 10px",
          borderRadius: 999,
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          color: "#f2f2f2",
          fontSize: 14,
          lineHeight: 1,
          letterSpacing: "0.01em",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 9.5V4a2 2 0 0 0-4 0v10l-1.6-1.6a2 2 0 0 0-2.83 2.82l3.6 3.6C6.66 20.3 8.35 22 12 22h2a8 8 0 0 0 8-8v-3a2 2 0 1 0-4 0v-1a2 2 0 0 0-4 0V9a2 2 0 0 0-4 0z" />
          <path d="M10 9.5V12M14 10v2M18 11v1.5" fill="none" />
        </svg>
        Swipe
      </motion.div>
    </motion.div>
  );
}
