import React from "react";
import { Phone, Mail, MessageCircle } from "lucide-react";

const ROLE_COLORS = {
  Faculty: "bg-blue-500/20 text-blue-200",
  Resident: "bg-emerald-500/20 text-emerald-200",
  Intern: "bg-amber-500/20 text-amber-200",
  Technician: "bg-purple-500/20 text-purple-200",
  Student: "bg-rose-500/20 text-rose-200",
};

export default function StaffCard({ staff, onClick }) {
  const initials = `${staff.first_name?.[0] ?? ""}${staff.last_name?.[0] ?? ""}`.toUpperCase();
  const roleColor = ROLE_COLORS[staff.role] || "bg-white/10 text-white/60";

  return (
    <div
      onClick={onClick}
      className="glass-card p-3.5 flex items-center gap-3 cursor-pointer hover:bg-white/14 transition-all duration-200 group"
    >
      {staff.profile_image_url ? (
        <img
          src={staff.profile_image_url}
          alt={`${staff.first_name} ${staff.last_name}`}
          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/15"
        />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-white/12 flex items-center justify-center shrink-0 border border-white/10">
          <span className="text-xs font-bold text-white/75">{initials}</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90 truncate">
          {staff.first_name} {staff.last_name}
        </p>
        <p className="text-[11px] text-white/45 truncate">{staff.service || staff.department}</p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${roleColor}`}>
          {staff.role}
        </span>
      </div>

      {/* Quick contact icons — visible on hover */}
      <div className="hidden group-hover:flex items-center gap-1 ml-1">
        {staff.phone && (
          <a
            href={`tel:${staff.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 text-white/40 hover:text-white/80 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
        {staff.email && (
          <a
            href={`mailto:${staff.email}`}
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 text-white/40 hover:text-white/80 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}