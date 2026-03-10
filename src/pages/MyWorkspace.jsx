import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import PageContainer from "../components/shared/PageContainer";
import SurgicalLogForm from "../components/surgical/SurgicalLogForm";
import WorkspaceProfile from "../components/workspace/WorkspaceProfile";
import ProcedureLogView from "../components/workspace/ProcedureLogView";
import ClinicScheduleCalendar from "../components/clinic/ClinicScheduleCalendar";
import { ChevronLeft, Plus, BookOpen, Star, CalendarDays, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MyWorkspace() {
  const [showForm, setShowForm] = useState(false);
  const [showLog, setShowLog] = useState(false);
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

  const userEmail = currentUser?.email || "";
  const userFullName = currentUser?.full_name || "";
  const firstName = userFullName.split(" ")[0]?.toLowerCase() || "";

  const myUploads = allJournals.filter(j => j.uploaded_by === userEmail);
  const myFavorites = allJournals.filter(j => (j.favorited_by || []).includes(userEmail));

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
        <div className="space-y-6">
          {/* Profile + Stats */}
          <WorkspaceProfile
            currentUser={currentUser}
            staffRecord={staffRecord}
            totalCount={myEntries.length}
            loggedCount={loggedCount}
            pendingCount={pendingCount}
            onOpenLog={() => setShowLog(true)}
          />

          {/* ── My Clinic Schedule ── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-white/40" />
              <h2 className="text-sm font-semibold text-white/70">My Clinic Schedule</h2>
            </div>
            <ClinicScheduleCalendar
              scheduleEntries={clinicSchedules}
              personName={userFullName}
            />
            {myClinicEntries.length === 0 && (
              <p className="text-xs text-white/25 text-center mt-2">
                No clinic schedule entries found for your name yet.
              </p>
            )}
          </section>

          {/* ── My Logs ── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-white/40" />
              <h2 className="text-sm font-semibold text-white/70">My Logs</h2>
            </div>
            <div className="glass-card p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white/6 border border-white/10 p-3 text-center">
                  <p className="text-xl font-bold text-white">{myEntries.length}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">Total</p>
                </div>
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
                  <p className="text-xl font-bold text-green-300">{loggedCount}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">Logged</p>
                </div>
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                  <p className="text-xl font-bold text-amber-300">{pendingCount}</p>
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

          {/* ── Journal Club ── */}
          {(myUploads.length > 0 || myFavorites.length > 0) && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-white/40" />
                <h2 className="text-sm font-semibold text-white/70">Journal Club</h2>
              </div>
              <div className="space-y-3">
                {myFavorites.length > 0 && (
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-medium text-white/60">Favorited Articles</span>
                    </div>
                    <div className="space-y-2">
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
                    <div className="space-y-2">
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
              </div>
            </section>
          )}

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