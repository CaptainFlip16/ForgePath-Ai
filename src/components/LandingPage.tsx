import React, { useState, useEffect, useRef } from "react";
import { 
  motion, 
  useInView, 
  AnimatePresence 
} from "motion/react";
import { 
  Compass, 
  ArrowRight, 
  ArrowUp,
  Workflow, 
  Mic, 
  Brain, 
  Sparkles, 
  Volume2, 
  Layers, 
  Terminal, 
  Award,
  Users,
  CheckCircle2,
  Code,
  Zap
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Footer } from "./Footer";
import simpleRoadMapImg from "../assets/images/simple_road_pin_map_1784812763624.jpg";
import chatMentorMockupImg from "../assets/images/chat_mentor_mockup_1784616949709.jpg";

interface LandingPageProps {
  user: any;
  profile: any;
  roadmap: any;
  theme: "dark" | "light";
  toggleTheme: () => void;
  setCurrentView: (view: string) => void;
  handleBuildMyPathClick: () => void;
  handleSignOut: () => void;
  setShowHowItWorksModal: (show: boolean) => void;
}

// Animated Counter component that counts up when visible in viewport (rAF optimized for smooth 60fps)
function AnimatedCounter({ value, suffix = "", prefix = "", duration = 1.6 }: { value: number; suffix?: string; prefix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });

  useEffect(() => {
    if (!isInView) return;

    let animId: number;
    let startTime: number | null = null;
    let lastValue = -1;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // Smooth easeOutCubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(value * easedProgress);

      if (currentVal !== lastValue) {
        lastValue = currentVal;
        setCount(currentVal);
      }

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isInView, value, duration]);

  return (
    <motion.span 
      ref={ref}
      animate={isInView ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
      className="inline-block transform-gpu"
    >
      {prefix}{count.toLocaleString()}{suffix}
    </motion.span>
  );
}

export function LandingPage({
  user,
  profile,
  roadmap,
  theme,
  toggleTheme,
  setCurrentView,
  handleBuildMyPathClick,
  handleSignOut,
  setShowHowItWorksModal,
}: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      if (window.scrollY > 350) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  return (
    <div className="relative z-10 flex flex-col min-h-screen overflow-x-hidden">
      
      {/* Animated Ambient Glowing Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/15 dark:bg-indigo-600/20 blur-[80px] transform-gpu will-change-transform pointer-events-none"
        />
        <motion.div
          animate={{
            x: [0, -30, 30, 0],
            y: [0, 25, -25, 0],
            scale: [1, 0.92, 1.1, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-600/15 blur-[90px] transform-gpu will-change-transform pointer-events-none"
        />
        <motion.div
          animate={{
            x: [0, 25, -25, 0],
            y: [0, -15, 30, 0],
            scale: [1, 1.08, 0.95, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-purple-500/10 dark:bg-purple-600/15 blur-[80px] transform-gpu will-change-transform pointer-events-none"
        />
      </div>

      {/* Main Top Header Navbar */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled 
            ? "bg-[var(--bg-header)]/90 backdrop-blur-xl border-b border-[var(--border-color)] shadow-md py-2.5" 
            : "bg-[var(--bg-header)]/70 backdrop-blur-md border-b border-[var(--border-color)]/60 py-3"
        }`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-3 sm:px-6 h-12 sm:h-14 gap-1.5 sm:gap-2">
          
          {/* Logo */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" 
            onClick={() => setCurrentView("home")}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <Compass className="text-white w-4 h-4 sm:w-5 sm:h-5 animate-spin-slow" />
            </div>
            <span className="font-sans font-bold text-base sm:text-lg tracking-tight text-[var(--text-main)] whitespace-nowrap">
              ForgePath AI
            </span>
          </motion.div>
          
          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a 
              className={`text-xs font-semibold cursor-pointer transition-colors relative py-1 ${
                activeSection === "home" ? "text-indigo-600 dark:text-primary" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`} 
              onClick={() => {
                setActiveSection("home");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Home Overview
              {activeSection === "home" && (
                <motion.div 
                  layoutId="active-nav-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-primary rounded-full"
                />
              )}
            </a>
            <button 
              onClick={() => setShowHowItWorksModal(true)} 
              className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <a 
              className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer" 
              href="#ai-mentor"
            >
              AI Mentor Hub
            </a>
          </div>

          {/* User & CTA actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            {user ? (
              <>
                <span className="hidden lg:inline text-xs text-[var(--text-muted)] font-medium">
                  Hey, <span className="text-[var(--text-main)] font-semibold">{profile?.fullName || user.email}</span>
                </span>
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (profile?.hasCompletedOnboarding || roadmap) {
                      setCurrentView("dashboard");
                    } else {
                      setCurrentView("onboarding_1");
                    }
                  }}
                  className="bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-[var(--text-main)] text-[11px] sm:text-xs uppercase tracking-wider font-semibold py-1.5 sm:py-2 px-2.5 sm:px-4 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  Dashboard
                </motion.button>
                <button 
                  onClick={handleSignOut}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-[11px] sm:text-xs font-semibold py-1.5 sm:py-2 px-2 sm:px-3 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setCurrentView("auth")}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-[11px] sm:text-xs font-semibold py-1.5 sm:py-2 px-2 sm:px-4 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Sign In
                </button>
                <motion.button 
                  whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBuildMyPathClick}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs uppercase tracking-wider font-bold py-1.5 sm:py-2.5 px-2.5 sm:px-5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/20 border border-indigo-400/30 whitespace-nowrap"
                >
                  Build My Path
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Content Sections */}
      <main className="flex-1 pt-24 sm:pt-28 pb-16 relative z-10">
        
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[680px]">
          
          {/* Left Column: Heading, Subtitle & Buttons */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            {/* Pill Badge */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
                <span className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 border border-indigo-400/30 shrink-0">
                  <Compass className="w-3 h-3 text-white animate-spin-slow" />
                </span>
                AI-Powered Career Engineering Platform
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--text-main)] leading-[1.12]"
            >
              Your skills are scattered.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 dark:from-primary dark:via-[#8083ff] dark:to-secondary">
                Your path doesn't have to be.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg text-[var(--text-muted)] max-w-lg leading-relaxed font-medium"
            >
              ForgePath AI leverages advanced spatial mapping to transform your complex career goals into structured, milestone-oriented skill roadmaps and production-grade portfolio projects.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mt-2">
              <motion.button 
                whileHover={{ scale: 1.03, boxShadow: "0 15px 30px -5px rgba(99, 102, 241, 0.4)" }}
                whileTap={{ scale: 0.97 }}
                onClick={handleBuildMyPathClick}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs uppercase tracking-wider font-bold py-4 px-8 rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group border border-indigo-400/30 cursor-pointer"
              >
                Build My Path
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowHowItWorksModal(true)}
                className="border border-[var(--border-color)] hover:border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] text-xs uppercase tracking-wider font-semibold py-4 px-8 rounded-xl transition-all text-center cursor-pointer shadow-sm"
              >
                Explore How It Works
              </motion.button>
            </motion.div>

            {/* Mini Trust Metrics */}
            <motion.div variants={itemVariants} className="pt-2 flex items-center gap-6 text-xs text-[var(--text-muted)] font-medium border-t border-[var(--border-color)]/50 mt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>100% Free Onboarding</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Firestore Cloud Sync</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Floating Visual Mockup Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.215, 0.61, 0.355, 1] }}
            className="relative w-full"
          >
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.02, boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.25)" }}
              className="relative w-full h-[320px] sm:h-[400px] lg:h-[460px] rounded-2xl overflow-hidden glass-panel border border-[var(--border-color)] shadow-2xl group bg-[var(--bg-surface-subtle)] transition-all duration-500"
            >
              <img 
                src={simpleRoadMapImg} 
                alt="Skill Roadmap Path" 
                className="w-full h-full object-cover object-center rounded-2xl transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-app)]/60 via-transparent to-transparent pointer-events-none" />
              
              {/* Overlay Glass Badge */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-[var(--bg-surface)]/80 backdrop-blur-md border border-[var(--border-color)] shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-main)]">Spatial Skill Mapping</h4>
                    <p className="text-[10px] text-[var(--text-muted)] font-mono">Dynamic node dependency tree</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5">
                  <Compass className="w-3 h-3 text-indigo-600 dark:text-indigo-400 animate-spin-slow" />
                  Interactive AI Path
                </span>
              </div>
            </motion.div>
          </motion.div>

        </section>

        {/* STATISTICS / NUMBERS SECTION */}
        <section className="max-w-7xl mx-auto px-6 py-16 border-t border-[var(--border-color)] my-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center"
          >
            {/* Stat 1 */}
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-panel p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)]/80 flex flex-col items-center justify-center gap-2 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-1">
                <Layers className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight font-mono">
                <AnimatedCounter value={10000} suffix="+" />
              </div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Roadmaps Synthesized</p>
            </motion.div>

            {/* Stat 2 */}
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-panel p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)]/80 flex flex-col items-center justify-center gap-2 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-1">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight font-mono">
                <AnimatedCounter value={99} suffix=".4%" />
              </div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Skill Target Match Rate</p>
            </motion.div>

            {/* Stat 3 */}
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-panel p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)]/80 flex flex-col items-center justify-center gap-2 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center mb-1">
                <Brain className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight font-mono">
                24/7
              </div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Context-Aware AI Mentor</p>
            </motion.div>

            {/* Stat 4 */}
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-panel p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)]/80 flex flex-col items-center justify-center gap-2 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center mb-1">
                <Code className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] tracking-tight font-mono">
                <AnimatedCounter value={50} suffix="+" />
              </div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Supported Tech Stacks</p>
            </motion.div>
          </motion.div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20 border-t border-[var(--border-color)] scroll-smooth">
          
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-main)] mb-3 tracking-tight">
              How It Works
            </h2>
            <p className="text-[var(--text-muted)] text-base font-medium">
              Three modular phases to continuous career mastery.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Animated Connector Line for Desktop */}
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeInOut", delay: 0.3 }}
              className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-indigo-500/40 via-emerald-500/40 to-indigo-500/40 z-0 origin-left"
            />

            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="relative z-10 flex flex-col items-center text-center gap-4 glass-panel p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-primary mb-1 shadow-indigo-500/20 shadow-md">
                1
              </div>
              <h3 className="text-lg font-bold text-[var(--text-main)]">Declare Your Destination</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-xs font-medium">
                Specify the tech stack, dream engineering role, or a complex portfolio project you intend to build.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.25 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="relative z-10 flex flex-col items-center text-center gap-4 glass-panel p-6 rounded-2xl border border-indigo-500/40 bg-[var(--bg-surface)] shadow-md hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-[var(--bg-surface-subtle)] border border-indigo-500/60 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-primary mb-1 shadow-lg shadow-indigo-500/20">
                2
              </div>
              <h3 className="text-lg font-bold text-[var(--text-main)]">Synthesize Roadmap</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-xs font-medium">
                Our AI parses prerequisites, reviews your active skills, and creates a logical, progressive step-by-step curriculum.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="relative z-10 flex flex-col items-center text-center gap-4 glass-panel p-6 rounded-2xl border border-emerald-500/40 bg-[var(--bg-surface)] shadow-md hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-[var(--bg-surface-subtle)] border border-emerald-500/60 flex items-center justify-center text-xl font-bold text-emerald-600 dark:text-secondary mb-1 shadow-lg shadow-emerald-500/20">
                3
              </div>
              <h3 className="text-lg font-bold text-[var(--text-main)]">Build Real Portfolios</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-xs font-medium">
                Unlock hands-on milestones, compile code under real-time guidance from the AI Mentor, and deploy working software.
              </p>
            </motion.div>

          </div>
        </section>

        {/* AI MENTOR SECTION */}
        <section id="ai-mentor" className="max-w-7xl mx-auto px-6 py-20 border-t border-[var(--border-color)] scroll-smooth relative">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-4">
              <Brain className="w-3.5 h-3.5 animate-pulse text-emerald-500" /> 
              Context-Aware Mentorship
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-main)] mb-4 tracking-tight">
              Meet Your ForgePath AI Mentor
            </h2>
            <p className="text-[var(--text-muted)] max-w-2xl mx-auto text-base leading-relaxed font-medium">
              Unlike generic AI chatbots, ForgePath AI Mentor stays grounded in your active learning roadmap, completed milestones, and target projects to provide personalized, real-time guidance.
            </p>
          </motion.div>

          {/* 2-column feature layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Interactive Workflow Steps */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-700 dark:text-indigo-400 font-bold flex items-center gap-2">
                <Workflow className="w-4 h-4" /> Personalized Learning Flow
              </h3>

              {/* Flow Steps List with Staggered Animations */}
              <div className="flex flex-col gap-4">
                
                {/* Flow Step 1: Question Input */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  whileHover={{ x: 6, scale: 1.01 }}
                  className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex gap-4 items-start hover:border-indigo-500/40 transition-all shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <motion.div
                      animate={{ scale: [1, 1.18, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      <Mic className="w-5 h-5" />
                    </motion.div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-[var(--text-main)]">1. Ask via Voice or Text</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-bold">Mic Enabled</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                      Speak naturally using microphone voice input or type your message. Voice is automatically transcribed into your question in real time.
                    </p>
                  </div>
                </motion.div>

                {/* Flow Step 2: Contextual Awareness */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ x: 6, scale: 1.01 }}
                  className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex gap-4 items-start hover:border-emerald-500/40 transition-all shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-[var(--text-main)]">2. Roadmap &amp; Progress Context</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold">Active Sync</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                      The mentor continuously reads your target tech stack, active study focus, and project milestones to tailor every response specifically to you.
                    </p>
                  </div>
                </motion.div>

                {/* Flow Step 3: Personalized Response */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ x: 6, scale: 1.01 }}
                  className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex gap-4 items-start hover:border-teal-500/40 transition-all shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-[var(--text-main)]">3. Tailored AI Answers</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 font-bold">Gemini Powered</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                      Receive exact code snippets, architectural explanations, and debugging strategies matched precisely to your skill level.
                    </p>
                  </div>
                </motion.div>

                {/* Flow Step 4: Text-To-Speech */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ x: 6, scale: 1.01 }}
                  className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex gap-4 items-start hover:border-purple-500/40 transition-all shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <motion.div
                      animate={{ rotate: [-6, 6, -6], scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    >
                      <Volume2 className="w-5 h-5" />
                    </motion.div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-[var(--text-main)]">4. Read Aloud (Speak Aloud)</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold">TTS Active</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                      Listen to answers read aloud with integrated speech synthesis so you can focus on coding without constantly switching tabs.
                    </p>
                  </div>
                </motion.div>

              </div>
            </div>

            {/* Right Column: Chat Mockup Image Showcase */}
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-6 flex flex-col gap-4"
            >
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative rounded-2xl overflow-hidden glass-panel border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-2xl group"
              >
                <div className="p-3 bg-[var(--bg-surface-subtle)] border-b border-[var(--border-color)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="text-[11px] font-mono text-[var(--text-muted)] ml-2 font-semibold">ForgePath AI Mentor Interface</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live Context
                    </span>
                  </div>
                </div>
                
                <div className="relative overflow-hidden bg-[#0a0d14] flex items-center justify-center p-2 sm:p-4">
                  <img 
                    src={chatMentorMockupImg} 
                    alt="ForgePath AI Mentor Interactive Interface" 
                    className="w-full h-auto max-h-[520px] object-contain rounded-xl shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Interactive Feature Pill Badges Bar */}
                <div className="p-4 bg-[var(--bg-surface-subtle)] border-t border-[var(--border-color)] grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex flex-col items-center gap-1">
                    <Mic className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                    <span className="text-[10px] font-bold text-[var(--text-main)]">Voice Input</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex flex-col items-center gap-1">
                    <Brain className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span className="text-[10px] font-bold text-[var(--text-main)]">Roadmap Context</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] col-span-2 sm:col-span-1 flex flex-col items-center gap-1">
                    <Volume2 className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                    <span className="text-[10px] font-bold text-[var(--text-main)]">Speak Aloud</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* VALUE PROPOSITION BENTO GRID */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-[var(--text-main)] mb-3 tracking-tight">
              Why Engineers Choose ForgePath
            </h2>
            <p className="text-[var(--text-muted)] text-sm font-medium">
              Eliminate tutorial hell with structured, goal-oriented progression.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Value 1 */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -8, scale: 1.015, boxShadow: "0 20px 30px -10px rgba(99, 102, 241, 0.15)" }}
              className="glass-panel p-8 rounded-2xl flex flex-col gap-4 border border-[var(--border-color)] hover:border-indigo-500/40 transition-all bg-[var(--bg-surface)] group shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)]">Know What to Study Next</h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-medium">
                Avoid direction clutter. We structure dependencies sequentially so you understand why and how skills build upon one another before investing time.
              </p>
            </motion.div>

            {/* Value 2 */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -8, scale: 1.015, boxShadow: "0 20px 30px -10px rgba(99, 102, 241, 0.15)" }}
              className="glass-panel p-8 rounded-2xl flex flex-col gap-4 border border-[var(--border-color)] hover:border-indigo-500/40 transition-all bg-[var(--bg-surface)] group shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-subtle)] flex items-center justify-center text-[var(--text-main)] border border-[var(--border-color)] group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <Workflow className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)]">Demystify Prerequisites</h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-medium">
                Gain insight into the computational structures behind every library. Explore detailed architectural requirements and dependencies.
              </p>
            </motion.div>

            {/* Value 3 */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -8, scale: 1.015, boxShadow: "0 20px 30px -10px rgba(16, 185, 129, 0.15)" }}
              className="glass-panel p-8 rounded-2xl flex flex-col gap-4 border border-[var(--border-color)] hover:border-emerald-500/40 transition-all bg-[var(--bg-surface)] group shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)]">Production-Grade Assignments</h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-medium">
                Move past simple sandbox tutorials. ForgePath structures live projects that call external APIs, connect servers, and demonstrate high technical proficiency.
              </p>
            </motion.div>

            {/* Value 4 */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -8, scale: 1.015, boxShadow: "0 20px 30px -10px rgba(20, 184, 166, 0.15)" }}
              className="glass-panel p-8 rounded-2xl flex flex-col gap-4 border border-teal-500/30 hover:border-teal-500/60 transition-all bg-[var(--bg-surface)] group shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-teal-600 dark:text-teal-400">Interactive Forge Mentor</h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-medium">
                An elite conversational study companion that understands your current curriculum node, reviews project instructions, and unblocks logic bugs 24/7.
              </p>
            </motion.div>

          </div>
        </section>

        {/* FINAL CTA BANNER */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="glass-panel rounded-3xl p-10 md:p-16 text-center flex flex-col items-center gap-6 relative overflow-hidden border border-indigo-500/30 bg-[var(--bg-surface)] shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[var(--text-main)] leading-tight">
              Stop wondering what to learn next.
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-md leading-relaxed font-medium">
              Calibrate your timeline, map your engineering background, and claim your active career progression.
            </p>
            <motion.button 
              whileHover={{ scale: 1.04, boxShadow: "0 20px 40px -10px rgba(99, 102, 241, 0.4)" }}
              whileTap={{ scale: 0.96 }}
              onClick={handleBuildMyPathClick}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs uppercase tracking-wider font-bold py-4 px-10 rounded-xl shadow-xl shadow-indigo-500/25 border border-indigo-400/30 transition-all cursor-pointer"
            >
              Build My Path
            </motion.button>
          </motion.div>
        </section>

      </main>

      {/* Landing Page Footer */}
      <Footer 
        onStartOnboarding={handleBuildMyPathClick}
        onOpenAuth={() => setCurrentView("auth")}
        onOpenHowItWorks={() => setShowHowItWorksModal(true)}
      />

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
            whileHover={{ scale: 1.1, y: -2, boxShadow: "0 15px 30px -5px rgba(99, 102, 241, 0.4)" }}
            whileTap={{ scale: 0.92 }}
            onClick={scrollToTop}
            aria-label="Scroll back to top"
            title="Scroll back to top"
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 border border-indigo-400/40 backdrop-blur-md flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 group transform-gpu"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
}
