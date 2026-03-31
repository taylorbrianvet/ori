import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Stethoscope, Phone, BookOpen, Menu, X, Settings, Users, BookMarked, GraduationCap, ArrowLeftRight, Pill, DollarSign, PawPrint } from "lucide-react";
import EditMyProfileModal from "@/components/shared/EditMyProfileModal";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Toaster } from "sonner";

// Richer blue-gray + warm sandy palette
const GRADIENT_CONFIGS = [
  // config 0 — steel blue + warm blush
  "radial-gradient(ellipse 80% 70% at 0% 100%, rgba(140,170,188,0.80) 0%, transparent 60%), radial-gradient(ellipse 70% 60% at 100% 0%, rgba(172,191,202,0.70) 0%, transparent 60%), radial-gradient(ellipse 55% 50% at 50% 50%, rgba(215,198,178,0.30) 0%, transparent 55%)",
  // config 1 — muted teal-blue
  "radial-gradient(ellipse 75% 70% at 10% 80%, rgba(140,170,188,0.75) 0%, transparent 60%), radial-gradient(ellipse 65% 55% at 90% 10%, rgba(160,185,200,0.65) 0%, transparent 60%), radial-gradient(ellipse 50% 45% at 70% 70%, rgba(172,191,202,0.50) 0%, transparent 55%)",
  // config 2 — cool gray-blue + peach warmth
  "radial-gradient(ellipse 85% 60% at 25% 95%, rgba(155,178,195,0.78) 0%, transparent 60%), radial-gradient(ellipse 75% 60% at 75% 5%, rgba(140,170,188,0.65) 0%, transparent 60%), radial-gradient(ellipse 45% 40% at 10% 15%, rgba(215,198,178,0.28) 0%, transparent 50%)",
  // config 3 — deep steel blue
  "radial-gradient(ellipse 65% 75% at 0% 60%, rgba(140,170,188,0.80) 0%, transparent 60%), radial-gradient(ellipse 70% 65% at 95% 35%, rgba(160,185,200,0.65) 0%, transparent 60%), radial-gradient(ellipse 55% 50% at 55% 85%, rgba(172,191,202,0.45) 0%, transparent 55%)",
  // config 4 — sandy warm + blue accent
  "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(155,178,195,0.75) 0%, transparent 60%), radial-gradient(ellipse 65% 60% at 10% 5%, rgba(140,170,188,0.65) 0%, transparent 60%), radial-gradient(ellipse 50% 45% at 90% 55%, rgba(215,198,178,0.25) 0%, transparent 52%)",
];

const PAGE_GRADIENT_MAP = {
  Home: 0, Services: 1, ServiceBoard: 2, OnCall: 3, EducationalRounds: 4,
  Transfers: 0, Resources: 1, Pharmacy: 2, Directory: 3, Admin: 4,
  MyWorkspace: 0, JournalClub: 1, PatientCare: 2,
};

const navItems = [
  { name: "Home", page: "Home", icon: Home },
  { name: "Services", page: "Services", icon: Stethoscope },
  { name: "Service Board", page: "ServiceBoard", icon: BookOpen },
  { name: "On-Call", page: "OnCall", icon: Phone },
  { name: "Ed. Rounds", page: "EducationalRounds", icon: GraduationCap },
  { name: "Transfers", page: "Transfers", icon: ArrowLeftRight },
  { name: "Pharmacy", page: "Pharmacy", icon: Pill },
  { name: "Patients", page: "Patients", icon: PawPrint },
];

function UserAvatar({ user, staffProfile }) {
  const imageUrl = staffProfile?.profile_image_url;
  const name = user?.full_name || "";
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200/70 flex items-center justify-center flex-shrink-0 border border-slate-300/60">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-slate-600">{initials}</span>
        )}
      </div>
      {name && <span className="text-xs text-slate-500 font-medium truncate max-w-[110px]">{name}</span>}
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [staffProfile, setStaffProfile] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Two gradient slots for crossfade: "current" fully visible, "next" fading in
  const [gradientA, setGradientA] = useState(GRADIENT_CONFIGS[0]);
  const [gradientB, setGradientB] = useState(GRADIENT_CONFIGS[0]);
  const [showB, setShowB] = useState(false); // which layer is on top
  const [logoRotation, setLogoRotation] = useState(0);
  const logoBaseRotation = useRef(0);
  const logoAnimRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then((u) => {
      if (u?.role === "admin") setIsAdmin(true);
      setCurrentUser(u);
      if (u?.email) {
        base44.entities.Staff.filter({ email: u.email }).then(results => {
          if (results?.length > 0) setStaffProfile(results[0]);
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  // Continuous slow spin
  useEffect(() => {
    let lastTime = null;
    const step = (timestamp) => {
      if (lastTime !== null) {
        const delta = timestamp - lastTime;
        logoBaseRotation.current += delta * 0.014; // ~1 full rotation per ~25s
        setLogoRotation(logoBaseRotation.current);
      }
      lastTime = timestamp;
      logoAnimRef.current = requestAnimationFrame(step);
    };
    logoAnimRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(logoAnimRef.current);
  }, []);

  // Page change gradient swap
  useEffect(() => {
    const idx = PAGE_GRADIENT_MAP[currentPageName] ?? 0;
    const nextGradient = GRADIENT_CONFIGS[idx];
    if (showB) {
      // B is on top — load new into A, then fade A in (hide B)
      setGradientA(nextGradient);
      requestAnimationFrame(() => requestAnimationFrame(() => setShowB(false)));
    } else {
      // A is on top — load new into B, then fade B in
      setGradientB(nextGradient);
      requestAnimationFrame(() => requestAnimationFrame(() => setShowB(true)));
    }
  }, [currentPageName]);

  const BASE_BG = "#9eb8c8"; // richer steel-blue base

  return (
    <div className="min-h-screen font-inter flex" style={{ position: "relative", "--sidebar-width": sidebarOpen ? "16rem" : "5rem" }}>
      {/* Crossfade background — layer A */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundColor: BASE_BG,
        backgroundImage: gradientA,
        opacity: showB ? 0 : 1,
        transition: "opacity 1.4s ease-in-out",
      }} />
      {/* Crossfade background — layer B */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundColor: BASE_BG,
        backgroundImage: gradientB,
        opacity: showB ? 1 : 0,
        transition: "opacity 1.4s ease-in-out",
      }} />
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-40 border-r transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"}`} style={{ background: "rgba(238, 247, 253, 0.82)", backdropFilter: "blur(32px) saturate(160%)", WebkitBackdropFilter: "blur(32px) saturate(160%)", borderColor: "rgba(255,255,255,0.75)", boxShadow: "4px 0 24px rgba(80,120,150,0.18), inset -1px 0 0 rgba(255,255,255,0.60)" }}>
        <div className={`border-b border-slate-200/60 transition-all duration-300 ${sidebarOpen ? "p-6" : "p-4"}`}>
          <div className={`flex items-center transition-all duration-300 ${sidebarOpen ? "gap-3" : "flex-col gap-2"}`}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ae5c53616161c3fff1c63f/899aa1d62_sollogo.png"
              alt="ORI"
              className="w-10 h-10 flex-shrink-0 cursor-pointer"
              onClick={() => { logoBaseRotation.current += 120; window.location.href = createPageUrl("Home"); }}
              style={{ filter: "brightness(0) saturate(0) opacity(0.55)", transform: `rotate(${logoRotation}deg)` }}
            />
            {sidebarOpen && (
             <div>
               <h1 className="text-base font-semibold text-slate-700 tracking-tight">ORI</h1>
               <p className="text-[11px] text-slate-400 font-medium">Hospital Management</p>
             </div>
            )}
            {!sidebarOpen && (
             <h1 className="text-xs font-semibold text-slate-700 tracking-tight">ORI</h1>
            )}
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                title={!sidebarOpen ? item.name : ""}
                className={`flex items-center transition-all duration-200 group rounded-xl ${
                  sidebarOpen ? "gap-3 px-4 py-2.5" : "justify-center px-3 py-2.5"
                } text-sm font-medium ${
                  isActive
                    ? "bg-[#8aa8b8]/20 text-slate-700 shadow-sm border border-[#8aa8b8]/30"
                    : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"
                }`}
              >
                <item.icon className={`w-[17px] h-[17px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-[#6a92a6]" : "text-slate-400"}`} />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200/60 space-y-1">
          <Link
            to={createPageUrl("Directory")}
            title={!sidebarOpen ? "Directory" : ""}
            className={`flex items-center transition-all duration-200 group rounded-xl ${
              sidebarOpen ? "gap-3 px-4 py-2.5" : "justify-center px-3 py-2.5"
            } text-sm font-medium ${
              currentPageName === "Directory"
                ? "bg-[#8aa8b8]/20 text-slate-700 shadow-sm border border-[#8aa8b8]/30"
                : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"
            }`}
          >
            <Users className={`w-[17px] h-[17px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${currentPageName === "Directory" ? "text-[#6a92a6]" : "text-slate-400"}`} />
            {sidebarOpen && <span>Directory</span>}
          </Link>

          <Link
            to={createPageUrl("Estimates")}
            title={!sidebarOpen ? "Estimates" : ""}
            className={`flex items-center transition-all duration-200 group rounded-xl ${
              sidebarOpen ? "gap-3 px-4 py-2.5" : "justify-center px-3 py-2.5"
            } text-sm font-medium ${
              currentPageName === "Estimates"
                ? "bg-[#c4a882]/20 text-slate-700 shadow-sm border border-[#c4a882]/35"
                : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"
            }`}
          >
            <DollarSign className={`w-[17px] h-[17px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${currentPageName === "Estimates" ? "text-[#b08a5e]" : "text-slate-400"}`} />
            {sidebarOpen && <span>Estimates</span>}
          </Link>

          {isAdmin && (
            <Link
              to={createPageUrl("Admin")}
              title={!sidebarOpen ? "Admin" : ""}
              className={`flex items-center transition-all duration-200 group rounded-xl ${
                sidebarOpen ? "gap-3 px-4 py-2.5" : "justify-center px-3 py-2.5"
              } text-sm font-medium ${
                currentPageName === "Admin"
                  ? "bg-[#8aa8b8]/20 text-slate-700 shadow-sm border border-[#8aa8b8]/30"
                  : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"
              }`}
            >
              <Settings className={`w-[17px] h-[17px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${currentPageName === "Admin" ? "text-[#6a92a6]" : "text-slate-400"}`} />
              {sidebarOpen && <span>Admin</span>}
            </Link>
          )}

          <Link
            to={createPageUrl("Resources")}
            title={!sidebarOpen ? "Resources" : ""}
            className={`flex items-center transition-all duration-200 group rounded-xl ${
              sidebarOpen ? "gap-3 px-4 py-2.5" : "justify-center px-3 py-2.5"
            } text-sm font-medium ${
              currentPageName === "Resources"
                ? "bg-[#8aa8b8]/20 text-slate-700 shadow-sm border border-[#8aa8b8]/30"
                : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"
            }`}
          >
            <BookOpen className={`w-[17px] h-[17px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${currentPageName === "Resources" ? "text-[#6a92a6]" : "text-slate-400"}`} />
            {sidebarOpen && <span>Resources</span>}
          </Link>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Collapse" : "Expand"}
            className="w-full flex items-center justify-center py-2 mt-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100/70 transition-colors text-xs font-medium"
          >
            {sidebarOpen ? "◄" : "►"}
          </button>

          {/* User profile at bottom of sidebar */}
          {currentUser && sidebarOpen && (
            <div className="pt-2 px-1">
              <button onClick={() => setShowEditProfile(true)} className="w-full text-left hover:bg-slate-100/60 rounded-xl px-1 py-1 transition-colors">
                <UserAvatar user={currentUser} staffProfile={staffProfile} />
              </button>
            </div>
          )}
          {sidebarOpen && (
            <p className="text-[11px] text-slate-400 text-center pt-1">© 2026 ORI</p>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 glass-panel border-b border-slate-200/60">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ae5c53616161c3fff1c63f/899aa1d62_sollogo.png"
              alt="ORI"
              className="w-7 h-7 cursor-pointer"
              onClick={() => { logoBaseRotation.current += 120; window.location.href = createPageUrl("Home"); }}
              style={{ filter: "brightness(0) saturate(0) opacity(0.55)", transform: `rotate(${logoRotation}deg)` }}
            />
            <span className="text-sm font-semibold text-slate-700">ORI</span>
          </div>
          <div className="flex items-center gap-2">
            {currentUser && (
              <UserAvatar user={currentUser} staffProfile={staffProfile} />
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100/70 transition-colors text-slate-500"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-slate-400/20 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-72 glass-panel border-r border-slate-200/60"
            >
              <div className="p-6 border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ae5c53616161c3fff1c63f/899aa1d62_sollogo.png" alt="ORI" className="w-7 h-7" style={{ filter: "brightness(0) saturate(0) opacity(0.55)" }} />
                    <span className="text-sm font-semibold text-slate-700">ORI</span>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100/70 text-slate-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-[#8aa8b8]/20 text-slate-700 border border-[#8aa8b8]/30"
                          : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"
                      }`}
                    >
                      <item.icon className={`w-[17px] h-[17px] ${isActive ? "text-[#6a92a6]" : "text-slate-400"}`} />
                      {item.name}
                    </Link>
                  );
                })}
                <Link
                  to={createPageUrl("Directory")}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    currentPageName === "Directory"
                      ? "bg-[#8aa8b8]/20 text-slate-700 border border-[#8aa8b8]/30"
                      : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"
                  }`}
                >
                  <Users className={`w-[17px] h-[17px] ${currentPageName === "Directory" ? "text-[#6a92a6]" : "text-slate-400"}`} />
                  Directory
                </Link>
                <Link
                  to={createPageUrl("Estimates")}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    currentPageName === "Estimates"
                      ? "bg-[#c4a882]/20 text-slate-700 border border-[#c4a882]/35"
                      : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"
                  }`}
                >
                  <DollarSign className={`w-[17px] h-[17px] ${currentPageName === "Estimates" ? "text-[#b08a5e]" : "text-slate-400"}`} />
                  Estimates
                </Link>
                {isAdmin && (
                  <Link
                    to={createPageUrl("Admin")}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      currentPageName === "Admin"
                        ? "bg-[#8aa8b8]/20 text-slate-700 border border-[#8aa8b8]/30"
                        : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"
                    }`}
                  >
                    <Settings className={`w-[17px] h-[17px] ${currentPageName === "Admin" ? "text-[#6a92a6]" : "text-slate-400"}`} />
                    Admin
                  </Link>
                )}
                <Link
                  to={createPageUrl("Resources")}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    currentPageName === "Resources"
                      ? "bg-[#8aa8b8]/20 text-slate-700 border border-[#8aa8b8]/30"
                      : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"
                  }`}
                >
                  <BookOpen className={`w-[17px] h-[17px] ${currentPageName === "Resources" ? "text-[#6a92a6]" : "text-slate-400"}`} />
                  Resources
                </Link>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      {showEditProfile && staffProfile && (
        <EditMyProfileModal
          staffProfile={staffProfile}
          onClose={() => setShowEditProfile(false)}
          onSaved={(updated) => setStaffProfile(updated)}
        />
      )}



      <Toaster richColors position="top-right" />

      {/* Main Content */}
      <main className={`flex-1 relative z-10 transition-all duration-300 ${sidebarOpen ? "md:ml-64" : "md:ml-20"}`}>
        <div className="pt-14 md:pt-0 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}