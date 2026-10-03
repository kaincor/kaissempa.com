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
 * - Drops the rock's textures: the page builds the rock from a colour and a
 *   small normal map (public/hero/rock-detail.webp) instead.
 * - The bike paint's texture to WebP, then quantization and meshopt
 *   compression.
 * 75MB in, about 0.6MB out.
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
  // The grass blades are thin curves at a few pixels on screen, and the page
  // copies them along the ridge; they can lose the most.
  if (path.includes('Grass')) return 0.003 * k;
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
for (const m of root.listMaterials()) {
  m.setMetallicRoughnessTexture(null);
  // The rock's photograph: the page builds the rock from a colour and a
  // small normal map instead (after the MTB Summit scene), so the 4096px
  // photo is a megabyte nobody sees. The bike's paint keeps its texture.
  if (m.getAlphaMode() !== 'BLEND') m.setBaseColorTexture(null);
}
// Texture coordinates only where something is mapped through them: the
// rock (its normal map, applied by the page) and the bike's paint.
for (const n of root.listNodes()) {
  const mesh = n.getMesh();
  if (!mesh || n.getName() === 'Rock') continue;
  for (const p of mesh.listPrimitives()) {
    if (!p.getMaterial()?.getBaseColorTexture()) p.setAttribute('TEXCOORD_0', null);
  }
}
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
  // Keep the texture coordinates: with its photo gone the rock references no
  // texture, but the page maps its normal map through them.
  prune({ keepAttributes: true }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [2048, 2048], quality: 80, slots: /^baseColor/ }),
  reorder({ encoder: MeshoptEncoder }),
  quantize(),
  meshopt({ encoder: MeshoptEncoder, level: 'high' }),
);
await io.write(out, doc);
