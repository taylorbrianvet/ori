import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle2 } from "lucide-react";

const MESSAGES = [
  "Analyzing wound care transcript…",
  "Identifying exudate type and amount…",
  "Extracting dressing and topical therapy details…",
  "Detecting debridement and closure notes…",
  "Calculating next bandage change date…",
  "Saving wound care record…",
  "Almost done…",
];

export default function AIProcessingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => Math.min(i + 1, MESSAGES.length - 1));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center px-8"
    >
      {/* Animated brain icon */}
      <div className="relative mb-8">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center"
        >
          <Brain className="w-10 h-10 text-white/70" />
        </motion.div>
        {/* Pulse rings */}
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-2xl border border-white/20"
            animate={{ scale: [1, 1.5 + i * 0.3], opacity: [0.3, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
          />
        ))}
      </div>

      <h2 className="text-xl font-semibold text-white mb-2">AI Processing</h2>
      <p className="text-sm text-white/50 mb-8 text-center">Parsing wound care data and saving your time</p>

      <AnimatePresence mode="wait">
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-sm text-white/70 text-center"
        >
          {MESSAGES[msgIndex]}
        </motion.p>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="flex gap-2 mt-8">
        {MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
              i <= msgIndex ? "bg-white/70" : "bg-white/20"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}