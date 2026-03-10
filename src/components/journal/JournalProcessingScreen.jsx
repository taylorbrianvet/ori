import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Join items, preserving line breaks between text chunks
    const pageText = content.items
      .map(item => item.str)
      .join(" ");
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }
  return fullText.trim();
}

export default function JournalProcessingScreen({ journal, pdfFile, onBack }) {
  const [status, setStatus] = useState("extracting"); // extracting | done | error
  const [extractedText, setExtractedText] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        const text = await extractTextFromPdf(pdfFile);
        setExtractedText(text);
        setStatus("done");
      } catch (err) {
        setError(err.message || "Failed to extract text from PDF.");
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
        <span className="text-sm text-white/60 font-medium">{journal?.title || "PDF Text Extraction"}</span>
        <div className="w-16" />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col p-5 gap-4">
        {status === "extracting" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
            <p className="text-white/60 text-sm">Extracting text from PDF…</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <p className="text-red-400 text-sm font-medium">Extraction Failed</p>
            <p className="text-white/40 text-xs text-center max-w-sm">{error}</p>
            <button onClick={onBack} className="text-xs text-white/40 hover:text-white underline mt-2">
              Go back
            </button>
          </div>
        )}

        {status === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col gap-3 min-h-0"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-white/80 font-medium">
                Text extracted — {extractedText.length.toLocaleString()} characters
              </span>
            </div>

            <div className="flex-1 rounded-xl border border-white/12 bg-white/4 overflow-auto p-4">
              <pre className="text-xs text-white/70 whitespace-pre-wrap leading-relaxed font-mono">
                {extractedText}
              </pre>
            </div>

            <p className="text-xs text-white/35 text-center">
              Review the extracted text above. If it looks correct, we can proceed to AI parsing.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}