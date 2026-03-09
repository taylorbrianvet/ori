import React from "react";
import { AlertCircle, Info, AlertTriangle, Bell } from "lucide-react";
import { format } from "date-fns";
import GlassCard from "../shared/GlassCard";

const priorityConfig = {
  urgent: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
  high: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  medium: { icon: Bell, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  low: { icon: Info, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
};

export default function AnnouncementBanner({ announcements }) {
  if (!announcements || announcements.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {announcements.map((ann) => {
        const config = priorityConfig[ann.priority] || priorityConfig.medium;
        const Icon = config.icon;
        return (
          <GlassCard key={ann.id} className={`${config.border} border`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-sm font-semibold text-foreground">{ann.title}</h4>
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md ${config.bg} ${config.color}`}>
                    {ann.priority}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{ann.message}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1.5">
                  {ann.created_date && format(new Date(ann.created_date), "MMM d, yyyy · h:mm a")}
                </p>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}