import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Share2,
  Copy,
  Check,
  Award,
  Terminal,
  Cpu,
  BarChart3,
  Flame,
  Star
} from 'lucide-react';

export default function AnalysisScorecard({ result, jobRole, onAnalyzeAnother }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const overallScore = result.overallScore || 85;
  const ratings = result.ratings || {
    buzzwordDensity: 4,
    actionVerbs: 4,
    quantifiedAchievements: 3,
    formatting: 5,
  };

  const getScoreTier = (score) => {
    if (score >= 85) return { label: "TIER 1 // INTERVIEW READY", color: "#76b900", bg: "bg-[#76b900]/10 border-[#76b900]/30" };
    if (score >= 70) return { label: "TIER 2 // COMPETITIVE", color: "#60a5fa", bg: "bg-blue-500/10 border-blue-500/30" };
    return { label: "TIER 3 // CALIBRATION NEEDED", color: "#f59e0b", bg: "bg-amber-500/10 border-amber-500/30" };
  };

  const tier = getScoreTier(overallScore);

  const copySummary = async () => {
    const text = `xInterview ATS Benchmark: ${overallScore}/100\nTarget Role: ${jobRole || "Software Engineer"}\nSummary: ${result.tagline}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  const DIMENSIONS = [
    { label: "Technical Keyword Precision", value: ratings.buzzwordDensity, max: 5 },
    { label: "Executive Action Verbs", value: ratings.actionVerbs, max: 5 },
    { label: "Google XYZ Metric Density", value: ratings.quantifiedAchievements, max: 5 },
    { label: "ATS Formatting & Structure", value: ratings.formatting, max: 5 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Top Overview Glass Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0c0c0f]/80 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#76b900]/40 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-[#76b900]" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#76b900] font-bold">
                AUDIT SCORECARD // NEMOTRON 120B
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-mono">
              RESUME READINESS BENCHMARK
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-mono">
              TARGET TRACK: <span className="text-white font-bold">{jobRole || "SOFTWARE ENGINEERING (GENERAL)"}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Score Ring */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
              <div className="flex flex-col text-right">
                <span className="font-mono text-3xl sm:text-4xl font-black text-[#76b900] tracking-tight">
                  {overallScore}
                </span>
                <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest -mt-1">
                  / 100 ATS
                </span>
              </div>
              <div className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded border ${tier.bg}`} style={{ color: tier.color }}>
                {tier.label}
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Dimensions Matrix - Stars out of 5 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {DIMENSIONS.map((dim, idx) => {
            const stars = Math.min(5, Math.max(1, Math.round(dim.value || 3)));
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md flex flex-col justify-between"
              >
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block mb-2">
                    {dim.label}
                  </span>
                  <div className="flex items-center gap-1.5 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= stars
                            ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.35)]"
                            : "text-zinc-700 fill-zinc-800/60"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">Rating</span>
                  <span className="font-mono text-xs font-bold text-zinc-200">
                    {stars} out of 5 Stars
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Executive Summary Quote */}
        {result.tagline && (
          <div className="mt-6 p-4 rounded-xl bg-[#141418]/60 border border-white/[0.08] flex items-start gap-3">
            <Terminal className="w-4 h-4 text-[#76b900] shrink-0 mt-0.5" />
            <div>
              <p className="font-mono text-xs text-zinc-400 uppercase tracking-wider mb-0.5">
                EXECUTIVE SUMMARY
              </p>
              <p className="text-sm font-mono font-medium text-zinc-200 leading-relaxed">
                "{result.tagline}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Technical Critique & Analysis */}
      {result.roast && (
        <div className="rounded-2xl bg-[#0c0c0f]/80 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-white/[0.08]">
            <BarChart3 className="w-4 h-4 text-[#76b900]" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
              TECHNICAL EVALUATION & DOMAIN ALIGNMENT
            </h3>
          </div>
          <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed font-sans whitespace-pre-line">
            {result.roast}
          </div>
        </div>
      )}

      {/* Strengths & Immediate Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Strengths */}
        <div className="rounded-2xl bg-[#0c0c0f]/80 backdrop-blur-2xl border border-white/10 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-white/[0.08]">
            <CheckCircle2 className="w-4 h-4 text-[#76b900]" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#76b900]">
              CORE ARCHITECTURAL STRENGTHS
            </h3>
          </div>
          <ul className="space-y-3">
            {(result.silverLinings || []).map((strength, sIdx) => (
              <li key={sIdx} className="flex items-start gap-3 text-xs sm:text-sm text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#76b900] mt-1.5 shrink-0" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actionable Recommendations */}
        <div className="rounded-2xl bg-[#0c0c0f]/80 backdrop-blur-2xl border border-white/10 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-white/[0.08]">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
              PRIORITY ATS OPTIMIZATION STEPS
            </h3>
          </div>
          <ul className="space-y-3">
            {(result.quickWins || []).map((action, aIdx) => (
              <li key={aIdx} className="flex items-start gap-3 text-xs sm:text-sm text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Navigation Footer */}
      <div className="p-6 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onAnalyzeAnother}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white font-mono text-xs uppercase tracking-wider border border-white/[0.1] transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-zinc-400" />
          <span>Analyze Another Resume</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={copySummary}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-mono text-xs uppercase border border-white/[0.08] transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#76b900]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied" : "Copy Summary"}</span>
          </button>

          <Link
            to="/mock-interview/practice?mode=technical"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#76b900] hover:bg-[#86d100] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(118,185,0,0.3)] hover:scale-102"
          >
            <span>Proceed to Track 02 (AI Technical Screen)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
