import React from "react";
import { Scissors } from "lucide-react";

export default function WorkspaceProfile({ currentUser, staffRecord, totalCount, loggedCount, pendingCount, onOpenLog }) {
  const fullName = currentUser?.full_name || "My Workspace";
  const role = staffRecord?.role || "";
  const service = staffRecord?.service || staffRecord?.department || "";
  const profileImg = staffRecord?.profile_image_url || null;

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center">
          {profileImg ? (
            <img src={profileImg} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-semibold text-white/80">{initials}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white">{fullName}</h1>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {role && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/12 text-xs text-white/75 font-medium">{role}</span>
            )}
            {service && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/8 text-xs text-white/55">{service}</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 flex-shrink-0">
          {/* Total */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{totalCount}</span>
            </div>
            <span className="text-[10px] text-white/45 font-medium uppercase tracking-wide">Total</span>
          </div>
          {/* Logged */}
          <div
            className="flex flex-col items-center gap-1 cursor-pointer group"
            onClick={onOpenLog}
            title="Open procedure log"
          >
            <div className="w-14 h-14 rounded-full bg-green-500/15 border-2 border-green-500/40 group-hover:border-green-400/70 flex items-center justify-center transition-colors">
              <span className="text-xl font-bold text-green-400">{loggedCount}</span>
            </div>
            <span className="text-[10px] text-green-400/70 font-medium uppercase tracking-wide">Logged</span>
          </div>
          {/* Pending */}
          <div
            className="flex flex-col items-center gap-1 cursor-pointer group"
            onClick={onOpenLog}
            title="Open procedure log"
          >
            <div className="w-14 h-14 rounded-full bg-amber-500/15 border-2 border-amber-500/40 group-hover:border-amber-400/70 flex items-center justify-center transition-colors">
              <span className="text-xl font-bold text-amber-400">{pendingCount}</span>
            </div>
            <span className="text-[10px] text-amber-400/70 font-medium uppercase tracking-wide">Pending</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onOpenLog}
        className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/8 hover:bg-white/14 border border-white/10 text-sm text-white/70 hover:text-white transition-colors"
      >
        <Scissors className="w-4 h-4" />
        Open My Procedure Log
      </button>
    </div>
  );
}