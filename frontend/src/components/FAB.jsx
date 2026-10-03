import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, Brain, Mic, Code2, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FAB({ scrollContainerRef }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  const actions = [
    {
      label: "Resume Analysis",
      icon: <FileText size={16} className="text-[#76b900]" />,
      onClick: () => navigate("/resume-roast/analyze"),
    },
    {
      label: "AI Interviewer",
      icon: <Brain size={16} className="text-[#76b900]" />,
      onClick: () => navigate("/mock-interview/practice?mode=technical"),
    },
    {
      label: "Communication Test",
      icon: <Mic size={16} className="text-[#76b900]" />,
      onClick: () => navigate("/mock-interview/practice?mode=behavioral"),
    },
    {
      label: "Coding Test",
      icon: <Code2 size={16} className="text-[#76b900]" />,
      onClick: () => navigate("/mock-interview/practice?mode=coding"),
    },
    {
      label: "Full Interview",
      icon: <Rocket size={16} className="text-[#76b900]" />,
      onClick: () => navigate("/mock-interview/practice?mode=mixed"),
    },
  ];

  useEffect(() => {
    let lastScrollY = 0;
    const mainContainer = scrollContainerRef?.current;

    const handleScroll = () => {
      const currentScrollY = (mainContainer && mainContainer.scrollTop > 0)
        ? mainContainer.scrollTop
        : (window.scrollY || document.documentElement.scrollTop || 0);

      setIsVisible(
        currentScrollY < lastScrollY || currentScrollY < 100
      );

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    mainContainer?.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      mainContainer?.removeEventListener("scroll", handleScroll);
    };
  }, [scrollContainerRef]);

  // Close menu when FAB becomes hidden
  useEffect(() => {
    if (!isVisible && isOpen) {
      setIsOpen(false);
    }
  }, [isVisible, isOpen]);

  // Escape key closes menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <motion.div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isVisible && (
          <div className="flex flex-col-reverse items-end gap-2">
            <motion.button
              type="button"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => setIsOpen(!isOpen)}
              aria-label={
                isOpen ? "Close quick actions" : "Open quick actions"
              }
              aria-expanded={isOpen}
              className="w-11 h-11 flex items-center justify-center bg-[#76b900] text-black rounded-[2px] shadow-[0_4px_16px_rgba(118,185,0,0.3)] hover:bg-[#5a8d00] transition-colors border border-[#8ce300]"
            >
              <motion.div animate={{ rotate: isOpen ? 45 : 0 }}>
                <Plus size={20} className="stroke-[2.5]" />
              </motion.div>
            </motion.button>

            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-1.5 mb-1"
                role="menu"
                aria-label="Quick actions"
              >
                {actions.map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    role="menuitem"
                    tabIndex={0}
                    aria-label={action.label}
                    onClick={() => {
                      setIsOpen(false);
                      action.onClick?.();
                    }}
                    className="flex items-center gap-2.5 px-3.5 py-2 bg-[#0e0e0e] text-white border border-[#242424] hover:border-[#76b900] rounded-[2px] shadow-xl hover:bg-[#161616] transition-all whitespace-nowrap font-mono text-xs uppercase tracking-wider"
                  >
                    {action.icon}
                    <span>
                      {action.label}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}