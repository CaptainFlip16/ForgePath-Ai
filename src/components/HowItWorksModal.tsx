import React, { useEffect } from "react";
import { X, Compass, UserCheck, Sparkles, FolderGit2, Brain, CheckCircle2, ArrowRight } from "lucide-react";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted?: () => void;
}

export function HowItWorksModal({ isOpen, onClose, onGetStarted }: HowItWorksModalProps) {
  // Prevent background scrolling when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const steps = [
    {
      step: "01",
      icon: UserCheck,
      iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      title: "Account & Profile Onboarding",
      description: "Create your account and define your career goals, existing tech stack, weekly time commitment, and learning preferences."
    },
    {
      step: "02",
      icon: Sparkles,
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      title: "Personalized Roadmap Generation",
      description: "ForgePath AI processes your inputs through intelligent workflows to craft a custom, milestone-based curriculum mapped to your exact targets."
    },
    {
      step: "03",
      icon: Compass,
      iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      title: "3D Skill Universe Exploration",
      description: "Navigate your learning trajectory using our interactive 3D spatial universe canvas. Inspect node details, prerequisites, and skill dependencies."
    },
    {
      step: "04",
      icon: FolderGit2,
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      title: "Hands-on Projects & Progress Tracking",
      description: "Complete real-world portfolio projects and master skill nodes to update your overall path metrics, earned badges, and mastery levels."
    },
    {
      step: "05",
      icon: Brain,
      iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
      title: "Context-Aware AI Mentor",
      description: "Receive tailored guidance from your AI Mentor tuned to your active roadmap. Supports text input, hands-free voice recognition, and speak-aloud audio responses."
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-color)] bg-[var(--bg-header)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 border border-indigo-400/30">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 id="modal-title" className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-main)] leading-tight">
                How ForgePath AI Works
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Your AI-guided career accelerator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-hover)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs sm:text-sm">
          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-[var(--text-main)] text-xs leading-relaxed">
            ForgePath AI transforms ambiguous career ambitions into a structured, interactive 3D learning experience powered by real-time AI context and cloud sync.
          </div>

          {/* Steps Timeline */}
          <div className="space-y-4 relative">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.step} 
                  className="flex items-start gap-4 p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] transition-all hover:border-indigo-500/30"
                >
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${item.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-xs sm:text-sm text-[var(--text-main)]">
                        {item.title}
                      </h3>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] text-[var(--text-muted)] shrink-0">
                        Step {item.step}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-header)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Interactive &amp; Sync Ready</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-500/20 border border-indigo-400/30 cursor-pointer flex items-center gap-2"
          >
            Got it, explore path
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
