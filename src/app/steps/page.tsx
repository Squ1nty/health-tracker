import type { Metadata } from "next";
import StatPage from "@/components/StatPage";

export const metadata: Metadata = {
  title: "Steps | Health Tracker",
};

export default function StepsPage() {
  return (
    <StatPage title="Steps" description="Track your daily step count." />
  );
}
