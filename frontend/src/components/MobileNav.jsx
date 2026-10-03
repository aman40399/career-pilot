import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    FileText,
    Brain,
    Mic,
    Code2,
    BookOpen,
    Rocket,
    User,
    Menu,
    Settings,
    X,
} from "lucide-react";
import { cn } from "../lib/utils";

const defaultTabs = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Console" },
    { to: "/resume-roast/analyze", icon: FileText, label: "Resume" },
    { to: "/mock-interview/practice?mode=technical", icon: Brain, label: "Interview" },
    { to: "/mock-interview/practice?mode=behavioral", icon: Mic, label: "Comm" },
    { to: "/mock-interview/practice?mode=coding", icon: Code2, label: "Code" },
];

const secondaryLinks = [
    { to: "/dashboard?modal=tips", icon: BookOpen, label: "Tips & Material" },
    { to: "/mock-interview/practice?mode=mixed", icon: Rocket, label: "Full Interview" },
    { to: "/profile", icon: User, label: "Profile" },
    { to: "/settings", icon: Settings, label: "Settings" },
];

function MobileNavItem({ item, onClick, drawerItem = false }) {
    const Icon = item.icon;

    return (
        <NavLink
            to={item.to}
            onClick={onClick}
            className={({ isActive }) => cn(
                "flex min-h-11 min-w-11 items-center justify-center rounded-[2px] transition-all duration-150 font-mono text-[10px] uppercase",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#76b900]",
                isActive 
                    ? "bg-[#76b900]/15 text-[#76b900] border border-[#76b900]/40 font-bold" 
                    : "text-zinc-400 border border-transparent hover:bg-[#141414] hover:text-white",
                drawerItem
                    ? "flex-row justify-start gap-3 px-4 py-3 text-xs font-medium w-full bg-[#111111] border-[#222222] hover:border-[#76b900]/40 mb-1"
                    : "flex-col gap-1 px-1 leading-none"
            )}
        >
            <Icon className="h-4 w-4 shrink-0 text-[#76b900]" aria-hidden="true" />
            <span className={cn(!drawerItem && "truncate tracking-tight")}>{item.label}</span>
        </NavLink>
    );
}

export default function MobileNav({
    tabs = defaultTabs,
    menuLinks = secondaryLinks,
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (!isMenuOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") setIsMenuOpen(false);
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMenuOpen]);

    return (
        <>
            <nav
                aria-label="Mobile navigation"
                className="fixed inset-x-0 bottom-0 z-50 border-t border-[#222222] bg-[#050505]/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
            >
                <div className="grid grid-cols-[44px_1fr] items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(true)}
                        aria-label="Open menu"
                        aria-expanded={isMenuOpen}
                        className="flex h-11 w-11 items-center justify-center rounded-[2px] text-zinc-300 transition-all duration-150 border border-[#262626] bg-[#0e0e0e] hover:border-[#76b900] focus-visible:outline-none"
                    >
                        <Menu className="h-5 w-5 text-[#76b900]" aria-hidden="true" />
                    </button>

                    <div className="grid grid-cols-5 gap-1.5">
                        {tabs.slice(0, 5).map((item) => (
                            <MobileNavItem
                                key={item.to || item.label}
                                item={item}
                            />
                        ))}
                    </div>
                </div>
            </nav>

            {isMenuOpen && (
                <div className="fixed inset-0 z-[60] md:hidden">
                    <button
                        type="button"
                        aria-label="Close menu"
                        onClick={() => setIsMenuOpen(false)}
                        className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm transition-opacity"
                    />

                    <aside
                        aria-label="Secondary navigation"
                        className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto border-t border-[#262626] bg-[#0a0a0a] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl rounded-t-sm"
                    >
                        <div className="flex min-h-11 items-center justify-between border-b border-[#1c1c1c] pb-2 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#76b900]" />
                                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white">NVIDIA Console Navigation</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen(false)}
                                aria-label="Close menu"
                                className="flex h-9 w-9 items-center justify-center rounded-[2px] text-zinc-400 transition-all duration-150 border border-[#2a2a2a] bg-[#141414] hover:border-[#76b900]"
                            >
                                <X className="h-4 w-4 text-[#76b900]" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="mt-2 grid gap-1">
                            {menuLinks.map((item) => (
                                <MobileNavItem
                                    key={item.to || item.label}
                                    item={item}
                                    drawerItem
                                    onClick={() => setIsMenuOpen(false)}
                                />
                            ))}
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}