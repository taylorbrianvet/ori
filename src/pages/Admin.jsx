import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageContainer from "../components/shared/PageContainer";
import PageHeader from "../components/shared/PageHeader";
import GlassCard from "../components/shared/GlassCard";
import { Upload, ImageIcon, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import RotationBlockCalendar from "../components/admin/RotationBlockCalendar";

const DEFAULT_TILES = [
  { key: "my_workspace", title: "My Workspace", defaultImage: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600&q=80" },
  { key: "services", title: "Services", defaultImage: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80" },
  { key: "patient_care", title: "Patient Care", defaultImage: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80" },
  { key: "transfers", title: "Transfers", defaultImage: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80" },
  { key: "journal_club", title: "Journal Club", defaultImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&q=80" },
  { key: "resources", title: "Resources", defaultImage: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80" },
];

function TileImageEditor({ tile, config }) {
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  const currentImage = config?.image_url || tile.defaultImage;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (config?.id) {
        await base44.entities.HomeTileConfig.update(config.id, { image_url: file_url });
      } else {
        await base44.entities.HomeTileConfig.create({ tile_key: tile.key, image_url: file_url });
      }
      queryClient.invalidateQueries({ queryKey: ["home-tile-configs"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success(`${tile.title} image updated`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleUrlChange = async (url) => {
    if (!url.trim()) return;
    try {
      if (config?.id) {
        await base44.entities.HomeTileConfig.update(config.id, { image_url: url });
      } else {
        await base44.entities.HomeTileConfig.create({ tile_key: tile.key, image_url: url });
      }
      queryClient.invalidateQueries({ queryKey: ["home-tile-configs"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success(`${tile.title} image updated`);
    } catch {
      toast.error("Failed to update image");
    }
  };

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="relative h-40 overflow-hidden">
        <img src={currentImage} alt={tile.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
          <span className="text-white text-sm font-semibold">{tile.title}</span>
          {saved && (
            <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Upload file */}
        <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-border cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5 text-sm font-medium text-muted-foreground hover:text-primary ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
          ) : (
            <><Upload className="w-4 h-4" /> Upload Image</>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
        </label>

        {/* Or paste URL */}
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Or paste image URL…"
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUrlChange(e.target.value);
            }}
            onBlur={(e) => {
              if (e.target.value.startsWith("http")) handleUrlChange(e.target.value);
            }}
          />
          <button
            className="px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title="Apply URL"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}



// Which services an admin can manage rotation blocks for
// Surgery + Neurosurgery share the same admin department
const SERVICE_ADMIN_MAP = {
  Anesthesia: ["Anesthesia"],
  Surgery: ["Surgery", "Neurosurgery"],
  Neurosurgery: ["Surgery", "Neurosurgery"],
};

function getEditableServices(staffProfile) {
  if (!staffProfile) return [];
  const dept = staffProfile.department || "";
  return SERVICE_ADMIN_MAP[dept] || [];
}

export default function Admin() {
  const [user, setUser] = useState(null);
  const [staffProfile, setStaffProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (u?.email) {
        base44.entities.Staff.filter({ email: u.email }).then((results) => {
          if (results?.length > 0) setStaffProfile(results[0]);
        }).catch(() => {});
      }
    }).finally(() => setAuthLoading(false));
  }, []);

  const { data: configs, isLoading } = useQuery({
    queryKey: ["home-tile-configs"],
    queryFn: () => base44.entities.HomeTileConfig.list(),
    initialData: [],
  });

  if (authLoading || isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <ImageIcon className="w-7 h-7 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">You must be an administrator to view this page.</p>
        </div>
      </PageContainer>
    );
  }

  const configMap = Object.fromEntries(configs.map((c) => [c.tile_key, c]));

  // Super admins (no staff profile or unrecognized dept) can edit all services
  const editableServices = staffProfile
    ? getEditableServices(staffProfile)
    : ["Anesthesia", "Surgery", "Neurosurgery"];

  const SERVICE_LABELS = {
    Anesthesia: { label: "Anesthesia", color: "text-purple-300" },
    Surgery: { label: "Surgery", color: "text-blue-300" },
    Neurosurgery: { label: "Neurosurgery", color: "text-emerald-300" },
  };

  return (
    <PageContainer>
      <PageHeader title="Admin" subtitle="Manage system settings and home tile images." />

      {/* Rotation Block Calendars */}
      {editableServices.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Rotation Block Schedules</h2>
          <p className="text-sm text-white/50 mb-6">Click any date to mark it as a block start. The gap between two starts defines the block length. Blocks go live at 8am on their start date.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {editableServices.map((svc) => (
              <GlassCard key={svc} className="p-6">
                <h3 className={`text-base font-semibold mb-4 ${SERVICE_LABELS[svc].color}`}>{SERVICE_LABELS[svc].label}</h3>
                <RotationBlockCalendar service={svc} />
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Home Tile Images */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Home Tile Images</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEFAULT_TILES.map((tile) => (
            <TileImageEditor key={tile.key} tile={tile} config={configMap[tile.key]} />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}