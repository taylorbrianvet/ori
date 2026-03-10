import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, ArrowLeftRight, Plus, X } from "lucide-react";
import PageContainer from "../components/shared/PageContainer";
import TransferForm from "../components/transfers/TransferForm";
import TransferCard from "../components/transfers/TransferCard";
import { AnimatePresence, motion } from "framer-motion";

export default function Transfers() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: transfers = [] } = useQuery({
    queryKey: ["interservice-transfers"],
    queryFn: () => base44.entities.InterserviceTransfer.list("-created_date"),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-all"],
    queryFn: () => base44.entities.Staff.list(),
  });

  const pending = transfers.filter(t => !t.already_transferred);
  const complete = transfers.filter(t => t.already_transferred);

  // Group transfers by patient ID to detect double transfers
  const groupTransfersByPatient = (transferList) => {
    const grouped = {};
    transferList.forEach(t => {
      if (!grouped[t.patient_id]) {
        grouped[t.patient_id] = [];
      }
      grouped[t.patient_id].push(t);
    });
    return Object.values(grouped);
  };

  const pendingGrouped = groupTransfersByPatient(pending);
  const completeGrouped = groupTransfersByPatient(complete);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["interservice-transfers"] });

  return (
    <PageContainer>
      <div className="mb-5">
        <Link to={createPageUrl("Home")} className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Home
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-white/70" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Inter-Service Transfers</h1>
            <p className="text-xs text-white/40 mt-0.5">Patient handoff board</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${showForm ? "bg-white/10 border-white/20 text-white/70" : "bg-white/12 hover:bg-white/18 border-white/20 text-white"}`}
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Close" : "New Transfer"}
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <TransferForm
              staffList={staffList}
              onSaved={() => { refresh(); setShowForm(false); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Pending</span>
          {pending.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/25 text-amber-200 font-medium">{pending.length}</span>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="rounded-xl border border-white/8 bg-white/3 p-6 text-center text-xs text-white/25">
            No pending transfers.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingGrouped.map(group => (
              <TransferCard 
                key={group[0].patient_id} 
                transfers={group} 
                onUpdated={refresh} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Complete */}
      {complete.length > 0 && (
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">Complete</p>
          <div className="space-y-3">
            {completeGrouped.map(group => (
              <TransferCard 
                key={group[0].patient_id} 
                transfers={group} 
                onUpdated={refresh} 
              />
            ))}
          </div>
        </div>
      )}

      {transfers.length === 0 && !showForm && (
        <div className="text-center py-20 text-white/25 text-sm">
          No transfers yet. Click "New Transfer" to get started.
        </div>
      )}
    </PageContainer>
  );
}