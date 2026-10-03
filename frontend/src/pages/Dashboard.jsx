import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Bot,
  Mic,
  Code2,
  BookOpen,
  Award,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Cpu,
  Terminal,
  Activity,
  Layers,
  Search,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Copy,
  Check,
  Lock
} from 'lucide-react'
import { SiNvidia, SiMongodb, SiFirebase, SiOllama, SiGoogle } from 'react-icons/si'
import { FaAws } from 'react-icons/fa'

// Technology Partners & Ecosystem with Official Imported Logos
const COMPANY_LOGOS = [
  {
    name: "NVIDIA",
    color: "#76b900",
    icon: SiNvidia
  },
  {
    name: "Google",
    color: "#4285F4",
    icon: SiGoogle
  },
  {
    name: "MongoDB",
    color: "#00ed64",
    icon: SiMongodb
  },
  {
    name: "Firebase",
    color: "#ffa000",
    icon: SiFirebase
  },
  {
    name: "Ollama",
    color: "#ffffff",
    icon: SiOllama
  },
  {
    name: "AWS",
    color: "#ff9900",
    icon: FaAws
  }
]

// Material resources for "Tips & Material" module
const TIPS_AND_MATERIALS = [
  {
    category: "System Design",
    items: [
      {
        title: "Distributed Rate Limiter Blueprint",
        desc: "Token Bucket vs Leaky Bucket algorithms, Redis cluster sliding-window implementation, and fallback strategies for 100k+ RPS.",
        badge: "Architecture",
        points: [
          "Use Redis sorted sets (ZSET) for precise millisecond sliding window tracking",
          "Decouple rate limiting middleware using asynchronous local token bucket cache",
          "Return standard RFC HTTP headers: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset"
        ]
      },
      {
        title: "High-Throughput Event Streaming",
        desc: "Kafka partitioning patterns, consumer group rebalance minimization, and idempotency guarantees.",
        badge: "Data Systems",
        points: [
          "Partition keys on entity UUID to guarantee strict in-order message processing",
          "Commit offsets only after downstream database transactions succeed (At-Least-Once + Idempotency)",
          "Configure dead letter queues (DLQ) with exponential backoff retries"
        ]
      }
    ]
  },
  {
    category: "Behavioral & STAR",
    items: [
      {
        title: "STAR Method Response Structure",
        desc: "The gold standard for answering senior technical and leadership behavioral questions.",
        badge: "Communication",
        points: [
          "Situation (15%): Set the business context, company constraints, and stakes clearly.",
          "Task (15%): Specifically define what YOU were personally accountable for.",
          "Action (50%): Detail your architectural decisions, trade-offs made, and how you led the team.",
          "Result (20%): Quantify with hard numbers (e.g., 'Reduced p99 latency by 42%, saving $18k/mo')."
        ]
      },
      {
        title: "Addressing Failure & Conflict",
        desc: "How to discuss production outages, disagreements with staff engineers, or delayed deadlines constructively.",
        badge: "Leadership",
        points: [
          "Focus on blameless post-mortem methodology rather than assigning personal fault",
          "Demonstrate root cause analysis (5 Whys) and permanent guardrails instituted",
          "Show intellectual humility and proactive cross-functional alignment"
        ]
      }
    ]
  },
  {
    category: "Resume & ATS Optimization",
    items: [
      {
        title: "XYZ Resume Bullet Framework (Google Standard)",
        desc: "Accomplished [X], as measured by [Y], by doing [Z].",
        badge: "ATS Strategy",
        points: [
          "Weak: 'Worked on backend API performance improvements using Node.js.'",
          "Strong: 'Scaled query throughput by 340% (p99 latency 280ms -> 45ms) by redesigning PostgreSQL compound indexes and implementing Redis read-through caching.'",
          "Start every bullet with past-tense power verbs: Architected, Orchestrated, Benchmarked, Streamlined."
        ]
      },
      {
        title: "Keyword Matching & Technical Headers",
        desc: "Ensure applicant tracking systems parse your technical stacks cleanly without formatting degradation.",
        badge: "Formatting",
        points: [
          "Keep section titles standard: SUMMARY, SKILLS, EXPERIENCE, EDUCATION, PROJECTS",
          "Avoid multi-column tables, complex graphics, or text boxes that break OCR parsing",
          "Mirror key technical acronyms exactly from target job descriptions (e.g., CI/CD, Kubernetes, GraphQL)"
        ]
      }
    ]
  },
  {
    category: "Coding & Algorithmic",
    items: [
      {
        title: "Algorithmic Problem-Solving Framework",
        desc: "A systematic 5-step approach during live technical coding rounds.",
        badge: "Coding",
        points: [
          "1. Clarify constraints: Data types, bounds (N <= 10^5), edge cases (null, negative, empty).",
          "2. Verbalize brute force: State the naive O(N^2) solution first to anchor baseline complexity.",
          "3. Optimize: Identify trade-offs (e.g., hash map for O(1) lookups, two-pointers for O(1) space).",
          "4. Code cleanly: Use modular helper functions, meaningful variable names, handle bounds.",
          "5. Dry run: Manually trace through a test case step-by-step before running."
        ]
      }
    ]
  }
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [showMaterialsModal, setShowMaterialsModal] = useState(false)
  const [showLockedModal, setShowLockedModal] = useState(false)
  const [selectedMaterialCategory, setSelectedMaterialCategory] = useState("System Design")
  const [copiedItem, setCopiedItem] = useState(null)

  useEffect(() => {
    if (searchParams.get('modal') === 'tips' || location.hash === '#tips') {
      setShowMaterialsModal(true)
    }
    if (searchParams.get('modal') === 'locked' || location.hash === '#locked') {
      setShowLockedModal(true)
    }
  }, [searchParams, location])

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedItem(id)
    setTimeout(() => setCopiedItem(null), 2000)
  }

  const MODULES = [
    {
      id: "01",
      title: "Resume Analysis",
      subtitle: "Instant ATS audit, quantitative bullet evaluation, and keyword optimization with Nemotron 120B.",
      icon: FileText,
      tag: "ATS & AUDIT",
      specs: ["ATS Parsing Score", "Power Verb Density", "Qualitative Gaps"],
      actionLabel: "Analyze Resume",
      route: "/resume-roast/analyze",
      color: "#76b900"
    },
    {
      id: "02",
      title: "AI Interviewer",
      subtitle: "Adaptive technical & domain evaluation engine. Generates targeted system and engineering questions.",
      icon: Bot,
      tag: "TECHNICAL SCREEN",
      specs: ["Adaptive Q&A", "Domain Architecture", "Real-Time Feedback"],
      actionLabel: "Launch Interviewer",
      route: "/mock-interview/practice?mode=technical",
      color: "#76b900"
    },
    {
      id: "03",
      title: "Communication Test",
      subtitle: "Evaluate vocal clarity, response pacing, tone inflection, and structured STAR method delivery.",
      icon: Mic,
      tag: "SPEECH & BEHAVIORAL",
      specs: ["Speech Clarity", "Pacing & Fillers", "STAR Compliance"],
      actionLabel: "Start Communication Test",
      route: "/mock-interview/practice?mode=behavioral",
      color: "#76b900"
    },
    {
      id: "04",
      title: "Coding Test",
      subtitle: "In-browser Monaco IDE environment with automated test suites, algorithm analysis, and complexity breakdown.",
      icon: Code2,
      tag: "ALGORITHMIC IDE",
      specs: ["Monaco Editor", "Automated Test Runner", "Big-O Breakdown"],
      actionLabel: "Start Coding Test",
      route: "/mock-interview/practice?mode=coding",
      color: "#76b900"
    },
    {
      id: "05",
      title: "Tips & Material",
      subtitle: "Curated engineering blueprints, system design frameworks, STAR scripts, and ATS checklists.",
      icon: BookOpen,
      tag: "KNOWLEDGE BASE",
      specs: ["System Design Blueprints", "STAR Response Library", "ATS Guidelines"],
      actionLabel: "Explore Materials",
      onClick: () => setShowMaterialsModal(true),
      color: "#76b900"
    },
    {
      id: "06",
      title: "Full Mock Interview",
      subtitle: "End-to-end multi-stage simulation combining resume verification, behavioral screening, and live technical coding.",
      icon: Award,
      tag: "LOCKED // REQUIRES TRACKS 01-04",
      specs: [
        "Track 01: Resume Analysis (Prerequisite)",
        "Track 02: AI Technical Screen (Prerequisite)",
        "Track 03: Communication Test (Prerequisite)",
        "Track 04: Algorithmic Coding (Prerequisite)"
      ],
      actionLabel: "Locked // Complete 4 Tracks",
      isLocked: true,
      onClick: () => setShowLockedModal(true),
      color: "#df6500"
    }
  ]

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-[#76b900] selection:text-black pb-16">
      {/* Background Subtle Tech Grid */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #1a1a1a 1px, transparent 1px),
            linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 xl:px-20 py-8 md:py-10">
        {/* Header Hero Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-2.5 h-2.5 bg-[#76b900]" />
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight uppercase text-white font-mono">
              xINTERVIEW
            </h1>
          </div>

          {/* Big Clean Glassmorphism Company Logos (No text, pure big icons right below platform name) */}
          <div className="mt-5 mb-7 flex flex-wrap items-center gap-3 sm:gap-4">
            {COMPANY_LOGOS.map((c) => {
              const IconComponent = c.icon
              return (
                <div
                  key={c.name}
                  title={c.name}
                  className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:border-[#76b900]/70 hover:bg-white/[0.07] hover:shadow-[0_0_30px_rgba(118,185,0,0.25)] transition-all duration-300 group cursor-default"
                >
                  <IconComponent
                    className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 shrink-0 transition-transform duration-300 group-hover:scale-115 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
                    style={{ color: c.color }}
                  />
                </div>
              )
            })}
          </div>

          {/* Platform Mission & Subtitle */}
          <div className="space-y-1.5 max-w-5xl">
            <p className="text-zinc-100 text-sm md:text-base font-mono font-semibold tracking-wide leading-relaxed">
              AI-Driven Resume Optimization and Automated Interview Platform: An Integrated Approach to Career Readiness
            </p>
            <p className="text-zinc-400 text-xs md:text-sm leading-relaxed font-mono">
              Autonomous evaluation modules powered by NVIDIA Nemotron 120B. Select a dedicated track below to analyze your credentials, benchmark communication, or execute technical assessments.
            </p>
          </div>
        </div>

        {/* 6 High-Precision Action Modules Grid - Expansive Full Width with Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {MODULES.map((m, idx) => {
            const Icon = m.icon
            const isLocked = m.isLocked

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                className={`group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl backdrop-blur-2xl transition-all duration-300 overflow-hidden ${
                  isLocked
                    ? "bg-[#100b07]/50 border border-amber-500/20 hover:border-amber-500/50 hover:bg-[#150d09]/70 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)]"
                    : "bg-[#0b0b0e]/60 border border-white/[0.08] hover:border-[#76b900]/60 hover:bg-white/[0.05] shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] hover:shadow-[0_8px_32px_0_rgba(118,185,0,0.12)]"
                }`}
              >
                {/* Top Glass Specular Line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                {/* Decorative Corner Accent */}
                <div
                  className={`absolute top-0 right-0 w-3 h-3 transition-colors duration-200 ${
                    isLocked
                      ? "bg-amber-500/30 group-hover:bg-amber-500"
                      : "bg-white/10 group-hover:bg-[#76b900]"
                  }`}
                />

                <div>
                  {/* Card Header: Module index & Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`font-mono text-xs font-bold tracking-widest ${
                        isLocked ? "text-amber-500" : "text-[#76b900]"
                      }`}
                    >
                      MODULE // {m.id}
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 backdrop-blur-md ${
                        isLocked
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-white/[0.04] text-zinc-300 border-white/[0.08]"
                      }`}
                    >
                      {isLocked && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                      {m.tag}
                    </span>
                  </div>

                  {/* Icon and Title */}
                  <div className="flex items-center gap-3.5 mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-200 relative backdrop-blur-md ${
                        isLocked
                          ? "bg-[#18120b] border-amber-500/40 text-amber-400"
                          : "bg-white/[0.04] border-white/[0.08] group-hover:border-[#76b900]/60 text-[#76b900] group-hover:scale-105"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {isLocked && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 text-black flex items-center justify-center rounded-full">
                          <Lock className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <h2
                      className={`text-xl font-bold uppercase tracking-tight transition-colors ${
                        isLocked
                          ? "text-zinc-200 group-hover:text-amber-400"
                          : "text-white group-hover:text-[#76b900]"
                      }`}
                    >
                      {m.title}
                    </h2>
                  </div>

                  {/* Subtitle / Description */}
                  <p className="text-zinc-400 text-sm leading-relaxed mb-5">
                    {m.subtitle}
                  </p>

                  {/* Specs List */}
                  <div className="space-y-1.5 mb-6 pt-4 border-t border-white/[0.06]">
                    {m.specs.map((spec, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isLocked ? "bg-amber-500" : "bg-[#76b900]"
                          }`}
                        />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  {isLocked ? (
                    <button
                      onClick={m.onClick}
                      className="w-full flex items-center justify-between py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 font-bold uppercase text-xs tracking-wider border border-amber-500/30 hover:border-amber-500/70 transition-all duration-200 cursor-pointer rounded-xl backdrop-blur-md"
                    >
                      <span className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked // Complete Tracks 01-04</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-amber-500" />
                    </button>
                  ) : m.route ? (
                    <button
                      onClick={() => navigate(m.route)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/[0.04] backdrop-blur-md group-hover:bg-[#76b900] text-zinc-200 group-hover:text-black font-bold uppercase text-xs tracking-wider border border-white/[0.08] group-hover:border-[#76b900] transition-all duration-200 cursor-pointer rounded-xl"
                    >
                      <span>{m.actionLabel}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  ) : (
                    <button
                      onClick={m.onClick}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/[0.04] backdrop-blur-md group-hover:bg-[#76b900] text-zinc-200 group-hover:text-black font-bold uppercase text-xs tracking-wider border border-white/[0.08] group-hover:border-[#76b900] transition-all duration-200 cursor-pointer rounded-xl"
                    >
                      <span>{m.actionLabel}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Footer Technical Metadata Banner with Glassmorphism */}
        <div className="mt-12 p-5 bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-zinc-400 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-[#76b900]" />
            <span>NVIDIA NIM ARCHITECTURE // xInterview PLATFORM // MODEL: NVIDIA/NEMOTRON-3-SUPER-120B-A12B</span>
          </div>
          <div className="flex items-center gap-6">
            <span>MONGODB: 127.0.0.1:27017 [ACTIVE]</span>
            <span>REDIS: 127.0.0.1:6379 [ACTIVE]</span>
            <span className="text-[#76b900] font-bold">READY</span>
          </div>
        </div>
      </div>

      {/* Materials Modal (Option 5: Tips & Material) */}
      <AnimatePresence>
        {showMaterialsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl max-h-[85vh] bg-[#0b0b0e]/90 backdrop-blur-2xl border border-white/[0.12] flex flex-col rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.9)]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-[#222222] flex items-center justify-between bg-[#111111]">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-[#76b900]" />
                  <h3 className="text-lg font-bold uppercase tracking-wider text-white font-mono">
                    TIPS & PREPARATION MATERIAL // NVIDIA BENCHMARK
                  </h3>
                </div>
                <button
                  onClick={() => setShowMaterialsModal(false)}
                  className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Tabs */}
              <div className="flex overflow-x-auto border-b border-[#222222] bg-[#080808] px-4">
                {TIPS_AND_MATERIALS.map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => setSelectedMaterialCategory(cat.category)}
                    className={`px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                      selectedMaterialCategory === cat.category
                        ? "border-[#76b900] text-[#76b900] bg-[#141414]"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {cat.category}
                  </button>
                ))}
              </div>

              {/* Material Content List */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#0d0d0d]">
                {TIPS_AND_MATERIALS.find(
                  (c) => c.category === selectedMaterialCategory
                )?.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-[#141414] border border-[#262626] rounded-[2px]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                        <span className="text-[#76b900] font-mono text-xs">0{idx + 1}.</span>
                        {item.title}
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-[#1c1c1c] text-[#76b900] border border-[#333333]">
                        {item.badge}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 mb-4">{item.desc}</p>

                    <div className="space-y-2 bg-[#0a0a0a] p-3.5 border border-[#222222]">
                      {item.points.map((pt, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#76b900] shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() =>
                          handleCopy(
                            `${item.title}\n\n${item.points.join("\n")}`,
                            `${selectedMaterialCategory}-${idx}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-[#1f1f1f] hover:bg-[#2a2a2a] text-zinc-200 border border-[#333333] transition-colors cursor-pointer"
                      >
                        {copiedItem === `${selectedMaterialCategory}-${idx}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#76b900]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Notes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#222222] bg-[#111111] flex justify-between items-center text-xs font-mono text-zinc-400">
                <span>PRESS ESC OR CLICK OUTSIDE TO CLOSE</span>
                <button
                  onClick={() => setShowMaterialsModal(false)}
                  className="px-4 py-2 bg-[#76b900] text-black font-bold uppercase tracking-wider text-xs hover:bg-[#86d100] transition-colors cursor-pointer rounded-[2px]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Locked Full Mock Interview Modal */}
      <AnimatePresence>
        {showLockedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-2xl bg-[#0c0a08]/90 backdrop-blur-2xl border border-amber-500/40 shadow-[0_24px_50px_rgba(0,0,0,0.95)] rounded-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#14100c]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[2px] bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                      MODULE 06 // COMPREHENSIVE BENCHMARK LOCKED
                    </h3>
                    <p className="text-[10px] font-mono text-amber-400 uppercase">
                      PREREQUISITE VERIFICATION REQUIRED
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLockedModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-white border border-[#2a2a2a] bg-[#141414] hover:border-[#76b900] transition-colors rounded-[2px] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5 bg-[#0d0d0d]">
                <div className="p-4 bg-[#141414] border border-[#262626] rounded-[2px]">
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    The <strong className="text-white">Full Mock Interview</strong> synthesizes multi-parameter telemetry across technical reasoning, vocal delivery, and live coding. Candidates must complete all 4 foundational tracks to calibrate their baseline hiring scorecard.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500" />
                    REQUIRED PREREQUISITE MODULES:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-[2px] flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs font-bold text-white uppercase">01. Resume Analysis</p>
                        <p className="text-[10px] text-zinc-400">ATS audit & bullet strength</p>
                      </div>
                      <Link
                        to="/resume-roast/analyze"
                        onClick={() => setShowLockedModal(false)}
                        className="px-3 py-1.5 bg-[#76b900] hover:bg-[#5a8d00] text-black font-mono text-[11px] font-bold uppercase rounded-[2px] transition-colors"
                      >
                        Launch
                      </Link>
                    </div>

                    <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-[2px] flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs font-bold text-white uppercase">02. AI Technical Screen</p>
                        <p className="text-[10px] text-zinc-400">Architecture & domain Q&A</p>
                      </div>
                      <Link
                        to="/mock-interview/practice?mode=technical"
                        onClick={() => setShowLockedModal(false)}
                        className="px-3 py-1.5 bg-[#76b900] hover:bg-[#5a8d00] text-black font-mono text-[11px] font-bold uppercase rounded-[2px] transition-colors"
                      >
                        Launch
                      </Link>
                    </div>

                    <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-[2px] flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs font-bold text-white uppercase">03. Communication Test</p>
                        <p className="text-[10px] text-zinc-400">STAR vocal clarity & pacing</p>
                      </div>
                      <Link
                        to="/mock-interview/practice?mode=behavioral"
                        onClick={() => setShowLockedModal(false)}
                        className="px-3 py-1.5 bg-[#76b900] hover:bg-[#5a8d00] text-black font-mono text-[11px] font-bold uppercase rounded-[2px] transition-colors"
                      >
                        Launch
                      </Link>
                    </div>

                    <div className="p-3.5 bg-[#121212] border border-[#222222] rounded-[2px] flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs font-bold text-white uppercase">04. Coding Test</p>
                        <p className="text-[10px] text-zinc-400">Monaco algorithmic IDE</p>
                      </div>
                      <Link
                        to="/mock-interview/practice?mode=coding"
                        onClick={() => setShowLockedModal(false)}
                        className="px-3 py-1.5 bg-[#76b900] hover:bg-[#5a8d00] text-black font-mono text-[11px] font-bold uppercase rounded-[2px] transition-colors"
                      >
                        Launch
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#222222] bg-[#111111] font-mono text-xs">
                <span className="text-zinc-400 text-[11px]">STATUS: 0 OF 4 PREREQUISITES COMPLETED</span>
                <button
                  onClick={() => setShowLockedModal(false)}
                  className="px-4 py-1.5 bg-[#1f1f1f] hover:bg-[#2c2c2c] text-white font-bold uppercase text-xs rounded-[2px] border border-[#333333] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
