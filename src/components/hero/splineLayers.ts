import type * as THREE_NS from "three";

/**
 * Spline's layered materials, rebuilt on three's own.
 *
 * A Spline material is a stack: a base (a colour or a texture), then a
 * lighting layer, then matcap and fresnel layers, each composited onto what
 * is below it with a blend mode and an opacity. The GLTF export keeps none of
 * that — only a flat PBR guess — so the stack is put back here, read off the
 * running Spline scene (each layer's `data`).
 *
 * The lighting layer is three's ordinary lighting. In Normal mode it lights
 * the base, as three would; in the other modes Spline computes the light on
 * its own (on white) and blends that over the base, which is why the title
 * reads as its grey whatever the lights are doing and only the highlights
 * move.
 */

/** Spline's blend modes, by its numbering. */
export const MODE = { normal: 0, multiply: 1, screen: 2, overlay: 3 } as const;
type Mode = (typeof MODE)[keyof typeof MODE];

export type LayerSpec = {
  /** The base layer: a colour, or the material's own texture. */
  base: { color: number[] } | { texture: true };
  light: { mode: Mode; alpha: number };
  matcap?: { tex: THREE_NS.Texture; mode: Mode; alpha: number; intensity: number };
  fresnel?: { color: number[]; mode: Mode; alpha: number; bias: number; scale: number; power: number; factor: number };
  /** A colour layer above the light, as Path 5 has. */
  tint?: { color: number[]; mode: Mode; alpha: number };
};

const BLEND = /* glsl */ `
vec3 splBlend(vec3 a, vec3 b, int mode) {
  if (mode == 1) return a * b;
  if (mode == 2) return 1.0 - (1.0 - a) * (1.0 - b);
  if (mode == 3) return mix(2.0 * a * b, 1.0 - 2.0 * (1.0 - a) * (1.0 - b), step(0.5, a));
  return b;
}
`;

export function applyLayers(m: THREE_NS.Material & { color?: THREE_NS.Color }, spec: LayerSpec) {
  const lightOnBase = spec.light.mode === MODE.normal;
  const v3 = (c: number[]) => ({ value: { x: c[0], y: c[1], z: c[2], isVector3: true } });
  m.onBeforeCompile = (shader) => {
    const u = shader.uniforms;
    u.splLightMode = { value: spec.light.mode };
    u.splLightAlpha = { value: spec.light.alpha };
    u.splBaseColor = v3("color" in spec.base ? spec.base.color : [1, 1, 1]);
    u.splUseBaseColor = { value: "color" in spec.base ? 1 : 0 };
    u.splLightOnBase = { value: lightOnBase ? 1 : 0 };
    if (spec.matcap) {
      u.splMatcap = { value: spec.matcap.tex };
      u.splMatcapMode = { value: spec.matcap.mode };
      u.splMatcapAlpha = { value: spec.matcap.alpha };
      u.splMatcapIntensity = { value: spec.matcap.intensity };
    }
    if (spec.fresnel) {
      const f = spec.fresnel;
      u.splFresnelColor = v3(f.color);
      u.splFresnel = { value: [f.bias, f.scale, f.power, f.factor] };
      u.splFresnelMode = { value: f.mode };
      u.splFresnelAlpha = { value: f.alpha };
    }
    if (spec.tint) {
      u.splTint = v3(spec.tint.color);
      u.splTintMode = { value: spec.tint.mode };
      u.splTintAlpha = { value: spec.tint.alpha };
    }
    const decl = [
      "uniform int splLightMode; uniform float splLightAlpha; uniform vec3 splBaseColor; uniform int splUseBaseColor; uniform int splLightOnBase;",
      spec.matcap ? "uniform sampler2D splMatcap; uniform int splMatcapMode; uniform float splMatcapAlpha; uniform float splMatcapIntensity;" : "",
      spec.fresnel ? "uniform vec3 splFresnelColor; uniform vec4 splFresnel; uniform int splFresnelMode; uniform float splFresnelAlpha;" : "",
      spec.tint ? "uniform vec3 splTint; uniform int splTintMode; uniform float splTintAlpha;" : "",
      BLEND,
    ].join("\n");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${decl}`)
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        vec3 splBase = splUseBaseColor == 1 ? splBaseColor : diffuseColor.rgb;
        // Light computed on the base in Normal mode, on white otherwise.
        diffuseColor.rgb = splLightOnBase == 1 ? splBase : vec3(1.0);`,
      )
      .replace(
        "#include <opaque_fragment>",
        `{
          vec3 res = mix(splBase, splBlend(splBase, outgoingLight, splLightMode), splLightAlpha);
          ${spec.tint ? "res = mix(res, splBlend(res, splTint, splTintMode), splTintAlpha);" : ""}
          ${
            spec.matcap
              ? `{
            // Straight off the view-space normal: Spline's flat letters
            // keep one matcap value right to the edge of the view.
            vec2 muv = normal.xy * 0.495 + 0.5;
            vec3 mc = clamp(texture2D(splMatcap, muv).rgb * splMatcapIntensity, 0.0, 1.0);
            res = mix(res, splBlend(res, mc, splMatcapMode), splMatcapAlpha);
          }`
              : ""
          }
          ${
            spec.fresnel
              ? `{
            float nv = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
            float fr = clamp(splFresnel.x + splFresnel.y * pow(1.0 - nv, splFresnel.z), 0.0, 1.0) * splFresnel.w;
            res = mix(res, splBlend(res, splFresnelColor * fr, splFresnelMode), splFresnelAlpha);
          }`
              : ""
          }
          outgoingLight = res;
        }
        #include <opaque_fragment>`,
      );
  };
  m.needsUpdate = true;
  return m;
}
