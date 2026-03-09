import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import GlassCard from "../shared/GlassCard";

export default function EquipmentList({ equipment }) {
  if (!equipment || equipment.length === 0) {
    return (
      <GlassCard>
        <p className="text-sm text-muted-foreground text-center py-4">No equipment listed.</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-2">
      {equipment.map((item) => (
        <GlassCard key={item.id} className="flex items-center gap-3 py-3.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            item.status ? "bg-green-500/10" : "bg-red-500/10"
          }`}>
            {item.status ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{item.equipment_name}</p>
            {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
            item.status ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"
          }`}>
            {item.status ? "Operational" : "Down"}
          </span>
        </GlassCard>
      ))}
    </div>
  );
}