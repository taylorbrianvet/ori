import React from "react";
import { DollarSign } from "lucide-react";
import GlassCard from "../shared/GlassCard";

export default function EstimateList({ estimates }) {
  if (!estimates || estimates.length === 0) {
    return (
      <GlassCard>
        <p className="text-sm text-muted-foreground text-center py-4">No procedure estimates available.</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-2">
      {estimates.map((est) => (
        <GlassCard key={est.id} className="flex items-center gap-3 py-3.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{est.procedure_name}</p>
            {est.notes && <p className="text-xs text-muted-foreground mt-0.5">{est.notes}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-foreground">
              ${est.estimate_low?.toLocaleString()} – ${est.estimate_high?.toLocaleString()}
            </p>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}