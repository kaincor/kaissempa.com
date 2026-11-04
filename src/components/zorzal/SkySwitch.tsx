"use client";

import { useSyncExternalStore } from "react";
import CloudDrift from "@/components/CloudDrift";
import DaySky from "./DaySky";

/**
 * The new daytime sky by default; /zorzal?sky=clouds brings back the
 * drifting clouds so Kai can compare the two before choosing.
 */
export default function SkySwitch() {
  const clouds = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("sky") === "clouds",
    () => false,
  );

  if (!clouds) return <DaySky />;
  return (
    <CloudDrift
      layers={[
        { src: "/case-studies/cloud-1.svg", heightPct: 70, aspect: 2.452, duration: 46 },
        { src: "/case-studies/cloud-2.svg", heightPct: 62, aspect: 1.487, duration: 70 },
      ]}
    />
  );
}
