import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Upload, FileText, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function JournalUploadModal({ onClose, onProcessing }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = (f) => {
    if (f && f.type === "application/pdf") {
      setFile(f);
    } else {
      toast.error("Please select a PDF file.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return toast.error("Please select a PDF first.");
    setUploading(true);
    try {
      const user = await base44.auth.me();

      // Create a placeholder journal record (no upload yet - just to have an ID)
      const journal = await base44.entities.Journal.create({
        title: file.name.replace(".pdf", ""),
        uploaded_by: user.email,
        uploaded_by_name: user.full_name,
        favorited_by: [],
        ai_processed: false,
      });

      // Pass the raw file object so text can be extracted client-side
      onProcessing(journal, file);
    } catch (err) {
      toast.error("Failed: " + err.message);
      setUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="relative glass-panel w-full sm:rounded-2xl sm:max-w-md rounded-t-2xl">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Upload Article</h2>
            <p className="text-xs text-white/45 mt-0.5">PDF will be analyzed by AI</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/45 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("pdf-input").click()}
            className={`rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center py-10 gap-3 ${
              dragging ? "border-white/40 bg-white/10" : file ? "border-white/25 bg-white/6" : "border-white/15 bg-white/4 hover:border-white/28 hover:bg-white/8"
            }`}
          >
            {file ? (
              <>
                <FileText className="w-8 h-8 text-white/60" />
                <p className="text-sm text-white/80 font-medium text-center px-4">{file.name}</p>
                <p className="text-xs text-white/35">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-white/30" />
                <div className="text-center">
                  <p className="text-sm text-white/60">Drop PDF here or click to browse</p>
                  <p className="text-xs text-white/30 mt-0.5">PDF files only</p>
                </div>
              </>
            )}
          </div>
          <input id="pdf-input" type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={!file || uploading}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-white/15 hover:bg-white/22 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? "Uploading…" : "Analyze Article"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}