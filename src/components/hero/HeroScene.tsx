"use client";

import { useEffect, useRef } from "react";
import type * as THREE_NS from "three";
import { PHONE_MAX } from "./constants";
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
    title: { p: [152.059, 346.77, -339.687], s: 0.3 },
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

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      const canvas = renderer.domElement;
      canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
      el.appendChild(canvas);

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
        if (src.map) {
          // The rock: its texture, lit normally at 90%.
          // Spline's settings: roughness from the texture's luminance, the
          // texture as a bump map, reflectivity 10.
          const m = physical(PHYS(ROCK.roughness, 0), {
            map: src.map,
            roughnessMap: src.map,
            bumpMap: src.map,
            bumpScale: ROCK.bump,
            specularIntensity: 1,
            specularColor: new THREE.Color(ROCK.specular, ROCK.specular, ROCK.specular),
          });
          return applyLayers(m, { base: { texture: true }, light: { mode: MODE.normal, alpha: 0.9 } });
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
        renderer.render(scene, camera);
      };

      // The posters are this renderer's own first frame, taken in dev from
      // /lab/hero, so the swap from still to live shows no change. Retake
      // them whenever the scene's look changes.
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as Record<string, unknown>).__heroPoster = async (w: number, h: number, phone: boolean) => {
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
          for (const { o, y, rx, ry } of floats) {
            o.position.y = y;
            o.rotation.x = rx;
            o.rotation.y = ry;
          }
          renderer.render(scene, camera);
          return await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
        };
      }

      let raf = 0;
      let last = performance.now();
      let first = true;
      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
      io.observe(el);
      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        if (!visible) return;
        clock += dt;
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
 * The rock's sheen. Spline's rock is roughness 0.1 driven by its texture's
 * luminance, bumped by it at 0.5, at a reflectivity of 10. Three reads a
 * roughness map as a multiplier and has no reflectivity past 1, so the same
 * look comes from a full roughness scaled by the texture, and a boosted
 * specular colour.
 */
const ROCK = { roughness: 1, bump: 3, specular: 10 };
