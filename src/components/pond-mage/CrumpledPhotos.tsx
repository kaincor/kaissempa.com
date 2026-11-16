"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Kai's Lake Lagunita photos as balls of crumpled paper (after the
 * crumpled-paper reveal he pointed to): each one opens out flat into the photo
 * when the pointer is over it, centre first, and screws itself back up when it
 * leaves. A tap does the same on a phone, and so do Enter and Space.
 *
 * Each is one sheet, a subdivided plane, with two shapes for every vertex: its
 * place on a lumpy, folded ball, and its place on the flat sheet with a few
 * faint creases left in it. The frame blends between the two. Flat shading
 * (face normals from the fragment's derivatives) gives the crumpled facets
 * their light and shade, and the back of the paper is plain off-white, so
 * the folds show both sides.
 *
 * Drawn only while something is moving (frameloop "demand"); with reduced
 * motion it jumps between ball and photo rather than unfolding.
 */

export type CrumpledPhoto = { src: string; alt: string; w: number; h: number };

const SEGMENTS = 60;
/** How long the unfold takes, s. */
const OPEN_S = 1.0;
/** How much of the canvas the open photo fills, so its shadow has room. */
const FILL = 0.84;
const FOV = 30;

/** A small, smooth 3D value noise, enough for lumps and creases. */
function hash(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x: number, y: number, z: number) {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    zi = Math.floor(z);
  const xf = x - xi,
    yf = y - yi,
    zf = z - zi;
  const u = xf * xf * (3 - 2 * xf),
    v = yf * yf * (3 - 2 * yf),
    w = zf * zf * (3 - 2 * zf);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) =>
    hash(xi + dx, yi + dy, zi + dz);
  return (
    l(
      l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v),
      l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v),
      w,
    ) *
      2 -
    1
  );
}

/** The sheet, and each vertex's place on the ball and on the flat photo. */
function buildSheet(W: number, H: number, seed: number) {
  const g = new THREE.PlaneGeometry(W, H, SEGMENTS, SEGMENTS);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const n = pos.count;
  const ball = new Float32Array(n * 3);
  const flat = new Float32Array(n * 3);
  const delay = new Float32Array(n);
  const R = 0.26 * (W + H);
  const s = seed * 13.37;
  // A seeded random, so each ball is crumpled the same way every visit.
  let st = (seed * 2654435761) >>> 0;
  const rnd = () => {
    st = (st + 0x6d2b79f5) >>> 0;
    let q = st;
    q = Math.imul(q ^ (q >>> 15), q | 1);
    q ^= q + Math.imul(q ^ (q >>> 7), q | 61);
    return ((q ^ (q >>> 14)) >>> 0) / 4294967296;
  };

  // Crumpled the way paper is: fold after fold. Each picks a plane through
  // the wad and bends everything on one side of it over, around a line in
  // that plane, through most of a half turn. The bend is spread over a
  // narrow band either side of the plane, so the sheet creases rather than
  // tears. Then the wad is squeezed round and given a little crinkle.
  const P = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) P.set([pos.getX(i), pos.getY(i), 0], i * 3);
  const nv = new THREE.Vector3();
  const ax = new THREE.Vector3();
  const c = new THREE.Vector3();
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const FOLDS = 16;
  for (let f = 0; f < FOLDS; f++) {
    // Centre of the wad so far, nudged.
    c.set(0, 0, 0);
    for (let i = 0; i < n; i++) {
      c.x += P[i * 3];
      c.y += P[i * 3 + 1];
      c.z += P[i * 3 + 2];
    }
    c.multiplyScalar(1 / n);
    const spread = 0.22 * Math.pow(0.86, f);
    c.x += (rnd() - 0.5) * spread;
    c.y += (rnd() - 0.5) * spread;
    c.z += (rnd() - 0.5) * spread * 0.5;
    nv.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
    ax.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5)
      .cross(nv)
      .normalize();
    const angle = (0.55 + rnd() * 0.4) * Math.PI * (rnd() < 0.5 ? 1 : -1);
    const band = 0.025;
    for (let i = 0; i < n; i++) {
      const j = i * 3;
      p.set(P[j] - c.x, P[j + 1] - c.y, P[j + 2] - c.z);
      const d = p.dot(nv);
      if (d <= 0) continue;
      const k = d >= band ? 1 : (d / band) * (d / band) * (3 - 2 * (d / band));
      q.setFromAxisAngle(ax, angle * k);
      p.applyQuaternion(q);
      P[j] = p.x + c.x;
      P[j + 1] = p.y + c.y;
      P[j + 2] = p.z + c.z;
    }
  }
  // Squeeze it into a ball of about R, keeping its folds.
  c.set(0, 0, 0);
  for (let i = 0; i < n; i++) {
    c.x += P[i * 3];
    c.y += P[i * 3 + 1];
    c.z += P[i * 3 + 2];
  }
  c.multiplyScalar(1 / n);
  let far = 0;
  for (let i = 0; i < n; i++)
    far = Math.max(
      far,
      Math.hypot(P[i * 3] - c.x, P[i * 3 + 1] - c.y, P[i * 3 + 2] - c.z),
    );

  for (let i = 0; i < n; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = x / W;
    const v = y / H;
    const j = i * 3;
    p.set(P[j] - c.x, P[j + 1] - c.y, P[j + 2] - c.z);
    const len = p.length() / far || 0;
    // Pulls the far-flung corners in hardest, so it rounds up.
    p.multiplyScalar(
      (R / far) * Math.pow(len || 1e-3, -0.62) * (0.85 + 0.15 * len),
    );
    const crinkle = 1 + noise(u * 23 + s, v * 23, 4.2) * 0.05;
    ball.set([p.x * crinkle, p.y * crinkle, p.z * crinkle], j);
    // Flat, with the faintest of its creases left in it.
    flat.set([x, y, noise(u * 11 + s, v * 11, 1.3) * 0.0025], j);
    // The middle opens first.
    delay[i] = Math.min(1, Math.hypot(u, v) / 0.71);
  }
  // Soften the sharpest shards a little, so it reads as paper rather than
  // foil: each point moves part way to the middle of its grid neighbours.
  const cols = SEGMENTS + 1;
  for (let pass = 0; pass < 2; pass++) {
    const src = ball.slice();
    for (let r = 1; r < cols - 1; r++) {
      for (let col = 1; col < cols - 1; col++) {
        const i = r * cols + col;
        for (let a = 0; a < 3; a++) {
          const m =
            (src[(i - 1) * 3 + a] + src[(i + 1) * 3 + a] + src[(i - cols) * 3 + a] + src[(i + cols) * 3 + a]) / 4;
          ball[i * 3 + a] = src[i * 3 + a] * 0.5 + m * 0.5;
        }
      }
    }
  }
  pos.array.set(ball);
  pos.needsUpdate = true;
  return { geometry: g, ball, flat, delay };
}

function Sheet({
  photo,
  seed,
  open,
  still,
}: {
  photo: CrumpledPhoto;
  seed: number;
  open: boolean;
  still: boolean;
}) {
  const texture = useTexture(photo.src, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
  });
  const invalidate = useThree((s) => s.invalidate);

  // The longer side of the sheet is 1.
  const W = photo.w >= photo.h ? 1 : photo.w / photo.h;
  const H = photo.h >= photo.w ? 1 : photo.h / photo.w;

  const { geometry, ball, flat, delay } = useMemo(
    () => buildSheet(W, H, seed),
    [W, H, seed],
  );

  const material = useMemo(() => {
    const m = new THREE.MeshLambertMaterial({
      map: texture,
      flatShading: true,
      side: THREE.DoubleSide,
    });
    // The back of the paper is the paper, with the photo faintly through it.
    m.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>
         if (!gl_FrontFacing) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.88, 0.86), 0.62);`,
      );
    };
    return m;
  }, [texture]);

  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  // The ball's own tumble, undone as it opens.
  const tumble = useMemo(
    () =>
      new THREE.Euler(
        0.5 + hash(seed, 1, 2) * 0.8,
        hash(seed, 3, 4) * 6.28,
        hash(seed, 5, 6) * 1.2 - 0.6,
      ),
    [seed],
  );

  useFrame((_, dt) => {
    const target = open ? 1 : 0;
    const prev = t.current;
    if (still) t.current = target;
    else {
      const step = Math.min(dt, 0.05) / OPEN_S;
      t.current =
        target > prev
          ? Math.min(target, prev + step)
          : Math.max(target, prev - step * 1.25);
    }
    const tt = t.current;
    const g = mesh.current?.geometry;
    if (!g) return;
    const pos = g.attributes.position as THREE.BufferAttribute;
    const a = pos.array as Float32Array;
    for (let i = 0; i < delay.length; i++) {
      // Each vertex has its own window in the unfold, the middle's earliest.
      let e = tt * 1.45 - delay[i] * 0.45;
      e = e < 0 ? 0 : e > 1 ? 1 : e;
      e = e * e * (3 - 2 * e);
      const j = i * 3;
      a[j] = ball[j] + (flat[j] - ball[j]) * e;
      a[j + 1] = ball[j + 1] + (flat[j + 1] - ball[j + 1]) * e;
      a[j + 2] = ball[j + 2] + (flat[j + 2] - ball[j + 2]) * e;
    }
    pos.needsUpdate = true;
    g.computeBoundingSphere();
    if (group.current) {
      const r = 1 - tt * tt * (3 - 2 * tt);
      group.current.rotation.set(tumble.x * r, tumble.y * r, tumble.z * r);
    }
    if (t.current !== target) invalidate();
  });

  return (
    <group ref={group}>
      <mesh ref={mesh} geometry={geometry} material={material} />
    </group>
  );
}

function Rig({ photo }: { photo: CrumpledPhoto }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const H = photo.h >= photo.w ? 1 : photo.h / photo.w;
  // Far enough back that the open sheet fills FILL of the canvas's height.
  const d = H / FILL / (2 * Math.tan((FOV / 2) * (Math.PI / 180)));
  camera.position.set(0, 0, d);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  return null;
}

function Crumpled({ photo, seed }: { photo: CrumpledPhoto; seed: number }) {
  const [open, setOpen] = useState(false);
  const still = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  // A touch opens and closes it; a mouse opens it while it is over it.
  const touch = useRef(false);
  return (
    <button
      type="button"
      className="pm-crumple"
      aria-label={`${photo.alt}. ${open ? "Crumple it back up" : "Open it out"}`}
      aria-pressed={open}
      onPointerDown={(e) => (touch.current = e.pointerType !== "mouse")}
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
      onClick={() => {
        if (touch.current) setOpen((o) => !o);
        touch.current = false;
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((o) => !o);
        }
      }}
      style={{ aspectRatio: `${photo.w} / ${photo.h}` }}
    >
      <Canvas
        flat
        frameloop="demand"
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        camera={{ fov: FOV, near: 0.1, far: 20 }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Rig photo={photo} />
        {/* Lit so the open photo shows its own colours (about 1 at face on),
            with a key light high and to the side to model the folds. */}
        <ambientLight intensity={0.46 * Math.PI} />
        <directionalLight position={[1.2, 2, 3]} intensity={0.62 * Math.PI} />
        <Suspense fallback={null}>
          <Sheet photo={photo} seed={seed} open={open} still={still} />
        </Suspense>
      </Canvas>
    </button>
  );
}

export default function CrumpledPhotos({
  photos,
}: {
  photos: CrumpledPhoto[];
}) {
  return (
    <div className="pm-crumples">
      {photos.map((p, i) => (
        <Crumpled key={p.src} photo={p} seed={i + 1} />
      ))}
      <style>{`
        .pm-crumples {
          display: flex; flex-wrap: wrap; justify-content: center; align-items: center;
          gap: clamp(4px, 1vw, 16px);
          width: min(94vw, 1100px); margin: 0 auto;
        }
        .pm-crumple {
          position: relative; flex: 0 0 auto;
          height: clamp(180px, 19vw, 280px);
          padding: 0; border: 0; background: none; cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          /* The paper's shadow on the dusk, following its outline. */
          filter: drop-shadow(6px 14px 12px rgba(5, 0, 10, 0.55));
        }
        .pm-crumple:focus-visible { outline: 2px solid #efd48c; outline-offset: 4px; border-radius: 6px; }
        @media (max-width: 639px) {
          .pm-crumples { width: 100%; padding: 0 8px; }
          .pm-crumple { height: auto; width: calc(50% - 6px); }
        }
      `}</style>
    </div>
  );
}
