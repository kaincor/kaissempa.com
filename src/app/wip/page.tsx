export const metadata = {
  title: "Work in progress",
  robots: { index: false, follow: false },
};

export default function WipPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-8 py-40">
      <div style={{ maxWidth: 520, textAlign: "center" }}>
        <h1 className="display text-4xl sm:text-5xl">Work in progress</h1>
        <p
          className="display mt-6"
          style={{ color: "var(--muted)", fontSize: "clamp(14px, 1.6vw, 19px)" }}
        >
          This case study is being written. Check back soon.
        </p>
      </div>
    </main>
  );
}
