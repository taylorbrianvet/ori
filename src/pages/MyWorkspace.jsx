import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import PageContainer from "../components/shared/PageContainer";
import SurgicalLogForm from "../components/surgical/SurgicalLogForm";
import WorkspaceProfile from "../components/workspace/WorkspaceProfile";
import ProcedureLogView from "../components/workspace/ProcedureLogView";
import ClinicScheduleCalendar from "../components/clinic/ClinicScheduleCalendar";
import NotificationSettings from "../components/workspace/NotificationSettings";
import WorkspaceRefillsPanel from "../components/workspace/WorkspaceRefillsPanel";
import { ChevronLeft, Plus, BookOpen, Star, CalendarDays, ClipboardList, Bell, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MyWorkspace() {
  const [showForm, setShowForm] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [activeTab, setActiveTab] = useState("schedule");
  const queryClient = useQueryClient();

  const { data: allEntries = [], isLoading } = useQuery({
    queryKey: ["surgical-logs-mine"],
    queryFn: () => base44.entities.SurgicalLogEntry.list("-surgery_date"),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-all"],
    queryFn: () => base44.entities.Staff.list(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: allJournals = [] } = useQuery({
    queryKey: ["journals"],
    queryFn: () => base44.entities.Journal.list("-created_date"),
  });

  const { data: clinicSchedules = [] } = useQuery({
    queryKey: ["clinic-schedules-all"],
    queryFn: () => base44.entities.ClinicSchedule.list("date"),
  });

  const { data: onCallSchedules = [] } = useQuery({
    queryKey: ["oncall-schedules-all"],
    queryFn: () => base44.entities.OnCallSchedule.list("date"),
  });

  const { data: diagnostics = [] } = useQuery({
    queryKey: ["diagnostics-all"],
    queryFn: () => base44.entities.Diagnostic.list(),
  });

  const { data: pharmacyRequests = [] } = useQuery({
    queryKey: ["pharmacy-requests-all"],
    queryFn: () => base44.entities.PharmacyRefillRequest.list(),
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ["transfers-all"],
    queryFn: () => base44.entities.InterserviceTransfer.list(),
  });

  const userEmail = currentUser?.email || "";
  const userFullName = currentUser?.full_name || "";
  const firstName = userFullName.split(" ")[0]?.toLowerCase() || "";

  const myUploads = allJournals.filter(j => j.uploaded_by === userEmail);
  const myFavorites = allJournals.filter(j => (j.favorited_by || []).includes(userEmail));

  const pendingDiagnostics = diagnostics.filter(d => !d.diagnostic_complete);
  const pendingRefills = pharmacyRequests.filter(r => r.status === "pending");
  const pendingTransfers = transfers.filter(t => !t.already_transferred);

  const staffRecord = staffList.find((s) => s.email === userEmail);

  const myEntries = allEntries.filter((e) => {
    const scrubbed = (e.residents_scrubbed_in || []).some((r) =>
      r.toLowerCase().includes(firstName)
    );
    const markedLogged = (e.logged_by || []).includes(userEmail);
    return scrubbed || markedLogged;
  });

  const loggedCount = myEntries.filter((e) => (e.logged_by || []).includes(userEmail)).length;
  const pendingCount = myEntries.length - loggedCount;

  // Find clinic schedule entries for this user (by full name or first name match)
  const myClinicEntries = clinicSchedules.filter(e => {
    if (!userFullName) return false;
    const nameLower = userFullName.toLowerCase();
    const fields = [e.faculty_1, e.faculty_2, e.house_officer_1, e.house_officer_2,
      e.house_officer_3, e.house_officer_4, e.house_officer_5, e.house_officer_6];
    return fields.some(f => f && f.toLowerCase().includes(nameLower.split(" ")[0]));
  });

  return (
    <PageContainer>
      {/* Back nav */}
      <div className="mb-5">
        <Link to={createPageUrl("Home")}
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Home
        </Link>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-white/40 text-sm">Loading…</div>
      ) : (
        <div className="space-y-4">
          {/* Profile Header */}
          <div className="glass-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{currentUser?.full_name || "User"}</h2>
                <p className="text-xs text-white/50 mt-0.5">{staffRecord?.department || "Staff"}</p>
              </div>
              <div className="text-right">
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">{pendingDiagnostics.length}</p>
                    <p className="text-[10px] text-white/40">Diagnostics</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">{pendingRefills.length}</p>
                    <p className="text-[10px] text-white/40">Refills</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setActiveTab("schedule")}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "schedule"
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 inline mr-1.5" />Clinic Schedule
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors relative ${
                activeTab === "notifications"
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              <Bell className="w-3.5 h-3.5 inline mr-1.5" />Notifications
              {(pendingDiagnostics.length + pendingRefills.length) > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingDiagnostics.length + pendingRefills.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "logs"
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 inline mr-1.5" />My Logs
            </button>
            <button
              onClick={() => setActiveTab("communication")}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "communication"
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />Communication
            </button>
            <button
              onClick={() => setActiveTab("journal")}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "journal"
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 inline mr-1.5" />Journal Club
            </button>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "schedule" && (
              <section key="schedule" className="space-y-4">
                <ClinicScheduleCalendar
                  scheduleEntries={clinicSchedules}
                  personName={userFullName}
                />
                {myClinicEntries.length === 0 && (
                  <p className="text-xs text-white/25 text-center">
                    No clinic schedule entries found.
                  </p>
                )}
              </section>
            )}

            {activeTab === "notifications" && (
              <section key="notifications" className="space-y-3">
                {pendingDiagnostics.length > 0 && (
                  <div className="glass-card p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-white">Pending Diagnostics ({pendingDiagnostics.length})</h3>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {pendingDiagnostics.map(d => (
                        <div key={d.id} className="bg-white/6 p-2 rounded-lg border border-white/10 text-[11px]">
                          <div className="font-semibold text-white">{d.patient_name}</div>
                          <div className="text-white/60 text-[10px]">{d.diagnostic_type} • {d.requesting_service}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingRefills.length > 0 && (
                  <div className="glass-card p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-white">Pending Refills ({pendingRefills.length})</h3>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {pendingRefills.map(r => (
                        <div key={r.id} className="bg-white/6 p-2 rounded-lg border border-white/10 text-[11px]">
                          <div className="font-semibold text-white">{r.medication}</div>
                          <div className="text-white/60 text-[10px]">{r.patient_name} • {r.quantity} qty</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingDiagnostics.length === 0 && pendingRefills.length === 0 && (
                  <div className="text-center py-6 text-white/30 text-xs">
                    No pending notifications
                  </div>
                )}
              </section>
            )}

            {activeTab === "logs" && (
              <section key="logs" className="space-y-3">
                <div className="glass-card p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white/6 border border-white/10 p-3 text-center">
                      <p className="text-lg font-bold text-white">{myEntries.length}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">Total</p>
                    </div>
                    <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
                      <p className="text-lg font-bold text-green-300">{loggedCount}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">Logged</p>
                    </div>
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                      <p className="text-lg font-bold text-amber-300">{pendingCount}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">Pending</p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setShowLog(true)}
                      className="flex-1 py-2.5 rounded-xl bg-white/8 hover:bg-white/14 border border-white/10 text-xs text-white/70 hover:text-white transition-colors">
                      Open Procedure Log
                    </button>
                    <button onClick={() => setShowForm(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 text-white text-xs font-medium transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Log Surgery
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "communication" && (
              <section key="communication" className="space-y-3">
                <div className="glass-card p-4">
                  <h3 className="text-xs font-semibold text-white mb-3">Transfer Emails</h3>
                  {staffRecord?.receive_transfer_emails ? (
                    <p className="text-xs text-green-300">✓ Receiving daily transfer emails at 6am</p>
                  ) : (
                    <p className="text-xs text-white/50">Not subscribed to transfer emails</p>
                  )}
                  {pendingTransfers.length > 0 && (
                    <div className="mt-3 p-2 bg-white/5 rounded text-[10px] text-white/60 max-h-32 overflow-y-auto">
                      <p className="font-semibold text-white/80 mb-2">{pendingTransfers.length} Pending Transfers:</p>
                      {pendingTransfers.map(t => (
                        <div key={t.id} className="mb-1">
                          {t.patient_name} ({t.species}) - {t.requesting_service} → {t.receiving_service}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === "journal" && (
              <section key="journal" className="space-y-3">
                {myFavorites.length > 0 && (
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-medium text-white/60">Favorited Articles</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {myFavorites.map(j => (
                        <Link key={j.id} to={createPageUrl(`JournalDetail?id=${j.id}`)}
                          className="flex items-start gap-2 py-1.5 hover:opacity-80 transition-opacity">
                          <BookOpen className="w-3.5 h-3.5 text-white/25 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-white/75 leading-snug line-clamp-1">{j.title}</p>
                            {j.journal_name && <p className="text-[10px] text-white/30">{j.journal_name}{j.journal_year ? ` · ${j.journal_year}` : ""}</p>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {myUploads.length > 0 && (
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-xs font-medium text-white/60">My Uploads</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {myUploads.map(j => (
                        <Link key={j.id} to={createPageUrl(`JournalDetail?id=${j.id}`)}
                          className="flex items-start gap-2 py-1.5 hover:opacity-80 transition-opacity">
                          <BookOpen className="w-3.5 h-3.5 text-white/25 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-white/75 leading-snug line-clamp-1">{j.title}</p>
                            {j.journal_name && <p className="text-[10px] text-white/30">{j.journal_name}{j.journal_year ? ` · ${j.journal_year}` : ""}</p>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {myFavorites.length === 0 && myUploads.length === 0 && (
                  <div className="text-center py-6 text-white/30 text-xs">
                    No journal articles yet
                  </div>
                )}
              </section>
            )}
          </AnimatePresence>

          <p className="mt-2 text-center text-xs text-white/25 lg:hidden">
            The full procedure log view is available on desktop.
          </p>
        </div>
      )}

      {/* Procedure Log (desktop fullscreen overlay) */}
      <AnimatePresence>
        {showLog && (
          <div className="hidden lg:block">
            <ProcedureLogView
              myEntries={myEntries}
              userEmail={userEmail}
              onClose={() => setShowLog(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* New surgery form */}
      <AnimatePresence>
        {showForm && (
          <SurgicalLogForm
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ["surgical-logs-mine"] });
              queryClient.invalidateQueries({ queryKey: ["surgical-logs"] });
            }}
            staffList={staffList}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}