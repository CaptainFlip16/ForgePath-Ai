import React from "react";
import { motion } from "motion/react";
import { Compass, ShieldCheck, ArrowUpRight } from "lucide-react";

interface FooterProps {
  onStartOnboarding?: () => void;
  onOpenAuth?: () => void;
  onNavigateSection?: (sectionId: string) => void;
  onOpenHowItWorks?: () => void;
}

export function Footer({ onStartOnboarding, onOpenAuth, onNavigateSection, onOpenHowItWorks }: FooterProps) {
  const scrollToSection = (sectionId: string) => {
    if (sectionId === "how-it-works" && onOpenHowItWorks) {
      onOpenHowItWorks();
      return;
    }
    if (onNavigateSection) {
      onNavigateSection(sectionId);
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.footer 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6 }}
      className="relative z-10 w-full border-t border-[var(--border-color)] bg-[var(--bg-header)] backdrop-blur-xl text-[var(--text-main)] transition-colors duration-700"
    >
      <div className="max-w-7xl mx-auto px-6 py-16">
        
        {/* Main Footer Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-16">
          
          {/* Brand & Mission (4 Columns on LG) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 15, scale: 1.05 }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 border border-indigo-400/30 cursor-pointer"
              >
                <Compass className="w-5 h-5" />
              </motion.div>
              <span className="font-bold text-xl tracking-tight text-[var(--text-main)] flex items-center gap-2">
                ForgePath AI
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 font-bold">
                  v2.0
                </span>
              </span>
            </div>

            <p className="text-sm text-[var(--text-muted)] max-w-sm leading-relaxed">
              Adaptive developer roadmaps, real-time context-aware AI mentorship, and interactive node projects tailored directly to your engineering goals.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Firestore &amp; n8n AI Automation
              </div>
            </div>
          </div>

          {/* Navigation Column 1: Platform Features (2 Columns on LG) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--text-main)] mb-1">
              Platform Features
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs font-medium text-[var(--text-muted)]">
              <li>
                <motion.button 
                  whileHover={{ x: 3, color: "var(--color-primary)" }}
                  onClick={() => scrollToSection("how-it-works")} 
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left flex items-center gap-1 group"
                >
                  How It Works
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
                </motion.button>
              </li>
              <li>
                <motion.button 
                  whileHover={{ x: 3, color: "var(--color-primary)" }}
                  onClick={() => scrollToSection("ai-mentor")} 
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left flex items-center gap-1 group"
                >
                  AI Mentor Hub
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
                </motion.button>
              </li>
              <li>
                <motion.button 
                  whileHover={{ x: 3, color: "var(--color-primary)" }}
                  onClick={() => scrollToSection("roadmap")} 
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left flex items-center gap-1 group"
                >
                  Interactive Roadmaps
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
                </motion.button>
              </li>
              <li>
                <motion.button 
                  whileHover={{ x: 3, color: "var(--color-primary)" }}
                  onClick={() => scrollToSection("n8n-automation")} 
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left flex items-center gap-1 group"
                >
                  n8n Automation Engine
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
                </motion.button>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2: Quick Links (2 Columns on LG) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--text-main)] mb-1">
              Quick Actions
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs font-medium text-[var(--text-muted)]">
              <li>
                <motion.button 
                  whileHover={{ x: 3 }}
                  onClick={onStartOnboarding} 
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left font-semibold text-indigo-700 dark:text-indigo-300"
                >
                  Build Custom Roadmap
                </motion.button>
              </li>
              <li>
                <motion.button 
                  whileHover={{ x: 3 }}
                  onClick={onOpenAuth} 
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Sign In / Register
                </motion.button>
              </li>
              <li>
                <motion.button 
                  whileHover={{ x: 3 }}
                  onClick={() => scrollToSection("ai-mentor")} 
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Voice &amp; TTS Assistant
                </motion.button>
              </li>
              <li>
                <motion.button 
                  whileHover={{ x: 3 }}
                  onClick={() => scrollToSection("features")} 
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Full Tech Stack Grid
                </motion.button>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3: Security & Tech (3 Columns on LG) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--text-main)] mb-1">
              Architecture &amp; Cloud
            </h4>
            <motion.div 
              whileHover={{ y: -2, scale: 1.01 }}
              className="glass-panel p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex flex-col gap-2 transition-all shadow-sm"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Secure Firebase Cloud
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Persisted user milestones, custom tech roadmaps, and auth sessions protected by Firestore rules.
              </p>
            </motion.div>
          </div>

        </div>

        {/* Divider Bar */}
        <div className="w-full h-px bg-[var(--border-color)] mb-8" />

        {/* Bottom Bar */}
        <div className="flex items-center justify-center text-center text-xs text-[var(--text-muted)] font-medium">
          <span>&copy; {new Date().getFullYear()} ForgePath AI. All rights reserved.</span>
        </div>

      </div>
    </motion.footer>
  );
}
