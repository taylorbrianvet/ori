import React from "react";
import PageContainer from "../components/shared/PageContainer";
import PageHeader from "../components/shared/PageHeader";
import HomeTile from "../components/home/HomeTile";
import {
  LayoutGrid,
  Stethoscope,
  HeartPulse,
  ArrowRightLeft,
  BookOpen,
  FolderOpen,
} from "lucide-react";

const tiles = [
  {
    title: "My Workspace",
    subtext: "Personal schedule, logs, and tools.",
    page: "Home",
    icon: LayoutGrid,
    image: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600&q=80",
  },
  {
    title: "Services",
    subtext: "Browse all hospital departments.",
    page: "Services",
    icon: Stethoscope,
    image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80",
  },
  {
    title: "Patient Care",
    subtext: "Wound care and patient tools.",
    page: "Home",
    icon: HeartPulse,
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80",
  },
  {
    title: "Transfers",
    subtext: "Manage inter-service transfers.",
    page: "Home",
    icon: ArrowRightLeft,
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80",
  },
  {
    title: "Journal Club",
    subtext: "Shared clinical literature from the hospital community.",
    page: "Home",
    icon: BookOpen,
    image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&q=80",
  },
  {
    title: "Resources",
    subtext: "Hospital guides and reference materials.",
    page: "Resources",
    icon: FolderOpen,
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
  },
];

export default function Home() {
  return (
    <PageContainer>
      <PageHeader
        title="Welcome back"
        subtitle="Navigate to your hospital tools and services."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {tiles.map((tile, i) => (
          <HomeTile key={tile.title} {...tile} index={i} />
        ))}
      </div>
    </PageContainer>
  );
}