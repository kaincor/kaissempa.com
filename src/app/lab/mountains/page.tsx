import RangePicker from "./RangePicker";

export const metadata = {
  title: "Mountain ranges",
  robots: { index: false, follow: false },
};

export default function MountainsLab() {
  return (
    <main className="flex flex-1 flex-col">
      <RangePicker />
    </main>
  );
}
