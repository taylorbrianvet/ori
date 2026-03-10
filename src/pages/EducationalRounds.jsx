import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import PageContainer from "../components/shared/PageContainer";
import WeekNav from "../components/rounds/WeekNav";
import RoundRow from "../components/rounds/RoundRow";
import RoundDetailModal from "../components/rounds/RoundDetailModal";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ChevronLeft, BookOpen, GraduationCap, CalendarDays, Users
} from "lucide-react";
import {
  startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval,
  format, parseISO, isWithinInterval, isFriday
} from "date-fns";

const DEPT_COLORS = {
  "Surgery": "bg-blue-500/20 text-blue-200",
  "Internal Medicine": "bg-green-500/20 text-green-200",
  "Emergency & Critical Care": "bg-red-500/20 text-red-200",
  "Neurology": "bg-purple-500/20 text-purple-200",
  "default": "bg-white/10 text-white/60",
};

function SeminarRow({ round, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left rounded-xl border border-emerald-400/20 bg-emerald-500/8 hover:bg-emerald-500/14 transition-all p-3 flex items-center gap-3">
      <div className="flex-shrink-0 w-12 text-center rounded-lg py-1.5 bg-emerald-500/20">
        <p className="text-[10px] text-emerald-300/70 font-medium uppercase">Fri</p>
        <p className="text-sm font-bold text-emerald-200 leading-none mt-0.5">{format(parseISO(round.date), "d")}</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-medium">Seminar</span>
          <span className="text-[10px] text-white/30">{round.start_time || "09:00"} – {round.end_time || "10:00"}</span>
        </div>
        <p className="text-xs text-white/75 font-medium truncate">{round.topic || "Topic TBD"}</p>
        {round.clinician && <p className="text-[10px] text-white/35 mt-0.5">{round.clinician}</p>}
      </div>
    </button>
  );
}

export default function EducationalRounds() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedRound, setSelectedRound] = useState(null);
  const queryClient = useQueryClient();

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const { data: rounds = [] } = useQuery({
    queryKey: ["educational-rounds"],
    queryFn: () => base44.entities.EducationalRound.list("date"),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-all"],
    queryFn: () => base44.entities.Staff.list(),
  });

  // Filter rounds for current week
  const weekRounds = rounds.filter(r => {
    const d = parseISO(r.date);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  });

  const seminars = weekRounds.filter(r => r.is_seminar || r.event_type === "Seminar");
  const regularRounds = weekRounds.filter(r => !r.is_seminar && r.event_type !== "Seminar");

  // Group regular rounds by day
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const roundsByDay = days.reduce((acc, day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    acc[dayStr] = regularRounds.filter(r => r.date === dayStr);
    return acc;
  }, {});

  // Stats
  const totalThisWeek = weekRounds.length;
  const approvedThisWeek = weekRounds.filter(r => r.status === "approved").length;
  const cancelledThisWeek = weekRounds.filter(r => r.status === "cancelled").length;

  return (
    <PageContainer>
      <div className="mb-5">
        <Link to={createPageUrl("Home")}
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Home
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white/70" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Educational Rounds</h1>
          <p className="text-xs text-white/40 mt-0.5">Weekly schedule of rounds and seminars</p>
        </div>
      </div>

      {/* Week stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card p-3 text-center">
          <p className="text-lg font-bold text-white">{totalThisWeek}</p>
          <p className="text-[10px] text-white/35">This week</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-lg font-bold text-green-300">{approvedThisWeek}</p>
          <p className="text-[10px] text-white/35">Approved</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-lg font-bold text-red-300">{cancelledThisWeek}</p>
          <p className="text-[10px] text-white/35">Cancelled</p>
        </div>
      </div>

      {/* Week nav */}
      <WeekNav
        weekStart={weekStart}
        onPrev={() => setWeekStart(w => subWeeks(w, 1))}
        onNext={() => setWeekStart(w => addWeeks(w, 1))}
      />

      {/* Seminars section (Fridays) */}
      {seminars.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3" /> Friday Seminar
          </p>
          <div className="space-y-2">
            {seminars.map(r => (
              <SeminarRow key={r.id} round={r} onClick={() => setSelectedRound(r)} />
            ))}
          </div>
        </div>
      )}

      {/* Regular rounds by day */}
      <div className="space-y-4">
        {days.map(day => {
          const dayStr = format(day, "yyyy-MM-dd");
          const dayRounds = roundsByDay[dayStr] || [];
          if (dayRounds.length === 0) return null;

          return (
            <div key={dayStr}>
              <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-2">
                {format(day, "EEEE, MMMM d")}
              </p>
              <div className="space-y-2">
                {dayRounds.map(r => (
                  <RoundRow key={r.id} round={r} onClick={() => setSelectedRound(r)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {weekRounds.length === 0 && (
        <div className="text-center py-16 text-white/25 text-sm">
          No rounds scheduled for this week.
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selectedRound && (
          <RoundDetailModal
            round={selectedRound}
            staffList={staffList}
            onClose={() => setSelectedRound(null)}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: ["educational-rounds"] });
              setSelectedRound(null);
            }}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}