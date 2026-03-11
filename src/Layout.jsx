import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Stethoscope, Phone, BookOpen, Menu, X, Settings, Users, BookMarked, GraduationCap, ArrowLeftRight } from "lucide-react";
import EditMyProfileModal from "@/components/shared/EditMyProfileModal";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

// Dark navy base + warm orange/amber radial blobs — matching the sunset-to-ocean image
// Each config shifts the blob positions for a fluid per-page feel
const GRADIENT_CONFIGS = [
  // config 0 — orange bottom-left, blue top-right
  "radial-gradient(ellipse 70% 60% at 10% 85%, rgba(220,90,20,0.90) 0%, transparent 60%), radial-gradient(ellipse 65% 55% at 85% 10%, rgba(30,80,200,0.75) 0%, transparent 60%), radial-gradient(ellipse 50% 45% at 50% 45%, rgba(180,60,10,0.30) 0%, transparent 55%)",
  // config 1 — orange center-left, blue top-right, hint bottom-right
  "radial-gradient(ellipse 65% 65% at 20% 70%, rgba(220,90,20,0.85) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 15%, rgba(25,70,210,0.78) 0%, transparent 60%), radial-gradient(ellipse 45% 40% at 75% 80%, rgba(15,40,140,0.45) 0%, transparent 55%)",
  // config 2 — orange bottom, blue top-center
  "radial-gradient(ellipse 80% 55% at 30% 90%, rgba(215,85,15,0.88) 0%, transparent 60%), radial-gradient(ellipse 70% 55% at 70% 5%, rgba(35,85,210,0.72) 0%, transparent 58%), radial-gradient(ellipse 40% 35% at 15% 20%, rgba(200,70,10,0.25) 0%, transparent 50%)",
  // config 3 — orange left, blue right-center
  "radial-gradient(ellipse 60% 70% at 5% 60%, rgba(225,85,18,0.90) 0%, transparent 60%), radial-gradient(ellipse 65% 60% at 90% 35%, rgba(20,65,205,0.78) 0%, transparent 60%), radial-gradient(ellipse 50% 45% at 55% 90%, rgba(170,55,8,0.28) 0%, transparent 52%)",
  // config 4 — orange bottom-center, blue top-left
  "radial-gradient(ellipse 75% 55% at 45% 95%, rgba(218,88,16,0.88) 0%, transparent 60%), radial-gradient(ellipse 60% 55% at 15% 10%, rgba(28,75,215,0.75) 0%, transparent 58%), radial-gradient(ellipse 45% 40% at 88% 55%, rgba(12,38,150,0.42) 0%, transparent 52%)",
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
  { name: "On Call", page: "OnCall", icon: Phone },
  { name: "Ed. Rounds", page: "EducationalRounds", icon: GraduationCap },
  { name: "Transfers", page: "Transfers", icon: ArrowLeftRight },
  { name: "Resources", page: "Resources", icon: BookOpen },
];

function UserAvatar({ user, staffProfile }) {
  const imageUrl = staffProfile?.profile_image_url;
  const name = user?.full_name || "";
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/15 flex items-center justify-center flex-shrink-0 border border-white/25">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-white/90">{initials}</span>
        )}
      </div>
      {name && <span className="text-xs text-white/60 font-medium truncate max-w-[110px]">{name}</span>}
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
        logoBaseRotation.current += delta * 0.02; // ~1 full rotation per ~18s
        setLogoRotation(logoBaseRotation.current);
      }
      lastTime = timestamp;
      logoAnimRef.current = requestAnimationFrame(step);
    };
    logoAnimRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(logoAnimRef.current);
  }, []);

  // Page change bump
  useEffect(() => {
    logoBaseRotation.current += 30;
    setLogoRotation(logoBaseRotation.current);
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

  const BASE_BG = "#0d1a3a"; // deep navy base

  return (
    <div className="min-h-screen font-inter flex" style={{ position: "relative" }}>
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
      <aside className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-40 glass-panel border-r border-white/10 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"}`}>
        <div className={`border-b border-white/10 transition-all duration-300 ${sidebarOpen ? "p-6" : "p-4"}`}>
          <div className={`flex items-center transition-all duration-300 ${sidebarOpen ? "gap-3" : "flex-col gap-2"}`}>
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ae5c53616161c3fff1c63f/899aa1d62_sollogo.png" alt="ORI" className="w-10 h-10 flex-shrink-0" style={{ filter: "brightness(0) invert(1)", transform: `rotate(${logoRotation}deg)`, transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)" }} />
            {sidebarOpen && (
             <div>
               <h1 className="text-base font-semibold text-white tracking-tight">ORI</h1>
               <p className="text-[11px] text-white/50 font-medium">Hospital Management</p>
             </div>
            )}
            {!sidebarOpen && (
             <h1 className="text-xs font-semibold text-white tracking-tight">ORI</h1>
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
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/55 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className={`w-[17px] h-[17px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-orange-300" : "text-white/40"}`} />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-1">
          <Link
            to={createPageUrl("Pharmacy")}
            title={!sidebarOpen ? "Pharmacy" : ""}
            className={`flex items-center transition-all duration-200 group rounded-xl ${
              sidebarOpen ? "gap-3 px-4 py-2.5" : "justify-center px-3 py-2.5"
            } text-sm font-medium ${
              currentPageName === "Pharmacy"
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/55 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Users className={`w-[17px] h-[17px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${currentPageName === "Pharmacy" ? "text-orange-300" : "text-white/40"}`} />
            {sidebarOpen && <span>Pharmacy</span>}
          </Link>

          <Link
            to={createPageUrl("Directory")}
            title={!sidebarOpen ? "Directory" : ""}
            className={`flex items-center transition-all duration-200 group rounded-xl ${
              sidebarOpen ? "gap-3 px-4 py-2.5" : "justify-center px-3 py-2.5"
            } text-sm font-medium ${
              currentPageName === "Directory"
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/55 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Users className={`w-[17px] h-[17px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${currentPageName === "Directory" ? "text-orange-300" : "text-white/40"}`} />
            {sidebarOpen && <span>Directory</span>}
          </Link>
          {isAdmin && (
            <Link
              to={createPageUrl("Admin")}
              title={!sidebarOpen ? "Admin" : ""}
              className={`flex items-center transition-all duration-200 group rounded-xl ${
                sidebarOpen ? "gap-3 px-4 py-2.5" : "justify-center px-3 py-2.5"
              } text-sm font-medium ${
                currentPageName === "Admin"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/55 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Settings className={`w-[17px] h-[17px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${currentPageName === "Admin" ? "text-orange-300" : "text-white/40"}`} />
              {sidebarOpen && <span>Admin</span>}
            </Link>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Collapse" : "Expand"}
            className="w-full flex items-center justify-center py-2 mt-2 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
          >
            {sidebarOpen ? "◄" : "►"}
          </button>

          {/* User profile at bottom of sidebar */}
          {currentUser && sidebarOpen && (
            <div className="pt-2 px-1">
              <button onClick={() => setShowEditProfile(true)} className="w-full text-left hover:bg-white/8 rounded-xl px-1 py-1 transition-colors">
                <UserAvatar user={currentUser} staffProfile={staffProfile} />
              </button>
            </div>
          )}
          {sidebarOpen && (
            <p className="text-[11px] text-white/25 text-center pt-1">© 2026 ORI</p>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ae5c53616161c3fff1c63f/899aa1d62_sollogo.png" alt="ORI" className="w-7 h-7" style={{ filter: "brightness(0) invert(1)", transform: `rotate(${logoRotation}deg)`, transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)" }} />
            <span className="text-sm font-semibold text-white">ORI</span>
          </div>
          <div className="flex items-center gap-2">
            {currentUser && (
              <UserAvatar user={currentUser} staffProfile={staffProfile} />
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors text-white/70"
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
              className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-72 glass-panel border-r border-white/10"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ae5c53616161c3fff1c63f/899aa1d62_sollogo.png" alt="ORI" className="w-7 h-7" style={{ filter: "brightness(0) invert(1)" }} />
                    <span className="text-sm font-semibold text-white">ORI</span>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70">
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
                          ? "bg-white/15 text-white"
                          : "text-white/55 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <item.icon className={`w-[17px] h-[17px] ${isActive ? "text-orange-300" : "text-white/40"}`} />
                      {item.name}
                    </Link>
                  );
                })}
                {isAdmin && (
                  <Link
                    to={createPageUrl("Admin")}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      currentPageName === "Admin"
                        ? "bg-white/15 text-white"
                        : "text-white/55 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Settings className={`w-[17px] h-[17px] ${currentPageName === "Admin" ? "text-orange-300" : "text-white/40"}`} />
                    Admin
                  </Link>
                )}
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



      {/* Main Content */}
      <main className={`flex-1 relative z-10 transition-all duration-300 ${sidebarOpen ? "md:ml-64" : "md:ml-20"}`}>
        <div className="pt-14 md:pt-0 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}