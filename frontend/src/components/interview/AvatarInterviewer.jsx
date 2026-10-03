import { motion } from 'framer-motion';

export default function AvatarInterviewer({ isSpeaking = false, amplitude = 0 }) {
  return (
    <div className="relative w-full h-full min-h-[280px] sm:min-h-[340px] flex items-center justify-center overflow-hidden bg-[#0c0c0f] rounded-2xl border border-white/10 shadow-2xl">
      {/* Background radial glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
          isSpeaking
            ? 'opacity-60 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#76b900]/30 via-black/40 to-transparent'
            : 'opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-700/40 via-black to-transparent'
        }`}
      />

      {/* Main Interviewer Image Container with subtle breathing motion */}
      <motion.div
        animate={isSpeaking ? { scale: [1, 1.018, 1] } : { scale: 1 }}
        transition={{ duration: 1.8, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut" }}
        className="relative w-full h-full flex items-center justify-center"
      >
        <img
          src="/inteview_image.png"
          alt="AI Technical Interviewer"
          className={`w-full h-full object-cover object-top transition-all duration-300 ${
            isSpeaking ? 'brightness-110 contrast-105 scale-[1.01]' : 'brightness-95 contrast-100'
          }`}
        />

        {/* Dynamic Speaking Aura / Border Highlight */}
        {isSpeaking && (
          <div className="absolute inset-0 pointer-events-none ring-2 ring-[#76b900]/60 ring-inset shadow-[inset_0_0_30px_rgba(118,185,0,0.25)] animate-pulse" />
        )}
      </motion.div>

      {/* Google Meet Style: Bottom-Left Name & Audio Wave Badge */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 shadow-lg">
        <span className="font-mono text-xs font-bold text-white tracking-wide">
          xInterview AI // Nemotron 120B
        </span>
        {isSpeaking ? (
          <div className="flex items-center gap-0.5 ml-1">
            <span className="w-1 h-3 bg-[#76b900] animate-pulse rounded-full" />
            <span className="w-1 h-4 bg-[#76b900] animate-pulse delay-75 rounded-full" />
            <span className="w-1 h-2.5 bg-[#76b900] animate-pulse delay-150 rounded-full" />
          </div>
        ) : (
          <span className="w-2 h-2 rounded-full bg-zinc-500" />
        )}
      </div>

      {/* Google Meet Style: Top-Right Role Tag */}
      <div className="absolute top-4 right-4 z-20 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/10 flex items-center gap-1.5 font-mono text-[10px] text-zinc-300">
        <span className="w-1.5 h-1.5 rounded-full bg-[#76b900]" />
        <span>INTERVIEWER</span>
      </div>
    </div>
  );
}
