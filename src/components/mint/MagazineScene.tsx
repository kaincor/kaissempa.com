"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import type { CoverRect } from "./MintIntro";
import { LAST_RIGHT, LEAVES } from "./pages";

/**
 * The Mint Magazine case study: Kai's issue floating in mid-air at a slight
 * angle. Drag a page (or tap it) to turn it.
 *
 * The magazine is a stack of leaves on a spine. Each leaf is the right page
 * of one spread on its front and the left page of the next on its back, so
 * the cover's back is the first spread's left page, and so on. The last right
 * page is glued down: the issue ends open on its final spread rather than
 * closing onto the back cover.
 *
 * A leaf is a strip bent along its width, solved every frame from one angle
 * at the spine and a bend that lets the free edge lead while it is held and
 * trail while it falls. One light, above and to the left, casts the shadows,
 * so a lifting page throws its shadow across the spread.
 *
 * It starts square to the screen, so the opening montage's flat cover card
 * can sit exactly over it, then tilts into its resting angle once `play`.
 */

/** 8.5 x 11 in, in metres; the width follows Kai's spreads, 3036 x 4116. */
const PAGE_H = 0.279;
const PAGE_W = (PAGE_H * 3036) / 4116;
/** Paper thickness, exaggerated a touch so the stacks read. */
const LEAF_T = 0.0014;
/** The back cover board under the right-hand stack. */
const BASE_T = 0.0022;
const SEGMENTS = 48;
/**
 * Uncoated paper: rough enough that the key light never shows as a sheen
 * across the photos at the book's resting angle.
 */
const PAPER_ROUGH = 0.96;
/**
 * How high an open page arches up off the gutter before settling towards its
 * edge, in metres: enough that the spread isn't ironed flat.
 */
const ARCH = 0.0075;
/** The arch across a page, 0 at the spine and at the edge, highest a little short of the middle. */
const archAt = (s: number) => Math.sin(Math.PI * Math.pow(THREE.MathUtils.clamp(s, 0, 1), 0.8));

/**
 * Page images: full size on a desktop, about half on a phone, where a page is
 * never more than a few hundred pixels tall and the graphics memory is tight.
 */
const PAGES = "/mint/pages/";
const PAGES_SM = "/mint/pages-sm/";

const FOV = 35;

/**
 * The book's poses. The pages lie in the book's own xz plane, facing +y;
 * standing it up (a quarter turn about x) faces them to the camera.
 * Square: flat on to the screen. Resting: tipped back so it is seen a little
 * from above, turned a little to the left, and leaning a touch.
 */
const SQUARE = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
const RESTING = new THREE.Quaternion()
  .setFromEuler(new THREE.Euler(0, -0.26, 0.04))
  .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 - 0.42, 0, 0)));
const TILT_S = 1.5;

/** Height of the closed cover above the back cover, in the book's frame. */
const COVER_Y = BASE_T + LEAVES.length * LEAF_T + 0.0004;

type SceneProps = {
  /** Start tilting into the resting pose (and take input). */
  play: boolean;
  /** Phones: scrolling the page turns the pages too. */
  scrollTurn: boolean;
  /** The closed cover's size on screen, square on, once the pages are loaded. */
  onCover: (r: CoverRect) => void;
  /** Four squares to keep at the magazine's corners, shown while it is hovered. */
  corners?: RefObject<HTMLDivElement | null>;
};

export default function MagazineScene({ play, scrollTurn, onCover, corners }: SceneProps) {
  return (
    <Canvas
      // PCF: three.js has dropped the soft variant and warned about it on
      // every frame; the shadow radius below does the softening.
      shadows={{ type: THREE.PCFShadowMap }}
      // Capped at 1.5: on a retina screen 2x would be nearly twice the pixels
      // to light and shade for no difference anyone can see at this size.
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: FOV, near: 0.02, far: 20 }}
      // Vertical drags still scroll the page; sideways ones turn it.
      style={{ touchAction: "pan-y", cursor: play ? "grab" : "default" }}
      onCreated={({ gl }) => {
        // Neutral rather than ACES, which desaturated the photos and left the
        // pages looking glazed.
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.0;
        gl.setClearColor(0x000000, 0);
      }}
    >
      <CameraRig />
      <Lights />
      <Suspense fallback={null}>
        <Magazine play={play} scrollTurn={scrollTurn} onCover={onCover} corners={corners} />
      </Suspense>
      {/* A soft shadow on the floor far below, so it reads as floating. */}
      <FloorShadow />
    </Canvas>
  );
}

/**
 * A soft shadow far below the book, so it reads as floating: one blurred
 * ellipse painted once, in place of a contact shadow that re-renders the
 * whole book from below every frame. The book only bobs a few millimetres,
 * so a shadow that holds still is indistinguishable.
 */
function FloorShadow() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 64, 0, 128, 64, 128);
    grad.addColorStop(0, "rgba(0,0,0,0.34)");
    grad.addColorStop(0.45, "rgba(0,0,0,0.16)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.setTransform(1, 0, 0, 0.5, 0, 32);
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh position={[0, -0.26, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
      <planeGeometry args={[0.75, 0.3]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/** How far back the camera sits so the open spread fits with room round it. */
function fitDistance(aspect: number) {
  const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const wide = 2 * PAGE_W * (aspect < 0.8 ? 1.05 : 1.4);
  const tall = PAGE_H * (aspect < 0.8 ? 1.4 : 1.42);
  return Math.max(wide / (2 * tan * aspect), tall / (2 * tan));
}

/** Straight on, at the book's height. */
function CameraRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(0, 0, fitDistance(size.width / size.height));
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function Lights() {
  const sun = useRef<THREE.DirectionalLight>(null);
  useEffect(() => {
    const l = sun.current!;
    l.target.position.set(0, 0, 0);
    l.target.updateMatrixWorld();
    const c = l.shadow.camera;
    c.left = -0.4;
    c.right = 0.4;
    c.top = 0.4;
    c.bottom = -0.4;
    c.near = 0.1;
    c.far = 4;
    c.updateProjectionMatrix();
  }, []);
  return (
    <>
      <hemisphereLight args={["#ffffff", "#9d9d9d", 0.9]} />
      {/* The key, above and to the left, in front: the only shadow caster. */}
      <directionalLight
        ref={sun}
        position={[-0.55, 0.75, 0.95]}
        intensity={2.2}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.002}
        shadow-radius={5}
      />
      {/* A soft fill from the right, so the far page isn't lost. */}
      <directionalLight position={[0.7, 0.1, 1]} intensity={0.55} color="#ffffff" />
    </>
  );
}

/** How much page scroll turns one page, as a share of the screen's height. */
const SCROLL_STEP = 0.6;

type Leaf = {
  theta: number;
  /** Where the finger has the page, while held; the page follows it with a little lag. */
  grab: number;
  /** Which way it was last pulled, +1 forward, -1 back. */
  dir: number;
  vel: number;
  target: number;
  bend: number;
  held: boolean;
};

function loadPage(t: THREE.Texture) {
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function Magazine({ play, scrollTurn, onCover, corners }: SceneProps) {
  const P = scrollTurn ? PAGES_SM : PAGES;
  const urls = useMemo(() => [...LEAVES.flat(), LAST_RIGHT].map((n) => `${P}${n}.jpg`), [P]);
  const tex = useTexture(urls, (ts) => (Array.isArray(ts) ? ts : [ts]).forEach(loadPage));
  const byName = (n: string) => tex[urls.indexOf(`${P}${n}.jpg`)];

  /**
   * The shape each page was last solved for. A page lying still keeps its
   * shape, so it is only re-solved (and its normals recomputed) when it moves.
   */
  const solved = useRef<string[]>([]);
  const leaves = useRef<Leaf[]>(
    LEAVES.map(() => ({ theta: 0, grab: 0, dir: 1, vel: 0, target: 0, bend: 0, held: false })),
  );
  /**
   * Where the reader is in the issue, in pages turned: 0 closed, 1 with the
   * cover turned, and so on. Fractions are pages part way over, which only
   * scrolling leaves. Each leaf falls towards its share of it.
   */
  const pos = useRef(0);
  const book = useRef<THREE.Group>(null);
  const float = useRef<THREE.Group>(null);
  const backCover = useRef<THREE.Group>(null);
  const spine = useRef<THREE.Group>(null);
  const playing = useRef({ on: play, since: -1 });
  useEffect(() => {
    playing.current.on = play;
  }, [play]);
  const shade = useRef<THREE.MeshBasicMaterial>(null);
  const meshes = useRef<{ front: THREE.Mesh; back: THREE.Mesh }[]>([]);

  // One geometry pair per leaf: the back shares the front's positions and
  // normals, with its texture mirrored so it reads correctly once turned.
  const geos = useMemo(
    () =>
      LEAVES.map(() => {
        const front = new THREE.PlaneGeometry(PAGE_W, PAGE_H, SEGMENTS, 1);
        const back = new THREE.BufferGeometry();
        back.setIndex(front.getIndex());
        back.setAttribute("position", front.getAttribute("position"));
        back.setAttribute("normal", front.getAttribute("normal"));
        const uv = front.getAttribute("uv").clone();
        for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
        back.setAttribute("uv", uv);
        // Resting u along the width, for the solver.
        const rest = new Float32Array(uv.count);
        const fu = front.getAttribute("uv");
        for (let i = 0; i < uv.count; i++) rest[i] = fu.getX(i);
        return { front, back, rest };
      }),
    [],
  );

  // The glued-down last page, a strip like the leaves so it can arch too.
  const lastGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(PAGE_W, PAGE_H, SEGMENTS, 1);
    const uv = geo.getAttribute("uv");
    const rest = new Float32Array(uv.count);
    for (let i = 0; i < uv.count; i++) rest[i] = uv.getX(i);
    solveLast(geo, rest, 0);
    return { geo, rest };
  }, []);

  const mats = useMemo(
    () =>
      LEAVES.map(([f, b]) => ({
        front: new THREE.MeshStandardMaterial({
          map: byName(f),
          roughness: PAPER_ROUGH,
          side: THREE.FrontSide,
          shadowSide: THREE.DoubleSide,
        }),
        back: new THREE.MeshStandardMaterial({ map: byName(b), roughness: PAPER_ROUGH, side: THREE.BackSide }),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tex],
  );

  // Pointer handling: grab the top leaf of either stack and drag it across.
  const { camera, gl } = useThree();
  /** The mouse is over the magazine (mice only; touch has no hover). */
  const hovered = useRef(false);
  const drag = useRef<{
    leaf: number;
    forward: boolean;
    x0: number;
    sx: number;
    sy: number;
    moved: boolean;
    lastX: number;
    lastT: number;
    vx: number;
  } | null>(null);

  useEffect(() => {
    const el = gl.domElement;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const flat = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.004);
    const plane = new THREE.Plane();
    const hit = new THREE.Vector3();

    /**
     * The pointer on the plane of the pages, in the book's own frame (x
     * across, spine at 0). The plane is the book's own, so it follows the
     * book however it is turned.
     */
    const local = (e: PointerEvent) => {
      if (!book.current) return null;
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      plane.copy(flat).applyMatrix4(book.current.matrixWorld);
      if (!ray.ray.intersectPlane(plane, hit)) return null;
      return book.current.worldToLocal(hit.clone());
    };

    const n = leaves.current.length;
    /** The top leaf of the right-hand stack, and of the left. */
    const topRight = () => {
      const i = Math.floor(pos.current + 0.5);
      return i < n ? i : -1;
    };
    const topLeft = () => Math.floor(pos.current + 0.5) - 1;

    const down = (e: PointerEvent) => {
      if (!playing.current.on) return;
      const p = local(e);
      if (!p || Math.abs(p.z) > PAGE_H / 2 + 0.01) return;
      let leaf = -1;
      let forward = true;
      if (p.x > 0 && p.x < PAGE_W + 0.01) leaf = topRight();
      else if (p.x < 0 && p.x > -PAGE_W - 0.01) {
        leaf = topLeft();
        forward = false;
      }
      if (leaf < 0) return;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
      drag.current = {
        leaf,
        forward,
        x0: p.x,
        sx: e.clientX,
        sy: e.clientY,
        moved: false,
        lastX: p.x,
        lastT: performance.now(),
        vx: 0,
      };
      const l = leaves.current[leaf];
      l.held = true;
      l.grab = l.theta;
      l.dir = forward ? 1 : -1;
    };

    /** How far left the issue reaches, in its own frame: just the cover while closed. */
    const leftEdge = () => -PAGE_W * THREE.MathUtils.smoothstep(leaves.current[0].theta, 0, Math.PI);

    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) {
        if (e.pointerType !== "mouse") return;
        const p = playing.current.on ? local(e) : null;
        hovered.current = !!p && Math.abs(p.z) <= PAGE_H / 2 && p.x <= PAGE_W && p.x >= leftEdge();
        return;
      }
      if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true;
      if (!d.moved) return;
      const p = local(e);
      if (!p) return;
      const now = performance.now();
      const dt = Math.max(1, now - d.lastT);
      d.vx = THREE.MathUtils.lerp(d.vx, (p.x - d.lastX) / dt, 0.4);
      d.lastX = p.x;
      d.lastT = now;
      // Where the page's edge should be: the grab point maps to the edge's
      // resting place, the far side of the book to the other side, so the
      // page never jumps under the finger.
      const W = PAGE_W;
      const edge = d.forward
        ? -W + ((p.x + W) / (d.x0 + W)) * 2 * W
        : W - ((W - p.x) / (W - d.x0)) * 2 * W;
      const l = leaves.current[d.leaf];
      const grab = Math.acos(THREE.MathUtils.clamp(edge / W, -1, 1));
      if (Math.abs(grab - l.grab) > 1e-4) l.dir = grab > l.grab ? 1 : -1;
      l.grab = grab;
    };

    /** Let go of the page; a tap turns it, unless the browser took the touch. */
    const release = (e: PointerEvent, cancelled: boolean) => {
      const d = drag.current;
      if (!d) return;
      drag.current = null;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      const l = leaves.current[d.leaf];
      l.held = false;
      // Carry the hand's speed into the fall, so a flung page keeps going.
      let over: boolean;
      if (cancelled) over = pos.current - d.leaf >= 0.5;
      else if (!d.moved) over = d.forward;
      else {
        // A flick decides it; otherwise whichever side the page is nearer.
        const flick = d.vx * 1000; // m/s, + is to the right
        if (flick < -0.25) over = true;
        else if (flick > 0.25) over = false;
        else over = l.theta > Math.PI / 2;
      }
      pos.current = over ? d.leaf + 1 : d.leaf;
    };
    const up = (e: PointerEvent) => release(e, false);
    const cancel = (e: PointerEvent) => release(e, true);

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", cancel);
    const leave = () => {
      if (!drag.current) hovered.current = false;
    };
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", cancel);
    };
  }, [camera, gl]);

  // Phones: once the book has come up and pinned to the screen, scrolling
  // on turns its pages, hinged to the scroll. Each screenful-and-a-bit of
  // scroll turns a page. When the scroll rests, a page left part way over
  // finishes falling whichever way it was going. Scrolled back up through the
  // whole track, the issue is closed; down to its end, it is at its end.
  useEffect(() => {
    if (!scrollTurn) return;
    const n = LEAVES.length;
    const track = gl.domElement.closest<HTMLElement>("[data-mint-track]");
    if (!track) return;
    /** How far into the pinned stretch the page is scrolled, in px. */
    const pinned = () => {
      const r = track.getBoundingClientRect();
      const max = Math.max(0, r.height - window.innerHeight);
      return { s: THREE.MathUtils.clamp(-r.top, 0, max), max };
    };
    let last = pinned().s;
    let idle = 0;
    let dir = 1;
    const onScroll = () => {
      const { s, max } = pinned();
      const ds = s - last;
      const was = last;
      last = s;
      if (!playing.current.on || drag.current || ds === 0) return;
      dir = Math.sign(ds);
      let p = pos.current + ds / (window.innerHeight * SCROLL_STEP);
      if (s <= 0 && was > 0) p = 0;
      else if (s >= max && was < max) p = n;
      pos.current = THREE.MathUtils.clamp(p, 0, n);
      clearTimeout(idle);
      idle = window.setTimeout(() => {
        pos.current = THREE.MathUtils.clamp(Math.round(pos.current + 0.25 * dir), 0, n);
      }, 220);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(idle);
      window.removeEventListener("scroll", onScroll);
    };
  }, [scrollTurn, gl]);

  useFrame(({ clock, size: view }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    // Square on until it plays, then it tilts back into its resting angle
    // and starts to float, bobbing and swaying very gently.
    const f = float.current;
    if (f) {
      const pl = playing.current;
      const now = clock.getElapsedTime();
      if (pl.on && pl.since < 0) pl.since = now;
      const since = pl.since < 0 ? 0 : now - pl.since;
      const k = pl.since < 0 ? 0 : THREE.MathUtils.smootherstep(since, 0, TILT_S);
      f.quaternion.slerpQuaternions(SQUARE, RESTING, k);
      const sway = THREE.MathUtils.smoothstep(since, TILT_S * 0.5, TILT_S * 1.5);
      sway_q.setFromEuler(
        sway_e.set(Math.sin(since * 0.6) * 0.018 * sway, Math.sin(since * 0.45 + 1) * 0.025 * sway, 0),
      );
      f.quaternion.premultiply(sway_q);
      f.position.y = Math.sin(since * 0.9) * 0.005 * sway;
    }
    const n = leaves.current.length;
    // How open the issue is, for the pages' arch: none while it is closed.
    const opened = THREE.MathUtils.smoothstep(leaves.current[0].theta, 0, Math.PI);
    // Level the spread. Turned leaves pile up on the left while the right
    // stack runs down to the back cover, so by the end the two open pages lie
    // more than a centimetre apart in height and a photo across them breaks
    // at the spine. Each side is shifted by half the difference, so their top
    // pages always meet at the spine at one height; the paper keeps its
    // thickness. None while closed, where there is only one stack to see.
    const turned = leaves.current.reduce((a, l) => a + l.theta / Math.PI, 0);
    const leftTop = 0.0004 + turned * LEAF_T;
    const rightTop = BASE_T + 0.0004 + (n - turned) * LEAF_T;
    const level = ((leftTop - rightTop) / 2) * opened;
    if (backCover.current) backCover.current.position.y = level;
    if (spine.current) spine.current.position.y = (leftTop + rightTop) / 2 + 0.001;
    const lastKey = opened.toFixed(3);
    if (solved.current[LEAVES.length] !== lastKey) {
      solved.current[LEAVES.length] = lastKey;
      solveLast(lastGeo.geo, lastGeo.rest, opened);
    }
    leaves.current.forEach((l, i) => {
      l.target = THREE.MathUtils.clamp(pos.current - i, 0, 1) * Math.PI;
      if (l.held) {
        // Paper has some heft: it follows the finger a moment behind.
        const prev = l.theta;
        l.theta += (l.grab - l.theta) * (1 - Math.exp(-dt * 14));
        l.vel = dt > 0 ? (l.theta - prev) / dt : 0;
      } else {
        // A soft spring towards the side it is falling to: slow enough to
        // feel the page's weight, and damped harder as it nears rest, like
        // the air cushion under a page settling, so it lands without a slap.
        const gap = l.target - l.theta;
        const k = 16;
        const near = 1 - THREE.MathUtils.clamp(Math.abs(gap) / 0.6, 0, 1);
        const c = 2 * Math.sqrt(k) * (1 + 0.5 * near * near);
        l.vel = THREE.MathUtils.clamp(l.vel + (gap * k - l.vel * c) * dt, -7, 7);
        l.theta = THREE.MathUtils.clamp(l.theta + l.vel * dt, 0, Math.PI);
        if (Math.abs(l.target - l.theta) < 1e-4 && Math.abs(l.vel) < 1e-3) {
          l.theta = l.target;
          l.vel = 0;
        }
      }
      // Bend, through the middle of the page as well as at its edge: a held
      // page's edge leads the way it is pulled; a moving page's edge trails
      // behind its spine, more the faster it goes, and eases flat as it lands.
      const wantBend = l.held
        ? 0.8 * l.dir
        : -THREE.MathUtils.clamp(l.vel * 0.16, -0.95, 0.95);
      l.bend = THREE.MathUtils.lerp(l.bend, wantBend, 1 - Math.exp(-dt * 7));
      const key = `${l.theta.toFixed(4)}|${l.bend.toFixed(4)}|${opened.toFixed(3)}|${level.toFixed(5)}`;
      if (solved.current[i] !== key) {
        solved.current[i] = key;
        solveLeaf(geos[i].front, geos[i].rest, l, i, n, opened, level);
      }
    });

    // Closed, the cover sits in the middle of the shot; the book slides
    // over as it opens so the spread ends up centred instead.
    if (book.current) {
      const open = THREE.MathUtils.smoothstep(leaves.current[0].theta, 0, Math.PI * 0.85);
      book.current.position.x = -0.5 * PAGE_W * (1 - open);
    }
    if (shade.current) shade.current.opacity = THREE.MathUtils.smoothstep(leaves.current[0].theta, 0.5, Math.PI);

    placeCorners(
      corners?.current ?? null,
      book.current,
      camera,
      view,
      leaves.current[0].theta,
      hovered.current || !!drag.current,
    );
  });

  // Once the pages are in, say how big the closed cover is on screen, square
  // on: the camera looks straight at its middle, so it is just its size over
  // its distance.
  const { size } = useThree();
  useEffect(() => {
    const d = camera.position.z - COVER_Y;
    const k = size.height / 2 / (d * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    // Where it is on screen: the middle of the canvas, as the page opens.
    const r = gl.domElement.getBoundingClientRect();
    onCover({ w: PAGE_W * k, h: PAGE_H * k, cx: r.left + r.width / 2, cy: r.top + r.height / 2 });
  }, [camera, gl, size, onCover]);

  const lastMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: byName(LAST_RIGHT), roughness: PAPER_ROUGH }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tex],
  );

  const base = BASE_T;

  return (
    <group ref={float} quaternion={SQUARE}>
    <group ref={book} position={[-PAGE_W / 2, 0, 0]}>
      {/* Back cover, and the glued-down last page on it, raised with the
          right-hand stack to level the spread. */}
      <group ref={backCover}>
        <mesh position={[PAGE_W / 2, base / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[PAGE_W, base, PAGE_H]} />
          <meshStandardMaterial color="#efe9df" roughness={0.7} />
        </mesh>
        <mesh geometry={lastGeo.geo} material={lastMat} receiveShadow />
      </group>
      {LEAVES.map((_, i) => (
        <group key={i}>
          <mesh
            ref={(m) => {
              if (m) (meshes.current[i] ??= { front: m, back: m }).front = m;
            }}
            geometry={geos[i].front}
            material={mats[i].front}
            castShadow
            receiveShadow
          />
          <mesh
            ref={(m) => {
              if (m) (meshes.current[i] ??= { front: m, back: m }).back = m;
            }}
            geometry={geos[i].back}
            material={mats[i].back}
            receiveShadow
          />
        </group>
      ))}
      <group ref={spine}>
        <SpineShade material={shade} />
      </group>
    </group>
    </group>
  );
}

/**
 * Bends one leaf. Each column of vertices sits at a distance s along the
 * page from the spine; its angle is the spine angle plus a bend that grows
 * towards the free edge, and its position is that angle integrated out from
 * the spine. Lying flat it is just stacked at its height in the pile.
 */
const sway_q = new THREE.Quaternion();
const corner_v = new THREE.Vector3();

/**
 * The corner squares: each corner of the issue (the cover's while it is
 * closed, the spread's once open) projected to the screen, with a square set
 * just outside it, so they ride along with the bob and sway.
 */
function placeCorners(
  box: HTMLDivElement | null,
  book: THREE.Group | null,
  camera: THREE.Camera,
  view: { width: number; height: number },
  coverTheta: number,
  on: boolean,
) {
  if (!box || !book) return;
  box.style.opacity = on ? "1" : "0";
  const left = -PAGE_W * THREE.MathUtils.smoothstep(coverTheta, 0, Math.PI);
  const pts = [
    [left, -PAGE_H / 2],
    [PAGE_W, -PAGE_H / 2],
    [left, PAGE_H / 2],
    [PAGE_W, PAGE_H / 2],
  ].map(([x, z]) => {
    corner_v.set(x, COVER_Y, z).applyMatrix4(book.matrixWorld).project(camera);
    return [((corner_v.x + 1) / 2) * view.width, ((1 - corner_v.y) / 2) * view.height];
  });
  const cx = pts.reduce((a, p) => a + p[0], 0) / 4;
  const cy = pts.reduce((a, p) => a + p[1], 0) / 4;
  pts.forEach(([x, y], i) => {
    const el = box.children[i] as HTMLElement | undefined;
    if (!el) return;
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.hypot(dx, dy) || 1;
    el.style.transform = `translate(${x + (dx / len) * 16 - 4}px, ${y + (dy / len) * 16 - 4}px)`;
  });
}
const sway_e = new THREE.Euler();

function solveLeaf(
  geo: THREE.PlaneGeometry,
  rest: Float32Array,
  l: Leaf,
  i: number,
  n: number,
  open: number,
  /** How far the right stack is raised and the left lowered, to level the spread. */
  level: number,
) {
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const cols = SEGMENTS + 1;
  const ds = PAGE_W / SEGMENTS;
  const f = l.theta / Math.PI;
  // Height of the hinge: its place in the right pile, then in the left one.
  const hRight = BASE_T + (n - i) * LEAF_T + 0.0004 + level;
  const hLeft = 0.0004 + (i + 1) * LEAF_T - level;
  const h = THREE.MathUtils.lerp(hRight, hLeft, f);
  const lift = Math.sin(l.theta);

  const xs = new Float32Array(cols);
  const ys = new Float32Array(cols);
  let x = 0;
  let y = 0;
  for (let c = 0; c < cols; c++) {
    xs[c] = x;
    ys[c] = y;
    const s = (c + 0.5) / SEGMENTS;
    const a = THREE.MathUtils.clamp(l.theta + l.bend * lift * Math.pow(s, 1.1), 0, Math.PI);
    x += Math.cos(a) * ds;
    y += Math.sin(a) * ds;
  }
  // PlaneGeometry lays its vertices out row by row, cols per row; row 0 is
  // the page's top (head). The page lies in the book's xz plane: head away
  // from the viewer at -z.
  for (let v = 0; v < pos.count; v++) {
    const c = Math.round(rest[v] * SEGMENTS);
    const row = Math.floor(v / cols);
    const z = row === 0 ? -PAGE_H / 2 : PAGE_H / 2;
    // Lying open, the page arches gently off the gutter; while it is up in
    // the air its own bend takes over.
    const arch = ARCH * open * (1 - lift) * archAt(c / SEGMENTS);
    pos.setXYZ(v, xs[c], h + ys[c] + arch, z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
}

/** The glued-down last page, arched like the others once the issue is open. */
function solveLast(geo: THREE.PlaneGeometry, rest: Float32Array, open: number) {
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const cols = SEGMENTS + 1;
  for (let v = 0; v < pos.count; v++) {
    const u = rest[v];
    const z = Math.floor(v / cols) === 0 ? -PAGE_H / 2 : PAGE_H / 2;
    pos.setXYZ(v, u * PAGE_W, BASE_T + 0.0002 + ARCH * open * archAt(u), z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
}

/**
 * A soft shadow down the gutter on both pages, where paper curves into the
 * spine, so the spread doesn't read as two flat cards.
 */
function SpineShade({ material }: { material: RefObject<THREE.MeshBasicMaterial | null> }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 4;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.42, "rgba(0,0,0,0.05)");
    grad.addColorStop(0.5, "rgba(0,0,0,0.32)");
    grad.addColorStop(0.58, "rgba(0,0,0,0.05)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 4);
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.06, PAGE_H]} />
      <meshBasicMaterial ref={material} map={tex} transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
