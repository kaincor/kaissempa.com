/**
 * Compresses Spline's GLTF export of the hero scene into public/hero/cliff.glb.
 *
 *   npx -p @gltf-transform/core@4 -p @gltf-transform/extensions@4 \
 *       -p @gltf-transform/functions@4 -p meshoptimizer -p sharp \
 *       node scripts/hero-glb.mjs "assets/Cliff's Edge/precipice_transparent_background.gltf" public/hero/cliff.glb
 *
 * What it does, and why each step:
 * - Strips the mesh extras. Spline writes every shape's editing parameters
 *   into them — 9MB of point lists the page never reads.
 * - Simplifies each mesh to an error budget set by what it is. The rough
 *   "KAI" letters were half the scene's triangles for outlines nobody can
 *   resolve at hero size; the figurine and bike keep tighter budgets.
 * - Drops the rock's roughness map: it comes out near zero (a mirror), and
 *   the page builds the rock's sheen from the colour texture instead.
 * - The rock's colour texture to WebP at 2048, then quantization and
 *   meshopt compression.
 * 75MB in, about 1.7MB out.
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplifyPrimitive, quantize, meshopt, textureCompress, reorder } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
const [,, inp, out, eScale='1'] = process.argv;
await MeshoptSimplifier.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(inp);
const root = doc.getRoot();
for (const n of root.listNodes()) if (n.getCamera() && n.getName() !== 'Camera') n.setCamera(null);
const tris = (m) => m.listPrimitives().reduce((a,p)=>a+(p.getIndices()?.getCount()??0)/3,0);
const pathOf = (n) => { const p=[]; let c=n; while (c) { p.unshift(c.getName()); c = c.getParentNode(); } return p.join('/'); };
const k = +eScale;
const budget = (path) => {
  if (/Roughness/.test(path)) return 0.004 * k;
  if (path.includes('Kai Figurine')) return 0.002 * k;
  if (path.includes('Revamped Bike')) return 0.0015 * k;
  if (path.includes('Cliff')) return 0.001 * k;
  return 0.001 * k;
};
// Spline writes each shape's full editing parameters into mesh extras —
// 9MB of point lists the page never reads.
for (const m of root.listMeshes()) { m.setExtras({}); for (const p of m.listPrimitives()) p.setExtras({}); }
for (const n of root.listNodes()) n.setExtras({});
for (const m of root.listMaterials()) m.setMetallicRoughnessTexture(null);
await doc.transform(dedup(), weld());
let before = 0, after = 0; const rows = [];
const done = new Set();
for (const n of root.listNodes()) {
  const m = n.getMesh(); if (!m || done.has(m)) continue; done.add(m);
  const t0 = tris(m); before += t0;
  const err = budget(pathOf(n));
  for (const p of m.listPrimitives()) simplifyPrimitive(p, { simplifier: MeshoptSimplifier, ratio: 0, error: err, lockBorder: false });
  const t1 = tris(m); after += t1;
  rows.push([t0, t1, pathOf(n).split('/').slice(-3).join('/')]);
}
rows.sort((a,b)=>b[0]-a[0]); console.log(rows.slice(0,15).map(r=>r.join('  ')).join('\n'));
console.log('tris', before, '->', after);
await doc.transform(
  prune(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [2048, 2048], quality: 80, slots: /^baseColor/ }),
  reorder({ encoder: MeshoptEncoder }),
  quantize(),
  meshopt({ encoder: MeshoptEncoder, level: 'high' }),
);
await io.write(out, doc);
