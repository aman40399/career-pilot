import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  ChevronDown,
  FileText,
  Bot,
  Mic,
  Code2,
  BookOpen,
  Award,
  ArrowRight
} from 'lucide-react'

export default function Navbar() {
  const { user } = useAuth()
  const location = useLocation()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showTracksDropdown, setShowTracksDropdown] = useState(false)

  const TRACKS = [
    {
      id: "01",
      name: "Resume Analysis",
      description: "Instant ATS audit, quantitative bullet evaluation, keyword matching.",
      path: "/resume-roast/analyze",
      icon: FileText,
      tag: "ATS & AUDIT"
    },
    {
      id: "02",
      name: "AI Interviewer",
      description: "Adaptive technical & systems architecture assessment with Nemotron 120B.",
      path: "/mock-interview/practice?mode=technical",
      icon: Bot,
      tag: "TECHNICAL SCREEN"
    },
    {
      id: "03",
      name: "Communication Test",
      description: "Evaluate speech clarity, response pacing, and STAR delivery.",
      path: "/mock-interview/practice?mode=behavioral",
      icon: Mic,
      tag: "BEHAVIORAL & STAR"
    },
    {
      id: "04",
      name: "Coding Test",
      description: "In-browser Monaco IDE environment with automated test suites.",
      path: "/mock-interview/practice?mode=coding",
      icon: Code2,
      tag: "ALGORITHMIC IDE"
    },
    {
      id: "05",
      name: "Tips & Material",
      description: "System design blueprints, STAR scripts, and ATS guidelines.",
      path: "/dashboard?modal=tips",
      icon: BookOpen,
      tag: "KNOWLEDGE BASE"
    },
    {
      id: "06",
      name: "Full Interview",
      description: "End-to-end multi-stage simulation with comprehensive scorecard.",
      path: "/mock-interview/practice?mode=mixed",
      icon: Award,
      tag: "COMPREHENSIVE"
    }
  ]

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-[#000000]/95 backdrop-blur-md border-b border-[#222222] shadow-[0_4px_24px_rgba(0,0,0,0.8)]'
          : 'bg-[#000000] border-b border-[#1c1c1c]'
      }`}
    >
      {/* Top micro status bar */}
      <div className="hidden lg:flex items-center justify-between px-6 py-1 bg-[#0a0a0a] border-b border-[#181818] text-[10px] font-mono tracking-widest text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-1.5 h-1.5 bg-[#76b900] animate-pulse" />
            NVIDIA NIM ARCHITECTURE
          </span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-400">MODEL: NEMOTRON 3 120B</span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-400">STATUS: ACCELERATED // OPTIMAL</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#76b900]">CUDA-GRADE BENCHMARKING</span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-400">v2.4.0-NV</span>
        </div>
      </div>

      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex justify-between items-center h-16">

          {/* NVIDIA-Themed Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo_dark.png"
              alt="xInterview"
              className="h-10 md:h-12 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-mono text-xs md:text-sm font-black tracking-tight text-white group-hover:text-[#76b900] transition-colors uppercase">
                xInterview <span className="text-[#76b900]">//</span> NV
              </span>
              <span className="text-[9px] font-mono text-zinc-500 tracking-wider uppercase -mt-0.5">
                ENGINEERING INTELLIGENCE
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Direct Link: Resume Analysis */}
            <Link
              to="/resume-roast/analyze"
              className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors rounded-[2px] ${
                location.pathname.includes('/resume-roast')
                  ? 'text-[#76b900] bg-[#76b900]/10 border border-[#76b900]/30'
                  : 'text-zinc-300 hover:text-white hover:bg-[#141414]'
              }`}
            >
              Resume Analysis
            </Link>

            {/* Direct Link: AI Interviewer */}
            <Link
              to="/mock-interview/practice?mode=technical"
              className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors rounded-[2px] ${
                location.search.includes('mode=technical')
                  ? 'text-[#76b900] bg-[#76b900]/10 border border-[#76b900]/30'
                  : 'text-zinc-300 hover:text-white hover:bg-[#141414]'
              }`}
            >
              AI Interviewer
            </Link>

            {/* Direct Link: Communication Test */}
            <Link
              to="/mock-interview/practice?mode=behavioral"
              className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors rounded-[2px] ${
                location.search.includes('mode=behavioral')
                  ? 'text-[#76b900] bg-[#76b900]/10 border border-[#76b900]/30'
                  : 'text-zinc-300 hover:text-white hover:bg-[#141414]'
              }`}
            >
              Communication Test
            </Link>

            {/* Direct Link: Coding Test */}
            <Link
              to="/mock-interview/practice?mode=coding"
              className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors rounded-[2px] ${
                location.search.includes('mode=coding')
                  ? 'text-[#76b900] bg-[#76b900]/10 border border-[#76b900]/30'
                  : 'text-zinc-300 hover:text-white hover:bg-[#141414]'
              }`}
            >
              Coding Test
            </Link>

            {/* Direct Link: Tips & Material */}
            <Link
              to="/dashboard?modal=tips"
              className="px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-[#141414] transition-colors rounded-[2px]"
            >
              Tips & Material
            </Link>

            {/* Direct Link: Full Interview */}
            <Link
              to="/mock-interview/practice?mode=mixed"
              className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors rounded-[2px] ${
                location.search.includes('mode=mixed')
                  ? 'text-[#76b900] bg-[#76b900]/10 border border-[#76b900]/30'
                  : 'text-zinc-300 hover:text-white hover:bg-[#141414]'
              }`}
            >
              Full Interview
            </Link>

            {/* All Modules Dropdown */}
            <div
              className="relative ml-1"
              onMouseEnter={() => setShowTracksDropdown(true)}
              onMouseLeave={() => setShowTracksDropdown(false)}
            >
              <button
                className="flex items-center gap-1 px-2.5 py-1.5 font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-[#76b900] border border-[#222222] hover:border-[#76b900]/40 bg-[#0d0d0d] transition-all rounded-[2px]"
                aria-expanded={showTracksDropdown}
              >
                <span>Tracks</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showTracksDropdown ? 'rotate-180 text-[#76b900]' : ''}`} />
              </button>

              <AnimatePresence>
                {showTracksDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-[600px] bg-[#0c0c0c] border border-[#262626] rounded-[2px] shadow-[0_16px_36px_rgba(0,0,0,0.95)] p-4 grid grid-cols-2 gap-2 z-50"
                  >
                    <div className="col-span-2 flex items-center justify-between pb-2 mb-2 border-b border-[#1f1f1f]">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#76b900]" />
                        ENGINEERING MODULES // 6 CORE TRACKS
                      </span>
                      <span className="font-mono text-[10px] text-[#76b900]">
                        NEMOTRON 120B ACCELERATED
                      </span>
                    </div>

                    {TRACKS.map(({ id, name, description, path, icon: Icon, tag }) => (
                      <Link
                        key={id}
                        to={path}
                        onClick={() => setShowTracksDropdown(false)}
                        className="group relative flex items-start gap-3 p-3 bg-[#111111] hover:bg-[#181818] border border-[#202020] hover:border-[#76b900]/60 transition-all rounded-[2px]"
                      >
                        <div className="w-8 h-8 rounded-[2px] bg-[#1a1a1a] border border-[#2a2a2a] group-hover:border-[#76b900] group-hover:bg-[#76b900]/10 flex items-center justify-center shrink-0 transition-colors">
                          <Icon className="w-4 h-4 text-[#76b900]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-mono text-xs font-bold text-white group-hover:text-[#76b900] transition-colors truncate">
                              {name}
                            </p>
                            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                              {id}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Action Section */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-[#76b900] hover:bg-[#5a8d00] text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors rounded-[2px]"
              >
                <span>Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white border border-[#262626] hover:border-zinc-500 bg-[#111111] transition-colors rounded-[2px]"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#76b900] hover:bg-[#5a8d00] text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors rounded-[2px]"
                >
                  <span>Launch Platform</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Trigger */}
          <div className="flex items-center gap-3 lg:hidden">
            <Link
              to="/dashboard"
              className="px-2.5 py-1 text-[11px] font-mono font-bold uppercase bg-[#76b900] text-black rounded-[2px]"
            >
              Console
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border border-[#2a2a2a] bg-[#111111] text-zinc-300 hover:text-white hover:border-[#76b900] transition-colors rounded-[2px]"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#76b900]" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-[#222222] bg-[#000000] overflow-hidden"
          >
            <div className="px-4 py-5 space-y-4">
              <div className="flex items-center justify-between px-2 pb-2 border-b border-[#1c1c1c]">
                <span className="font-mono text-[10px] text-[#76b900] uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#76b900]" />
                  SELECT BENCHMARK MODULE
                </span>
                <span className="font-mono text-[10px] text-zinc-400">NEMOTRON 120B</span>
              </div>

              <div className="space-y-1.5">
                {TRACKS.map(({ id, name, description, path, icon: Icon, tag }) => (
                  <Link
                    key={id}
                    to={path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 bg-[#0e0e0e] border border-[#202020] hover:border-[#76b900] rounded-[2px] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-[#141414] border border-[#282828] flex items-center justify-center text-[#76b900] rounded-[2px]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold text-white uppercase">{name}</div>
                        <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{tag}</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[#76b900]">{id}</span>
                  </Link>
                ))}
              </div>

              <div className="pt-3 border-t border-[#1c1c1c]">
                {user ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#76b900] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-[2px]"
                  >
                    <span>Open Engineering Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center py-2 bg-[#141414] border border-[#2a2a2a] text-white font-mono text-xs font-bold uppercase tracking-wider rounded-[2px]"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center py-2 bg-[#76b900] text-black font-mono text-xs font-bold uppercase tracking-wider rounded-[2px]"
                    >
                      Launch
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
