"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense } from "react";

/**
 * Camera from Spline's own Three.js export, divided by 100. The glTF export is
 * in metres while the Spline editor works in centimetres, so the exported
 * camera (z = 304.68, near = 70) sits far outside a scene only ~8 units wide.
 */
const SCALE = 100;
const CAMERA = {
  fov: 45,
  near: 70 / SCALE,
  far: 100000 / SCALE,
  position: [-92.15 / SCALE, -11.68 / SCALE, 304.68 / SCALE] as [
    number,
    number,
    number,
  ],
  rotation: [0.34, -0.33, 0.1] as [number, number, number],
};

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function SceneViewer({
  url,
  orbit = false,
}: {
  url: string;
  orbit?: boolean;
}) {
  return (
    <Canvas
      style={{ width: "100%", height: "100%", background: "#d4d4d4" }}
      camera={CAMERA}
      dpr={[1, 2]}
      onCreated={({ camera }) => {
        camera.rotation.set(...CAMERA.rotation);
      }}
    >
      <Suspense fallback={null}>
        <Model url={url} />
      </Suspense>
      {orbit ? <OrbitControls enableDamping dampingFactor={0.125} /> : null}
    </Canvas>
  );
}
