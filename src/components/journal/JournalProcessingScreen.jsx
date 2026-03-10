import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import * as pdfjsLib from "pdfjs-dist";

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const MESSAGES = [
  "Reading the article…",
  "Analyzing clinical content…",
  "Extracting key findings…",
  "Identifying procedures and diagnoses…",
  "Generating AI summary…",
  "Compiling clinical takeaways…",
  "Finalizing your journal entry…",
];

async function extractTextFromPdf(pdfUrl) {
  const response = await fetch(pdfUrl);
  const arrayBuffer = await response.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(" ");
    fullText += pageText + "\n";
  }
  return fullText.trim();
}

export default function JournalProcessingScreen({ journal, pdfUrl }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => Math.min(i + 1, MESSAGES.length - 1));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        // Extract text client-side from PDF
        const raw_text = await extractTextFromPdf(pdfUrl);

        if (!raw_text || raw_text.length < 50) {
          throw new Error("Could not extract text from PDF. Make sure the PDF contains selectable text (not a scanned image).");
        }

        // Send text to backend for AI analysis
        await base44.functions.invoke("parseJournalArticle", {
          raw_text,
          journal_id: journal.id,
        });

        window.location.href = createPageUrl(`JournalDetail?id=${journal.id}`);
      } catch (err) {
        setError(err.message || "Processing failed.");
      }
    };
    run();
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: "#1a070f" }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-8 px-8 text-center max-w-sm">

        {/* Animated book icon */}
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="w-20 h-20 rounded-3xl bg-white/8 flex items-center justify-center"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </motion.div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="absolute inset-0"
            style={{ transformOrigin: "center" }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white/50" />
          </motion.div>
        </div>

        {error ? (
          <div className="text-center space-y-3">
            <p className="text-white/60 text-sm">Processing failed</p>
            <p className="text-red-400 text-xs leading-relaxed">{error}</p>
            <button
              onClick={() => window.location.href = createPageUrl("JournalClub")}
              className="text-xs text-white/40 hover:text-white/70 underline transition-colors"
            >
              Back to Journal Club
            </button>
          </div>
        ) : (
          <>
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base text-white/80 font-medium"
            >
              {MESSAGES[msgIndex]}
            </motion.p>

            <div className="flex gap-1.5">
              {MESSAGES.map((_, i) => (
                <div key={i} className={`rounded-full transition-all duration-500 ${
                  i <= msgIndex ? "w-2 h-2 bg-white/60" : "w-1.5 h-1.5 bg-white/15"
                }`} />
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}