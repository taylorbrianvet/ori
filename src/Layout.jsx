import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Stethoscope, Phone, BookOpen, Menu, X, Settings, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

const navItems = [
  { name: "Home", page: "Home", icon: Home },
  { name: "Services", page: "Services", icon: Stethoscope },
  { name: "On Call", page: "OnCall", icon: Phone },
  { name: "Resources", page: "Resources", icon: BookOpen },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      if (u?.role === "admin") setIsAdmin(true);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen font-inter flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-40 glass-panel border-r border-white/10">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shadow-inner">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-tight">VetHub</h1>
              <p className="text-[11px] text-white/50 font-medium">Hospital Management</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/55 hover:bg-white/10 hover:text-white/90"
                }`}
              >
                <item.icon className={`w-[17px] h-[17px] transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-white/50"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-1">
          {isAdmin && (
            <Link
              to={createPageUrl("Admin")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                currentPageName === "Admin"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/55 hover:bg-white/10 hover:text-white/90"
              }`}
            >
              <Settings className={`w-[17px] h-[17px] transition-transform duration-200 group-hover:scale-110 ${currentPageName === "Admin" ? "text-white" : "text-white/50"}`} />
              Admin
            </Link>
          )}
          <p className="text-[11px] text-white/30 text-center pt-1">© 2026 VetHub</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">VetHub</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors text-white/70"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
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
              className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
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
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-white">VetHub</span>
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
                          : "text-white/55 hover:bg-white/10 hover:text-white/90"
                      }`}
                    >
                      <item.icon className={`w-[17px] h-[17px] ${isActive ? "text-white" : "text-white/50"}`} />
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
                        : "text-white/55 hover:bg-white/10 hover:text-white/90"
                    }`}
                  >
                    <Settings className={`w-[17px] h-[17px] ${currentPageName === "Admin" ? "text-white" : "text-white/50"}`} />
                    Admin
                  </Link>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        <div className="pt-14 md:pt-0 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}