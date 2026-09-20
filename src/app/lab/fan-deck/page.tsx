import FanDeck from "@/components/FanDeck";

export const metadata = {
  title: "Fan deck",
  robots: { index: false, follow: false },
};

export default function FanDeckLab() {
  return (
    <main className="flex flex-1 flex-col justify-center overflow-hidden py-16">
      <h1 className="display px-8 text-3xl sm:px-16">Fan deck</h1>
      <FanDeck className="mt-8" />
    </main>
  );
}
