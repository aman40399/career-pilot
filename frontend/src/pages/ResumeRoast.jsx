import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ArrowLeft,
  Sparkles,
  Upload,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Zap,
  RotateCcw,
  FileCheck2,
  X
} from 'lucide-react';
import { useRoastStore } from '../stores/useRoastStore';
import { roastApi, uploadApi } from '../services/api';
import { useAIConfigStore } from '../stores/useAIConfigStore';
import ResumeAnalyzingAnimation from '../components/roast/ResumeAnalyzingAnimation';
import AnalysisScorecard from '../components/roast/AnalysisScorecard';
import toast from 'react-hot-toast';

const SAMPLE_RESUME = `ALEX CHEN
San Francisco, CA • alex.chen@example.com • github.com/alexchen • linkedin.com/in/alexchen

SUMMARY
Staff Backend & Distributed Systems Engineer with 6+ years of experience architecting high-throughput data infrastructure, microservices, and AI inference pipelines. Proven track record scaling systems from 10k to 250k RPS while cutting p99 latency by 45%.

TECHNICAL SKILLS
Languages: Go, Python, TypeScript, C++, SQL
Infrastructure & Cloud: Kubernetes, Docker, AWS (ECS, EKS, Lambda, S3), Terraform
Databases & Streaming: PostgreSQL, Redis, Apache Kafka, Cassandra, MongoDB
AI & Inference: NVIDIA NIM, Triton Inference Server, PyTorch, LangChain, vLLM

PROFESSIONAL EXPERIENCE
Staff Backend Engineer | CloudScale Systems | 2022 – Present
• Architected event-driven distributed streaming pipeline using Apache Kafka and Go, processing 250M daily events with zero data loss.
• Reduced p99 API response latency from 320ms to 42ms by designing compound PostgreSQL indexes and implementing Redis sliding-window caching.
• Led cross-functional team of 8 engineers migrating monolith to 14 containerized microservices on Kubernetes, reducing AWS compute expenditure by $38,000/month.
• Benchmarked and deployed NVIDIA NIM inference endpoints for automated code summarization, cutting GPU memory overhead by 34%.

Senior Software Engineer | DataGrid Technologies | 2019 – 2022
• Developed high-concurrency rate-limiting middleware serving 120,000 requests/sec with Redis cluster backing.
• Orchestrated automated CI/CD deployment workflows using GitHub Actions and ArgoCD, slashing release cycle time from 3 days to 18 minutes.
• Streamlined PostgreSQL query performance across 500GB production databases, boosting query throughput by 300%.

EDUCATION
B.S. in Computer Science | University of California, Berkeley | 2015 – 2019`;

const ROLE_SUGGESTIONS = [
  "Senior Backend Engineer",
  "AI/ML Systems Engineer",
  "Full-Stack Architect",
  "Cloud Infrastructure Engineer",
  "Data Platform Engineer"
];

export default function ResumeRoast() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [resumeText, setResumeText] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [result, setResult] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [fileName, setFileName] = useState(null);

  const setStoreResult = useRoastStore((s) => s.setResult);
  const setLoading = useRoastStore((s) => s.setLoading);
  const setError = useRoastStore((s) => s.setError);
  const isLoading = useRoastStore((s) => s.isLoading);
  const lastResult = useRoastStore((s) => s.lastResult);
  const activeProvider = useAIConfigStore((s) => s.activeProvider);

  // Always reset result on mount so navigating to this page presents a fresh, clean input screen
  useEffect(() => {
    setResult(null);
    useRoastStore.getState().clear();
  }, []);

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF document');
      return;
    }
    setUploadingPdf(true);
    setFileName(file.name);
    try {
      const res = await uploadApi.extractText(file);
      const text = res?.data?.text || res?.text;
      if (!text) throw new Error('No text extracted from document');
      setResumeText(text);
      toast.success(`Extracted ${text.length.toLocaleString()} characters from ${file.name}`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'PDF extraction failed. You can paste the text directly.');
      setFileName(null);
    } finally {
      setUploadingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const loadSample = () => {
    setResumeText(SAMPLE_RESUME);
    setJobRole('Senior Backend Engineer');
    setFileName('sample_staff_engineer_resume.txt');
    toast.success('Loaded sample engineering resume');
  };

  const submitAnalysis = async () => {
    if (!resumeText || resumeText.trim().length < 50) {
      toast.error('Please provide a resume with at least 50 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await roastApi.create({ resumeText, jobRole });
      const data = res.data || res;
      setResult(data);
      setStoreResult(data);
      toast.success(`Analysis Complete // ATS Score: ${data.overallScore}/100`);
    } catch (err) {
      console.error('Analysis error:', err);
      const msg = err?.message || 'Analysis failed — please try again';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const startOver = () => {
    setResult(null);
    setResumeText('');
    setJobRole('');
    setFileName(null);
    useRoastStore.getState().clear();
  };

  const charCount = resumeText.length;
  const wordCount = resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-[#76b900] selection:text-black py-8 md:py-10">
      {/* Background Grid */}
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

      <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 xl:px-20">
        {/* In-Place Loading Modal with Frosted Background Blur */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="loading-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-md"
              >
                <ResumeAnalyzingAnimation />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic View: Results Scorecard or Input View (which blurs during analysis) */}
        <AnimatePresence mode="wait">
          {result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnalysisScorecard
              result={result}
              jobRole={jobRole}
              onAnalyzeAnother={startOver}
            />
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`space-y-8 transition-all duration-300 ${
              isLoading ? "filter blur-[5px] opacity-40 pointer-events-none select-none" : ""
            }`}
          >
              {/* Hero Section */}
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-2.5 h-2.5 bg-[#76b900]" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#76b900]">
                    MODULE 01 // CAREER READINESS
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-mono">
                  RESUME ANALYSIS & ATS AUDIT
                </h1>
                <p className="mt-2.5 text-zinc-400 text-sm md:text-base font-mono max-w-3xl leading-relaxed">
                  Autonomous semantic evaluation calibrated against tier-1 engineering rubrics. Benchmarks Google XYZ quantified impact, systems depth, and ATS syntax parsing.
                </p>
              </div>

              {/* Main Glassmorphic Input Card */}
              <div className="relative overflow-hidden rounded-2xl bg-[#0c0c0f]/80 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
                {/* Top Specular Line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#76b900]/40 to-transparent pointer-events-none" />

                <div className="space-y-6">
                  {/* Target Role with Quick Suggestions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-[#76b900]" />
                        Target Engineering Role
                      </label>
                      <span className="text-[11px] font-mono text-zinc-500 uppercase">
                        Calibrates Keyword Rubric
                      </span>
                    </div>
                    <input
                      type="text"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      placeholder="e.g. Senior Backend Engineer, Distributed Systems"
                      className="w-full rounded-xl border border-white/[0.08] bg-black/50 px-4 py-3 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900] transition-all"
                    />

                    {/* Quick Suggestions Chips */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      <span className="text-[10px] font-mono uppercase text-zinc-500">
                        SUGGESTIONS:
                      </span>
                      {ROLE_SUGGESTIONS.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setJobRole(role)}
                          className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-[#76b900]/40 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resume Content Input */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <label className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-[#76b900]" />
                        Resume Content (Plain Text or Markdown)
                      </label>

                      <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                        <span>WORDS: {wordCount}</span>
                        <span>CHARS: {charCount.toLocaleString()} / 50,000</span>
                      </div>
                    </div>

                    <textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      rows={14}
                      placeholder="Paste your full resume text or markdown here, or upload your PDF below..."
                      className="w-full rounded-xl border border-white/[0.08] bg-black/50 p-4 font-mono text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900] transition-all resize-y leading-relaxed"
                    />
                  </div>

                  {/* File Upload Zone & Quick Sample Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="application/pdf,.pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPdf}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#76b900]/50 text-zinc-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#76b900]" />
                        <span>{uploadingPdf ? "Extracting PDF..." : "Upload PDF Resume"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={loadSample}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-zinc-400 hover:text-[#76b900] font-mono text-xs uppercase tracking-wider transition-all cursor-pointer"
                        title="Click to load a pre-formatted Senior Engineer resume for instant testing"
                      >
                        <Zap className="w-3.5 h-3.5 text-[#76b900]" />
                        <span>Load Sample</span>
                      </button>
                    </div>

                    {fileName && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#76b900]/10 border border-[#76b900]/30 text-[#76b900] font-mono text-xs">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[200px]">{fileName}</span>
                        <button
                          type="button"
                          onClick={() => { setFileName(null); setResumeText(''); }}
                          className="text-zinc-400 hover:text-white ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submit Action Button - Clean Professional Styling (No Default Glow) */}
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={submitAnalysis}
                      disabled={isLoading || !resumeText.trim()}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-[#76b900] hover:bg-[#86d100] active:scale-[0.99] disabled:bg-[#141414] disabled:text-zinc-600 disabled:border disabled:border-white/[0.05] disabled:cursor-not-allowed text-black font-mono font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer shadow-none"
                    >
                      <Cpu className="w-4 h-4" />
                      <span>Execute ATS Resume Benchmark</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
