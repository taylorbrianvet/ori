import React, { useState } from "react";
import { ArrowRight, AlertCircle, MapPin, Clock } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import TransferDetailModal from "./TransferDetailModal";

function formatLocalTime(isoString) {
  if (!isoString) return "";
  // Ensure UTC parsing by appending Z if no timezone info present
  const s = /[Z+\-]\d*$/.test(isoString) ? isoString : isoString + "Z";
  const d = new Date(s);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

export default function TransferCard({ transfers, transfer, onUpdated, bucket }) {
  const [showDetail, setShowDetail] = useState(false);

  // Support both grouped and single transfer
  const transferGroup = transfers || (transfer ? [transfer] : []);
  const primaryTransfer = transferGroup[0];
  const isDoubleTransfer = transferGroup.length > 1;

  const ageString = [
    primaryTransfer.age_years && `${primaryTransfer.age_years}y`,
    primaryTransfer.age_months && `${primaryTransfer.age_months}m`,
    primaryTransfer.age_weeks && `${primaryTransfer.age_weeks}w`,
  ].filter(Boolean).join(" ");

  const signalment = [
    ageString,
    primaryTransfer.sex,
    primaryTransfer.species,
    primaryTransfer.breed,
  ].filter(Boolean).join(" · ");

  const bucketBadge = {
    today: { text: "Today's Transfer", cls: "bg-sky-500/20 border-sky-400/30 text-sky-200" },
    upcoming: { text: "Upcoming Transfer", cls: "bg-amber-500/20 border-amber-400/30 text-amber-200" },
    previous: { text: "Previous Transfer", cls: "bg-white/8 border-white/12 text-white/40" },
  }[bucket];

  return (
    <>
      <div
        className="glass-card p-4 cursor-pointer glass-hover"
        onClick={() => setShowDetail(true)}
      >
        {/* Top row: name, ID, badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{primaryTransfer.patient_name}</span>
              {primaryTransfer.patient_id && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 border border-white/12 text-white/45 font-mono">
                  #{primaryTransfer.patient_id}
                </span>
              )}
              {bucketBadge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${bucketBadge.cls}`}>
                  {bucketBadge.text}
                </span>
              )}
              {isDoubleTransfer && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-200 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Double Transfer
                </span>
              )}
              {primaryTransfer.already_transferred && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 border border-green-400/25 text-green-300 font-medium">
                  Already Transferred
                </span>
              )}
            </div>
            {signalment && <p className="text-xs text-white/40 mt-0.5">{signalment}</p>}
          </div>
        </div>

        {/* Service arrows */}
        <div className="space-y-1.5 mb-3">
          {transferGroup.map((t, idx) => {
            const receivingServices = t.receiving_services?.length > 0 ? t.receiving_services : (t.receiving_service ? [t.receiving_service] : []);
            return (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-white/8 border border-white/12 text-white/65 font-medium">{t.requesting_service}</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <span className="px-2.5 py-1 rounded-lg bg-white/12 border border-white/18 text-white/85 font-medium">
                  {receivingServices.join(", ")}
                </span>
                {t.estimate && (
                  <span className="ml-auto text-white/60 font-medium">${Number(t.estimate).toLocaleString()}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Problem list */}
        {(primaryTransfer.problem_list || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {primaryTransfer.problem_list.map((p, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-white/6 border border-white/10 text-white/55">{p}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-white/30">
          <div className="flex items-center gap-3">
            {primaryTransfer.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {primaryTransfer.location}
              </span>
            )}
            {primaryTransfer.requesting_clinician && (
              <span>{primaryTransfer.requesting_clinician}</span>
            )}
          </div>
          {primaryTransfer.created_date && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatLocalTime(primaryTransfer.created_date)}
            </span>
          )}
        </div>

        {primaryTransfer.notes && (
          <p className="mt-2 text-xs text-white/35 italic border-t border-white/8 pt-2 truncate">{primaryTransfer.notes}</p>
        )}
      </div>

      <AnimatePresence>
        {showDetail && (
          <TransferDetailModal
            transfers={transferGroup}
            bucket={bucket}
            onClose={() => setShowDetail(false)}
            onUpdated={() => { setShowDetail(false); onUpdated?.(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}