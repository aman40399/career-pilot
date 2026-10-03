import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RESUME_TIPS = [
  "Follow Google's XYZ formula: Accomplished [X], as measured by [Y], by doing [Z] for high-impact bullets.",
  "Quantify engineering achievements with concrete metrics (e.g., latency reduction %, RPS scale, AWS savings).",
  "Mirror exact technical keywords and framework names from target job descriptions for optimal ATS parsing.",
  "Use past-tense power action verbs like 'Architected', 'Engineered', and 'Scaled' instead of 'Responsible for'.",
  "Maintain a clean, standard layout (SUMMARY, SKILLS, EXPERIENCE, EDUCATION) for 100% ATS readability."
];

export default function ResumeAnalyzingAnimation() {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % RESUME_TIPS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Simple, Minimalist Popup Box */}
      <div className="relative w-full rounded-2xl bg-[#0c0c0f]/95 backdrop-blur-xl border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.9)] overflow-hidden">
        
        {/* Top Green Progress Bar - Runs only once */}
        <div className="w-full h-1.5 bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full bg-[#76b900]"
            initial={{ width: "0%" }}
            animate={{ width: "95%" }}
            transition={{
              duration: 12,
              ease: [0.15, 0.45, 0.2, 1],
            }}
          />
        </div>

        {/* Central Clean Loading Area */}
        <div className="p-8 sm:p-10 flex flex-col items-center justify-center text-center">
          {/* Minimalist Spinner */}
          <div className="relative w-12 h-12 mb-5">
            <div className="w-12 h-12 rounded-full border-2 border-white/[0.08]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#76b900] animate-spin" />
          </div>

          <h3 className="font-mono text-base sm:text-lg font-bold uppercase tracking-wider text-white mb-1.5">
            Analyzing Resume...
          </h3>
          <p className="font-mono text-xs text-zinc-400">
            Calibrating ATS metrics & evaluating keyword precision
          </p>
        </div>

        {/* Minimalist Tip Section at Bottom */}
        <div className="px-6 py-4 bg-black/50 border-t border-white/[0.06] flex items-start gap-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#76b900] shrink-0 mt-0.5 px-1.5 py-0.5 rounded bg-[#76b900]/10 border border-[#76b900]/20">
            TIP
          </span>
          <div className="min-h-[38px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="font-mono text-xs text-zinc-300 leading-relaxed"
              >
                {RESUME_TIPS[tipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
