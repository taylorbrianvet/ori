import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageContainer from "../components/shared/PageContainer";
import PageHeader from "../components/shared/PageHeader";
import EducationalRoundForm from "../components/rounds/EducationalRoundForm";
import { Plus, ChevronLeft, ChevronRight, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";

const DEPARTMENTS = ["Surgery", "Internal Medicine", "Emergency & Critical Care", "Neurology", "Oncology", "Dermatology", "Cardiology", "Ophthalmology", "Radiology", "Anesthesia"];

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getWeekDates(weekStart) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

// Parse a YYYY-MM-DD string as local date (avoids UTC-shift off-by-one)
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDayOfWeek(date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function RoundCard({ round, onEdit }) {
  const deptText = round.departments?.slice(0, 2).join(", ") + (round.departments?.length > 2 ? "..." : "");
  
  const statusColors = {
    scheduled: "bg-amber-500/15 border-amber-500/30 hover:bg-amber-500/25",
    approved: "bg-green-500/15 border-green-500/30 hover:bg-green-500/25",
    completed: "bg-slate-500/15 border-slate-500/30 hover:bg-slate-500/25"
  };

  return (
    <div
      className={`rounded-lg border p-2 cursor-pointer transition-all h-full flex flex-col ${statusColors[round.approval_status] || "bg-white/5 border-white/10 hover:bg-white/10"}`}
      onClick={() => onEdit(round)}
    >
      <div className="flex-1 min-h-0">
        <p className="text-[11px] font-semibold text-white line-clamp-1">{round.event_type}</p>
        <p className="text-[9px] text-white/60 line-clamp-1">{deptText}</p>
        {round.topic && <p className="text-[9px] text-white/50 line-clamp-2 mt-0.5">{round.topic}</p>}
      </div>
      {round.start_time && <p className="text-[8px] text-white/40 mt-1">⏰ {round.start_time}</p>}
    </div>
  );
}

export default function EducationalRounds() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [editingRound, setEditingRound] = useState(null);
  const [selectedDept, setSelectedDept] = useState("");
  const queryClient = useQueryClient();

  // Save department preference
  useEffect(() => {
    if (selectedDept) {
      base44.auth.me().then(user => {
        if (user?.email) {
          base44.entities.UserPreference.filter({ user_email: user.email }).then(prefs => {
            if (prefs?.length > 0) {
              base44.entities.UserPreference.update(prefs[0].id, { selected_department: selectedDept }).catch(() => {});
            } else {
              base44.entities.UserPreference.create({ user_email: user.email, selected_department: selectedDept }).catch(() => {});
            }
          });
        }
      });
    }
  }, [selectedDept]);

  // Load department preference
  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.email) {
        base44.entities.UserPreference.filter({ user_email: user.email }).then(prefs => {
          if (prefs?.length > 0 && prefs[0].selected_department) {
            setSelectedDept(prefs[0].selected_department);
          }
        }).catch(() => {});
      }
    });
  }, []);

  const { data: allRounds = [] } = useQuery({
    queryKey: ["educational-rounds"],
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

  const weekDates = getWeekDates(weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  // Get rounds for this week
  const weekRounds = allRounds.filter(r => {
    const rDate = new Date(r.date);
    return rDate >= weekStart && rDate <= weekEnd && r.approval_status !== "cancelled";
  });

  // Filter by department if selected
  const displayRounds = selectedDept
    ? weekRounds.filter(r => r.departments?.includes(selectedDept))
    : weekRounds;

  const roundsByDate = {};
  weekDates.forEach(d => {
    roundsByDate[formatDate(d)] = displayRounds.filter(r => r.date === formatDate(d));
  });

  const weekdayDates = weekDates.slice(0, 5); // Mon-Fri
  const weekendDates = weekDates.slice(5); // Sat-Sun

  const handlePrevWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() - 7);
    setWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + 7);
    setWeekStart(newStart);
  };

  const handleEdit = (round) => {
    setEditingRound(round);
    setShowForm(true);
  };

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
      <PageHeader title="Educational Rounds" />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={handlePrevWeek} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 transition-colors flex-shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center min-w-48">
            <p className="text-sm font-semibold text-white">{formatDisplayDate(weekStart)} – {formatDisplayDate(weekEnd)}</p>
            <p className="text-xs text-white/50">Week of {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
          </div>
          <button onClick={handleNextWeek} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 transition-colors flex-shrink-0">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button
            onClick={() => {
              setEditingRound(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Round
          </button>
        </div>
      </div>

      {/* Weekday Calendar (Mon-Fri) */}
      <div className="mb-8">
        <h3 className="text-xs font-semibold text-white/70 uppercase mb-3">Monday - Friday</h3>
        <div className="grid grid-cols-5 gap-3">
          {weekdayDates.map(date => {
            const dateStr = formatDate(date);
            const dayRounds = roundsByDate[dateStr] || [];
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <div
                key={dateStr}
                className={`rounded-lg border p-3 min-h-[200px] flex flex-col ${
                  isToday ? "bg-white/10 border-white/30" : "bg-white/5 border-white/10"
                }`}
              >
                <div className="mb-3 pb-2 border-b border-white/10">
                  <p className={`text-xs font-semibold ${isToday ? "text-blue-300" : "text-white"}`}>
                    {formatDayOfWeek(date)}
                  </p>
                  <p className={`text-sm font-bold ${isToday ? "text-blue-300" : "text-white/80"}`}>
                    {formatDisplayDate(date)}
                  </p>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  {dayRounds.length > 0 ? (
                    dayRounds.map(round => (
                      <RoundCard key={round.id} round={round} onEdit={handleEdit} />
                    ))
                  ) : (
                    <p className="text-[10px] text-white/30 italic">No rounds</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekend Calendar (Sat-Sun) */}
      <div>
        <h3 className="text-xs font-semibold text-white/70 uppercase mb-3">Saturday - Sunday</h3>
        <div className="grid grid-cols-2 gap-3">
          {weekendDates.map(date => {
            const dateStr = formatDate(date);
            const dayRounds = roundsByDate[dateStr] || [];
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <div
                key={dateStr}
                className={`rounded-lg border p-3 min-h-[200px] flex flex-col ${
                  isToday ? "bg-white/10 border-white/30" : "bg-white/5 border-white/10"
                }`}
              >
                <div className="mb-3 pb-2 border-b border-white/10">
                  <p className={`text-xs font-semibold ${isToday ? "text-blue-300" : "text-white"}`}>
                    {formatDayOfWeek(date)}
                  </p>
                  <p className={`text-sm font-bold ${isToday ? "text-blue-300" : "text-white/80"}`}>
                    {formatDisplayDate(date)}
                  </p>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  {dayRounds.length > 0 ? (
                    dayRounds.map(round => (
                      <RoundCard key={round.id} round={round} onEdit={handleEdit} />
                    ))
                  ) : (
                    <p className="text-[10px] text-white/30 italic">No rounds</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <EducationalRoundForm
            round={editingRound}
            onClose={() => {
              setShowForm(false);
              setEditingRound(null);
            }}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ["educational-rounds"] })}
            staffList={staffList}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}