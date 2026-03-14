import React, { useState } from "react";
import { X, Pencil, Check, Minus, Link2, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import EstimateForm from "./EstimateForm";

const fmt = (n) => (n !== undefined && n !== null ? `$${n.toLocaleString()}` : "—");

export default function EstimateDetailModal({ estimate, allEstimates, canEdit, isAdmin, onClose }) {
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();

  const linkedEstimates = (estimate.linked_estimate_ids || [])
    .map((id) => allEstimates.find((e) => e.id === id))
    .filter(Boolean);

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["estimates"] });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this estimate?")) return;
    await base44.entities.Estimate.delete(estimate.id);
    queryClient.invalidateQueries({ queryKey: ["estimates"] });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative glass-card w-full max-w-lg z-10 overflow-hidden"
        >
          {editing ? (
            <EstimateForm
              estimate={estimate}
              allEstimates={allEstimates}
              onSaved={handleSaved}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div>
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-white/10">
                <div className="flex-1 min-w-0 pr-4">
                  <h2 className="text-base font-semibold text-white leading-snug">
                    {estimate.procedure_name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/60">
                      {estimate.service_name}
                    </span>
                    {estimate.species && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-400/25 text-orange-300">
                        {estimate.species}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {canEdit && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15 text-white/70 hover:text-white text-xs font-medium transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cost range */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-green-500/10 border border-green-400/20 p-3 text-center">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Low Estimate</p>
                    <p className="text-xl font-semibold text-green-300 font-mono">{fmt(estimate.estimate_low)}</p>
                  </div>
                  <div className="rounded-xl bg-orange-500/10 border border-orange-400/20 p-3 text-center">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">High Estimate</p>
                    <p className="text-xl font-semibold text-orange-300 font-mono">{fmt(estimate.estimate_high)}</p>
                  </div>
                </div>

                {/* Anesthesia */}
                <div className="flex items-center gap-2 text-sm">
                  {estimate.includes_anesthesia ? (
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <Minus className="w-4 h-4 text-white/30 flex-shrink-0" />
                  )}
                  <span className={estimate.includes_anesthesia ? "text-green-300" : "text-white/35"}>
                    Anesthesia {estimate.includes_anesthesia ? "included" : "not included"}
                  </span>
                </div>

                {/* Notes */}
                {estimate.notes && (
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-white/70 leading-relaxed">{estimate.notes}</p>
                  </div>
                )}

                {/* Linked estimates */}
                {linkedEstimates.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Link2 className="w-3.5 h-3.5 text-white/35" />
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">Associated Estimates</p>
                    </div>
                    <div className="space-y-2">
                      {linkedEstimates.map((linked) => (
                        <div
                          key={linked.id}
                          className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                        >
                          <div>
                            <p className="text-xs font-medium text-white">{linked.procedure_name}</p>
                            <p className="text-[10px] text-white/40">{linked.service_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono text-white/70">
                              <span className="text-green-300">{fmt(linked.estimate_low)}</span>
                              <span className="text-white/35 mx-1">–</span>
                              <span className="text-orange-300">{fmt(linked.estimate_high)}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <button
                    onClick={handleDelete}
                    className="w-full text-center text-[11px] text-red-400/50 hover:text-red-400 transition-colors pt-1"
                  >
                    Delete estimate
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}