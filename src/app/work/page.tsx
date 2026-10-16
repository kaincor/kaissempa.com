import type { Metadata } from "next";
import ProjectsAndProducts from "@/components/ProjectsAndProducts";

export const metadata: Metadata = {
  title: "Work",
  description: "Kai Ssempa's projects and products: case studies in product design, branding and development.",
};

/**
 * Work: the home page's Projects & Products, on its own, with a line under
 * each thumbnail about the role it was.
 */
export default function WorkPage() {
  return (
    <main className="flex flex-1 flex-col" style={{ paddingBottom: "clamp(60px, 10vw, 120px)" }}>
      <ProjectsAndProducts detailed />
    </main>
  );
}
