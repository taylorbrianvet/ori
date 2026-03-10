import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import PageContainer from "../components/shared/PageContainer";
import SurgicalLogForm from "../components/surgical/SurgicalLogForm";
import WorkspaceProfile from "../components/workspace/WorkspaceProfile";
import ProcedureLogView from "../components/workspace/ProcedureLogView";
import { ChevronLeft, Plus, BookOpen, Star } from "lucide-react";
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

  const userEmail = currentUser?.email || "";
  const userFullName = currentUser?.full_name || "";
  const firstName = userFullName.split(" ")[0]?.toLowerCase() || "";

  const myUploads = allJournals.filter(j => j.uploaded_by === userEmail);
  const myFavorites = allJournals.filter(j => (j.favorited_by || []).includes(userEmail));

  // Match to staff record
  const staffRecord = staffList.find((s) => s.email === userEmail);

  // Entries where this user is scrubbed in OR has manually logged
  const myEntries = allEntries.filter((e) => {
    const scrubbed = (e.residents_scrubbed_in || []).some((r) =>
      r.toLowerCase().includes(firstName)
    );
    const markedLogged = (e.logged_by || []).includes(userEmail);
    return scrubbed || markedLogged;
  });

  const loggedCount = myEntries.filter((e) => (e.logged_by || []).includes(userEmail)).length;
  const pendingCount = myEntries.length - loggedCount;

  return (
    <PageContainer>
      {/* Back nav */}
      <div className="mb-5">
        <Link
          to={createPageUrl("Home")}
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Home
        </Link>
      </div>

      {/* Profile + Stats */}
      {isLoading ? (
        <div className="py-20 text-center text-white/40 text-sm">Loading…</div>
      ) : (
        <>
          <WorkspaceProfile
            currentUser={currentUser}
            staffRecord={staffRecord}
            totalCount={myEntries.length}
            loggedCount={loggedCount}
            pendingCount={pendingCount}
            onOpenLog={() => setShowLog(true)}
          />

          {/* Quick actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowLog(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/8 hover:bg-white/14 border border-white/10 text-sm text-white/70 hover:text-white transition-colors"
            >
              Open Procedure Log
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/12 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Log Surgery
            </button>
          </div>

          {/* Mobile notice — log view is desktop only */}
          <p className="mt-4 text-center text-xs text-white/25 lg:hidden">
            The full procedure log view is available on desktop.
          </p>

          {/* Journal Club section */}
          {(myUploads.length > 0 || myFavorites.length > 0) && (
            <div className="mt-6 space-y-4">
              <h2 className="text-sm font-semibold text-white/70">Journal Club</h2>

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
          )}
        
        </>
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