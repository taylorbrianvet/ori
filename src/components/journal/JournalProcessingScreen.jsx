import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Loader2, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(" ");
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }
  return fullText.trim();
}

export default function JournalProcessingScreen({ journal, pdfFile, onBack }) {
  const [status, setStatus] = useState("extracting"); // extracting | parsing | done | error
  const [extractedText, setExtractedText] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        // Step 1: Extract text client-side
        const text = await extractTextFromPdf(pdfFile);
        setExtractedText(text);

        if (!text || text.length < 50) {
          throw new Error("Could not extract text from PDF. Make sure the PDF contains selectable text (not a scanned image).");
        }

        // Step 2: Send to OpenAI for parsing
        setStatus("parsing");
        await base44.functions.invoke("parseJournalArticle", {
          raw_text: text,
          journal_id: journal.id,
        });

        setStatus("done");

        // Navigate to the article after a brief success moment
        setTimeout(() => {
          window.location.href = createPageUrl(`JournalDetail?id=${journal.id}`);
        }, 1200);

      } catch (err) {
        setError(err.message || "Processing failed.");
        setStatus("error");
      }
    };
    run();
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: "#1a070f" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-sm text-white/60 font-medium truncate max-w-xs">{journal?.title || "Processing Article"}</span>
        <div className="w-16" />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col p-5 gap-4">

        {/* Status bar */}
        <div className="flex items-center gap-3 shrink-0">
          <StepBadge label="Extract Text" active={status === "extracting"} done={["parsing","done"].includes(status)} />
          <div className="flex-1 h-px bg-white/10" />
          <StepBadge label="AI Parsing" active={status === "parsing"} done={status === "done"} />
          <div className="flex-1 h-px bg-white/10" />
          <StepBadge label="Done" active={false} done={status === "done"} />
        </div>

        {/* Content area */}
        {status === "extracting" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-white/50 animate-spin" />
            <p className="text-white/60 text-sm">Extracting text from PDF…</p>
          </div>
        )}

        {status === "parsing" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-white/50 animate-spin" />
            <p className="text-white/60 text-sm">Analyzing article with AI…</p>
          </div>
        )}

        {status === "done" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white/80" />
            </div>
            <p className="text-white/80 text-sm font-medium">Article processed successfully</p>
            <p className="text-white/35 text-xs">Redirecting to article…</p>
          </motion.div>
        )}

        {status === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <p className="text-red-400 text-sm font-medium">Processing Failed</p>
            <p className="text-white/40 text-xs text-center max-w-sm leading-relaxed">{error}</p>
            <button onClick={onBack} className="text-xs text-white/40 hover:text-white underline mt-2 transition-colors">
              Go back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepBadge({ label, active, done }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs transition-colors ${
      done ? "text-green-400" : active ? "text-white/80" : "text-white/25"
    }`}>
      {done
        ? <CheckCircle className="w-3.5 h-3.5" />
        : active
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <div className="w-3.5 h-3.5 rounded-full border border-current opacity-40" />
      }
      {label}
    </div>
  );
}