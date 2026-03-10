import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, Plus, Search, BookOpen, Star, Filter, X } from "lucide-react";
import PageContainer from "../components/shared/PageContainer";
import JournalUploadModal from "../components/journal/JournalUploadModal";
import JournalProcessingScreen from "../components/journal/JournalProcessingScreen";

const SERVICES = [
  "Anesthesia","Cardiology","Clinical Pathology","Dermatology","Emergency",
  "Critical Care","Internal Medicine","Interventional Radiology","Neurology",
  "Nutrition","Medical Oncology","Radiation Oncology","Ophthalmology",
  "Orthopedic Surgery","Primary Care","General Surgery","Radiology","Soft Tissue Surgery"
];

function JournalCard({ journal, userEmail }) {
  const isFav = (journal.favorited_by || []).includes(userEmail);
  const authors = journal.authors || [];
  const authorStr = authors.length > 2 ? `${authors[0]} et al.` : authors.join(", ");

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 cursor-pointer hover:bg-white/12 transition-all active:scale-[0.98]"
      onClick={() => { window.location.href = createPageUrl(`JournalDetail?id=${journal.id}`); }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {journal.journal_name && (
              <span className="text-[10px] text-white/40 bg-white/8 px-2 py-0.5 rounded-full flex-shrink-0">
                {journal.journal_name}{journal.journal_year ? ` ${journal.journal_year}` : ""}
              </span>
            )}
            {isFav && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug mb-1">{journal.title}</h3>
          {authorStr && <p className="text-xs text-white/40 mb-2">{authorStr}</p>}
          {journal.ai_clinical_takeaway && (
            <p className="text-xs text-white/55 leading-relaxed line-clamp-2">{journal.ai_clinical_takeaway}</p>
          )}
          {/* Service tags */}
          {(journal.associated_services || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {journal.associated_services.slice(0, 3).map(s => (
                <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/6 border border-white/10 text-white/40">{s}</span>
              ))}
              {journal.associated_services.length > 3 && (
                <span className="text-[9px] text-white/25">+{journal.associated_services.length - 3}</span>
              )}
            </div>
          )}
        </div>
        <BookOpen className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" />
      </div>
    </motion.div>
  );
}

export default function JournalClub() {
  const [showUpload, setShowUpload] = useState(false);
  const [processing, setProcessing] = useState(null); // { journal, pdfFile }
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { data: journals = [], isLoading } = useQuery({
    queryKey: ["journals"],
    queryFn: () => base44.entities.Journal.list("-created_date"),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const userEmail = currentUser?.email || "";

  const filtered = journals.filter(j => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (j.title || "").toLowerCase().includes(q) ||
      (j.journal_name || "").toLowerCase().includes(q) ||
      (j.authors || []).some(a => a.toLowerCase().includes(q)) ||
      (j.keywords || []).some(k => k.toLowerCase().includes(q)) ||
      (j.procedures || []).some(p => p.toLowerCase().includes(q)) ||
      (j.disease_processes || []).some(d => d.toLowerCase().includes(q));
    const matchService = !serviceFilter ||
      (j.associated_services || []).includes(serviceFilter);
    return matchSearch && matchService;
  });

  // Group by journal name for display
  const journalNames = [...new Set(journals.map(j => j.journal_name).filter(Boolean))].sort();

  if (processing) {
    return (
      <JournalProcessingScreen
        journal={processing.journal}
        pdfFile={processing.pdfFile}
        onBack={() => setProcessing(null)}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero background with blur */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1600&q=60)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(25px) brightness(0.4)',
          opacity: 0.55,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        <PageContainer className="pt-8">
          <div className="mb-8">
            <Link to={createPageUrl("Home")}
              className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" /> Home
            </Link>
          </div>

          {/* Hero Section */}
          <div className="mb-12">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-white mb-4">Journal Club</h1>
              <div className="space-y-3 max-w-2xl">
                <p className="text-base text-white/80 leading-relaxed">
                  A curated library of <span className="font-semibold">AI-generated articles</span> for quick reference and easy access.
                </p>
                <ul className="space-y-2 text-sm text-white/70">
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-300 font-bold mt-0.5">✓</span>
                    <span><strong>Save articles</strong> — Build your personal collection of essential reads</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-300 font-bold mt-0.5">✓</span>
                    <span><strong>Manage your library</strong> — No need to continuously download—everything is here</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-300 font-bold mt-0.5">✓</span>
                    <span><strong>Share with your community</strong> — Make knowledge accessible across the hospital</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Upload button */}
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/20 hover:bg-white/28 text-white text-sm font-semibold transition-colors border border-white/25">
              <Plus className="w-4 h-4" /> Upload Article
            </button>
          </div>

          {/* Articles section */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full max-w-xs grid-cols-2 bg-white/10 border border-white/15 mb-6">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All Articles</TabsTrigger>
              <TabsTrigger value="favorites" className="text-xs sm:text-sm">My Favorites</TabsTrigger>
            </TabsList>

            {/* Search + Filter */}
            <div className="flex gap-2 mb-5">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/8 border border-white/10">
                <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                <input
                  className="bg-transparent text-xs text-white placeholder:text-white/35 outline-none flex-1"
                  placeholder="Search title, author, keyword, procedure…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && <button onClick={() => setSearch("")}><X className="w-3.5 h-3.5 text-white/30 hover:text-white/60" /></button>}
              </div>
              <button onClick={() => setShowFilter(v => !v)}
                className={`px-3 py-2.5 rounded-xl border text-xs transition-colors flex items-center gap-1.5 ${
                  serviceFilter ? "bg-white/15 border-white/25 text-white" : "bg-white/6 border-white/10 text-white/50 hover:bg-white/10"
                }`}>
                <Filter className="w-3.5 h-3.5" />
                {serviceFilter || "Service"}
              </button>
            </div>

            {/* Service filter dropdown */}
            <AnimatePresence>
              {showFilter && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4">
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    <button onClick={() => { setServiceFilter(""); setShowFilter(false); }}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${!serviceFilter ? "bg-white/15 border-white/25 text-white" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"}`}>
                      All Services
                    </button>
                    {SERVICES.map(s => (
                      <button key={s} onClick={() => { setServiceFilter(s); setShowFilter(false); }}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${serviceFilter === s ? "bg-white/15 border-white/25 text-white" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <TabsContent value="all" className="mt-0">
              {isLoading ? (
                <div className="py-20 text-center text-white/40 text-sm">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/8 flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6 text-white/25" />
                  </div>
                  <p className="text-sm text-white/40 mb-1">{search || serviceFilter ? "No articles match your search" : "No articles yet"}</p>
                  {!search && !serviceFilter && (
                    <button onClick={() => setShowUpload(true)} className="text-xs text-white/50 hover:text-white underline transition-colors">
                      Upload the first article
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map(j => (
                    <JournalCard key={j.id} journal={j} userEmail={userEmail} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites" className="mt-0">
              {isLoading ? (
                <div className="py-20 text-center text-white/40 text-sm">Loading…</div>
              ) : (
                (() => {
                  const favorites = filtered.filter(j => (j.favorited_by || []).includes(userEmail));
                  return favorites.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-white/8 flex items-center justify-center mx-auto mb-3">
                        <Star className="w-6 h-6 text-white/25" />
                      </div>
                      <p className="text-sm text-white/40">No favorite articles yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {favorites.map(j => (
                        <JournalCard key={j.id} journal={j} userEmail={userEmail} />
                      ))}
                    </div>
                  );
                })()
              )}
            </TabsContent>
          </Tabs>
      </PageContainer>
      </div>

      <AnimatePresence>
      {showUpload && (
      <JournalUploadModal
      onClose={() => setShowUpload(false)}
      onProcessing={(journal, pdfFile) => {
        setShowUpload(false);
        setProcessing({ journal, pdfFile });
      }}
      />
      )}
      </AnimatePresence>
      </div>
  );
}