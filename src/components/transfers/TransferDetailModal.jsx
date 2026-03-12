import React, { useState } from "react";
import { format } from "date-fns";
import { X, ArrowRight, MapPin, DollarSign, FileText, User, Pencil, AlertCircle, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import TransferEditForm from "./TransferEditForm";

function formatLocalTime(isoString) {
  if (!isoString) return "";
  // Ensure UTC parsing by appending Z if no timezone info present
  const s = /[Z+\-]\d*$/.test(isoString) ? isoString : isoString + "Z";
  const d = new Date(s);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

export default function TransferDetailModal({ transfers, onClose, onUpdated, bucket }) {
  const [editing, setEditing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const primaryTransfer = transfers[0];
  const isDoubleTransfer = transfers.length > 1;

  const handleCancelTransfer = async () => {
    setDeleting(true);
    try {
      // Delete all transfer records in this group
      for (const transfer of transfers) {
        await base44.entities.InterserviceTransfer.delete(transfer.id);
      }
      toast.success("Transfer cancelled and removed.");
      setShowCancelConfirm(false);
      onClose();
      onUpdated?.();
    } catch (error) {
      console.error("Error cancelling transfer:", error);
      toast.error("Failed to cancel transfer.");
    } finally {
      setDeleting(false);
    }
  };

  const signalment = [
    primaryTransfer.age,
    primaryTransfer.sex,
    primaryTransfer.species,
    primaryTransfer.breed,
  ].filter(Boolean).join(" · ");

  const bucketLabel = {
    today: { text: "Today's Transfer", color: "bg-sky-500/20 border-sky-400/30 text-sky-200" },
    upcoming: { text: "Upcoming Transfer", color: "bg-amber-500/20 border-amber-400/30 text-amber-200" },
    previous: { text: "Previous Transfer", color: "bg-white/10 border-white/15 text-white/50" },
  }[bucket] || { text: "", color: "" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="relative z-10 w-full max-w-lg glass-card overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {editing ? (
          <TransferEditForm
            transfers={transfers}
            onClose={() => setEditing(false)}
            onSaved={() => { setEditing(false); onUpdated?.(); }}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-white/10">
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-base font-semibold text-white">{primaryTransfer.patient_name}</h2>
                  {primaryTransfer.patient_id && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 border border-white/12 text-white/45 font-mono">
                      #{primaryTransfer.patient_id}
                    </span>
                  )}
                  {isDoubleTransfer && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-200 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Double Transfer
                    </span>
                  )}
                  {bucketLabel.text && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${bucketLabel.color}`}>
                      {bucketLabel.text}
                    </span>
                  )}
                </div>
                {signalment && <p className="text-xs text-white/45">{signalment}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {bucket === "upcoming" && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-400/30 text-xs text-red-300 hover:text-red-200 hover:bg-red-500/25 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Cancel
                  </button>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 border border-white/12 text-xs text-white/60 hover:text-white hover:bg-white/14 transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-white/6 border border-white/12 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/12 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">

              {/* Transfer routes */}
              <div>
                <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-2">Transfer Route</p>
                <div className="space-y-2">
                  {transfers.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="px-3 py-1.5 rounded-lg bg-white/8 border border-white/12 text-white/65 font-medium text-xs">
                        {t.requesting_service}
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                      <span className="px-3 py-1.5 rounded-lg bg-white/14 border border-white/20 text-white font-medium text-xs">
                        {t.receiving_service}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Already transferred status */}
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${primaryTransfer.already_transferred ? "text-green-400" : "text-white/20"}`} />
                <span className="text-xs text-white/50">
                  {primaryTransfer.already_transferred ? "Patient has already been transferred" : "Patient not yet transferred"}
                </span>
              </div>

              {/* Problem list */}
              {(primaryTransfer.problem_list || []).length > 0 && (
                <div>
                  <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-2">Problem List</p>
                  <div className="flex flex-wrap gap-1.5">
                    {primaryTransfer.problem_list.map((p, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-white/8 border border-white/12 text-white/65">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                {primaryTransfer.location && (
                  <div className="glass-card p-3">
                    <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location
                    </p>
                    <p className="text-sm text-white/80">{primaryTransfer.location}</p>
                  </div>
                )}
                {primaryTransfer.requesting_clinician && (
                  <div className="glass-card p-3">
                    <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                      <User className="w-3 h-3" /> Clinician
                    </p>
                    <p className="text-sm text-white/80">{primaryTransfer.requesting_clinician}</p>
                  </div>
                )}
                {primaryTransfer.estimate && (
                  <div className="glass-card p-3">
                    <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Estimate
                    </p>
                    <p className="text-sm text-white/80">${Number(primaryTransfer.estimate).toLocaleString()}</p>
                  </div>
                )}
                {primaryTransfer.created_date && (
                  <div className="glass-card p-3">
                    <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-1">Submitted</p>
                    <p className="text-xs text-white/65">{formatLocalTime(primaryTransfer.created_date)}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {primaryTransfer.notes && (
                <div>
                  <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Notes
                  </p>
                  <p className="text-sm text-white/65 leading-relaxed bg-white/4 border border-white/8 rounded-lg p-3">
                    {primaryTransfer.notes}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
            onClick={() => !deleting && setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="glass-card p-5 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-white mb-2">Cancel Transfer?</h3>
              <p className="text-sm text-white/60 mb-4">
                Are you sure you want to cancel this transfer for <strong>{primaryTransfer.patient_name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => !deleting && setShowCancelConfirm(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/8 border border-white/12 text-sm text-white/75 hover:text-white hover:bg-white/12 transition-colors disabled:opacity-50"
                >
                  Keep Transfer
                </button>
                <button
                  onClick={handleCancelTransfer}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/25 border border-red-400/40 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/35 transition-colors disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Cancel Transfer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </motion.div>
        </div>
        );
        }