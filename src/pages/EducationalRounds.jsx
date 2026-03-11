import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageContainer from "../components/shared/PageContainer";
import PageHeader from "../components/shared/PageHeader";
import EducationalRoundForm from "../components/rounds/EducationalRoundForm";
import { Plus, Calendar, CheckCircle, Clock, XCircle, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";

const DEPARTMENTS = ["Surgery", "Internal Medicine", "Emergency & Critical Care", "Neurology", "Oncology", "Dermatology", "Cardiology", "Ophthalmology", "Radiology", "Anesthesia"];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function RoundStatusBadge({ status }) {
  const configs = {
    scheduled: { icon: Clock, bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-300", label: "Scheduled" },
    approved: { icon: CheckCircle, bg: "bg-green-500/15", border: "border-green-500/30", text: "text-green-300", label: "Approved" },
    cancelled: { icon: XCircle, bg: "bg-red-500/15", border: "border-red-500/30", text: "text-red-300", label: "Cancelled" }
  };
  const config = configs[status] || configs.scheduled;
  const Icon = config.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${config.bg} ${config.border}`}>
      <Icon className={`w-3 h-3 ${config.text}`} />
      <span className={`text-[10px] font-medium ${config.text}`}>{config.label}</span>
    </div>
  );
}

export default function EducationalRounds() {
  const [showForm, setShowForm] = useState(false);
  const [editingRound, setEditingRound] = useState(null);
  const [filterDept, setFilterDept] = useState("");
  const queryClient = useQueryClient();

  const { data: allRounds = [], isLoading } = useQuery({
    queryKey: ["educational-rounds-all"],
    queryFn: () => base44.entities.EducationalRound.list("-date")
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-all"],
    queryFn: () => base44.entities.Staff.list()
  });

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = currentUser?.role === "admin";

  const filteredRounds = filterDept ? allRounds.filter(r => r.department === filterDept) : allRounds;

  const handleEdit = (round) => {
    setEditingRound(round);
    setShowForm(true);
  };

  const handleDelete = async (roundId) => {
    if (!confirm("Delete this round?")) return;
    try {
      // Delete by setting approval_status to cancelled (soft delete approach)
      const round = allRounds.find(r => r.id === roundId);
      await base44.entities.EducationalRound.update(roundId, { approval_status: "cancelled" });
      toast.success("Round deleted");
      queryClient.invalidateQueries({ queryKey: ["educational-rounds-all"] });
    } catch (error) {
      toast.error("Failed to delete round");
    }
  };

  const handleApprove = async (roundId) => {
    try {
      await base44.entities.EducationalRound.update(roundId, { approval_status: "approved" });
      toast.success("Round approved");
      queryClient.invalidateQueries({ queryKey: ["educational-rounds-all"] });
    } catch (error) {
      toast.error("Failed to approve round");
    }
  };

  const handleCancel = async (roundId) => {
    try {
      await base44.entities.EducationalRound.update(roundId, { approval_status: "cancelled" });
      toast.success("Round cancelled");
      queryClient.invalidateQueries({ queryKey: ["educational-rounds-all"] });
    } catch (error) {
      toast.error("Failed to cancel round");
    }
  };

  const visibleRounds = filteredRounds.filter(r => r.approval_status !== "cancelled");

  if (!isAdmin) {
    return (
      <PageContainer>
        <div className="py-20 text-center text-white/40">
          <p>Admin access required</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Educational Rounds Management" />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <button
          onClick={() => {
            setEditingRound(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Round
        </button>
      </div>

      {/* Rounds List */}
      {isLoading ? (
        <div className="text-center py-8 text-white/40">Loading...</div>
      ) : visibleRounds.length === 0 ? (
        <div className="text-center py-8 text-white/40">No rounds found</div>
      ) : (
        <div className="space-y-3">
          {visibleRounds.map(round => (
            <div key={round.id} className="glass-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-white/40" />
                    <span className="text-sm font-semibold text-white">{formatDate(round.date)}</span>
                    <span className="text-xs text-white/50">•</span>
                    <span className="text-xs text-white/60">{round.department}</span>
                  </div>
                  <p className="text-sm text-white/80 mb-1">{round.event_type}</p>
                  {round.topic && <p className="text-xs text-white/60 mb-2">{round.topic}</p>}
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    {round.start_time && <span className="text-white/50">⏰ {round.start_time}{round.end_time ? ` - ${round.end_time}` : ""}</span>}
                    {round.clinician && <span className="text-white/50">👤 {round.clinician}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <RoundStatusBadge status={round.approval_status} />
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(round)} className="w-8 h-8 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors flex items-center justify-center">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {round.approval_status === "scheduled" && (
                      <button onClick={() => handleApprove(round.id)} className="px-3 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-300 text-xs font-medium transition-colors">
                        Approve
                      </button>
                    )}
                    {round.approval_status !== "cancelled" && (
                      <button onClick={() => handleCancel(round.id)} className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-medium transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Attendance Preview */}
              <div className="pt-2 border-t border-white/10 space-y-1">
                <p className="text-[10px] text-white/40 uppercase font-medium">Expected Attendance</p>
                {round.attendance_everyone ? (
                  <p className="text-xs text-white/60">All residents in {round.department}</p>
                ) : round.attendance?.length > 0 ? (
                  <p className="text-xs text-white/60">{round.attendance.join(", ")}</p>
                ) : (
                  <p className="text-xs text-white/40 italic">None specified</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <EducationalRoundForm
            round={editingRound}
            onClose={() => {
              setShowForm(false);
              setEditingRound(null);
            }}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ["educational-rounds-all"] })}
            staffList={staffList}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}