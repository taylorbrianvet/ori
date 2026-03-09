import React from "react";
import { X, FileSpreadsheet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CsvUploadInstructions({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.94, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            className="relative glass-panel rounded-2xl p-6 w-full max-w-lg z-10"
          >
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/40 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">CSV Upload Instructions</h2>
                <p className="text-xs text-white/45">Format your schedule file correctly</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-white/70">
              <p>Your CSV file must contain the following <strong className="text-white">columns in this exact order</strong>:</p>
              <div className="grid grid-cols-5 gap-1 text-center text-[11px]">
                {["date","service","primary","secondary","tertiary"].map(col => (
                  <div key={col} className="bg-white/8 rounded-lg px-2 py-2 font-mono text-white/80 font-medium">{col}</div>
                ))}
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-white/60 text-xs">
                <li><strong className="text-white/80">date</strong> — Format: YYYY-MM-DD (e.g. 2026-03-09)</li>
                <li><strong className="text-white/80">service</strong> — Exact service name (e.g. Surgery, Internal Medicine)</li>
                <li><strong className="text-white/80">primary</strong> — Full name of primary on-call person (required)</li>
                <li><strong className="text-white/80">secondary</strong> — Full name of backup person (leave blank if none)</li>
                <li><strong className="text-white/80">tertiary</strong> — Full name of tertiary person (leave blank if none)</li>
              </ul>
              <p className="text-xs text-white/45">One row per date per service. Multiple services on same date = multiple rows. Role information will be auto-matched from the staff directory.</p>
              <div className="bg-white/5 rounded-xl p-3 font-mono text-[11px] text-white/60 leading-relaxed">
                date,service,primary,secondary,tertiary<br />
                2026-03-09,Surgery,James Patel,Marcus Rivera,<br />
                2026-03-09,Internal Medicine,Nathan Kim,Olivia Martinez,<br />
                2026-03-10,Surgery,Danielle Chen,Marcus Rivera,Tyler Brooks
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}