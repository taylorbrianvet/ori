import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import PageContainer from "../components/shared/PageContainer";
import WeekNav from "../components/rounds/WeekNav";
import RoundRow from "../components/rounds/RoundRow";
import RoundDetailModal from "../components/rounds/RoundDetailModal";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, BookOpen, CalendarDays, List } from "lucide-react";
import {
  startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval,
  format, parseISO, isWithinInterval, isFuture, isToday, compareAsc
} from "date-fns";

const DEPARTMENTS = [
  "Surgery", "Internal Medicine", "Emergency & Critical Care",
  "Neurology", "Oncology", "Dermatology", "Cardiology",
  "Ophthalmology", "Radiology", "Anesthesia"
];

const DEPT_SHORT = {
  "Surgery": "Surgery",
  "Internal Medicine": "Int Med",
  "Emergency & Critical Care": "ECC",
  "Neurology": "Neuro",
  "Oncology": "Onco",
  "Dermatology": "Derm",
  "Cardiology": "Cardio",
  "Ophthalmology": "Ophth",
  "Radiology": "Radiology",
  "Anesthesia": "Anesth",
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
  const [activeDept, setActiveDept] = useState(null); // null = not yet loaded
  const queryClient = useQueryClient();

  // Load user preference
  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (currentUser && activeDept === null) {
      setActiveDept(currentUser.default_rounds_department || "Surgery");
    }
  }, [currentUser, activeDept]);

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const { data: rounds = [] } = useQuery({
    queryKey: ["educational-rounds"],
    queryFn: () => base44.entities.EducationalRound.list("date"),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-all"],
    queryFn: () => base44.entities.Staff.list(),
  });

  const handleSetDefault = async (dept) => {
    setActiveDept(dept);
    await base44.auth.updateMe({ default_rounds_department: dept });
  };

  const inCurrentWeek = (r) => isWithinInterval(parseISO(r.date), { start: weekStart, end: weekEnd });

  // Seminars are NOT department-specific — always show all seminars for the week
  const seminars = rounds.filter(r => inCurrentWeek(r) && (r.is_seminar || r.event_type === "Seminar"));

  // Regular rounds filtered by active department
  const regularRounds = rounds.filter(r => {
    if (!inCurrentWeek(r)) return false;
    if (r.is_seminar || r.event_type === "Seminar") return false;
    const depts = r.departments?.length > 0 ? r.departments : (r.department ? [r.department] : []);
    return !activeDept || depts.includes(activeDept) || depts.length === 0;
  });

  const weekRounds = [...regularRounds, ...seminars];

  // Group Mon–Fri (skip Saturday/Sunday for display)
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).filter(d => {
    const dow = d.getDay();
    return dow >= 1 && dow <= 5; // Mon-Fri
  });

  const roundsByDay = days.reduce((acc, day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    acc[dayStr] = regularRounds.filter(r => r.date === dayStr);
    return acc;
  }, {});

  // Mon–Thu regular rounds, Friday seminars
  const monThuDays = days.filter(d => d.getDay() >= 1 && d.getDay() <= 4);
  const friDays = days.filter(d => d.getDay() === 5);

  return (
    <PageContainer>
      <div className="mb-5">
        <Link to={createPageUrl("Home")}
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Home
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white/70" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Educational Rounds</h1>
          <p className="text-xs text-white/40 mt-0.5">Weekly schedule of rounds and seminars</p>
        </div>
      </div>

      {/* Department selector */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold">Service</p>
          {activeDept && (
            <p className="text-[10px] text-white/25">
              Default: <span className="text-white/45">{activeDept}</span> · tap to change
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map(dept => (
            <button
              key={dept}
              onClick={() => handleSetDefault(dept)}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-colors font-medium ${
                activeDept === dept
                  ? "bg-white/18 border-white/30 text-white"
                  : "bg-white/4 border-white/12 text-white/40 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              {DEPT_SHORT[dept] || dept}
            </button>
          ))}
        </div>
      </div>

      {/* Week nav */}
      <WeekNav
        weekStart={weekStart}
        onPrev={() => setWeekStart(w => subWeeks(w, 1))}
        onNext={() => setWeekStart(w => addWeeks(w, 1))}
      />

      {/* Mon–Thu rounds */}
      <div className="space-y-4 mb-6">
        {monThuDays.map(day => {
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

      {/* Friday Seminar — always at bottom */}
      {(seminars.length > 0 || friDays.length > 0) && (
        <div>
          <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3" /> Friday Seminar
          </p>
          <div className="space-y-2">
            {seminars.length > 0 ? (
              seminars.map(r => (
                <SeminarRow key={r.id} round={r} onClick={() => setSelectedRound(r)} />
              ))
            ) : (
              <div className="rounded-xl border border-white/8 bg-white/3 p-3 text-xs text-white/20 text-center">
                No seminar scheduled this Friday
              </div>
            )}
          </div>
        </div>
      )}

      {weekRounds.length === 0 && (
        <div className="text-center py-16 text-white/25 text-sm">
          No rounds scheduled for {activeDept ? `${activeDept} ` : ""}this week.
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