import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
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

const DEFAULT_TILES = [
  { key: "my_workspace", title: "My Workspace", subtext: "Personal schedule, logs, and tools.", page: "Home", icon: LayoutGrid, defaultImage: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600&q=80" },
  { key: "services", title: "Services", subtext: "Browse all hospital departments.", page: "Services", icon: Stethoscope, defaultImage: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80" },
  { key: "patient_care", title: "Patient Care", subtext: "Wound care and patient tools.", page: "Home", icon: HeartPulse, defaultImage: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80" },
  { key: "transfers", title: "Transfers", subtext: "Manage inter-service transfers.", page: "Home", icon: ArrowRightLeft, defaultImage: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80" },
  { key: "journal_club", title: "Journal Club", subtext: "Shared clinical literature from the hospital community.", page: "Home", icon: BookOpen, defaultImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&q=80" },
  { key: "resources", title: "Resources", subtext: "Hospital guides and reference materials.", page: "Resources", icon: FolderOpen, defaultImage: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80" },
];

export default function Home() {
  const { data: configs } = useQuery({
    queryKey: ["home-tile-configs"],
    queryFn: () => base44.entities.HomeTileConfig.list(),
    initialData: [],
  });

  const configMap = Object.fromEntries((configs || []).map((c) => [c.tile_key, c]));

  const tiles = DEFAULT_TILES.map((t) => ({
    ...t,
    image: configMap[t.key]?.image_url || t.defaultImage,
  }));

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