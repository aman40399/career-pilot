import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MobileNav from "./MobileNav";
import FAB from "./FAB";
import NotificationCenter from "./NotificationCenter";
import MissingApiKeyModal from "./settings/MissingApiKeyModal";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../lib/utils";
import {
  Settings,
  LogOut,
  User,
  ChevronDown
} from "lucide-react";

export default function AppLayout({ children, className }) {
    const mainRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const handleLogout = async () => {
      await logout();
      navigate('/login');
    };

    const navItems = [
      { label: "Resume Analysis", path: "/resume-roast/analyze", active: location.pathname.includes('/resume-roast') },
      { label: "AI Interviewer", path: "/mock-interview/practice?mode=technical", active: location.search.includes('mode=technical') },
      { label: "Communication", path: "/mock-interview/practice?mode=behavioral", active: location.search.includes('mode=behavioral') },
      { label: "Coding", path: "/mock-interview/practice?mode=coding", active: location.search.includes('mode=coding') },
      { label: "Tips & Material", path: "/dashboard?modal=tips", active: location.search.includes('modal=tips') },
      { label: "Full Interview", path: "/mock-interview/practice?mode=mixed", active: location.search.includes('mode=mixed') },
    ];

    return (
        <div className={cn("min-h-screen bg-[#000000] text-white flex flex-col relative", className)}>
            {/* NVIDIA-styled fixed glassmorphism top bar */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-20 py-3 bg-[#060606]/80 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.85)]">
                <div className="flex items-center gap-6">
                    <Link to="/dashboard" className="flex items-center gap-3 group">
                        <img
                            src="/logo_dark.png"
                            alt="xInterview"
                            className="h-10 md:h-12 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
                        />
                        <div className="flex flex-col">
                            <span className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-white group-hover:text-[#76b900] transition-colors">
                                xInterview <span className="text-[#76b900]">//</span> NVIDIA
                            </span>
                            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest -mt-0.5">
                                xINTERVIEW
                            </span>
                        </div>
                    </Link>
                        
                        <div className="hidden xl:flex items-center gap-2 text-xs font-mono text-zinc-400">
                            <span className="text-zinc-700">|</span>
                            {navItems.map((item) => (
                              <Link
                                key={item.label}
                                to={item.path}
                                className={`px-2.5 py-1 uppercase rounded-[2px] transition-all ${
                                  item.active
                                    ? "text-[#76b900] bg-[#76b900]/10 border border-[#76b900]/30 font-bold"
                                    : "hover:text-white hover:bg-[#141414]"
                                }`}
                              >
                                {item.label}
                              </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#111111] border border-[#262626] text-[11px] font-mono text-[#76b900] rounded-[2px]">
                            <span className="w-1.5 h-1.5 rounded-none bg-[#76b900] animate-pulse" />
                            <span>NEMOTRON 120B ACTIVE</span>
                        </div>
                        
                        <NotificationCenter />

                        {/* User Profile / Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 px-2 py-1 bg-[#111111] hover:bg-[#181818] border border-[#262626] hover:border-[#76b900] transition-colors rounded-[2px]"
                            >
                                <div className="w-6 h-6 rounded-[2px] bg-[#76b900]/20 border border-[#76b900]/40 flex items-center justify-center text-[#76b900] font-mono text-xs font-bold">
                                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                                </div>
                                <span className="hidden md:inline font-mono text-xs text-zinc-300 max-w-[120px] truncate">
                                    {user?.displayName || "Developer"}
                                </span>
                                <ChevronDown className="w-3 h-3 text-zinc-400" />
                            </button>

                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-[#0c0c0c] border border-[#262626] shadow-[0_16px_36px_rgba(0,0,0,0.95)] rounded-[2px] p-2 z-50 font-mono text-xs">
                                    <div className="px-3 py-2 border-b border-[#1f1f1f] mb-1">
                                        <p className="font-bold text-white truncate">{user?.displayName || "Local Dev User"}</p>
                                        <p className="text-[10px] text-zinc-500 truncate">{user?.email || "dev@example.com"}</p>
                                    </div>

                                    <Link
                                        to="/profile"
                                        onClick={() => setUserMenuOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 text-zinc-300 hover:text-[#76b900] hover:bg-[#141414] rounded-[2px] transition-colors"
                                    >
                                        <User className="w-3.5 h-3.5" />
                                        <span>Profile</span>
                                    </Link>

                                    <Link
                                        to="/settings"
                                        onClick={() => setUserMenuOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 text-zinc-300 hover:text-[#76b900] hover:bg-[#141414] rounded-[2px] transition-colors"
                                    >
                                        <Settings className="w-3.5 h-3.5" />
                                        <span>Settings</span>
                                    </Link>

                                    <div className="my-1 border-t border-[#1f1f1f]" />

                                    <button
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            handleLogout();
                                        }}
                                        className="flex items-center gap-2.5 w-full px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-[2px] transition-colors text-left"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main ref={mainRef} className="flex-1 pt-[68px] md:pt-[72px] relative pb-24 md:pb-0">
                    {children}

                <FAB scrollContainerRef={mainRef} />
            </main>
            <MobileNav />
            <MissingApiKeyModal />
        </div>
    );
}