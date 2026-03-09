import React from "react";
import { Phone, Mail, MessageSquare } from "lucide-react";
import GlassCard from "../shared/GlassCard";
import { Badge } from "@/components/ui/badge";

const roleColors = {
  faculty: "bg-primary/10 text-primary",
  resident: "bg-blue-500/10 text-blue-600",
  intern: "bg-teal-500/10 text-teal-600",
  technician: "bg-amber-500/10 text-amber-600",
  nurse: "bg-green-500/10 text-green-600",
  admin: "bg-purple-500/10 text-purple-600",
  staff: "bg-muted text-muted-foreground",
};

export default function StaffList({ staff }) {
  if (!staff || staff.length === 0) {
    return (
      <GlassCard>
        <p className="text-sm text-muted-foreground text-center py-4">No staff currently assigned.</p>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {staff.map((person) => (
        <GlassCard key={person.id} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-primary">
              {(person.full_name || "?").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{person.full_name || "Unknown"}</p>
            <Badge className={`text-[10px] mt-0.5 ${roleColors[person.role] || roleColors.staff}`}>
              {person.role || "Staff"}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            {person.phone && (
              <a
                href={`tel:${person.phone}`}
                className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center hover:bg-green-500/20 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-green-600" />
              </a>
            )}
            {person.phone && (
              <a
                href={`sms:${person.phone}`}
                className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              </a>
            )}
            {person.email && (
              <a
                href={`mailto:${person.email}`}
                className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-primary" />
              </a>
            )}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}