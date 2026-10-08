"use client";

import { useEffect, useRef } from "react";
import type * as THREE_NS from "three";
import { PHONE_MAX } from "./constants";
import { GRASS_STROKES } from "./grassStrokes";
import { applyLayers, MODE } from "./splineLayers";

/**
 * The landing scene — the rider on the cliff — in plain three.js, rebuilt
 * from the Spline scene it replaces.
 *
 * The model is Spline's own GLTF export, compressed (see scripts/hero). What
 * the export loses is put back here by hand, read off the running Spline
 * scene: its colour handling, its lights, the matcap and fresnel layers on
 * the title and the bike, the title's float, the light that follows the
 * cursor, and the layout it switches to on a phone.
 *
 * Spline renders without converting colours to sRGB — every hex it shows is
 * used as a linear value and written out as is. Matching that is what makes
 * the greys the same greys, so the renderer here does the same: output in
 * linear, and each material colour put back to the number Spline had.
 *
 * Loaded after the page has painted, behind a still of its own first frame
 * (HeroPoster), so nothing waits on it. It stops drawing whenever the hero is
 * off screen.
 */


/** The two layouts, per Spline's Resize event: positions are local. */
const LAYOUT = {
  wide: {
    title: { p: [171.49, 352.29, -339.69], s: 0.8 },
    group: { p: [136.35, -0.66, -112.25] },
  },
  phone: {
    title: { p: [152.059, 346.77, -339.687], s: 0.46 },
    group: { p: [107.857, 23.315, -124.092] },
  },
} as const;

/** The floats, as Spline's Start events run them: there, back, forever. */
const FLOATS = {
  Kai: { dy: 9.68, drx: 0.067, dry: 0.115, out: 3.7, back: 3.7 },
  "Designer & Developer (Efficient)": { dy: -3.56, drx: 0, dry: 0, out: 2.8, back: 2.9 },
} as const;

const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u));
/** One there-and-back cycle, 0 → 1 → 0, eased both ways. */
function pingpong(t: number, out: number, back: number) {
  const p = t % (out + back);
  return p < out ? easeInOut(p / out) : 1 - easeInOut((p - out) / back);
}

export default function HeroScene({
  onFirstFrame,
}: {
  /** Called once the first frame is on the canvas, to retire the poster. */
  onFirstFrame?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
      const { MeshoptDecoder } = await import("three/addons/libs/meshopt_decoder.module.js");
      const { mergeGeometries } = await import("three/addons/utils/BufferGeometryUtils.js");
      if (disposed) return;

      // A phone, by its screen rather than its window, so it never switches
      // mid-visit. On a phone the rock is a still (see "The rock as a still"
      // below), which takes the heaviest shader in the scene off the GPU, so
      // the rest can draw at full sharpness.
      const phone = Math.min(window.screen.width, window.screen.height) <= 500;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      const canvas = renderer.domElement;
      canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";

      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      const texLoader = new THREE.TextureLoader();
      const [gltf, matcapSharp, matcapSoft, matcapGrey] = await Promise.all([
        loader.loadAsync("/hero/cliff.glb"),
        texLoader.loadAsync("/hero/matcap-sharp.webp"),
        texLoader.loadAsync("/hero/matcap-soft.webp"),
        texLoader.loadAsync("/hero/matcap-grey.webp"),
      ]);
      if (disposed) {
        renderer.dispose();
        return;
      }
      for (const t of [matcapSharp, matcapSoft, matcapGrey]) t.colorSpace = THREE.NoColorSpace;

      const scene = gltf.scene;
      // The export wraps everything in a 1/100 scale. Undone, so the scene
      // is back in Spline's units — the camera's near plane, the lights'
      // reach and every number read off Spline are all in those.
      scene.traverse((o) => {
        if (o !== scene && Math.abs(o.scale.x - 0.01) < 1e-6 && o.position.lengthSq() === 0) o.scale.setScalar(1);
      });
      scene.updateMatrixWorld(true);
      // The loader swaps the spaces in node names for underscores.
      const byName = (n: string) => scene.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(n));
      const camera = (gltf.cameras.find((c) => c.name === "Camera") ?? gltf.cameras[0]) as THREE_NS.PerspectiveCamera;

      // ── Lights, as Spline has them ──────────────────────────────────────
      const follow = byName("Point Light") as THREE_NS.PointLight | undefined;
      const key = byName("Light") as THREE_NS.PointLight | undefined;
      scene.traverse((o) => {
        const l = o as THREE_NS.PointLight;
        if (!l.isPointLight) return;
        if (l === follow) Object.assign(l, { intensity: 4.383, distance: 500, decay: 0 });
        // The light that is always on, above the rock. Spline gives it decay
        // 1 but no distance, and without a distance its light does not fall
        // off; three would fade it to nothing by the time it reached the
        // rock, which is what left the scene dark with the cursor away.
        else if (l === key) Object.assign(l, { intensity: KEY_LIGHT, distance: 0, decay: 0 });
      });
      const ambient = new THREE.HemisphereLight(0xd3d3d3, 0x828282, AMBIENT.value);
      scene.add(ambient);

      // ── Materials ───────────────────────────────────────────────────────
      // Each GLTF material is matched back to the Spline material it came
      // from by the colour it was exported with, then given that Spline
      // material's layer stack (splineLayers). Values are Spline's own.
      const S = MODE.screen;
      const O = MODE.overlay;
      const PHYS = (rough: number, metal: number) => ({ rough, metal });
      const swapped = new Map<THREE_NS.Material, THREE_NS.Material>();
      let rockMat: THREE_NS.Material | undefined;
      const restyle = (src: THREE_NS.MeshStandardMaterial, meshName: string): THREE_NS.Material => {
        const hex = src.color.getHexString(THREE.SRGBColorSpace);
        // Spline uses its hex values as linear numbers; so do we.
        const raw = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
        const rawColor = new THREE.Color().setRGB(raw[0], raw[1], raw[2], THREE.LinearSRGBColorSpace);
        for (const t of [src.map, src.metalnessMap, src.roughnessMap]) if (t) t.colorSpace = THREE.NoColorSpace;
        const physical = (p: { rough: number; metal: number }, extra: Partial<THREE_NS.MeshPhysicalMaterialParameters> = {}) =>
          new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: p.rough, metalness: p.metal, ...extra });
        const isFlat = !src.map && src.metalness === 0 && Math.abs(src.roughness - 0.3) < 0.01;

        if (meshName === "Path_5") {
          return applyLayers(new THREE.MeshLambertMaterial({ color: 0xffffff }), {
            base: { color: [1, 1, 1] },
            light: { mode: O, alpha: 1 },
            matcap: { tex: matcapGrey, mode: S, alpha: 1, intensity: 1 },
            tint: { color: [0.1373, 0.1373, 0.1373], mode: O, alpha: 1 },
            fresnel: { color: [1, 1, 1], mode: S, alpha: 0.2, bias: 0.1, scale: 1, power: 2, factor: 1 },
          });
        }
        if (hex === "404040" || hex === "7e7e7e" || hex === "393939") {
          // The title, the bike's bright metal and its dark metal.
          const tex = hex === "393939" ? matcapSoft : matcapSharp;
          return applyLayers(physical(PHYS(0.553, 0.3)), {
            base: { color: raw },
            light: { mode: O, alpha: 1 },
            matcap: { tex, mode: S, alpha: hex === "393939" ? 0.5 : 1, intensity: 2 },
          });
        }
        if (src.map && src.transparent) {
          // The bike's paint: a texture under a screened light and a blue rim.
          const m = physical(PHYS(0.49, 0), { map: src.map, transparent: src.transparent, opacity: src.opacity });
          return applyLayers(m, {
            base: { texture: true },
            light: { mode: S, alpha: 1 },
            fresnel: { color: [0.5469, 0.7281, 1], mode: S, alpha: 1, bias: -0.06, scale: 0.53, power: 1.75, factor: 0.94 },
          });
        }
        if (meshName === "Rock" && src.map) {
          // The rock as Spline has it: its photograph, lit at 90%, the photo
          // as a bump map, and a wet sheen where the light falls. Matched
          // side by side against the Spline scene.
          const m = physical(PHYS(ROCK.roughness, 0), {
            map: src.map,
            bumpMap: src.map,
            bumpScale: ROCK.bump,
            specularIntensity: 1,
            specularColor: new THREE.Color(ROCK.specular, ROCK.specular, ROCK.specular),
          });
          rockMat = applyLayers(m, {
            base: { texture: true },
            light: { mode: MODE.normal, alpha: 0.9, gain: ROCK.gain },
          });
          return rockMat;
        }
        if (hex === "373737") {
          // The saddle.
          return applyLayers(new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 5, specular: 0x333333 }), {
            base: { color: raw },
            light: { mode: O, alpha: 1 },
            matcap: { tex: matcapGrey, mode: O, alpha: 1, intensity: 1 },
            fresnel: { color: [1, 1, 1], mode: O, alpha: 1, bias: 0.1, scale: 1, power: 2, factor: 1 },
          });
        }
        if (hex === "54545b") {
          // The wheel discs: lit at 60%.
          return applyLayers(new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 5, specular: 0x333333 }), {
            base: { color: raw },
            light: { mode: MODE.normal, alpha: 0.6 },
          });
        }
        if (isFlat || hex === "000000") {
          // The figurine, and the bandage: Spline has their lighting off.
          return new THREE.MeshBasicMaterial({ color: rawColor });
        }
        const m = src.clone();
        m.color.copy(rawColor);
        return m;
      };
      scene.traverse((o) => {
        const mesh = o as THREE_NS.Mesh;
        if (!mesh.isMesh) return;
        const src = mesh.material as THREE_NS.MeshStandardMaterial;
        const key = mesh.name === "Path_5" ? mesh.name : src.uuid;
        if (!swapped.has(src) || key === "Path_5") {
          const made = restyle(src, mesh.name);
          if (key === "Path_5") {
            mesh.material = made;
            return;
          }
          swapped.set(src, made);
        }
        mesh.material = swapped.get(src)!;
      });

      const floatAttr = (a: THREE_NS.BufferAttribute | THREE_NS.InterleavedBufferAttribute, size: number) => {
        const out = new Float32Array(a.count * size);
        for (let i = 0; i < a.count; i++) {
          out[i * size] = a.getX(i);
          if (size > 1) out[i * size + 1] = a.getY(i);
          if (size > 2) out[i * size + 2] = a.getZ(i);
        }
        return new THREE.BufferAttribute(out, size);
      };
      // ── Grass in the wind ───────────────────────────────────────────────
      // Each tuft leans gently back and forth, the tips furthest and the
      // roots not at all, on a slow swing with a slower gust over it, a
      // little out of step from tuft to tuft. All of it runs in the vertex
      // shader off one time value, so it costs next to nothing: each point
      // carries how far up its tuft it sits (squared, so the blades bend
      // rather than tilt), worked out once here.
      const windTime = { value: 0 };
      {
        const grassMats = new Map<THREE_NS.Material, THREE_NS.Material>();
        const widened = new Set<THREE_NS.BufferGeometry>();
        // Out first: the odd shapes that swayed like black leaves, and the
        // clump right of the figure lost in the rock's shade.
        const grass = byName("Grass");
        grass?.children.filter((_, i) => GRASS_DROP.includes(i)).forEach((t) => t.removeFromParent());

        grass?.children.forEach((tuft) => {
          tuft.traverse((o) => {
            const mesh = o as THREE_NS.Mesh;
            if (!mesh.isMesh) return;
            if (!widened.has(mesh.geometry)) {
              widen(mesh.geometry, GRASS_WIDTH);
              widened.add(mesh.geometry);
            }
            mesh.updateWorldMatrix(true, false);
            const pos = mesh.geometry.attributes.position;
            const v = new THREE.Vector3();
            const ys = new Float32Array(pos.count);
            let lo = Infinity;
            let hi = -Infinity;
            for (let i = 0; i < pos.count; i++) {
              ys[i] = v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).y;
              lo = Math.min(lo, ys[i]);
              hi = Math.max(hi, ys[i]);
            }
            const h = Math.max(hi - lo, 1e-6);
            const sway = new Float32Array(pos.count);
            for (let i = 0; i < pos.count; i++) sway[i] = ((ys[i] - lo) / h) ** 2 * h;
            mesh.geometry.setAttribute("sway", new THREE.BufferAttribute(sway, 1));
            mesh.geometry.setAttribute("lean", new THREE.BufferAttribute(new Float32Array(pos.count), 1));
            const src = mesh.material as THREE_NS.Material;
            if (!grassMats.has(src)) {
              const m = src.clone();
              m.onBeforeCompile = (shader) => {
                shader.uniforms.windTime = windTime;
                shader.vertexShader = shader.vertexShader
                  .replace("#include <common>", "#include <common>\nattribute float sway;\nattribute float lean;\nuniform float windTime;")
                  .replace(
                    "#include <begin_vertex>",
                    `#include <begin_vertex>
                    {
                      // Out of step across the ridge, and zero at time zero,
                      // so the first frame is the still the page opens on.
                      float ph = position.x * ${WIND.spread.toFixed(4)} + position.z * ${(WIND.spread * 0.7).toFixed(4)};
                      float w = windTime * ${((2 * Math.PI) / WIND.period).toFixed(4)};
                      float g = windTime * ${((2 * Math.PI) / WIND.gust).toFixed(4)};
                      // The wave runs left to right across the ridge, and
                      // pushes harder rightward than it lets go, so it reads
                      // as a wind from the left rather than a rocking.
                      float k = 0.75 * (sin(w - ph) + sin(ph)) + 0.25 * (sin(g - ph * 0.6) + sin(ph * 0.6));
                      k = 0.75 * k + 0.25 * abs(k);
                      // A blade growing sideways (lean near 1) is pushed along
                      // its own length by a sideways wind, which only looks
                      // like squeezing; it bobs instead, dipping as the gust
                      // comes through. Upright blades sway side to side.
                      float side = 1.0 - 0.85 * abs(lean);
                      transformed.x += k * sway * side * ${WIND.amount.toFixed(4)};
                      transformed.y -= k * sway * lean * ${(WIND.amount * 0.7).toFixed(4)};
                      transformed.z += k * sway * side * ${(WIND.amount * 0.35).toFixed(4)};
                    }`,
                  );
              };
              grassMats.set(src, m);
            }
            mesh.material = grassMats.get(src)!;
          });
        });

        // ── Kai's blades ──
        // Each stroke Kai drew on the hero is one blade (grassStrokes.ts),
        // drawn as he drew it: a flat ribbon facing the camera, tapering to
        // its tip, standing on a plane just behind the rock's skyline where
        // its base is. A base drawn above the skyline is dropped onto it, and
        // every blade runs on a little below its base, so the rock's edge
        // hides its root and it grows out of the black line rather than
        // standing on it. Built in the wide layout, in the group's own frame.
        const rg = byName("Responsive Group");
        const rockMesh = byName("Rock") as THREE_NS.Mesh | undefined;
        const mat = grassMats.values().next().value;
        if (rg && rockMesh && mat) {
          const home = rg.position.clone();
          rg.position.set(...LAYOUT.wide.group.p);
          scene.updateMatrixWorld(true);
          camera.updateMatrixWorld();
          const toGroup = rg.matrixWorld.clone().invert();
          const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
          const fwd = camera.getWorldDirection(new THREE.Vector3());
          const eye = camera.getWorldPosition(new THREE.Vector3());
          const ray = new THREE.Raycaster();
          // A screen direction at a depth, into the group's frame.
          const at = (u: number, v: number, d: number) =>
            new THREE.Vector3(u * d * tan, v * d * tan, -d).applyMatrix4(camera.matrixWorld).applyMatrix4(toGroup);
          const pos: number[] = [];
          const sway: number[] = [];
          const index: number[] = [];
          let seed = 3;
          const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
          // Each of Kai's strokes, and around it a few more of its kind — the
          // same base give or take a hair, turned a little, longer or shorter
          // — so each spot he marked grows a cluster rather than a few
          // separate blades.
          const strokes: [number, number][][] = [];
          for (const stroke of GRASS_STROKES) {
            strokes.push(stroke);
            const [fu, fv] = stroke[0];
            for (let c = 0; c < BLADE.cluster; c++) {
              const turn = (rnd() - 0.5) * 0.5;
              const scale = 0.7 + rnd() * 0.45;
              const du = (rnd() - 0.5) * 0.012;
              const cos = Math.cos(turn);
              const sin = Math.sin(turn);
              strokes.push(
                stroke.map(([u, v]) => {
                  const x = (u - fu) * scale;
                  const y = (v - fv) * scale;
                  return [fu + du + x * cos - y * sin, fv + x * sin + y * cos] as [number, number];
                }),
              );
            }
          }
          const lean: number[] = [];
          for (const stroke of strokes) {
            const [bu, bv] = stroke[0];
            // The skyline below the base: the first of the rock down its column.
            let sky: THREE_NS.Vector3 | undefined;
            let skyV = 0;
            for (let v = bv + 0.05; v > bv - 0.12 && !sky; v -= 0.002) {
              ray.setFromCamera(new THREE.Vector2(bu / camera.aspect, v), camera);
              sky = ray.intersectObject(rockMesh, false)[0]?.point;
              skyV = v;
            }
            if (!sky) continue;
            const depth = sky.clone().sub(eye).dot(fwd) * (1 + BLADE.back);
            const drop = Math.max(0, bv - skyV);
            // The stroke as a smooth curve, root first: run on below the base,
            // then through Kai's points with a touch of extra bend.
            // Kai's stroke, drawn out longer from its base the way it points
            // — his marks are short for grass this size — with the shortest
            // brought up to a floor, so every blade reads as long and slender
            // like the clump left of the bike.
            const drawn = stroke.map(([u, v]) => new THREE.Vector2(u, v - drop));
            const foot = drawn[0];
            const reach = foot.distanceTo(drawn[drawn.length - 1]) || 1e-6;
            const grow = Math.max(BLADE.grow, BLADE.min / reach) * (0.85 + rnd() * 0.3);
            const pts = drawn.map((p) => foot.clone().add(p.clone().sub(foot).multiplyScalar(grow)));
            const root = foot.clone().add(new THREE.Vector2(0, -BLADE.root));
            const tip = pts[pts.length - 1];
            const len = root.distanceTo(tip);
            // A droop toward the way it leans, growing toward the tip, as a
            // long blade's own weight would bend it; upright ones droop to
            // either side at random.
            const along = tip.clone().sub(root).normalize();
            const down = new THREE.Vector2(along.y, -along.x);
            if (down.y > 0 || (Math.abs(along.x) < 0.15 && rnd() < 0.5)) down.negate();
            const droop = BLADE.droop * (0.6 + rnd() * 0.8) * len;
            const curve = new THREE.SplineCurve([root, ...pts]);
            const n = 12;
            const line = curve.getSpacedPoints(n).map((p, i) => p.clone().addScaledVector(down, droop * (i / n) ** 2));
            const base = pos.length / 3;
            const tall = at(root.x, root.y, depth).distanceTo(at(tip.x, tip.y, depth));
            // Each blade moves a little more or less than its neighbours.
            const give = 0.7 + rnd() * 0.6;
            line.forEach((p, i) => {
              const t = i / n;
              const next = line[Math.min(i + 1, n)];
              const prev = line[Math.max(i - 1, 0)];
              const dir = next.clone().sub(prev).normalize();
              const half = (BLADE.width * (1 - 0.94 * t)) / 2;
              for (const s of [-1, 1]) {
                const q = at(p.x - dir.y * half * s, p.y + dir.x * half * s, depth);
                pos.push(q.x, q.y, q.z);
                sway.push(t * t * tall * give);
                lean.push(along.x);
              }
              if (i < n) {
                const a = base + i * 2;
                // Wound to face the camera.
                index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
              }
            });
          }
          if (index.length) {
            const g = new THREE.BufferGeometry();
            g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
            g.setAttribute("sway", new THREE.Float32BufferAttribute(sway, 1));
            g.setAttribute("lean", new THREE.Float32BufferAttribute(lean, 1));
            g.setIndex(index);
            g.computeVertexNormals();
            rg.add(new THREE.Mesh(g, mat));
          }
          rg.position.copy(home);
          scene.updateMatrixWorld(true);
        }
      }

      /**
       * Each blade is a flat ribbon: points in pairs across its width, all
       * the way up. At hero size a ribbon is narrower than a pixel and breaks
       * up into dots, so each point is pushed out from the middle of its pair
       * by `k` — wider by that much, as long as before, and drawn exactly as
       * cheaply. A point's pair is the nearest other point on its own blade.
       *
       * Not every blade is built in tidy pairs, and where the nearest point
       * is along the blade rather than across it the push went the wrong
       * way and ballooned it into a black leaf. So no point moves further
       * than its blade's typical half-width would grow by.
       */
      function widen(g: THREE_NS.BufferGeometry, k: number) {
        const pos = g.attributes.position;
        const index = g.index;
        if (!index) return;
        const n = pos.count;
        const root = Array.from({ length: n }, (_, i) => i);
        const find = (x: number): number => (root[x] === x ? x : (root[x] = find(root[x])));
        for (let i = 0; i < index.count; i += 3) {
          const a = find(index.getX(i));
          root[find(index.getX(i + 1))] = a;
          root[find(index.getX(i + 2))] = a;
        }
        const blades = new Map<number, number[]>();
        for (let i = 0; i < n; i++) {
          const r = find(i);
          if (!blades.has(r)) blades.set(r, []);
          blades.get(r)!.push(i);
        }
        const v = new THREE.Vector3();
        const w = new THREE.Vector3();
        const out = new Float32Array(n * 3);
        for (const ids of blades.values()) {
          const pair = new Map<number, number>();
          const gaps: number[] = [];
          for (const i of ids) {
            v.fromBufferAttribute(pos, i);
            let best = -1;
            let bestD = Infinity;
            for (const j of ids) {
              if (j === i) continue;
              const d = w.fromBufferAttribute(pos, j).distanceToSquared(v);
              if (d < bestD) {
                bestD = d;
                best = j;
              }
            }
            if (best >= 0) {
              pair.set(i, best);
              gaps.push(Math.sqrt(bestD));
            }
          }
          gaps.sort((a, b) => a - b);
          const cap = ((k - 1) / 2) * (gaps[Math.floor(gaps.length / 2)] ?? 0);
          for (const i of ids) {
            v.fromBufferAttribute(pos, i);
            const j = pair.get(i);
            if (j !== undefined) {
              // Away from the pair's middle, by at most `cap`.
              w.fromBufferAttribute(pos, j);
              const away = v.clone().sub(w).multiplyScalar((k - 1) / 2);
              if (away.length() > cap) away.setLength(cap);
              v.add(away);
            }
            out.set([v.x, v.y, v.z], i * 3);
          }
        }
        for (let i = 0; i < n; i++) pos.setXYZ(i, out[i * 3], out[i * 3 + 1], out[i * 3 + 2]);
        pos.needsUpdate = true;
      }

      // ── Fewer draw calls ────────────────────────────────────────────────
      // The scene is 300-odd separate meshes — the figurine alone is 191
      // flattened Figma shapes — and each costs a draw call every frame.
      // Everything that moves together, and shares a material, is merged
      // into one: under each animated group, one mesh per material. Lossless:
      // every triangle is kept, only the bookkeeping goes.
      const mergeUnder = (root: THREE_NS.Object3D, skip: Set<THREE_NS.Object3D>) => {
        root.updateMatrixWorld(true);
        const inv = root.matrixWorld.clone().invert();
        const sets = new Map<THREE_NS.Material, THREE_NS.BufferGeometry[]>();
        const drop: THREE_NS.Mesh[] = [];
        const walk = (o: THREE_NS.Object3D) => {
          if (o !== root && skip.has(o)) return;
          const mesh = o as THREE_NS.Mesh;
          if (mesh.isMesh && !(mesh as THREE_NS.InstancedMesh).isInstancedMesh && !Array.isArray(mesh.material)) {
            const src = mesh.geometry;
            const g = new THREE.BufferGeometry();
            g.setAttribute("position", floatAttr(src.attributes.position, 3));
            if (src.attributes.normal) g.setAttribute("normal", floatAttr(src.attributes.normal, 3));
            if (src.attributes.sway) g.setAttribute("sway", floatAttr(src.attributes.sway, 1));
            if (src.attributes.lean) g.setAttribute("lean", floatAttr(src.attributes.lean, 1));
            g.setAttribute("uv", src.attributes.uv ? floatAttr(src.attributes.uv, 2) : new THREE.BufferAttribute(new Float32Array(src.attributes.position.count * 2), 2));
            const idx = src.index ? Array.from(src.index.array as ArrayLike<number>) : Array.from({ length: src.attributes.position.count }, (_, i) => i);
            const m = new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld);
            // A mirrored transform turns the triangles inside out.
            if (m.determinant() < 0) for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
            g.setIndex(idx);
            g.applyMatrix4(m);
            if (!g.attributes.normal) g.computeVertexNormals();
            const mat = mesh.material as THREE_NS.Material;
            if (!sets.has(mat)) sets.set(mat, []);
            sets.get(mat)!.push(g);
            drop.push(mesh);
          }
          for (const c of [...o.children]) walk(c);
        };
        walk(root);
        for (const mesh of drop) mesh.removeFromParent();
        for (const [mat, geos] of sets) {
          const merged = mergeGeometries(geos, false);
          if (!merged) continue;
          root.add(new THREE.Mesh(merged, mat));
        }
      };
      {
        const kai = byName("Kai");
        const dd = byName("Designer & Developer (Efficient)");
        const rg = byName("Responsive Group");
        const moving = new Set([kai, dd, rg].filter(Boolean) as THREE_NS.Object3D[]);
        for (const root of moving) mergeUnder(root, moving);
      }

      // ── The rock as a still, on a phone ─────────────────────────────────
      // The rock fills most of a phone's screen and is the costliest thing
      // drawn: a wet, bumped, physically lit surface, every pixel, every
      // frame, scroll or no scroll. On a phone there is no cursor to move its
      // light, so it never changes — and a picture of it, rendered by this
      // same renderer (rock.webp, taken from /lab/hero), is all it needs to
      // be. The rock stays in the scene as depth alone, drawn first and
      // invisibly, so the grass roots and the figure's feet still tuck behind
      // its edge; the bike, the figure, the title and the grass stay live.
      // Only in the phone layout: a phone turned on its side gets the wide
      // layout, and the live rock with it.
      let rock: THREE_NS.Mesh | undefined;
      scene.traverse((o) => {
        if ((o as THREE_NS.Mesh).isMesh && (o as THREE_NS.Mesh).material === rockMat) rock = o as THREE_NS.Mesh;
      });
      const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
      const still = document.createElement("picture");
      still.style.cssText = "position:absolute;inset:0;pointer-events:none;display:none";
      // Filled in on a phone only, so nothing else ever downloads it.
      if (phone) {
        still.innerHTML = '<source type="image/avif" srcset="/hero/rock-phone.avif"><img src="/hero/rock-phone.webp" alt="" decoding="async" draggable="false">';
        (still.lastElementChild as HTMLElement).style.cssText = "position:absolute;top:0;left:50%;height:100%;width:auto;max-width:none;transform:translateX(-50%)";
      }
      el.appendChild(still);
      el.appendChild(canvas);
      const showStill = (on: boolean) => {
        if (!rock || !rockMat) return;
        rock.material = on ? depthOnly : rockMat;
        rock.renderOrder = on ? -1 : 0;
        still.style.display = on ? "block" : "none";
      };

      // ── Layout, floats and the cursor light ─────────────────────────────
      const title = byName("Floating Title");
      const group = byName("Responsive Group");
      const floats = Object.entries(FLOATS).map(([name, f]) => {
        const o = byName(name)!;
        return { o, f, y: o.position.y, rx: o.rotation.x, ry: o.rotation.y };
      });
      // Before the cursor first moves, the light sits a little right of
      // the middle of the screen: where it puts the sheen on the rock where
      // the Spline scene has it on load.
      const followHome = new THREE.Vector3(64.9, 99.2, -16.8);
      if (follow) follow.position.copy(followHome);
      const followAim = followHome.clone();
      // Spline's Follow puts the light where the cursor's ray meets a plane
      // facing the camera, at the light's own depth.
      const depth = follow ? follow.getWorldPosition(new THREE.Vector3()).sub(camera.getWorldPosition(new THREE.Vector3())).dot(camera.getWorldDirection(new THREE.Vector3())) : 0;
      const aimAt = (nx: number, ny: number) => {
        if (!follow) return;
        const p = new THREE.Vector3(nx, ny, 0.5).unproject(camera);
        const origin = camera.getWorldPosition(new THREE.Vector3());
        const dir = p.sub(origin).normalize();
        const fwd = camera.getWorldDirection(new THREE.Vector3());
        const world = origin.add(dir.multiplyScalar(depth / dir.dot(fwd)));
        followAim.copy(follow.parent ? follow.parent.worldToLocal(world) : world);
      };
      const onMove = (e: PointerEvent) => {
        // A mouse only. On a phone every scroll is a touch moving across the
        // screen, and the light chased the reader's thumb all over the rock.
        if (e.pointerType !== "mouse") return;
        const r = canvas.getBoundingClientRect();
        aimAt(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      };
      window.addEventListener("pointermove", onMove, { passive: true });

      let layout: keyof typeof LAYOUT = "wide";
      let layoutFrom = 0;
      let layoutAt = -10;
      const place = (k: number) => {
        const a = LAYOUT[layout === "phone" ? "wide" : "phone"];
        const b = LAYOUT[layout];
        const u = easeInOut(Math.min(1, Math.max(0, k)));
        if (title) {
          title.position.set(...(a.title.p.map((v, i) => v + (b.title.p[i] - v) * u) as [number, number, number]));
          title.scale.setScalar(a.title.s + (b.title.s - a.title.s) * u);
        }
        if (group) group.position.set(...(a.group.p.map((v, i) => v + (b.group.p[i] - v) * u) as [number, number, number]));
      };

      const resize = () => {
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const next = w <= PHONE_MAX ? "phone" : "wide";
        if (next !== layout) {
          layout = next;
          layoutAt = clock;
          layoutFrom = 0;
        }
        showStill(phone && layout === "phone");
      };
      let clock = 0;
      layout = (el.clientWidth || 1) <= PHONE_MAX ? "phone" : "wide";
      place(1);
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();

      const draw = (t: number) => {
        for (const { o, f, y, rx, ry } of floats) {
          const k = pingpong(t, f.out, f.back);
          o.position.y = y + f.dy * k;
          o.rotation.x = rx + f.drx * k;
          o.rotation.y = ry + f.dry * k;
        }
        if (layoutAt > -10) place(layoutFrom + (t - layoutAt));
        if (follow) follow.position.lerp(followAim, 0.08);
        windTime.value = t;
        renderer.render(scene, camera);
      };

      // The posters are this renderer's own first frame, taken in dev from
      // /lab/hero, so the swap from still to live shows no change. Retake
      // them whenever the scene's look changes.
      if (process.env.NODE_ENV !== "production") {
        // `rockOnly` renders the rock by itself, for the phone's still of it.
        (window as unknown as Record<string, unknown>).__heroPoster = async (w: number, h: number, phone: boolean, rockOnly = false) => {
          showStill(false);
          const hidden: THREE_NS.Object3D[] = [];
          if (rockOnly)
            scene.traverse((o) => {
              if ((o as THREE_NS.Mesh).isMesh && o !== rock && o.visible) {
                o.visible = false;
                hidden.push(o);
              }
            });
          layout = phone ? "phone" : "wide";
          layoutAt = -10;
          place(1);
          if (follow) {
            follow.position.copy(followHome);
            followAim.copy(followHome);
          }
          renderer.setPixelRatio(1);
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          windTime.value = 0;
          for (const { o, y, rx, ry } of floats) {
            o.position.y = y;
            o.rotation.x = rx;
            o.rotation.y = ry;
          }
          renderer.render(scene, camera);
          const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
          for (const o of hidden) o.visible = true;
          return blob;
        };
      }

      let raf = 0;
      let last = performance.now();
      let first = true;
      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
      io.observe(el);
      // A phone that cannot keep up draws every other frame instead of
      // dropping them at random: the grass and the floats are slow enough
      // that 30 even frames read smoother than 60 ragged ones, and the page's
      // own scrolling gets the time back. Judged on a running average of
      // the frame time, so a single slow frame never trips it.
      let avg = 1 / 60;
      let half = false;
      let skip = false;
      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        if (!visible) return;
        clock += dt;
        avg += (dt - avg) * 0.05;
        if (phone && !half && avg > 1 / 45) half = true;
        if (half && (skip = !skip)) return;
        draw(clock);
        if (first) {
          first = false;
          onFirstFrame?.();
        }
      };
      raf = requestAnimationFrame(tick);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", onMove);
        renderer.dispose();
        canvas.remove();
        still.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [onFirstFrame]);

  return <div ref={host} aria-hidden="true" style={{ position: "absolute", inset: 0 }} />;
}

/** Matched against renders of the Spline scene with its light pinned in the same place. */
/** The hemisphere fill, in three's units; it sets where the overlay layers sit. */
const AMBIENT = { value: 1.5 };
/** The always-on light's strength in three's units (Spline: 2π). */
const KEY_LIGHT = 1.57;
/**
 * The rock, matched to Spline's: its roughness (lower is wetter), its
 * specular, how hard the photo bumps it, and how much of the light it
 * takes — less is blacker.
 */
const ROCK = { roughness: 0.3, specular: 14, bump: 6, gain: 0.45 };
/**
 * The grass in the wind: how far the tips lean (a share of the tuft's
 * height), the seconds for one slow swing and for the gust over it, and how
 * out of step tufts are across the ridge.
 */
const WIND = { amount: 0.24, period: 4.5, gust: 12, spread: 0.02 };
/**
 * Grass tufts taken out, by their order in the scene: two small ones by the
 * left-hand clump that drew as black leaves, and the pair right of the figure.
 */
const GRASS_DROP = [1, 4, 6, 9];
/**
 * Kai's blades: how wide at the base and how far each runs on below it (in
 * units of the screen's height), how far behind the skyline it stands (a
 * share of its distance from the camera), how many times its drawn length
 * it grows to and the least length it may have (screen-height units), how
 * far its tip droops (a share of its length), and how many more blades grow
 * around each one Kai drew.
 */
const BLADE = { width: 0.0018, root: 0.012, back: 0.004, grow: 2, min: 0.075, droop: 0.22, cluster: 2 };
/** How much wider each grass blade is drawn than it was modelled. */
const GRASS_WIDTH = 1.6;
