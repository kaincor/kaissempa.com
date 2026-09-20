import SceneViewer from "@/components/SceneViewer";

export const metadata = {
  title: "Scene",
  robots: { index: false, follow: false },
};

export default function SceneLab() {
  return (
    <main className="flex flex-1 flex-col">
      <div style={{ height: "100dvh" }}>
        <SceneViewer url="/scene/precipice-2048.glb" orbit />
      </div>
    </main>
  );
}
