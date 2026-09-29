import type { Metadata } from "next";
import StatPage from "@/components/StatPage";
import WaterGrid from "@/components/WaterGrid";

export const metadata: Metadata = {
  title: "Water intake | Health Tracker",
};

export default function WaterPage() {
  return (
    <StatPage
      title="Water intake"
      description="Track how much water you drink each day."
      wide
    >
      <WaterGrid />
    </StatPage>
  );
}
