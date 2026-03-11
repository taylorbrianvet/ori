import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, X, ArrowLeftRight, Search } from "lucide-react";

const DEFAULT_HERO = "https://images.unsplash.com/photo-1551076805-e1869033e561?w=1600&q=80";
import PageContainer from "../components/shared/PageContainer";
import TransferForm from "../components/transfers/TransferForm";
import TransferCard from "../components/transfers/TransferCard";
import { AnimatePresence, motion } from "framer-motion";

// Returns 6am boundaries for bucketing transfers
function getSixAmBoundaries() {
  const now = new Date();
  const todaySixAm = new Date(now);
  todaySixAm.setHours(6, 0, 0, 0);

  const yesterdaySixAm = new Date(todaySixAm);
  yesterdaySixAm.setDate(yesterdaySixAm.getDate() - 1);

  const tomorrowSixAm = new Date(todaySixAm);
  tomorrowSixAm.setDate(tomorrowSixAm.getDate() + 1);

  return { yesterdaySixAm, todaySixAm, tomorrowSixAm };
}

function bucketTransfers(transfers) {
  const { yesterdaySixAm, todaySixAm, tomorrowSixAm } = getSixAmBoundaries();

  const today = [];
  const upcoming = [];
  const previous = [];

  transfers.forEach(t => {
    const created = new Date(t.created_date);
    if (created >= todaySixAm && created < tomorrowSixAm) {
      upcoming.push(t);
    } else if (created >= yesterdaySixAm && created < todaySixAm) {
      today.push(t);
    } else {
      previous.push(t);
    }
  });

  return { today, upcoming, previous };
}

function groupByPatient(transferList) {
  const grouped = {};
  transferList.forEach(t => {
    const key = t.patient_id || t.patient_name;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });
  return Object.values(grouped);
}

const TABS = [
  { id: "today", label: "Today's Transfers" },
  { id: "upcoming", label: "Upcoming Transfers" },
  { id: "previous", label: "Previous Transfers" },
];

export default function Transfers() {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: transfers = [] } = useQuery({
    queryKey: ["interservice-transfers"],
    queryFn: () => base44.entities.InterserviceTransfer.list("-created_date"),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-all"],
    queryFn: () => base44.entities.Staff.list(),
  });

  const { data: tileConfigs = [] } = useQuery({
    queryKey: ["home-tile-configs"],
    queryFn: () => base44.entities.HomeTileConfig.list(),
  });

  const heroImage = tileConfigs.find(c => c.tile_key === "transfers_hero")?.image_url || DEFAULT_HERO;

  const { today, upcoming, previous } = useMemo(() => bucketTransfers(transfers), [transfers]);

  const filteredPrevious = useMemo(() => {
    if (!searchQuery.trim()) return previous;
    const q = searchQuery.toLowerCase();
    return previous.filter(t =>
      t.patient_name?.toLowerCase().includes(q) ||
      t.patient_id?.toLowerCase().includes(q) ||
      t.requesting_service?.toLowerCase().includes(q) ||
      t.receiving_service?.toLowerCase().includes(q) ||
      t.requesting_clinician?.toLowerCase().includes(q)
    );
  }, [previous, searchQuery]);

  const todayGrouped = groupByPatient(today);
  const upcomingGrouped = groupByPatient(upcoming);
  const previousGrouped = groupByPatient(filteredPrevious);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["interservice-transfers"] });

  const tabCounts = {
    today: today.length,
    upcoming: upcoming.length,
    previous: previous.length,
  };

  const renderEmptyState = (message) => (
    <div className="rounded-xl border border-white/8 bg-white/3 p-10 text-center text-sm text-white/25">
      {message}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative h-52 md:h-64 overflow-hidden">
        <img
          src={heroImage}
          alt="Interservice Transfers"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-[#0d1a3a]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
            Interservice Transfers
          </h1>
          <p className="text-sm text-white/60 max-w-lg leading-relaxed">
            Patient handoff board — track upcoming and completed interservice transfers.
            Upcoming transfers are included in the daily 6 am email sent to all subscribed staff.
          </p>
        </div>
      </div>

      <PageContainer>
        {/* New Transfer Button */}
        <div className="flex justify-end mb-5 -mt-2">
          <button
            onClick={() => setShowForm(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
              showForm
                ? "bg-white/10 border-white/20 text-white/70"
                : "bg-white/12 hover:bg-white/18 border-white/20 text-white"
            }`}
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

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/45 hover:text-white/70"
              }`}
            >
              {tab.label}
              {tabCounts[tab.id] > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.id
                    ? tab.id === "upcoming" ? "bg-amber-500/30 text-amber-200" : "bg-white/20 text-white/80"
                    : "bg-white/10 text-white/40"
                }`}>
                  {tabCounts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Today's Transfers */}
        {activeTab === "today" && (
          <div>
            <p className="text-xs text-white/35 mb-4">
              Transfers submitted between 6 am yesterday and 6 am today. These patients appeared on this morning's transfer email.
            </p>
            {todayGrouped.length === 0
              ? renderEmptyState("No transfers for today's list yet.")
              : (
                <div className="space-y-3">
                  {todayGrouped.map(group => (
                    <TransferCard
                      key={group[0].patient_id || group[0].id}
                      transfers={group}
                      onUpdated={refresh}
                      bucket="today"
                    />
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* Tab: Upcoming Transfers */}
        {activeTab === "upcoming" && (
          <div>
            <p className="text-xs text-white/35 mb-4">
              Transfers submitted since 6 am today — these will be included in tomorrow morning's 6 am email.
            </p>
            {upcomingGrouped.length === 0
              ? renderEmptyState("No upcoming transfers submitted yet today.")
              : (
                <div className="space-y-3">
                  {upcomingGrouped.map(group => (
                    <TransferCard
                      key={group[0].patient_id || group[0].id}
                      transfers={group}
                      onUpdated={refresh}
                      bucket="upcoming"
                    />
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* Tab: Previous Transfers */}
        {activeTab === "previous" && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type="text"
                  placeholder="Search by patient, service, clinician, ID…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/30 border border-white/20 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-white/35"
                />
              </div>
            </div>
            {previousGrouped.length === 0
              ? renderEmptyState(searchQuery ? "No transfers match your search." : "No previous transfers on record.")
              : (
                <div className="space-y-3">
                  {previousGrouped.map(group => (
                    <TransferCard
                      key={group[0].patient_id || group[0].id}
                      transfers={group}
                      onUpdated={refresh}
                      bucket="previous"
                    />
                  ))}
                </div>
              )
            }
          </div>
        )}
      </PageContainer>
    </div>
  );
}