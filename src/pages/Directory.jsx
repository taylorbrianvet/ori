import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Users } from "lucide-react";
import PageContainer from "../components/shared/PageContainer";
import PageHeader from "../components/shared/PageHeader";
import StaffCard from "../components/directory/StaffCard";
import StaffProfileModal from "../components/directory/StaffProfileModal";

const DEPARTMENTS = [
  "All",
  "Anesthesia",
  "Cardiology",
  "Clinical Pathology",
  "Dermatology",
  "Emergency and Critical Care",
  "Internal Medicine",
  "Interventional Radiology",
  "Neurology",
  "Nutrition",
  "Oncology",
  "Ophthalmology",
  "Orthopedic Surgery",
  "Primary Care and General Surgery",
  "Radiology",
  "Soft Tissue Surgery",
  "Hospital",
];

export default function Directory() {
  const [search, setSearch] = useState("");
  const [activeDept, setActiveDept] = useState("All");
  const [selectedStaff, setSelectedStaff] = useState(null);

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.Staff.list("-created_date", 200),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return staff.filter((s) => {
      const matchesDept = activeDept === "All" || s.department === activeDept;
      const matchesSearch =
        !q ||
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.service?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [staff, activeDept, search]);

  // Group by department for display
  const grouped = useMemo(() => {
    if (activeDept !== "All") return { [activeDept]: filtered };
    return filtered.reduce((acc, s) => {
      const dept = s.department || "Unknown";
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(s);
      return acc;
    }, {});
  }, [filtered, activeDept]);

  return (
    <PageContainer>
      <PageHeader
        title="Hospital Directory"
        subtitle="Browse staff by department or search by name, email, or phone."
        icon={Users}
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone, service…"
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/8 border border-white/12 rounded-xl text-white/85 placeholder-white/30 focus:outline-none focus:border-white/25 focus:bg-white/10 transition-all"
        />
      </div>

      {/* Department filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept}
            onClick={() => setActiveDept(dept)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
              activeDept === dept
                ? "bg-white/20 text-white"
                : "bg-white/7 text-white/45 hover:bg-white/12 hover:text-white/70"
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="glass-card h-16 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-sm text-white/40">No staff found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dept, members]) => (
            <div key={dept}>
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2.5 px-1">
                {dept} · {members.length}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {members.map((s) => (
                  <StaffCard key={s.id} staff={s} onClick={() => setSelectedStaff(s)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile modal */}
      {selectedStaff && (
        <StaffProfileModal staff={selectedStaff} onClose={() => setSelectedStaff(null)} />
      )}
    </PageContainer>
  );
}