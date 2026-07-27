import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { SkillUniverse3D } from "./components/SkillUniverse3D";
import { skills, currentSkill, type Skill } from "./roadmap-data";
import { 
  Compass, 
  Search, 
  Code, 
  Cpu, 
  BookOpen, 
  Award, 
  Terminal, 
  Layers, 
  Lock, 
  Unlock, 
  Play, 
  ArrowRight, 
  ChevronRight, 
  CheckCircle2, 
  MessageSquare, 
  Settings, 
  AlertCircle, 
  X, 
  Send, 
  TrendingUp, 
  Sparkles, 
  Clock, 
  Flame, 
  FolderGit2, 
  Brain,
  HelpCircle,
  Menu,
  ChevronLeft,
  Workflow,
  Check,
  AlertTriangle,
  FileCode,
  Gauge,
  LogOut,
  User,
  Mic,
  MicOff,
  Volume2,
  Square
} from "lucide-react";
import { Roadmap, Module, ChatMessage } from "./types";
import { generateFallbackRoadmap, normalizeN8nRoadmap, formatChatMessageText } from "./utils";
import { useAuth } from "./lib/AuthContext";
import { auth, doc, getDoc } from "./lib/firebase";
import { AuthPage } from "./components/AuthPage";
import { ThemeToggle } from "./components/ThemeToggle";
import { LiveBackground } from "./components/LiveBackground";
import { Footer } from "./components/Footer";
import { HowItWorksModal } from "./components/HowItWorksModal";
import simpleRoadMapImg from "./assets/images/simple_road_pin_map_1784812763624.jpg";
import chatMentorMockupImg from "./assets/images/chat_mentor_mockup_1784616949709.jpg";
import { 
  saveOnboarding, 
  getOnboarding, 
  saveRoadmap, 
  getRoadmap, 
  saveProgress, 
  getProgress,
  deleteRoadmap,
  addProgressSnapshot,
  getProgressHistory,
  clearProgressHistory,
  type ProgressHistoryItem,
  testFirestoreConnection,
  type OnboardingData
} from "./lib/firestoreService";
import { LearningProgressChart } from "./components/LearningProgressChart";

export interface PortfolioProject {
  id: string;
  title: string;
  shortTag: string;
  category: string;
  timeEstimate: string;
  difficulty: string;
  description: string;
  problem: string;
  keyFeatures: string[];
  prerequisites: string[];
  milestones: { step: number; title: string; desc: string }[];
}

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: "weather-dashboard",
    title: "Weather Intelligence Dashboard",
    shortTag: "APIs",
    category: "APIs & Integration",
    timeEstimate: "3-5 Hours",
    difficulty: "Beginner",
    description: "Integrate external meteorological APIs to pull, format, and render dynamic weather parameters in a glassmorphic dashboard interface.",
    problem: "Users need immediate access to structured meteorological data across diverse endpoints without dealing with complex developer tools, authentications, or rate limits.",
    keyFeatures: [
      "Dynamic search query scanning",
      "Graceful connection recovery",
      "Dynamic temperature charts",
      "Glassmorphic UI overlays"
    ],
    prerequisites: [],
    milestones: [
      { step: 1, title: "Understand the target API", desc: "Acquire API keys and construct curl sequences to verify endpoints." },
      { step: 2, title: "Mockup dynamic component tree", desc: "Build clean, modular visual frames for current weather and maps." },
      { step: 3, title: "Establish Fetch network sockets", desc: "Hook state functions to digest live meteorological telemetry." },
      { step: 4, title: "Clean and format payload variables", desc: "Verify coordinates, format metrics into metric/imperial structures." },
      { step: 5, title: "Incorporate crash handlers", desc: "Handle offline alerts and missing locations gracefully." },
      { step: 6, title: "Build and deploy production artifact", desc: "Prepare responsive static builds to demonstrate output." }
    ]
  },
  {
    id: "personal-portfolio-ai",
    title: "Personal Portfolio AI",
    shortTag: "Webhooks",
    category: "Webhooks & Agents",
    timeEstimate: "4-6 Hours",
    difficulty: "Intermediate",
    description: "Build a customized agentic chat companion trained to represent your engineering credentials and experience.",
    problem: "Recruiters and collaborators need interactive access to your project history, skills, and code samples through an active AI persona rather than a static resume.",
    keyFeatures: [
      "Agent persona & system prompt tuning",
      "Context injection & RAG pipeline",
      "Interactive streaming chat UI",
      "Custom tools & action handlers"
    ],
    prerequisites: ["weather-dashboard"],
    milestones: [
      { step: 1, title: "Design agent persona and knowledge base schema", desc: "Define conversation bounds and prompt context wrappers." },
      { step: 2, title: "Set up prompt pipeline with context injection", desc: "Connect local resume and project artifacts into the system prompt." },
      { step: 3, title: "Implement webhook triggers for external chat interactions", desc: "Build event handlers to process inbound messages in real time." },
      { step: 4, title: "Build interactive portfolio chat widget UI", desc: "Create a glassmorphic floating assistant or standalone view." },
      { step: 5, title: "Add streaming response handlers and fallbacks", desc: "Handle typing indicators, streaming chunks, and error recoveries." },
      { step: 6, title: "Deploy and publish live portfolio agent", desc: "Verify end-to-end user interaction and host the application." }
    ]
  },
  {
    id: "automated-news-summarizer",
    title: "Automated News Summarizer",
    shortTag: "AI Agents",
    category: "AI Agents & RAG",
    timeEstimate: "5-8 Hours",
    difficulty: "Advanced",
    description: "Connect standard RSS pipelines to Gemini streaming models to automatically organize daily tech news summaries.",
    problem: "Developers and researchers face information overload from daily technical news feeds and need automated concise summaries categorized by relevance.",
    keyFeatures: [
      "Automated RSS ingestion",
      "Gemini streaming summaries",
      "Topic classification & tagging",
      "Daily automated digest triggers"
    ],
    prerequisites: ["personal-portfolio-ai"],
    milestones: [
      { step: 1, title: "Configure RSS feed parser & data ingestion pipeline", desc: "Fetch XML/JSON news feeds and clean HTML payloads." },
      { step: 2, title: "Integrate Gemini streaming models for article summarization", desc: "Generate bulleted key takeaways using structured AI prompts." },
      { step: 3, title: "Build automated topic categorization and tagging", desc: "Cluster articles by tech domain (AI, Web, Systems, DevOps)." },
      { step: 4, title: "Design responsive news digest UI dashboard", desc: "Present daily briefings with read times and direct source links." },
      { step: 5, title: "Add export & bookmarking features", desc: "Allow users to save key insights to local or cloud storage." },
      { step: 6, title: "Deploy automated cron/event trigger for daily updates", desc: "Schedule background refresh routines for real-time briefs." }
    ]
  }
];

export default function App() {
  const { user, profile, loading: authLoading, logOut, updateOnboardingStatus } = useAuth();

  // Global theme state with localStorage persistence
  const [theme, setTheme] = useState<"dark" | "light">(
    () => (localStorage.getItem("forgepath-theme") as "dark" | "light") || "dark"
  );

  useEffect(() => {
    localStorage.setItem("forgepath-theme", theme);
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Loading and Dynamic Skills states for Firestore sync
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [dynamicSkills, setDynamicSkills] = useState<Skill[]>(skills);

  // Navigation & User Flow State
  // "home", "onboarding_1", "onboarding_2", "onboarding_3", "onboarding_4", "loading", "dashboard", "auth"
  const [currentView, setCurrentView] = useState<string>("home");
  
  // Dashboard view selection: "my-path", "projects", "ai-mentor", "progress", "settings"
  const [activeTab, setActiveTab] = useState<string>("my-path");

  // R3F 3D skill universe states
  const [selectedSkill, setSelectedSkill] = useState<Skill>(currentSkill);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>("");

  // Onboarding input states
  const [targetCareer, setTargetCareer] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Programming Fundamentals", "HTML & CSS"]);
  const [weeklyHours, setWeeklyHours] = useState<string>("5-10 hours");
  const [methodologies, setMethodologies] = useState<string[]>(["Build projects", "Practice exercises"]);
  const [targetBuild, setTargetBuild] = useState<string>("");

  // Search input for step 2 skills
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>("");

  // Roadmap & study progression state
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState<boolean>(false);
  const [roadmapGenerationError, setRoadmapGenerationError] = useState<string | null>(null);

  // Active Project Detail focus and progress tracking
  const [completedProjects, setCompletedProjects] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("weather-dashboard");
  const [activeProjectFocus, setActiveProjectFocus] = useState<boolean>(false);

  // Chat Interface state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "model", text: "Hello! I see you're starting your custom AI path. How can I assist you with your current focus or help you write some code today?" }
  ]);
  const [userMsgText, setUserMsgText] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [chatSuggestChips] = useState<string[]>([
    "Explain APIs to me like a beginner.",
    "Give me a challenge to test my JavaScript skills.",
    "Why do I need a webhook event handler?",
    "Review my Weather Dashboard project requirements."
  ]);

  // Voice Input Speech Recognition state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>("");

  // Text-to-Speech (Voice Output) state
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState<number | null>(null);

  // How It Works Modal overlay state
  const [showHowItWorksModal, setShowHowItWorksModal] = useState<boolean>(false);

  // Firestore Progress History trajectory state
  const [progressHistory, setProgressHistory] = useState<ProgressHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Clean markdown and formatting symbols from response text before speaking
  const cleanTextForSpeech = (rawText: string): string => {
    if (!rawText) return "";
    return rawText
      .replace(/```[\s\S]*?```/g, " code block skipped. ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
      .replace(/^\s*>\s+/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const stopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgIndex(null);
  };

  const handleSpeakMessage = (index: number, rawText: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceError("Text-to-speech is not supported in this browser.");
      setTimeout(() => setVoiceError(null), 5000);
      return;
    }

    // If already speaking this message, toggle stop
    if (speakingMsgIndex === index) {
      stopSpeech();
      return;
    }

    // Cancel any current speech before starting a new one
    window.speechSynthesis.cancel();

    const textToSpeak = cleanTextForSpeech(rawText);
    if (!textToSpeak) return;

    try {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";

      utterance.onstart = () => {
        setSpeakingMsgIndex(index);
      };

      utterance.onend = () => {
        setSpeakingMsgIndex(null);
      };

      utterance.onerror = (e) => {
        console.warn("TTS speech synthesis error:", e);
        setSpeakingMsgIndex(null);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err: any) {
      console.error("Failed to start speech synthesis:", err);
      setSpeakingMsgIndex(null);
      setVoiceError("Could not start voice text-to-speech playback.");
      setTimeout(() => setVoiceError(null), 5000);
    }
  };

  // Clean up speech recognition and synthesis on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      setTimeout(() => setVoiceError(null), 5000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("Error stopping speech recognition:", e);
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      const isMobile = typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      recognition.continuous = !isMobile;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      baseTextRef.current = userMsgText;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let transcriptParts: string[] = [];
        for (let i = 0; i < event.results.length; i++) {
          const text = event.results[i][0].transcript.trim();
          if (text) {
            // Prevent duplicated phrase entries from mobile Speech API buffer repeats
            if (transcriptParts.length === 0 || transcriptParts[transcriptParts.length - 1].toLowerCase() !== text.toLowerCase()) {
              transcriptParts.push(text);
            }
          }
        }
        const fullTranscript = transcriptParts.join(" ");
        const prefix = baseTextRef.current ? baseTextRef.current.trim() + " " : "";
        setUserMsgText(prefix + fullTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setVoiceError("Microphone access was blocked. Please grant microphone permissions in your browser or open the app in a new tab.");
        } else if (event.error === "no-speech") {
          setVoiceError("No speech detected. Please speak clearly into your microphone.");
        } else if (event.error === "network") {
          setVoiceError("Network error: Chrome Web Speech API requires an active internet connection to process audio.");
        } else if (event.error !== "aborted") {
          setVoiceError(`Voice input error (${event.error}). Try opening the app in a new tab.`);
        }
        setTimeout(() => setVoiceError(null), 8000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
      setVoiceError("Could not access microphone or start speech recognition.");
      setTimeout(() => setVoiceError(null), 5000);
    }
  };

  // Loading animation state messages list
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const loadingPhrases = [
    "Understanding your desired destination...",
    "Analyzing your current background experience...",
    "Assembling dependencies and module milestones...",
    "Forging prerequisite path connectors...",
    "Designing custom portfolio project structures...",
    "Unlocking AI Mentor workspace environment..."
  ];

  // Ref for chat history scrolling
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Available standard skills for onboarding selection
  const standardSkills = [
    "Programming Fundamentals",
    "JavaScript",
    "React",
    "Python",
    "APIs",
    "Databases",
    "AI & ML",
    "Automation",
    "Git & GitHub",
    "HTML & CSS",
    "TypeScript",
    "Node.js"
  ];

  // Load all user's data from Cloud Firestore on login or refresh
  useEffect(() => {
    async function fetchUserData() {
      if (!user) {
        setRoadmap(null);
        setSelectedModule(null);
        return;
      }
      
      setDataLoading(true);
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 4000));

      try {
        await Promise.race([
          (async () => {
            try {
              await testFirestoreConnection();
            } catch (e) {}
            
            // 1. Fetch user's custom calibrated roadmap & progress from Cloud Firestore
            const dbRoadmap = await getRoadmap(user.uid);
            const dbProgress = await getProgress(user.uid);

            if (dbProgress && Array.isArray(dbProgress.completedProjects)) {
              setCompletedProjects(dbProgress.completedProjects);
            } else {
              setCompletedProjects([]);
            }

            let activeRoadmap: Roadmap | null = dbRoadmap;

            if (activeRoadmap) {
              // Merge dbProgress if available to guarantee completedSkills are synced
              if (dbProgress && Array.isArray(dbProgress.completedSkills)) {
                const mergedModules = activeRoadmap.modules.map((m) => {
                  const isMastered = dbProgress.completedSkills.some(
                    (titleOrId) => titleOrId.toLowerCase() === m.title.toLowerCase() || titleOrId === m.id
                  );
                  if (isMastered) {
                    return { ...m, status: "Mastered" as const };
                  }
                  return m;
                });

                // Ensure next locked module is marked In Progress if none is currently active
                let foundNextInProg = false;
                const syncedModules = mergedModules.map((m) => {
                  if (m.status === "Mastered") return m;
                  if (!foundNextInProg && (m.status === "In Progress" || m.status === "Locked")) {
                    foundNextInProg = true;
                    return { ...m, status: "In Progress" as const };
                  }
                  return m;
                });

                const completedCount = syncedModules.filter(m => m.status === "Mastered").length;
                const overallProgress = Math.round((completedCount / syncedModules.length) * 100);

                activeRoadmap = {
                  ...activeRoadmap,
                  overallProgress,
                  modules: syncedModules
                };
              }

              setRoadmap(activeRoadmap);
              localStorage.setItem(`forgepath_roadmap_${user.uid}`, JSON.stringify(activeRoadmap));
              const inProgressMod = activeRoadmap.modules.find((m: any) => m.status === "In Progress");
              setSelectedModule(inProgressMod || activeRoadmap.modules[0]);
            } else {
              // Sync/Migrate from localStorage if exists, or generate fallback
              const savedRoadmap = localStorage.getItem(`forgepath_roadmap_${user.uid}`);
              if (savedRoadmap) {
                try {
                  const parsed = JSON.parse(savedRoadmap);
                  setRoadmap(parsed);
                  const inProgressMod = parsed.modules.find((m: any) => m.status === "In Progress");
                  setSelectedModule(inProgressMod || parsed.modules[0]);
                  // Upload to Firestore so they have server persistence
                  await saveRoadmap(user.uid, parsed);
                  await saveProgress(user.uid, {
                    completedSkills: parsed.modules.filter((m: any) => m.status === "Mastered").map((m: any) => m.title),
                    currentSkill: inProgressMod?.title || "",
                    completionPercentage: parsed.overallProgress || 0
                  });
                } catch (e) {
                  console.error("Migration parse error", e);
                }
              } else {
                const fallback = generateFallbackRoadmap(targetCareer || "Full-Stack AI Engineer", targetBuild || "Interactive Portfolio Application", selectedSkills.length > 0 ? selectedSkills : ["Programming Fundamentals", "React"]);
                setRoadmap(fallback);
                setSelectedModule(fallback.modules[0]);
                try {
                  await saveRoadmap(user.uid, fallback);
                } catch (e) {}
              }
            }

            // 2. Fetch onboarding choices to populate inputs
            const dbOnboarding = await getOnboarding(user.uid);
            if (dbOnboarding) {
              setTargetCareer(dbOnboarding.learningGoal || "");
              setSelectedSkills(dbOnboarding.selectedSkills || []);
              setWeeklyHours(dbOnboarding.weeklyTime || "5-10 hours");
              setMethodologies(dbOnboarding.learningStyle || []);
              setTargetBuild(dbOnboarding.desiredOutcome || "");
            }

            // 3. Fetch progress history snapshots from Firestore
            setHistoryLoading(true);
            let dbHistory = await getProgressHistory(user.uid);

            if (dbHistory.length === 0 && (activeRoadmap || dbProgress)) {
              const currentMods = activeRoadmap?.modules || [];
              const masteredMods = currentMods.filter((m: any) => m.status === "Mastered");
              const totalMods = currentMods.length || 1;
              const pct = activeRoadmap?.overallProgress ?? dbProgress?.completionPercentage ?? 0;
              
              await addProgressSnapshot(user.uid, {
                completionPercentage: pct,
                completedSkillsCount: dbProgress?.completedSkills?.length || masteredMods.length,
                totalSkills: totalMods,
                completedSkills: dbProgress?.completedSkills || masteredMods.map((m: any) => m.title),
                currentSkill: dbProgress?.currentSkill || activeRoadmap?.modules.find((m: any) => m.status === "In Progress")?.title || ""
              });

              dbHistory = await getProgressHistory(user.uid);
            }

            setProgressHistory(dbHistory);
            setHistoryLoading(false);

            // 3. Determine if user has completed onboarding
            const userHasCompletedOnboarding = !!(profile?.hasCompletedOnboarding || activeRoadmap || dbOnboarding);

            if (userHasCompletedOnboarding) {
              if (!profile?.hasCompletedOnboarding) {
                await updateOnboardingStatus(true);
              }
              setCurrentView((prev) => {
                if (prev === "auth" || prev === "home" || prev.startsWith("onboarding_")) {
                  return "dashboard";
                }
                return prev;
              });
            } else {
              setCurrentView((prev) => {
                if (prev === "auth") {
                  return "onboarding_1";
                }
                return prev;
              });
            }
          })(),
          timeoutPromise
        ]);
      } catch (err) {
        console.error("Error synchronizing with Firestore database:", err);
      } finally {
        // Guarantee roadmap is present
        setRoadmap((currentRoadmap) => {
          if (!currentRoadmap) {
            const fallback = generateFallbackRoadmap(targetCareer || "Full-Stack AI Engineer", targetBuild || "Interactive Portfolio Application", selectedSkills.length > 0 ? selectedSkills : ["Programming Fundamentals", "React"]);
            setSelectedModule(fallback.modules[0]);
            return fallback;
          }
          return currentRoadmap;
        });
        setDataLoading(false);
      }
    }
    fetchUserData();
  }, [user]);

  // Handle Sign Out cleanly and transition immediately to home view
  const handleSignOut = async () => {
    setCurrentView("home");
    setActiveTab("my-path");
    setRoadmap(null);
    setSelectedModule(null);
    setCompletedProjects([]);
    setSelectedProjectId("weather-dashboard");
    setActiveProjectFocus(false);
    try {
      await logOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  // Handle navigation when completing authentication
  useEffect(() => {
    if (user && profile) {
      if (currentView === "auth" && profile.hasCompletedOnboarding) {
        setCurrentView("dashboard");
      }
    }
  }, [user, profile, currentView]);

  // Ensure unauthenticated users redirect back to home if on dashboard
  useEffect(() => {
    if (!user && !authLoading && currentView === "dashboard") {
      setCurrentView("home");
    }
  }, [user, authLoading, currentView]);

  // Synchronize AI Mentor greeting with logged-in user's name
  useEffect(() => {
    const activeUserName = profile?.fullName || user?.displayName || (user?.email ? user.email.split('@')[0] : null);
    if (activeUserName) {
      setChatMessages(prev => {
        if (prev.length > 0 && prev[0].role === 'model') {
          const newGreeting = `Hello ${activeUserName}! I see you're starting your custom AI path. How can I assist you with your current focus or help you write some code today?`;
          if (prev[0].text !== newGreeting && (prev[0].text.startsWith('Hello') || prev.length === 1)) {
            const copy = [...prev];
            copy[0] = { ...copy[0], text: newGreeting };
            return copy;
          }
        }
        return prev;
      });
    }
  }, [user, profile]);

  // Synchronize 3D Skill Universe node statuses dynamically with the active Firestore roadmap modules
  useEffect(() => {
    if (!roadmap || !roadmap.modules || roadmap.modules.length === 0) return;

    const total = roadmap.modules.length;
    const updatedSkills: Skill[] = roadmap.modules.map((m, idx) => {
      let skillStatus: any = "locked";
      let progress = 0;

      if (m.status === "Mastered") {
        skillStatus = "completed";
        progress = 100;
      } else if (m.status === "In Progress") {
        skillStatus = "current";
        progress = 0;
      } else if (idx === total - 1) {
        skillStatus = "destination";
        progress = 0;
      } else {
        skillStatus = "locked";
        progress = 0;
      }

      const t = total > 1 ? idx / (total - 1) : 0.5;
      const x = -6.0 + t * 12.0;
      const y = Math.sin(t * Math.PI) * 1.2 - 0.4;
      const z = (idx % 2 === 0 ? 0.35 : -0.45) * Math.cos(t * Math.PI);

      return {
        id: m.id,
        name: m.title,
        shortName: m.title.length > 16 ? m.title.split(" ")[0] : m.title,
        description: m.description,
        whyItMatters: m.whyItMatters,
        status: skillStatus,
        prerequisites: m.prerequisites || [],
        progress,
        position: [x, y, z] as [number, number, number],
        project: m.recommendedProject || {
          title: `${m.title} Capstone`,
          description: `Build a project demonstrating ${m.title}.`
        }
      };
    });

    setDynamicSkills(updatedSkills);

    // Keep selectedSkill in sync with current state
    setSelectedSkill((prev) => {
      if (prev) {
        const match = updatedSkills.find((s) => s.id === prev.id || s.name === prev.name);
        if (match) return match;
      }
      return updatedSkills.find((s) => s.status === "current") || updatedSkills[0];
    });
  }, [roadmap]);

  // Setup periodic intervals for loading step simulation (driven by n8n request execution)
  useEffect(() => {
    if (currentView === "loading" && !roadmapGenerationError) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < loadingPhrases.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [currentView, roadmapGenerationError]);

  // Handle CTA Click: Protected Navigation Flow
  const handleBuildMyPathClick = () => {
    if (!user) {
      setCurrentView("auth");
    } else {
      if (profile?.hasCompletedOnboarding || roadmap) {
        if (!roadmap) {
          const savedRoadmap = localStorage.getItem(`forgepath_roadmap_${user.uid}`);
          if (savedRoadmap) {
            try {
              const parsed = JSON.parse(savedRoadmap);
              setRoadmap(parsed);
              const inProgressMod = parsed.modules.find((m: any) => m.status === "In Progress");
              setSelectedModule(inProgressMod || parsed.modules[3] || parsed.modules[0]);
              setCurrentView("dashboard");
              return;
            } catch (e) {
              console.error(e);
            }
          }
          const fallbackData = generateFallbackRoadmap(profile?.fullName || "Learner", "Custom Application Portfolio", ["Programming Fundamentals"]);
          setRoadmap(fallbackData);
          const inProgressMod = fallbackData.modules.find((m) => m.status === "In Progress");
          setSelectedModule(inProgressMod || fallbackData.modules[0]);
        }
        setCurrentView("dashboard");
      } else {
        setCurrentView("onboarding_1");
      }
    }
  };

  const handleAuthSuccess = async (hasCompletedOnboardingArg: boolean) => {
    const activeUser = auth?.currentUser || user;
    if (!activeUser) {
      setCurrentView("auth");
      return;
    }

    try {
      const dbRoadmap = await getRoadmap(activeUser.uid);
      const dbProgress = await getProgress(activeUser.uid);
      const dbOnboarding = await getOnboarding(activeUser.uid);

      if (dbProgress && Array.isArray(dbProgress.completedProjects)) {
        setCompletedProjects(dbProgress.completedProjects);
      } else {
        setCompletedProjects([]);
      }

      let activeRoadmap = dbRoadmap;
      if (activeRoadmap && dbProgress && Array.isArray(dbProgress.completedSkills)) {
        const mergedModules = activeRoadmap.modules.map((m) => {
          const isMastered = dbProgress.completedSkills.some(
            (titleOrId) => titleOrId.toLowerCase() === m.title.toLowerCase() || titleOrId === m.id
          );
          if (isMastered) {
            return { ...m, status: "Mastered" as const };
          }
          return m;
        });

        let foundNextInProg = false;
        const syncedModules = mergedModules.map((m) => {
          if (m.status === "Mastered") return m;
          if (!foundNextInProg && (m.status === "In Progress" || m.status === "Locked")) {
            foundNextInProg = true;
            return { ...m, status: "In Progress" as const };
          }
          return m;
        });

        const completedCount = syncedModules.filter(m => m.status === "Mastered").length;
        const overallProgress = Math.round((completedCount / syncedModules.length) * 100);

        activeRoadmap = {
          ...activeRoadmap,
          overallProgress,
          modules: syncedModules
        };
      }

      const isCompleted = !!(
        profile?.hasCompletedOnboarding || 
        hasCompletedOnboardingArg || 
        activeRoadmap || 
        dbOnboarding
      );

      if (isCompleted) {
        if (activeRoadmap) {
          setRoadmap(activeRoadmap);
          localStorage.setItem(`forgepath_roadmap_${activeUser.uid}`, JSON.stringify(activeRoadmap));
          const inProgressMod = activeRoadmap.modules.find((m: any) => m.status === "In Progress");
          setSelectedModule(inProgressMod || activeRoadmap.modules[0]);
        }
        if (!profile?.hasCompletedOnboarding) {
          await updateOnboardingStatus(true);
        }
        setCurrentView("dashboard");
      } else {
        setCurrentView("onboarding_1");
      }
    } catch (err) {
      console.error("Error in handleAuthSuccess:", err);
      if (profile?.hasCompletedOnboarding || roadmap) {
        setCurrentView("dashboard");
      } else {
        setCurrentView("onboarding_1");
      }
    }
  };

  // Auto-scroll chat window to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // 1. Core Webhook API call: Send onboarding selections to n8n production webhook & Save to Firestore
  const handleGenerateRoadmap = async () => {
    if (!user) {
      setCurrentView("auth");
      return;
    }

    setIsGeneratingRoadmap(true);
    setRoadmapGenerationError(null);
    setCurrentView("loading");
    setLoadingStep(0);

    const goal = targetCareer || "AI Automation Developer";
    const desiredOutcome = targetBuild || "Portfolio Project";
    const learningStyle = methodologies && methodologies.length > 0 ? methodologies.join(", ") : "Build projects";

    const n8nPayload = {
      uid: user.uid,
      email: user.email || profile?.email || "",
      name: profile?.fullName || user.displayName || (user.email ? user.email.split('@')[0] : "Learner"),
      goal: goal,
      currentSkills: selectedSkills || [],
      weeklyTime: weeklyHours || "5-10 hours",
      learningStyle: learningStyle,
      desiredOutcome: desiredOutcome,
      projectGoal: desiredOutcome
    };

    let normalizedRoadmap: Roadmap | null = null;

    try {
      const webhookUrl = "https://ahmad-at-tech.app.n8n.cloud/webhook/forgepath/generate-roadmap";
      console.log("Posting onboarding payload to n8n production webhook:", webhookUrl, n8nPayload);

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(n8nPayload)
      });

      const resText = await res.text().catch(() => "");

      if (res.ok && resText && resText.trim()) {
        try {
          const responseData = JSON.parse(resText);
          console.log("Received n8n Webhook response:", responseData);
          normalizedRoadmap = normalizeN8nRoadmap(responseData, n8nPayload.goal, n8nPayload.desiredOutcome);
        } catch (jsonErr) {
          console.warn("Could not parse or normalize n8n response, using fallback roadmap generator:", jsonErr);
        }
      } else {
        console.warn(`n8n webhook returned status ${res.status} or empty response body. Utilizing fallback roadmap.`);
      }
    } catch (err: any) {
      console.warn("Error invoking n8n roadmap generation webhook, utilizing local roadmap generator:", err);
    }

    // Fallback if n8n returned empty or invalid JSON response
    if (!normalizedRoadmap) {
      console.log("Generating customized fallback roadmap for goal:", n8nPayload.goal);
      normalizedRoadmap = generateFallbackRoadmap(n8nPayload.goal, n8nPayload.desiredOutcome, n8nPayload.currentSkills);
    }

    try {
      setRoadmap(normalizedRoadmap);

      // Select initial "In Progress" module
      const activeMod = normalizedRoadmap.modules.find((m) => m.status === "In Progress") || normalizedRoadmap.modules[0];
      setSelectedModule(activeMod);

      // Persist to Firestore
      await saveOnboarding(user.uid, {
        learningGoal: n8nPayload.goal,
        selectedSkills: n8nPayload.currentSkills,
        weeklyTime: n8nPayload.weeklyTime,
        learningStyle: methodologies,
        desiredOutcome: n8nPayload.desiredOutcome
      });

      await saveRoadmap(user.uid, normalizedRoadmap);

      await saveProgress(user.uid, {
        completedSkills: normalizedRoadmap.modules.filter((m) => m.status === "Mastered").map((m) => m.title),
        currentSkill: activeMod?.title || "",
        completionPercentage: normalizedRoadmap.overallProgress
      });

      await addProgressSnapshot(user.uid, {
        completionPercentage: normalizedRoadmap.overallProgress,
        completedSkillsCount: normalizedRoadmap.modules.filter((m) => m.status === "Mastered").length,
        totalSkills: normalizedRoadmap.modules.length,
        completedSkills: normalizedRoadmap.modules.filter((m) => m.status === "Mastered").map((m) => m.title),
        currentSkill: activeMod?.title || ""
      });

      const updatedHistory = await getProgressHistory(user.uid);
      setProgressHistory(updatedHistory);

      localStorage.setItem(`forgepath_roadmap_${user.uid}`, JSON.stringify(normalizedRoadmap));
      await updateOnboardingStatus(true);

      setIsGeneratingRoadmap(false);
      setCurrentView("dashboard");
    } catch (saveErr: any) {
      console.error("Error persisting generated roadmap:", saveErr);
      // Ensure user is taken to dashboard regardless of Firestore save latency
      setIsGeneratingRoadmap(false);
      setCurrentView("dashboard");
    }
  };

  // Helper to complete a roadmap module, advance progress, and persist to Firestore
  const handleMarkModuleCompleted = async (moduleId: string) => {
    if (!roadmap || !user) return;

    const updatedModules = roadmap.modules.map((m) => {
      if (m.id === moduleId) {
        return { ...m, status: "Mastered" as const };
      }
      return m;
    });

    // Auto-advance next locked module to "In Progress"
    let unlockedNext = false;
    const finalModules = updatedModules.map((m) => {
      if (!unlockedNext && m.status === "Locked") {
        unlockedNext = true;
        return { ...m, status: "In Progress" as const };
      }
      return m;
    });

    const completedCount = finalModules.filter(m => m.status === "Mastered").length;
    const overallProgress = Math.round((completedCount / finalModules.length) * 100);

    const updatedRoadmap: Roadmap = {
      ...roadmap,
      overallProgress,
      modules: finalModules
    };

    const nextInProg = finalModules.find(m => m.status === "In Progress");

    // REQUIREMENT: Save to Firestore FIRST before updating local state
    try {
      await saveRoadmap(user.uid, updatedRoadmap);
      await saveProgress(user.uid, {
        completedSkills: finalModules.filter(m => m.status === "Mastered").map(m => m.title),
        completedProjects: completedProjects,
        currentSkill: nextInProg?.title || "Path Completed!",
        completionPercentage: overallProgress
      });

      await addProgressSnapshot(user.uid, {
        completionPercentage: overallProgress,
        completedSkillsCount: completedCount,
        totalSkills: finalModules.length,
        completedSkills: finalModules.filter(m => m.status === "Mastered").map(m => m.title),
        currentSkill: nextInProg?.title || "Path Completed!"
      });

      const updatedHistory = await getProgressHistory(user.uid);
      setProgressHistory(updatedHistory);

      // Update local state and localStorage ONLY AFTER Firestore write succeeds
      setRoadmap(updatedRoadmap);
      if (nextInProg) {
        setSelectedModule(nextInProg);
      } else {
        setSelectedModule(finalModules.find(m => m.id === moduleId) || finalModules[0]);
      }
      localStorage.setItem(`forgepath_roadmap_${user.uid}`, JSON.stringify(updatedRoadmap));

      setNotice(`Module mastered! Progress updated to ${overallProgress}%`);
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      console.error("Error setting module master state in Firestore:", err);
      setNotice("Failed to persist progress to Firestore. Please check connection.");
      setTimeout(() => setNotice(""), 4000);
    }
  };

  // Helper to mark a portfolio project as completed and unlock next projects in Firestore
  const handleMarkProjectCompleted = async (projectId: string) => {
    if (!user) {
      setNotice("Please sign in to save your project progress.");
      setTimeout(() => setNotice(""), 3000);
      return;
    }

    try {
      const currentDbProgress = await getProgress(user.uid);
      const existingCompleted = currentDbProgress?.completedProjects || completedProjects || [];

      if (existingCompleted.includes(projectId)) {
        setNotice("This project is already marked as completed.");
        setTimeout(() => setNotice(""), 2500);
        return;
      }

      const updatedCompletedProjects = Array.from(new Set([...existingCompleted, projectId]));

      const existingSkills = currentDbProgress?.completedSkills || (roadmap ? roadmap.modules.filter(m => m.status === 'Mastered').map(m => m.title) : []);
      const currentSkillName = currentDbProgress?.currentSkill || selectedModule?.title || "";
      const completionPct = currentDbProgress?.completionPercentage || (roadmap ? roadmap.overallProgress : 0);

      const projectModuleMap: Record<string, string> = {
        "weather-dashboard": "apis",
        "personal-portfolio-ai": "webhooks",
        "automated-news-summarizer": "ai_agents"
      };

      let updatedRoadmap = roadmap;
      let finalSkills = existingSkills;
      let updatedPct = completionPct;

      const targetModuleId = projectModuleMap[projectId];
      if (roadmap && targetModuleId) {
        const matchMod = roadmap.modules.find(m => 
          m.id === targetModuleId || 
          m.id.toLowerCase().includes(targetModuleId) ||
          m.title.toLowerCase().includes(targetModuleId.replace('_', ''))
        );
        if (matchMod && matchMod.status !== "Mastered") {
          const finalModules = roadmap.modules.map(m => {
            if (m.id === matchMod.id) return { ...m, status: "Mastered" as const };
            return m;
          });
          const completedCount = finalModules.filter(m => m.status === "Mastered").length;
          updatedPct = Math.round((completedCount / finalModules.length) * 100);
          updatedRoadmap = {
            ...roadmap,
            overallProgress: updatedPct,
            modules: finalModules
          };
          finalSkills = finalModules.filter(m => m.status === "Mastered").map(m => m.title);
        }
      }

      if (updatedRoadmap && updatedRoadmap !== roadmap) {
        await saveRoadmap(user.uid, updatedRoadmap);
      }

      // REQUIREMENT: Save to Firestore FIRST before updating local state
      await saveProgress(user.uid, {
        completedSkills: finalSkills,
        completedProjects: updatedCompletedProjects,
        currentSkill: currentSkillName,
        completionPercentage: updatedPct
      });

      const totalModsCount = updatedRoadmap ? updatedRoadmap.modules.length : (roadmap ? roadmap.modules.length : 1);
      await addProgressSnapshot(user.uid, {
        completionPercentage: updatedPct,
        completedSkillsCount: finalSkills.length,
        totalSkills: totalModsCount,
        completedSkills: finalSkills,
        currentSkill: currentSkillName
      });

      const freshHistory = await getProgressHistory(user.uid);
      setProgressHistory(freshHistory);

      // Update local React state ONLY AFTER Firestore write succeeds
      setCompletedProjects(updatedCompletedProjects);
      localStorage.setItem(`forgepath_completed_projects_${user.uid}`, JSON.stringify(updatedCompletedProjects));
      
      if (updatedRoadmap) {
        setRoadmap(updatedRoadmap);
        localStorage.setItem(`forgepath_roadmap_${user.uid}`, JSON.stringify(updatedRoadmap));
      }

      const nextProj = PORTFOLIO_PROJECTS.find(p => p.prerequisites.includes(projectId));
      if (nextProj) {
        setNotice(`Project completed! "${nextProj.title}" unlocked.`);
      } else {
        setNotice("Project completed! All portfolio projects mastered!");
      }
      setTimeout(() => setNotice(""), 3500);
    } catch (err) {
      console.error("Error saving project completion to Firestore:", err);
      setNotice("Failed to update project status in Firestore. Please try again.");
      setTimeout(() => setNotice(""), 4000);
    }
  };

  // 2. Core API call: Send user question and UID to n8n AI Mentor Webhook
  const handleSendChatMessage = async (textToSend?: string) => {
    const rawText = textToSend || userMsgText;
    if (!rawText.trim()) return;

    stopSpeech();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);

    const updatedMsgs = [...chatMessages, { role: "user" as const, text: rawText }];
    setChatMessages(updatedMsgs);
    setUserMsgText("");
    setIsChatLoading(true);

    const loggedInUid = user?.uid || "guest_user";

    try {
      const res = await fetch("https://ahmad-at-tech.app.n8n.cloud/webhook/forgepath/ai-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: loggedInUid,
          question: rawText
        }),
      });

      const resText = await res.text().catch(() => "");
      let rawOutput = "";

      if (res.ok && resText && resText.trim()) {
        try {
          const responseData = JSON.parse(resText);
          rawOutput = Array.isArray(responseData)
            ? (responseData[0]?.output || responseData[0]?.text || JSON.stringify(responseData[0]))
            : (responseData?.output || responseData?.text || (typeof responseData === "string" ? responseData : JSON.stringify(responseData)));
        } catch (e) {
          rawOutput = resText;
        }
      }

      if (!rawOutput) {
        throw new Error(`n8n Webhook returned status ${res.status}`);
      }

      const outputText = formatChatMessageText(rawOutput || "No response received.");

      setChatMessages((prev) => [
        ...prev,
        { role: "model", text: outputText }
      ]);
    } catch (err: any) {
      console.warn("Direct webhook fetch failed, trying proxy endpoint:", err);
      try {
        const proxyRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: loggedInUid,
            question: rawText,
            messages: updatedMsgs
          })
        });
        const proxyData = await proxyRes.json();
        const rawOutput = proxyData.output || proxyData.text || "No response received.";
        const outputText = formatChatMessageText(rawOutput);
        setChatMessages((prev) => [
          ...prev,
          { role: "model", text: outputText }
        ]);
      } catch (proxyErr) {
        setChatMessages((prev) => [
          ...prev,
          { role: "model", text: "Sorry, I encountered an issue connecting to the AI Mentor service. Please try asking again." }
        ]);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  // Onboarding flow skill toggling
  const toggleSkillSelection = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills((prev) => prev.filter((s) => s !== skill));
    } else {
      setSelectedSkills((prev) => [...prev, skill]);
    }
  };

  // Onboarding flow learning methodology toggling
  const toggleMethodologySelection = (method: string) => {
    if (methodologies.includes(method)) {
      setMethodologies((prev) => prev.filter((m) => m !== method));
    } else {
      setMethodologies((prev) => [...prev, method]);
    }
  };

  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [isResettingPath, setIsResettingPath] = useState<boolean>(false);

  // Save updated onboarding and roadmap calibration preferences to Firestore
  const handleSaveSettings = async () => {
    const currentGoal = (roadmap?.pathName || targetCareer || "").trim();
    if (!currentGoal) {
      setNotice("Target stack & goal cannot be empty.");
      setTimeout(() => setNotice(""), 3000);
      return;
    }

    if (!weeklyHours) {
      setNotice("Please select a time commitment.");
      setTimeout(() => setNotice(""), 3000);
      return;
    }

    if (!user) {
      setNotice("You must be logged in to save settings.");
      setTimeout(() => setNotice(""), 3000);
      return;
    }

    setIsSavingSettings(true);
    try {
      // 1. Prepare updated roadmap if existing
      let updatedRoadmap = roadmap;
      if (updatedRoadmap) {
        updatedRoadmap = {
          ...updatedRoadmap,
          pathName: currentGoal
        };
      }

      // 2. Read existing onboarding data to preserve skills, learning styles, outcome
      const existingDbOnboarding = await getOnboarding(user.uid);
      const updatedOnboarding: OnboardingData = {
        learningGoal: currentGoal,
        selectedSkills: existingDbOnboarding?.selectedSkills || selectedSkills || [],
        weeklyTime: weeklyHours,
        learningStyle: existingDbOnboarding?.learningStyle || methodologies || [],
        desiredOutcome: existingDbOnboarding?.desiredOutcome || targetBuild || "Portfolio Project"
      };

      // 3. Persist to Firestore: onboarding preferences & roadmap
      await saveOnboarding(user.uid, updatedOnboarding);

      if (updatedRoadmap) {
        await saveRoadmap(user.uid, updatedRoadmap);
        localStorage.setItem(`forgepath_roadmap_${user.uid}`, JSON.stringify(updatedRoadmap));
        setRoadmap(updatedRoadmap);
      }

      setTargetCareer(currentGoal);
      setNotice("Platform calibration settings saved successfully!");
      setTimeout(() => setNotice(""), 3500);
    } catch (err: any) {
      console.error("Error saving calibration settings to Firestore:", err);
      setNotice("Failed to save settings. Please try again.");
      setTimeout(() => setNotice(""), 4000);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Open reset confirmation modal or switch to onboarding if guest
  const handleResetAndBuildNewPath = () => {
    if (!user) {
      setCurrentView("onboarding_1");
      return;
    }
    setShowResetConfirmModal(true);
  };

  // Execute actual roadmap and progress reset across Firestore and local state
  const executeResetPath = async () => {
    if (!user) return;
    setIsResettingPath(true);

    try {
      // 1. Delete active roadmap in Firestore
      await deleteRoadmap(user.uid);

      // 2. Reset progress in Firestore so new path doesn't inherit old progress
      await saveProgress(user.uid, {
        completedSkills: [],
        completedProjects: [],
        currentSkill: "",
        completionPercentage: 0
      });
      await clearProgressHistory(user.uid);
      setProgressHistory([]);

      // 3. Update onboarding status in profile
      await updateOnboardingStatus(false);

      // 4. Reset local React states
      setRoadmap(null);
      setSelectedModule(null);
      setCompletedProjects([]);
      setTargetCareer("");
      setTargetBuild("");
      setSelectedSkills(["Programming Fundamentals", "HTML & CSS"]);
      setActiveTab("my-path");

      // 5. Clear local storage cache
      localStorage.removeItem(`forgepath_roadmap_${user.uid}`);
      localStorage.removeItem(`forgepath_completed_projects_${user.uid}`);

      // 6. Close modal & redirect user to Onboarding Step 1
      setShowResetConfirmModal(false);
      setCurrentView("onboarding_1");
      setNotice("Learning path reset successfully. Please configure your new goal!");
      setTimeout(() => setNotice(""), 4000);
    } catch (err: any) {
      console.error("Error resetting roadmap in Firestore:", err);
      setNotice("Failed to reset path. Please check your connection.");
      setTimeout(() => setNotice(""), 4000);
    } finally {
      setIsResettingPath(false);
    }
  };

  // Dynamic status tag styling helpers
  const getStatusColor = (status: 'Mastered' | 'In Progress' | 'Locked') => {
    switch (status) {
      case 'Mastered':
        return 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]';
      case 'In Progress':
        return 'bg-[#44e2cd]/10 border-[#44e2cd]/30 text-[#44e2cd]';
      case 'Locked':
        return 'bg-white/5 border-white/10 text-on-surface-variant/70';
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="bg-[var(--bg-app)] text-[var(--text-main)] min-h-screen flex flex-col items-center justify-center relative overflow-hidden antialiased">
        <LiveBackground theme={theme} />
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6 border border-indigo-400/30">
            <Compass className="text-white w-6 h-6 animate-spin-slow" />
          </div>
          <h2 className="text-lg font-bold tracking-widest text-[var(--text-main)] uppercase mb-2">ForgePath AI</h2>
          <p className="text-xs text-[var(--text-muted)] font-mono tracking-wide animate-pulse">Synchronizing Firestore credentials &amp; database state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-app)] text-[var(--text-main)] min-h-screen font-sans flex flex-col selection:bg-indigo-500/20 selection:text-indigo-300 relative overflow-x-hidden antialiased transition-colors duration-700">
      
      {/* Theme-Aware Live Background for Landing Screen, Onboarding Screens & Loading Screen */}
      {(currentView === "home" || currentView.startsWith("onboarding") || currentView === "loading") && (
        <LiveBackground theme={theme} />
      )}

      {/* VIEW: HOME (CINEMATIC LANDING SCREEN) */}
      {currentView === "home" && (
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Main Top Header */}
          <header className="fixed top-0 w-full z-50 bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border-color)] shadow-sm">
            <div className="max-w-7xl mx-auto flex justify-between items-center px-2 sm:px-6 h-16 gap-1.5 sm:gap-2">
              <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => setCurrentView("home")}>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
                  <Compass className="text-white w-4 h-4 sm:w-5 sm:h-5 animate-spin-slow" />
                </div>
                <span className="font-sans font-bold text-base sm:text-lg tracking-tight text-[var(--text-main)] whitespace-nowrap">ForgePath AI</span>
              </div>
              
              <div className="hidden md:flex items-center gap-8">
                <a className="text-xs font-semibold text-primary hover:text-[var(--text-main)] transition-colors cursor-pointer" onClick={() => setCurrentView("home")}>Home Overview</a>
                <button 
                  onClick={() => setShowHowItWorksModal(true)} 
                  className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                >
                  How It Works
                </button>
                <a className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors" href="#ai-mentor">AI Mentor Hub</a>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
                {user ? (
                  <>
                    <span className="hidden lg:inline text-xs text-[var(--text-muted)] font-medium">
                      Hey, <span className="text-[var(--text-main)] font-semibold">{profile?.fullName || user.email}</span>
                    </span>
                    <button 
                      onClick={() => {
                        if (profile?.hasCompletedOnboarding || roadmap) {
                          setCurrentView("dashboard");
                        } else {
                          setCurrentView("onboarding_1");
                        }
                      }}
                      className="bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-[var(--text-main)] text-[11px] sm:text-xs uppercase tracking-wider font-semibold py-1.5 sm:py-2 px-2.5 sm:px-4 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                    >
                      Dashboard
                    </button>
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
                    <button 
                      onClick={handleBuildMyPathClick}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs uppercase tracking-wider font-bold py-1.5 sm:py-2.5 px-2.5 sm:px-5 rounded-lg transition-all hover:scale-[1.02] cursor-pointer shadow-lg shadow-indigo-500/20 border border-indigo-400/30 whitespace-nowrap"
                    >
                      Build My Path
                    </button>
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 pt-24 pb-16">
            {/* Hero Interactive Split Column Section */}
            <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[750px]">
              <div className="flex flex-col gap-6">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[var(--text-main)] leading-[1.1]">
                  Your skills are scattered.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 dark:from-primary dark:via-[#8083ff] dark:to-secondary">
                    Your path doesn't have to be.
                  </span>
                </h1>
                <p className="text-lg text-[var(--text-muted)] max-w-lg leading-relaxed">
                  ForgePath AI leverages advanced spatial mapping to transform your complex career goals into structured, milestone-oriented skill roadmaps and production-grade portfolio projects.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <button 
                    onClick={handleBuildMyPathClick}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs uppercase tracking-wider font-bold py-4 px-8 rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group hover:translate-y-[-1px] border border-indigo-400/30 cursor-pointer"
                  >
                    Build My Path
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => setShowHowItWorksModal(true)}
                    className="border border-[var(--border-color)] hover:border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] text-xs uppercase tracking-wider font-semibold py-4 px-8 rounded-xl transition-all text-center cursor-pointer"
                  >
                    Explore How It Works
                  </button>
                </div>
              </div>

              {/* Sophisticated visual map display */}
              <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[460px] rounded-2xl overflow-hidden glass-panel border border-[var(--border-color)] shadow-2xl group ai-glow bg-[var(--bg-surface-subtle)]">
                <img 
                  src={simpleRoadMapImg} 
                  alt="Skill Roadmap Path" 
                  className="w-full h-full object-cover object-center rounded-2xl transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-app)]/60 via-transparent to-transparent pointer-events-none"></div>
              </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-24 border-t border-[var(--border-color)] scroll-smooth">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-main)] mb-3">How It Works</h2>
                <p className="text-[var(--text-muted)]">Three modular phases to continuous mastery.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Horizontal progress bar for desktop */}
                <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-indigo-500/30 via-emerald-500/30 to-indigo-500/30 z-0"></div>

                {/* Step 1 */}
                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-primary mb-2 shadow-indigo-500/20 shadow-md">
                    1
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text-main)]">Declare Your Destination</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs">
                    Specify the tech stack, dream engineering role, or a complex portfolio project you intend to build.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--bg-surface-subtle)] border border-indigo-500/50 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-primary mb-2 shadow-lg glow-hover">
                    2
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text-main)]">Synthesize Roadmap</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs">
                    Our AI parses prerequisites, reviews your active skills, and creates a logical, progressive step-by-step curriculum.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--bg-surface-subtle)] border border-emerald-500/50 flex items-center justify-center text-xl font-bold text-emerald-600 dark:text-secondary mb-2 shadow-lg ai-glow">
                    3
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text-main)]">Build Real Portfolios</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs">
                    Unlock hands-on milestones, compile code under real-time guidance from the AI Mentor, and deploy working software.
                  </p>
                </div>
              </div>
            </section>

            {/* AI Mentor Section */}
            <section id="ai-mentor" className="max-w-7xl mx-auto px-6 py-24 border-t border-[var(--border-color)] scroll-smooth relative">
              <div className="text-center mb-16">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-4">
                  <Brain className="w-3.5 h-3.5 animate-pulse" /> Context-Aware Mentorship
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-main)] mb-4 tracking-tight">
                  Meet Your ForgePath AI Mentor
                </h2>
                <p className="text-[var(--text-muted)] max-w-2xl mx-auto text-base leading-relaxed font-medium">
                  Unlike generic AI chatbots, ForgePath AI Mentor stays grounded in your active learning roadmap, completed milestones, and target projects to provide personalized, real-time guidance.
                </p>
              </div>

              {/* Main 2-column feature layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Left Column: Interactive Workflow Steps & Feature Highlights */}
                <div className="lg:col-span-6 flex flex-col gap-6">
                  
                  <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-700 dark:text-indigo-400 font-bold flex items-center gap-2">
                    <Workflow className="w-4 h-4" /> Personalized Learning Flow
                  </h3>

                  {/* Flow Steps List */}
                  <div className="flex flex-col gap-4">
                    
                    {/* Flow Step 1: Question Input (Voice or Text) */}
                    <div className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex gap-4 items-start hover:border-indigo-500/30 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Mic className="w-5 h-5" />
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
                    </div>

                    {/* Flow Step 2: Contextual Awareness */}
                    <div className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex gap-4 items-start hover:border-emerald-500/30 transition-all">
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
                    </div>

                    {/* Flow Step 3: Personalized Response */}
                    <div className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex gap-4 items-start hover:border-teal-500/30 transition-all">
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
                    </div>

                    {/* Flow Step 4: Text-To-Speech / Speak Aloud */}
                    <div className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex gap-4 items-start hover:border-purple-500/30 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Volume2 className="w-5 h-5" />
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
                    </div>

                  </div>
                </div>

                {/* Right Column: Existing Project Asset Image Showcase */}
                <div className="lg:col-span-6 flex flex-col gap-4">
                  <div className="relative rounded-2xl overflow-hidden glass-panel border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-2xl group">
                    <div className="p-3 bg-[var(--bg-surface-subtle)] border-b border-[var(--border-color)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                        <span className="text-[11px] font-mono text-[var(--text-muted)] ml-2 font-semibold">ForgePath AI Mentor Interface</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Context
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
                  </div>
                </div>

              </div>
            </section>

            {/* Value Proposition Bento Grid */}
            <section className="max-w-7xl mx-auto px-6 py-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Value 1 */}
                <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 border border-[var(--border-color)] hover:border-[var(--border-strong)] transition-all bg-[var(--bg-surface)]">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text-main)]">Know What to Study Next</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Avoid direction clutter. We structure dependencies sequentially so you understand why and how skills build upon one another before investing time.
                  </p>
                </div>

                {/* Value 2 */}
                <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 border border-[var(--border-color)] hover:border-[var(--border-strong)] transition-all bg-[var(--bg-surface)]">
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-subtle)] flex items-center justify-center text-[var(--text-main)] border border-[var(--border-color)]">
                    <Workflow className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text-main)]">Demystify Prerequisites</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Gain insight into the computational structures behind every library. Explore detailed architectural requirements and dependencies.
                  </p>
                </div>

                {/* Value 3 */}
                <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 border border-[var(--border-color)] hover:border-[var(--border-strong)] transition-all bg-[var(--bg-surface)]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text-main)]">Production-Grade Assignments</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Move past simple sandbox tutorials. ForgePath structures live projects that call external APIs, connect servers, and demonstrate high technical proficiency.
                  </p>
                </div>

                {/* Value 4 */}
                <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 border border-teal-500/30 hover:border-teal-500/50 transition-all bg-[var(--bg-surface)] ai-glow">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-500/20 animate-pulse">
                    <Brain className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400">Interactive Forge Mentor</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    An elite conversational study companion that understands your current curriculum node, reviews project instructions, and unblocks logic bugs 24/7.
                  </p>
                </div>

              </div>
            </section>

            {/* Final CTA Banner */}
            <section className="max-w-7xl mx-auto px-6 py-16">
              <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center gap-6 relative overflow-hidden border border-[var(--border-color)] bg-[var(--bg-surface)]">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--text-main)]">Stop wondering what to learn next.</h2>
                <p className="text-sm text-[var(--text-muted)] max-w-md leading-relaxed">
                  Calibrate your timeline, map your engineering background, and claim your active career progression.
                </p>
                <button 
                  onClick={handleBuildMyPathClick}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs uppercase tracking-wider font-bold py-4 px-10 rounded-xl shadow-lg shadow-indigo-500/25 border border-indigo-400/30 transition-all cursor-pointer transform hover:scale-[1.02]"
                >
                  Build My Path
                </button>
              </div>
            </section>
          </main>

          {/* Landing Page Footer */}
          <Footer 
            onStartOnboarding={handleBuildMyPathClick}
            onOpenAuth={() => setCurrentView("auth")}
            onOpenHowItWorks={() => setShowHowItWorksModal(true)}
          />
        </div>
      )}


      {/* ONBOARDING FLOW: STEP 1 (What do you want to become?) */}
      {currentView === "onboarding_1" && (
        <div className="relative z-10 flex flex-col min-h-screen bg-[var(--bg-app)]/70 backdrop-blur-sm">
          {/* Progress Header */}
          <header className="w-full flex justify-between items-center px-6 md:px-12 h-20 border-b border-[var(--border-color)] bg-[var(--bg-header)] backdrop-blur-md">
            <span className="font-bold text-lg text-primary tracking-tight">ForgePath AI</span>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Step 1 of 4</span>
              <div className="flex gap-1.5">
                <div className="w-6 h-1 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
                <div className="w-6 h-1 rounded-full bg-[var(--border-color)]"></div>
                <div className="w-6 h-1 rounded-full bg-[var(--border-color)]"></div>
                <div className="w-6 h-1 rounded-full bg-[var(--border-color)]"></div>
              </div>
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-3xl mx-auto w-full pb-24">
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[var(--text-main)]">
                What do you want to become?
              </h1>
              <p className="text-[var(--text-muted)] leading-relaxed max-w-xl mx-auto">
                Tell us where you want to go. We'll map the optimal dependencies and logical curriculum layers to build your path.
              </p>
            </div>

            {/* Search Input Box */}
            <div className="w-full mb-8">
              <div className="glass-panel rounded-xl transition-all duration-300 p-1.5 focus-within:border-secondary/50 focus-within:shadow-[0_0_20px_rgba(3,198,178,0.15)] border-[var(--border-color)] bg-[var(--bg-surface)]/80">
                <div className="flex items-center px-4 py-2">
                  <Brain className="text-secondary w-6 h-6 mr-3 opacity-80" />
                  <input 
                    type="text" 
                    autoFocus
                    value={targetCareer}
                    onChange={(e) => setTargetCareer(e.target.value)}
                    placeholder="e.g., AI Automation Developer, Full-Stack Engineer..."
                    className="w-full bg-transparent border-none text-[var(--text-main)] font-sans text-xl md:text-2xl focus:ring-0 placeholder:text-[var(--text-muted)]/60 placeholder:font-light py-2 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Example chips */}
            <div className="w-full text-center">
              <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-4">Popular Career Paths</p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  "AI Automation Developer",
                  "Full-Stack Developer",
                  "Data Scientist",
                  "UI/UX Designer",
                  "Mobile App Developer"
                ].map((path) => (
                  <button
                    key={path}
                    onClick={() => setTargetCareer(path)}
                    className={`px-4 py-2.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                      targetCareer === path 
                        ? "border-secondary bg-secondary/10 text-secondary shadow-[0_0_15px_rgba(3,198,178,0.15)]" 
                        : "border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    {path}
                  </button>
                ))}
              </div>
            </div>
          </main>

          {/* Fixed bottom footer */}
          <footer className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-surface-subtle)]/80 backdrop-blur-md flex justify-between items-center max-w-3xl mx-auto w-full rounded-t-xl">
            <button 
              onClick={() => setCurrentView("home")}
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] tracking-wider uppercase flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Cancel
            </button>
            <button
              onClick={() => {
                if (targetCareer.trim() === "") {
                  setTargetCareer("AI Automation Developer"); // default
                }
                setCurrentView("onboarding_2");
              }}
              className="bg-[#494bd6] hover:bg-[#8083ff] text-white py-3.5 px-8 rounded-lg font-semibold text-xs uppercase tracking-wider shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2 group cursor-pointer"
            >
              Continue Journey
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </footer>
        </div>
      )}


      {/* ONBOARDING FLOW: STEP 2 (What do you already know?) */}
      {currentView === "onboarding_2" && (
        <div className="relative z-10 flex flex-col min-h-screen bg-[var(--bg-app)]/70 backdrop-blur-sm">
          <header className="w-full flex justify-between items-center px-6 md:px-12 h-20 border-b border-[var(--border-color)] bg-[var(--bg-header)] backdrop-blur-md">
            <button 
              onClick={() => setCurrentView("onboarding_1")}
              className="w-9 h-9 rounded-full glass-panel flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Step 2 of 4</span>
              <div className="flex gap-1.5">
                <div className="w-6 h-1 rounded-full bg-[var(--border-color)]"></div>
                <div className="w-6 h-1 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
                <div className="w-6 h-1 rounded-full bg-[var(--border-color)]"></div>
                <div className="w-6 h-1 rounded-full bg-[var(--border-color)]"></div>
              </div>
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto w-full pb-24">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-[var(--text-main)]">What do you already know?</h1>
              <p className="text-[var(--text-muted)] leading-relaxed max-w-xl mx-auto">
                Declaring your current stack helps ForgePath calibrate custom prerequisites. Mark everything you've already mastered.
              </p>
            </div>

            {/* Search filter for skills */}
            <div className="w-full max-w-xl mb-8 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
              <input 
                type="text" 
                value={skillSearchQuery}
                onChange={(e) => setSkillSearchQuery(e.target.value)}
                placeholder="Search skills, languages, libraries..."
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl py-4.5 pl-12 pr-4 text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/40 transition-all shadow-lg font-sans"
              />
            </div>

            {/* Dynamic Interactive Skills Grid */}
            <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {standardSkills
                .filter(s => s.toLowerCase().includes(skillSearchQuery.toLowerCase()))
                .map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkillSelection(skill)}
                      className={`p-4 rounded-xl flex flex-col items-center justify-center gap-3 text-center transition-all duration-300 border cursor-pointer ${
                        isSelected 
                          ? "bg-primary/10 border-primary/80 shadow-[0_0_20px_rgba(99,102,241,0.15)] text-[var(--text-main)]" 
                          : "bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] text-[var(--text-main)]"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isSelected ? "bg-primary/20 text-primary" : "bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]"
                      }`}>
                        {skill === "Programming Fundamentals" && <Code className="w-5 h-5" />}
                        {skill === "JavaScript" && <Terminal className="w-5 h-5" />}
                        {skill === "React" && <Workflow className="w-5 h-5" />}
                        {skill === "Python" && <FileCode className="w-5 h-5" />}
                        {skill === "APIs" && <Cpu className="w-5 h-5" />}
                        {skill === "Databases" && <Layers className="w-5 h-5" />}
                        {skill === "AI & ML" && <Brain className="w-5 h-5" />}
                        {skill === "Automation" && <Gauge className="w-5 h-5" />}
                        {skill === "Git & GitHub" && <FolderGit2 className="w-5 h-5" />}
                        {skill === "HTML & CSS" && <Layers className="w-5 h-5" />}
                        {skill === "TypeScript" && <Code className="w-5 h-5" />}
                        {skill === "Node.js" && <Terminal className="w-5 h-5" />}
                      </div>
                      <span className="text-sm font-semibold leading-tight">{skill}</span>
                    </button>
                  );
                })}
            </div>
          </main>

          <footer className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-surface-subtle)]/80 backdrop-blur-md flex justify-between items-center max-w-4xl mx-auto w-full rounded-t-xl">
            <button 
              onClick={() => setCurrentView("onboarding_1")}
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] tracking-wider uppercase flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setCurrentView("onboarding_3")}
              className="bg-[#494bd6] hover:bg-[#8083ff] text-white py-3.5 px-8 rounded-lg font-semibold text-xs uppercase tracking-wider shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2 group cursor-pointer"
            >
              Continue Journey
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </footer>
        </div>
      )}


      {/* ONBOARDING FLOW: STEP 3 (Configure your engine) */}
      {currentView === "onboarding_3" && (
        <div className="relative z-10 flex flex-col min-h-screen bg-[var(--bg-app)]/70 backdrop-blur-sm">
          <header className="w-full flex justify-between items-center px-6 md:px-12 h-20 border-b border-[var(--border-color)] bg-[var(--bg-header)] backdrop-blur-md">
            <button 
              onClick={() => setCurrentView("onboarding_2")}
              className="w-9 h-9 rounded-full glass-panel flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Step 3 of 4</span>
              <div className="flex gap-1.5">
                <div className="w-6 h-1 rounded-full bg-[var(--border-color)]"></div>
                <div className="w-6 h-1 rounded-full bg-[var(--border-color)]"></div>
                <div className="w-6 h-1 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
                <div className="w-6 h-1 rounded-full bg-[var(--border-color)]"></div>
              </div>
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </header>

          <main className="flex-1 flex flex-col justify-center px-6 max-w-5xl mx-auto w-full pb-24">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-[var(--text-main)]">Configure your engine</h1>
              <p className="text-[var(--text-muted)] leading-relaxed max-w-xl mx-auto">
                Calibrate study schedules and your preferred instructional format so the AI Mentor communicates on your wavelength.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-11 gap-12 items-start">
              {/* Left Column: Time dedication */}
              <section className="lg:col-span-5 flex flex-col gap-4">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Clock className="text-primary w-5 h-5" />
                    Weekly Availability
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">How many study hours can you dedicate?</p>
                </div>

                <div className="flex flex-col gap-3">
                  {[
                    { label: "1-5 hours", desc: "Light exploration" },
                    { label: "5-10 hours", desc: "Steady progress" },
                    { label: "10-20 hours", desc: "Accelerated growth" },
                    { label: "20+ hours", desc: "Immersion mode" }
                  ].map((option) => {
                    const isSelected = weeklyHours === option.label;
                    return (
                      <button
                        key={option.label}
                        onClick={() => setWeeklyHours(option.label)}
                        className={`rounded-xl p-4 text-left flex items-start gap-4 transition-all duration-300 border cursor-pointer ${
                          isSelected ? "border-primary bg-primary/10" : "bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <div className="w-4.5 h-4.5 rounded-full border border-[var(--border-strong)] mt-1 flex items-center justify-center shrink-0">
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-[var(--text-main)]">{option.label}</span>
                          <span className="font-mono text-xs text-[var(--text-muted)] mt-1">{option.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Vertical border line indicator for desktop */}
              <div className="hidden lg:block lg:col-span-1 border-r border-[var(--border-color)] h-64 mx-auto"></div>

              {/* Right Column: Methodologies */}
              <section className="lg:col-span-5 flex flex-col gap-4">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Brain className="text-secondary w-5 h-5" />
                    Learning Methodology
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Which instructional formats do you prefer? (Select multiple)</p>
                </div>

                <div className="flex flex-col gap-3">
                  {[
                    { label: "Build projects", icon: <Layers className="w-4 h-4" /> },
                    { label: "Practice exercises", icon: <FileCode className="w-4 h-4" /> },
                    { label: "Watch video tutorials", icon: <Play className="w-4 h-4" /> },
                    { label: "Read documentation", icon: <BookOpen className="w-4 h-4" /> },
                    { label: "Learn through explanations", icon: <Brain className="w-4 h-4" /> }
                  ].map((option) => {
                    const isSelected = methodologies.includes(option.label);
                    return (
                      <button
                        key={option.label}
                        onClick={() => toggleMethodologySelection(option.label)}
                        className={`rounded-xl p-4 text-left flex items-center gap-4 transition-all duration-300 border cursor-pointer ${
                          isSelected ? "border-secondary bg-secondary/10" : "bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected ? "text-secondary" : "text-[var(--text-muted)]"
                        }`}>
                          {option.icon}
                        </div>
                        <span className="text-sm font-semibold text-[var(--text-main)] flex-1">{option.label}</span>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          isSelected ? "border-secondary bg-secondary/20 text-secondary" : "border-[var(--border-color)]"
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </main>

          <footer className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-surface-subtle)]/80 backdrop-blur-md flex justify-between items-center max-w-5xl mx-auto w-full rounded-t-xl">
            <button 
              onClick={() => setCurrentView("onboarding_2")}
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] tracking-wider uppercase flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setCurrentView("onboarding_4")}
              className="bg-[#494bd6] hover:bg-[#8083ff] text-white py-3.5 px-8 rounded-lg font-semibold text-xs uppercase tracking-wider shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2 group cursor-pointer"
            >
              Continue Journey
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </footer>
        </div>
      )}


      {/* ONBOARDING FLOW: STEP 4 (What do you want to build?) */}
      {currentView === "onboarding_4" && (
        <div className="relative z-10 flex flex-col min-h-screen bg-[var(--bg-app)]/70 backdrop-blur-sm">
          <header className="w-full flex justify-between items-center px-6 md:px-12 h-20 border-b border-[var(--border-color)] bg-[var(--bg-header)] backdrop-blur-md">
            <button 
              onClick={() => setCurrentView("onboarding_3")}
              className="w-9 h-9 rounded-full glass-panel flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Step 4 of 4</span>
              <div className="flex gap-1.5">
                <div className="w-6 h-1 rounded-full bg-[var(--border-color)]"></div>
                <div className="w-6 h-1 rounded-full bg-[var(--border-color)]"></div>
                <div className="w-6 h-1 rounded-full bg-[var(--border-color)]"></div>
                <div className="w-6 h-1 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
              </div>
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto w-full pb-24">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-[var(--text-main)]">What do you want to build?</h1>
              <p className="text-[var(--text-muted)] leading-relaxed max-w-xl mx-auto">
                Educational roadmaps achieve maximum persistence when paired with a target product output. Select your desired outcome.
              </p>
            </div>

            {/* Main project target choice buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-8">
              {[
                { label: "Build my first portfolio project", desc: "Start with a manageable, standalone interface." },
                { label: "Become job-ready", desc: "Prepare comprehensive production systems for professional roles." },
                { label: "Start freelancing", desc: "Build client-focused tools and dynamic data pipelines." },
                { label: "Build a startup or product", desc: "Launch your high-scale software concept into the wild." }
              ].map((opt) => {
                const isSelected = targetBuild === opt.label;
                return (
                  <button
                    key={opt.label}
                    onClick={() => setTargetBuild(opt.label)}
                    className={`p-5 rounded-xl text-left transition-all duration-300 border flex justify-between items-start gap-4 cursor-pointer ${
                      isSelected 
                        ? "bg-primary/10 border-primary/80 shadow-[0_0_20px_rgba(99,102,241,0.15)]" 
                        : "bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <div>
                      <h4 className="font-semibold text-sm text-[var(--text-main)] mb-1">{opt.label}</h4>
                      <p className="text-xs text-[var(--text-muted)]">{opt.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-primary bg-primary/20 text-primary" : "border-[var(--border-color)]"
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Input box option */}
            <div className="w-full max-w-2xl flex flex-col gap-2.5">
              <label htmlFor="custom-project" className="font-mono text-[10px] text-primary uppercase tracking-wider">
                Or describe a specific app idea (Optional)
              </label>
              <div className="relative w-full">
                <input 
                  id="custom-project"
                  type="text"
                  value={targetBuild.startsWith("Custom:") ? targetBuild.replace("Custom:", "") : ""}
                  onChange={(e) => setTargetBuild("Custom:" + e.target.value)}
                  placeholder="e.g., An AI-driven search engine for medical research notes..."
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl px-4 py-4.5 text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60 font-sans focus:outline-none focus:border-secondary"
                />
              </div>
            </div>
          </main>

          <footer className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-surface-subtle)]/80 backdrop-blur-md flex justify-between items-center max-w-4xl mx-auto w-full rounded-t-xl">
            <button 
              onClick={() => setCurrentView("onboarding_3")}
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] tracking-wider uppercase flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleGenerateRoadmap}
              className="bg-primary hover:bg-[#8083ff] text-white py-3.5 px-8 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              Generate My Path
              <Sparkles className="w-4 h-4" />
            </button>
          </footer>
        </div>
      )}


      {/* VIEW: FORGING PATH LOADING SCREEN */}
      {currentView === "loading" && (
        <div className="relative z-10 flex flex-col min-h-screen bg-[var(--bg-app)]/70 backdrop-blur-sm justify-between p-6">
          <header className="w-full flex justify-between items-center pt-4 px-4 max-w-5xl mx-auto">
            <div className="flex items-center gap-2.5 opacity-85">
              <Compass className="text-primary w-6 h-6 animate-spin-slow" />
              <span className="font-sans font-bold text-base text-primary tracking-widest uppercase">ForgePath AI</span>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </header>

          <main className="flex-grow flex flex-col items-center justify-center max-w-xl mx-auto w-full">
            {!roadmapGenerationError ? (
              <>
                {/* Spinning orbital loading node */}
                <div className="relative w-36 h-36 flex items-center justify-center mb-10">
                  <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping"></div>
                  <div className="absolute inset-2 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  <div className="absolute inset-4 rounded-full border border-secondary/15 animate-reverse-spin"></div>
                  <Brain className="w-10 h-10 text-secondary animate-pulse" />
                </div>

                <div className="text-center">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-main)] mb-2 shimmer">
                    Forging your path...
                  </h1>
                  <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
                    Our n8n workflow engine is processing your goals, stack background, and time commitment to generate a custom roadmap.
                  </p>
                </div>

                {/* Loading stage card */}
                <div className="mt-10 w-full glass-panel border-[var(--border-color)] bg-[var(--bg-surface)]/90 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                  <div className="flex flex-col gap-4 text-center">
                    <span className="font-mono text-xs text-secondary tracking-wide transition-opacity duration-300">
                      {loadingPhrases[loadingStep]}
                    </span>
                    
                    {/* Horizontal progress indicators */}
                    <div className="h-1.5 w-full bg-[var(--bg-surface-subtle)] rounded-full overflow-hidden relative border border-[var(--border-color)]">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000"
                        style={{ width: `${((loadingStep + 1) / loadingPhrases.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Error State Screen with Retry Options */
              <div className="w-full glass-panel border-red-500/30 bg-red-950/20 rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">Roadmap Generation Issue</h2>
                <p className="text-xs text-red-200/80 max-w-md mx-auto mb-6 leading-relaxed bg-red-950/40 p-3 rounded-lg border border-red-500/20 font-mono">
                  {roadmapGenerationError}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                  <button
                    onClick={handleGenerateRoadmap}
                    className="flex-1 bg-primary hover:bg-[#8083ff] text-white py-3 px-5 rounded-lg font-semibold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" /> Retry Path Generation
                  </button>
                  <button
                    onClick={() => {
                      setRoadmapGenerationError(null);
                      setCurrentView("onboarding_4");
                    }}
                    className="bg-white/10 hover:bg-white/15 text-[var(--text-main)] py-3 px-4 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Back to Onboarding
                  </button>
                </div>
              </div>
            )}
          </main>

          <footer className="w-full text-center pb-8">
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
              ForgePath Core 2.4 online
            </span>
          </footer>
        </div>
      )}


      {/* VIEW: MAIN DASHBOARD & COMMAND CENTER */}
      {currentView === "dashboard" && !roadmap && (
        <div className="min-h-screen flex items-center justify-center bg-[#05070a] text-white p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <Compass className="w-8 h-8 text-indigo-400 animate-spin-slow" />
            <p className="text-sm font-mono text-slate-400">Loading learning environment...</p>
            <button
              onClick={() => {
                const fallback = generateFallbackRoadmap(targetCareer || "Full-Stack AI Engineer", targetBuild || "Interactive Portfolio Application", selectedSkills.length > 0 ? selectedSkills : ["Programming Fundamentals", "React"]);
                setRoadmap(fallback);
                setSelectedModule(fallback.modules[0]);
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              Launch Dashboard Now
            </button>
          </div>
        </div>
      )}

      {currentView === "dashboard" && roadmap && (
        <div className={`app-shell ${activeTab === "my-path" ? "" : "no-details"}`}>
          
          {/* Interactive Navigation Sidebar */}
          <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
            <div className="sidebar-top">
              <div className="brand flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 border border-indigo-400/30 shrink-0">
                  <Compass className="text-white w-4.5 h-4.5 animate-spin-slow" />
                </div>
                <div>
                  <strong className="text-white font-bold text-sm block leading-tight">ForgePath AI</strong>
                  <span className="text-[10px] text-indigo-300/80 font-mono block">Command Center</span>
                </div>
              </div>
              <button 
                className="icon-button mobile-close" 
                onClick={() => setMenuOpen(false)} 
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="nav-list">
              {[
                { id: "my-path", label: "My Path", icon: Compass },
                { id: "projects", label: "Projects", icon: FolderGit2 },
                { id: "ai-mentor", label: "AI Mentor", icon: Brain },
                { id: "progress", label: "Progress", icon: TrendingUp },
                { id: "settings", label: "Settings", icon: Settings }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`nav-item ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMenuOpen(false);
                      setActiveProjectFocus(false);
                    }}
                  >
                    <Icon size={16} aria-hidden="true" /><span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            
            <div className="flex flex-col gap-4 mt-auto">
              {user && (
                <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-hover)] flex flex-col gap-2">
                  <div className="flex items-center gap-2.5 px-0.5">
                    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {profile?.fullName?.charAt(0) || user.email?.charAt(0) || "A"}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-[10px] font-bold text-[var(--text-main)] truncate leading-tight">{profile?.fullName || user?.displayName || user?.email?.split('@')[0] || "Learner"}</p>
                      <p className="text-[8px] font-mono text-[var(--text-muted)] truncate leading-normal">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="w-full text-center font-mono text-[9px] text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 uppercase tracking-widest transition-colors py-1.5 cursor-pointer bg-red-500/10 hover:bg-red-500/20 rounded border border-red-500/20"
                  >
                    Disconnect Session
                  </button>
                </div>
              )}

              <button 
                onClick={() => setCurrentView("home")}
                className="text-center font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--text-main)] transition-colors py-2 cursor-pointer"
              >
                ← Back to Home
              </button>
            </div>
          </aside>
          
          {menuOpen && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}

          {activeTab === "my-path" ? (
            <>
              {/* Center workspace containing stats and 3D canvas */}
              <section className="workspace">
                <header className="mobile-header">
                  <div className="flex items-center gap-2.5">
                    <button className="icon-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
                    <div className="brand flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 border border-indigo-400/30 shrink-0">
                        <Compass className="text-white w-4 h-4 animate-spin-slow" />
                      </div>
                      <div>
                        <strong className="text-[var(--text-main)] font-bold text-sm block leading-tight">ForgePath AI</strong>
                        <span className="text-[10px] text-indigo-400 font-mono block">Command Center</span>
                      </div>
                    </div>
                  </div>
                  <ThemeToggle theme={theme} onToggle={toggleTheme} />
                </header>
                
                <div className="workspace-header">
                  <div>
                    <span className="section-kicker">Your adaptive roadmap</span>
                    <h1 className="text-[var(--text-main)]">Your path to becoming an <span className="text-primary">{roadmap.pathName || "AI Developer"}</span></h1>
                    <p className="text-[var(--text-muted)]">Here's what you should focus on next.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden md:block desktop-only-toggle">
                      <ThemeToggle theme={theme} onToggle={toggleTheme} />
                    </div>
                    <button 
                      className="help-button" 
                      aria-label="Open roadmap help"
                      onClick={() => setShowHowItWorksModal(true)}
                    >
                      <HelpCircle size={18} /><span>How it works</span>
                    </button>
                  </div>
                </div>

                <div className="stats-grid">
                  <article className="stat-card">
                    <span>Overall progress</span>
                    <strong className="text-[var(--text-main)]">{roadmap.overallProgress}%</strong>
                    <div className="progress-track"><span style={{ width: `${roadmap.overallProgress}%` }} /></div>
                  </article>
                  <article className="stat-card">
                    <span>Completed Nodes</span>
                    <strong className="text-[var(--text-main)]">{roadmap.modules.filter(m => m.status === "Mastered").length} of {roadmap.modules.length}</strong>
                  </article>
                  <article className="stat-card">
                    <span>Current focus</span>
                    <strong className="text-primary">{roadmap.modules.find(m => m.status === "In Progress")?.title || "APIs & Integration"}</strong>
                  </article>
                </div>

                <section className="universe-card">
                  <div className="universe-heading">
                    <div>
                      <span className="section-kicker">Skill universe</span>
                      <h2 className="text-[var(--text-main)]">Explore your learning path</h2>
                    </div>
                    <span className="live-label"><i></i>Live roadmap</span>
                  </div>
                  
                  <div className="universe-canvas">
                    <SkillUniverse3D 
                      skills={dynamicSkills} 
                      selectedId={selectedSkill.id} 
                      onSelect={(s) => {
                        setSelectedSkill(s);
                        // Dynamic sync with backend modules
                        const idMap: Record<string, string> = {
                          fundamentals: "fundamentals",
                          javascript: "js",
                          apis: "apis",
                          webhooks: "webhooks",
                          agents: "ai_agents",
                          rag: "ai_agents",
                          portfolio: "ai_agents"
                        };
                        const targetId = idMap[s.id] || s.id;
                        const matchingModule = roadmap.modules.find(m => m.id === targetId || m.id === s.id);
                        if (matchingModule) {
                          setSelectedModule(matchingModule);
                        }
                      }} 
                    />
                  </div>
                </section>
              </section>

              {/* Right Panel displaying detailed attributes and interactive launch buttons */}
              <aside className="details-panel" aria-live="polite">
                <div className="details-heading">
                  <span className="section-kicker">Selected skill</span>
                  <h2 className="text-[var(--text-main)] font-bold leading-tight">{selectedSkill.name}</h2>
                </div>
                
                <section>
                  <span className="detail-label">Why it matters</span>
                  <p>{selectedSkill.whyItMatters}</p>
                </section>

                <section>
                  <span className="detail-label">Prerequisites</span>
                  <div className="tag-list">
                    {selectedSkill.prerequisites.length ? (
                      selectedSkill.prerequisites.map((item) => <span key={item}>{item}</span>)
                    ) : (
                      <span className="text-primary border-primary/20 bg-primary/5">Start here</span>
                    )}
                  </div>
                </section>

                <section>
                  <span className="detail-label">Status</span>
                  <div className="flex gap-2">
                    {selectedSkill.status === 'completed' && (
                      <span className="status-badge flex items-center gap-1.5 text-accent border-accent/20 bg-accent/5">✓ Mastered</span>
                    )}
                    {selectedSkill.status === 'current' && (
                      <span className="status-badge flex items-center gap-1.5 text-primary border-primary/20 bg-primary/5 animate-pulse">● Active Focus</span>
                    )}
                    {selectedSkill.status === 'destination' && (
                      <span className="status-badge flex items-center gap-1.5 text-primary border-primary/20 bg-primary/5">✧ Capstone Destination</span>
                    )}
                    {selectedSkill.status === 'locked' && (
                      <span className="status-badge flex items-center gap-1.5 text-[var(--text-muted)] border-[var(--border-color)] bg-[var(--bg-hover)]">🔒 Locked</span>
                    )}
                  </div>
                </section>

                <section className="skill-progress">
                  <div className="flex justify-between items-center mb-1">
                    <span className="detail-label">Skill progress</span>
                    <strong>{selectedSkill.progress}%</strong>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: `${selectedSkill.progress}%` }} />
                  </div>
                </section>

                <article className="project-card">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5"><BookOpen size={13} />Recommended project</span>
                  <strong className="text-[var(--text-main)]">{selectedSkill.project.title}</strong>
                  <p>{selectedSkill.project.description}</p>
                </article>

                <button 
                  className="continue-button mt-auto" 
                  disabled={selectedSkill.status === 'locked'}
                  onClick={async () => {
                    if (selectedSkill.status === 'completed') {
                      setNotice(`${selectedSkill.name} review opened`);
                      window.setTimeout(() => setNotice(''), 2600);
                    } else if (selectedSkill.status === 'current') {
                      const idMap: Record<string, string> = {
                        fundamentals: "fundamentals",
                        javascript: "js",
                        apis: "apis",
                        webhooks: "webhooks",
                        agents: "ai_agents",
                        rag: "ai_agents",
                        portfolio: "ai_agents"
                      };
                      const targetId = idMap[selectedSkill.id] || selectedSkill.id;
                      const matchMod = roadmap.modules.find(m => 
                        m.id === targetId || 
                        m.id === selectedSkill.id || 
                        m.title.toLowerCase() === selectedSkill.name.toLowerCase() ||
                        m.title.toLowerCase().includes(selectedSkill.name.toLowerCase().split(' ')[0])
                      );
                      if (matchMod) {
                        await handleMarkModuleCompleted(matchMod.id);
                      } else {
                        setNotice(`${selectedSkill.name} marked as complete!`);
                        window.setTimeout(() => setNotice(''), 2600);
                      }
                    }
                  }}
                >
                  <span>
                    {selectedSkill.status === 'locked' 
                      ? 'Complete prerequisites' 
                      : selectedSkill.status === 'completed' 
                        ? 'Review skill' 
                        : 'Mark Node Mastered'}
                  </span>
                  {selectedSkill.status === 'locked' ? <Lock size={15} /> : <ArrowRight size={16} />}
                </button>
              </aside>

              {notice && (
                <div className="toast" role="status">
                  <Check size={14} />{notice}
                </div>
              )}
            </>
          ) : (
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-app)]">
              {/* Header top bar */}
              <header className="flex justify-between items-center px-4 sm:px-6 md:px-10 h-16 border-b border-[var(--border-color)] shrink-0 bg-[var(--bg-header)] backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <button className="md:hidden icon-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
                  <h2 className="font-bold text-base sm:text-lg text-[var(--text-main)]">
                    {activeTab === "projects" && "Portfolio Projects"}
                    {activeTab === "ai-mentor" && "Interactive Mentor"}
                    {activeTab === "progress" && "Progression Analytics"}
                    {activeTab === "settings" && "Platform Calibration"}
                  </h2>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="hidden sm:inline font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                    Goal: {roadmap?.pathName || targetCareer || "Custom Path"}
                  </span>
                  <ThemeToggle theme={theme} onToggle={toggleTheme} />
                </div>
              </header>

              {/* Dynamic tabs controller container */}
              <div className={`flex-1 min-h-0 ${activeTab === "ai-mentor" ? "p-3.5 sm:p-4 md:p-6 flex flex-col overflow-hidden" : "overflow-y-auto p-6 md:p-10"}`}>
                
                {/* TAB 2: PORTFOLIO PROJECTS */}
                {activeTab === "projects" && (
                <div className="flex flex-col gap-8 h-full">
                  {!activeProjectFocus ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {PORTFOLIO_PROJECTS.map((proj) => {
                        const isCompleted = completedProjects.includes(proj.id);
                        const isUnlocked = proj.prerequisites.length === 0 || proj.prerequisites.every(reqId => completedProjects.includes(reqId));
                        const prereqProjectName = proj.prerequisites.length > 0
                          ? (PORTFOLIO_PROJECTS.find(p => p.id === proj.prerequisites[0])?.title || proj.prerequisites[0])
                          : "";

                        if (isUnlocked) {
                          return (
                            <div 
                              key={proj.id}
                              className={`glass-panel rounded-2xl p-6 flex flex-col justify-between transition-transform duration-300 ${
                                isCompleted ? "border-l-4 border-l-[#10b981]" : "border-l-4 border-l-secondary hover:translate-y-[-2px]"
                              }`}
                            >
                              <div>
                                <div className="flex justify-between items-start mb-4">
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                                    isCompleted ? "bg-[#10b981]/15 border-[#10b981]/30" : "bg-secondary/15 border-secondary/20"
                                  }`}>
                                    {isCompleted ? <Check className="text-[#10b981] w-5 h-5" /> : <Layers className="text-secondary w-5 h-5" />}
                                  </div>
                                  {isCompleted ? (
                                    <span className="font-mono text-[9px] text-[#10b981] bg-[#10b981]/15 border border-[#10b981]/30 px-2 py-0.5 rounded-full uppercase flex items-center gap-1 font-semibold">
                                      ✓ Completed
                                    </span>
                                  ) : (
                                    <span className="font-mono text-[9px] text-secondary bg-secondary/10 px-2 py-0.5 rounded-full uppercase font-semibold">
                                      In Progress
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">{proj.title}</h3>
                                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                  {proj.description}
                                </p>
                              </div>
                              <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex justify-between items-center">
                                <span className="text-[10px] text-[var(--text-muted)] font-mono">{proj.timeEstimate} • {proj.shortTag}</span>
                                <button 
                                  onClick={() => {
                                    setSelectedProjectId(proj.id);
                                    setActiveProjectFocus(true);
                                  }}
                                  className={`${
                                    isCompleted 
                                      ? "bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/40" 
                                      : "bg-primary hover:bg-[#8083ff] text-on-primary"
                                  } font-mono text-[10px] uppercase font-bold tracking-wider py-2 px-4 rounded-lg transition-all cursor-pointer`}
                                >
                                  {isCompleted ? "View Details" : "Open Project"}
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={proj.id} className="glass-panel rounded-2xl p-6 opacity-60 flex flex-col justify-between border-l-4 border-l-transparent">
                            <div>
                              <div className="flex justify-between items-start mb-4">
                                <div className="w-9 h-9 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center">
                                  <Lock className="text-[var(--text-muted)] w-4 h-4" />
                                </div>
                                <span className="font-mono text-[9px] text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full uppercase font-semibold">
                                  Locked
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">{proj.title}</h3>
                              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                {proj.description}
                              </p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-[var(--border-color)] text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-1.5">
                              <Lock className="w-3 h-3 text-[var(--text-muted)]" />
                              Requires: {prereqProjectName}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (() => {
                    const activeProj = PORTFOLIO_PROJECTS.find(p => p.id === selectedProjectId) || PORTFOLIO_PROJECTS[0];
                    const isProjCompleted = completedProjects.includes(activeProj.id);

                    return (
                      /* Project Detailed Step-by-Step workspace */
                      <div className="flex flex-col gap-6">
                        <button 
                          onClick={() => setActiveProjectFocus(false)}
                          className="text-xs font-semibold text-primary hover:text-[#e1e0ff] transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          ← Back to Project Selector
                        </button>

                        {/* Breadcrumb row */}
                        <nav className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-2">
                          <span>Projects</span>
                          <ChevronRight className="w-3 h-3" />
                          <span className="text-[var(--text-main)] font-semibold">{activeProj.title}</span>
                        </nav>

                        {/* Main workspace layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                          {/* Left column specifications */}
                          <div className="lg:col-span-8 flex flex-col gap-6">
                            
                            {/* Overview card */}
                            <div className="glass-panel rounded-2xl p-6 border-[var(--border-color)] relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-6 opacity-5">
                                <Workflow className="w-32 h-32" />
                              </div>
                              <div className="relative z-10">
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <span className="px-2.5 py-1 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] text-[9px] text-secondary font-semibold font-mono uppercase">{activeProj.category}</span>
                                  <span className="px-2.5 py-1 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] text-[9px] text-[var(--text-muted)] font-semibold font-mono uppercase">{activeProj.difficulty}</span>
                                  <span className="px-2.5 py-1 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] text-[9px] text-[var(--text-muted)] font-semibold font-mono uppercase">{activeProj.timeEstimate}</span>
                                </div>
                                <h1 className="text-3xl font-bold text-[var(--text-main)] mb-4">{activeProj.title}</h1>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
                                  {activeProj.description}
                                </p>
                                
                                <div className="flex flex-wrap gap-4">
                                  <button 
                                    onClick={() => {
                                      setActiveTab("ai-mentor");
                                      setActiveProjectFocus(false);
                                      setUserMsgText(`Review requirements and guide me through building the "${activeProj.title}" project.`);
                                    }}
                                    className="bg-[#494bd6] hover:bg-[#8083ff] text-white font-mono text-[10px] font-bold py-3.5 px-6 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                                  >
                                    Ask Mentor to start code
                                  </button>

                                  {isProjCompleted ? (
                                    <button 
                                      disabled
                                      className="bg-[#10b981]/20 border border-[#10b981] text-[#10b981] font-mono text-[10px] font-bold py-3.5 px-6 rounded-lg uppercase tracking-wider flex items-center gap-2 cursor-default"
                                    >
                                      <Check className="w-4 h-4" /> Completed
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => handleMarkProjectCompleted(activeProj.id)}
                                      className="border border-[#44e2cd]/30 hover:bg-[#44e2cd]/10 text-[#44e2cd] font-mono text-[10px] font-bold py-3.5 px-6 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      Mark as Completed
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Problem and Bento grids */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              
                              {/* Problem block */}
                              <div className="glass-panel p-6 rounded-2xl">
                                <h3 className="text-md font-semibold text-[var(--text-main)] mb-4 flex items-center gap-2">
                                  <AlertCircle className="text-primary w-5 h-5" /> The Problem
                                </h3>
                                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                  {activeProj.problem}
                                </p>
                              </div>

                              {/* Skills practiced */}
                              <div className="glass-panel p-6 rounded-2xl">
                                <h3 className="text-md font-semibold text-[var(--text-main)] mb-4 flex items-center gap-2">
                                  <Award className="text-secondary w-5 h-5" /> Key Features
                                </h3>
                                <ul className="text-xs text-[var(--text-muted)] space-y-2.5">
                                  {activeProj.keyFeatures.map((feat, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                      <Check className="w-4 h-4 text-secondary shrink-0" />
                                      <span>{feat}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                            </div>
                          </div>

                          {/* Right column sidebar project milestones */}
                          <div className="lg:col-span-4">
                            <div className="glass-panel rounded-2xl p-6 border-[var(--border-color)]">
                              <h3 className="text-lg font-bold text-[var(--text-main)] mb-4 flex items-center justify-between">
                                Project Steps
                                <span className="text-[10px] font-mono text-secondary bg-secondary/10 px-2 py-0.5 rounded">
                                  {activeProj.milestones.length} Milestones
                                </span>
                              </h3>

                              <div className="flex flex-col gap-4">
                                {activeProj.milestones.map((item) => (
                                  <div key={item.step} className="flex gap-4 items-start relative">
                                    <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] flex items-center justify-center text-xs font-mono text-primary shrink-0">
                                      {item.step}
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-semibold text-[var(--text-main)]">{item.title}</h4>
                                      <p className="text-[10px] text-[var(--text-muted)] mt-1">{item.desc}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}


              {/* TAB 3: AI MENTOR */}
              {activeTab === "ai-mentor" && (
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-6 h-full overflow-hidden">
                  
                  {/* Left Column: Context Navigator widget (order-2 on mobile so chat comes first!) */}
                  <aside className="order-2 lg:order-1 w-full lg:w-80 shrink-0 flex flex-col gap-6 overflow-y-auto max-h-[35vh] lg:max-h-full">
                    <div className="glass-panel rounded-2xl p-4 sm:p-5 md:p-6 border-[var(--border-color)]">
                      <h3 className="text-md font-bold mb-4 text-[var(--text-main)] flex items-center gap-2">
                        <Brain className="text-secondary w-5 h-5 animate-pulse" /> Active Context
                      </h3>

                      <div className="flex flex-col gap-5">
                        {/* Target path stats */}
                        <div>
                          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block mb-1">Target Path</span>
                          <span className="text-sm font-semibold text-[var(--text-main)]">{roadmap.pathName}</span>
                          <div className="w-full bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-[#494bd6] h-full rounded-full transition-all duration-500" style={{ width: `${roadmap.overallProgress}%` }}></div>
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] mt-1 block text-right">{roadmap.overallProgress}% Overall Progress</span>
                        </div>

                        {/* active focus node */}
                        <div>
                          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block mb-1">Active Study Focus</span>
                          <div className="bg-[var(--bg-surface-subtle)] rounded-lg p-3 border border-[var(--border-color)] flex items-center gap-2.5">
                            <Cpu className="text-secondary w-4.5 h-4.5" />
                            <span className="text-xs font-semibold text-[var(--text-main)]">
                              {roadmap.modules.find(m => m.status === "In Progress")?.title || selectedModule?.title || "Active Module"}
                            </span>
                          </div>
                        </div>

                        {/* Active Recommended Project representation */}
                        <div>
                          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Project Assignment</span>
                          <div className="bg-[var(--bg-surface-subtle)] rounded-xl p-3 border border-[var(--border-color)]">
                            <div className="w-full h-20 sm:h-24 rounded bg-[var(--bg-hover)] mb-3 overflow-hidden relative flex items-center justify-center border border-[var(--border-color)]">
                              <Workflow className="text-[var(--text-muted)] w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
                            </div>
                            <h4 className="text-xs font-bold text-[var(--text-main)] leading-tight">Weather Intelligence Dashboard</h4>
                            <span className="text-[10px] text-secondary font-mono mt-1 block">Status: IN PROGRESS</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </aside>

                  {/* Right Column: Complete Chat container */}
                  <section className="order-1 lg:order-2 flex-1 min-h-0 glass-panel rounded-2xl flex flex-col overflow-hidden relative border-[var(--border-color)] shadow-2xl h-[calc(100vh-8.5rem)] min-h-[480px] lg:h-full">
                    {/* Chat Header */}
                    <div className="px-4 sm:px-6 py-3.5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-header)] shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center border border-secondary/20 animate-pulse">
                          <Brain className="text-secondary w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[var(--text-main)] block">Forge Mentor</span>
                          <span className="text-[9px] font-mono text-[#10b981] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping"></span> Online
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Messages history viewport */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 md:p-6 flex flex-col gap-4 md:gap-6">
                      {chatMessages.map((msg, idx) => {
                        const isAI = msg.role === "model";
                        return (
                          <div key={idx} className={`flex gap-2.5 sm:gap-3.5 md:gap-4 w-full ${
                            isAI 
                              ? "max-w-[95%] sm:max-w-[90%] md:max-w-[85%]" 
                              : "max-w-[90%] sm:max-w-[85%] md:max-w-[80%] ml-auto flex-row-reverse"
                          }`}>
                            {/* Avatar Icon */}
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg shrink-0 flex items-center justify-center border ${
                              isAI ? "border-secondary/20 bg-[var(--bg-surface-subtle)] text-secondary" : "border-primary/20 bg-primary/10 text-primary"
                            }`}>
                              {isAI ? <Brain className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> : <Code className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
                            </div>

                            <div className={`flex flex-col gap-1 ${isAI ? "flex-1 min-w-0" : "items-end"}`}>
                              <div className={`flex items-center gap-2 ${isAI ? "justify-between min-w-0 w-full" : "justify-end"}`}>
                                <span className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                                  {isAI ? "Forge Mentor" : `${profile?.fullName || user?.displayName || user?.email?.split('@')[0] || "You"} (You)`}
                                </span>
                                {isAI && (
                                  <button
                                    type="button"
                                    onClick={() => handleSpeakMessage(idx, msg.text)}
                                    aria-label={speakingMsgIndex === idx ? "Stop reading response aloud" : "Read response aloud"}
                                    title={speakingMsgIndex === idx ? "Stop reading response aloud" : "Read response aloud"}
                                    className={`flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                      speakingMsgIndex === idx
                                        ? "bg-secondary/20 text-secondary border border-secondary/40 animate-pulse shadow-[0_0_10px_rgba(3,198,178,0.2)]"
                                        : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] border border-transparent"
                                    }`}
                                  >
                                    {speakingMsgIndex === idx ? (
                                      <>
                                        <Square className="w-3 h-3 fill-current text-secondary" />
                                        <span>Stop</span>
                                      </>
                                    ) : (
                                      <>
                                        <Volume2 className="w-3 h-3 text-secondary" />
                                        <span>Listen</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                              <div className={`rounded-2xl p-3 sm:p-4 text-xs leading-relaxed shadow-sm relative overflow-hidden border ${
                                isAI 
                                  ? "w-full min-w-0 bg-[var(--bg-surface-subtle)] border-[var(--border-color)] rounded-tl-sm text-[var(--text-main)]" 
                                  : "w-fit max-w-full bg-primary/10 border-primary/30 rounded-tr-sm text-[var(--text-main)]"
                              }`}>
                                {isAI ? (
                                  <div className="markdown-body space-y-2 text-xs text-[var(--text-main)] w-full min-w-0 break-words [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_code]:bg-[var(--bg-hover)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_pre]:bg-black/60 [&_pre]:text-white [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2 [&_h1]:text-sm [&_h1]:font-bold [&_h2]:text-xs [&_h2]:font-bold [&_h3]:text-xs [&_h3]:font-semibold [&_a]:text-secondary [&_a]:underline">
                                    <ReactMarkdown>{formatChatMessageText(msg.text)}</ReactMarkdown>
                                  </div>
                                ) : (
                                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {isChatLoading && (
                        <div className="flex gap-2.5 sm:gap-3.5 md:gap-4 w-full max-w-[95%] sm:max-w-[90%] md:max-w-[85%]">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg shrink-0 flex items-center justify-center border border-secondary/20 bg-[var(--bg-surface-subtle)] text-secondary animate-pulse">
                            <Brain className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">Forge Mentor</span>
                            <div className="rounded-2xl p-3 sm:p-4 bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] rounded-tl-sm text-[var(--text-main)] w-fit">
                              <div className="flex gap-1 items-center py-1">
                                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={chatBottomRef} />
                    </div>

                    {/* Chat bottom action input dock */}
                    <div className="p-3 sm:p-4 bg-[var(--bg-header)] border-t border-[var(--border-color)] backdrop-blur-md shrink-0 flex flex-col gap-2.5 sm:gap-3">
                      {/* suggested suggestion chips */}
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
                        {chatSuggestChips.map((chip, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendChatMessage(chip)}
                            className="flex-shrink-0 px-3.5 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-hover)] hover:bg-[var(--bg-surface-subtle)] text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all whitespace-nowrap cursor-pointer"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>

                      {/* Voice listening status indicator bar */}
                      {isListening && (
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] font-mono animate-pulse">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span className="truncate">Listening... Speak into your microphone.</span>
                          </div>
                          <button 
                            type="button"
                            onClick={toggleVoiceInput}
                            className="text-[10px] text-red-300/90 hover:text-red-100 uppercase tracking-wider font-semibold cursor-pointer underline shrink-0"
                          >
                            Stop
                          </button>
                        </div>
                      )}

                      {voiceError && (
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{voiceError}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setVoiceError(null)} 
                            className="text-amber-300/70 hover:text-amber-200 cursor-pointer p-0.5 shrink-0"
                            aria-label="Dismiss message"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Actual rich text input panel */}
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl blur-xs opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                        
                        <div className={`relative flex items-center gap-2 bg-[var(--bg-input)] border rounded-xl p-1.5 sm:p-2 transition-all ${
                          isListening 
                            ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
                            : "border-[var(--border-color)] focus-within:border-secondary focus-within:shadow-[0_0_15px_rgba(3,198,178,0.15)]"
                        }`}>
                          <div 
                            className="p-2 text-secondary/80 rounded-lg flex items-center justify-center shrink-0"
                            aria-hidden="true"
                            title="Forge Mentor Conversation"
                          >
                            <MessageSquare className="w-4 h-4 text-secondary" />
                          </div>
                          
                          <input 
                            type="text"
                            value={userMsgText}
                            onChange={(e) => setUserMsgText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSendChatMessage();
                              }
                            }}
                            placeholder={isListening ? "Listening... Transcribing your question..." : "Message Forge Mentor..."}
                            className="w-full bg-transparent border-none text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-0 outline-none py-2 px-1 sm:px-2"
                          />

                          {/* Voice input microphone button */}
                          <button 
                            type="button"
                            onClick={toggleVoiceInput}
                            aria-label={isListening ? "Stop voice input" : "Start voice input"}
                            title={isListening ? "Stop listening" : "Start voice input"}
                            className={`p-2 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                              isListening 
                                ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)] hover:bg-red-500/30" 
                                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
                            }`}
                          >
                            {isListening ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
                          </button>

                          <button 
                            type="button"
                            onClick={() => handleSendChatMessage()}
                            aria-label="Send message"
                            className="bg-primary hover:bg-[#8083ff] text-on-primary p-2 rounded-lg flex items-center justify-center shadow-md cursor-pointer transition-all shrink-0"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-center">
                        <span className="font-mono text-[9px] text-outline/80">
                          Forge Mentor utilizes Gemini LLMs to trace your active career roadmap and study nodes.
                        </span>
                      </div>
                    </div>
                  </section>
                </div>
              )}


              {/* TAB 4: ANALYTICS / PROGRESS */}
              {activeTab === "progress" && (
                <div className="flex flex-col gap-8">
                  {/* Real Learning Progress Chart Component backed by Firestore */}
                  <LearningProgressChart 
                    history={progressHistory} 
                    loading={historyLoading} 
                    roadmap={roadmap} 
                  />

                  {/* Detailed summary milestone breakdown */}
                  <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6">
                    <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                      <TrendingUp className="text-primary w-5 h-5" /> Detailed Module Completion Rates
                    </h3>

                    <div className="space-y-4">
                      {(roadmap?.modules || []).map((m, idx) => {
                        let pct = 0;
                        if (m.status === "Mastered") {
                          pct = 100;
                        } else if (m.status === "In Progress") {
                          pct = 0;
                        }
                        return (
                          <div key={idx} className="flex flex-col gap-2 p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] transition-colors">
                            <div className="flex items-center justify-between gap-3 text-xs">
                              <span className="font-semibold text-[var(--text-main)] truncate" title={m.title}>
                                {m.title}
                              </span>
                              <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                                <span className="font-mono font-bold text-[var(--text-main)] text-xs">{pct}%</span>
                                <span className="text-[var(--text-muted)] opacity-30">•</span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide ${
                                  m.status === "Mastered"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    : m.status === "In Progress"
                                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                                    : "bg-gray-500/10 text-[var(--text-muted)] border border-gray-500/20"
                                }`}>
                                  {m.status}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  m.status === "Mastered" ? "bg-[#10b981]" : "bg-primary"
                                }`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}


              {/* TAB 5: SETTINGS */}
              {activeTab === "settings" && (
                <div className="max-w-3xl flex flex-col gap-8">
                  
                  {/* Account Details Panel */}
                  {user && (
                    <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col gap-6">
                      <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                        <User className="text-secondary w-5 h-5" /> Account Profile Details
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Full Developer Name</span>
                          <span className="font-semibold text-[var(--text-main)] bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] rounded-xl px-4 py-3">
                            {profile?.fullName || user?.displayName || user?.email?.split('@')[0] || "Learner"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Registered Email</span>
                          <span className="font-semibold text-[var(--text-main)] bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] rounded-xl px-4 py-3">
                            {user.email}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Workspace Secure UID</span>
                          <span className="font-mono text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] rounded-xl px-4 py-3 truncate">
                            {user.uid}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Authentication Provider</span>
                          <span className="font-semibold text-primary bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] rounded-xl px-4 py-3 capitalize">
                            {user.providerData?.[0]?.providerId || "Email / Password"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Workspace Initialized At</span>
                          <span className="font-semibold text-[var(--text-main)] bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] rounded-xl px-4 py-3">
                            {profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : new Date().toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Last Secure Access Audit</span>
                          <span className="font-semibold text-[var(--text-main)] bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] rounded-xl px-4 py-3">
                            {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : new Date().toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Calibration Panel */}
                  <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col gap-6">
                    <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                      <Settings className="text-primary w-5.5 h-5.5" /> Platform Calibration Settings
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <label className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider block mb-2">Target Stack &amp; Goal</label>
                        <input 
                          type="text" 
                          value={roadmap ? roadmap.pathName : targetCareer}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTargetCareer(val);
                            setRoadmap((prev) => prev ? { ...prev, pathName: val } : null);
                          }}
                          placeholder="e.g. AI Automation Developer, Full-Stack Engineer..."
                          className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-xs text-[var(--text-main)] focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider block mb-2">Configure Time commitment</label>
                        <select 
                          value={weeklyHours}
                          onChange={(e) => setWeeklyHours(e.target.value)}
                          className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-xs text-[var(--text-main)] focus:outline-none focus:border-primary"
                        >
                          <option value="1-5 hours">1-5 hours (Light exploration)</option>
                          <option value="5-10 hours">5-10 hours (Steady progress)</option>
                          <option value="10-20 hours">10-20 hours (Accelerated growth)</option>
                          <option value="20+ hours">20+ hours (Immersion mode)</option>
                        </select>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex flex-wrap gap-4">
                        <button 
                          onClick={handleSaveSettings}
                          disabled={isSavingSettings}
                          className="bg-primary hover:bg-[#8083ff] disabled:opacity-50 text-on-primary font-mono text-[10px] font-bold py-3.5 px-6 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                        >
                          {isSavingSettings ? "Saving..." : "Save Configurations"}
                        </button>
                        <button 
                          onClick={handleResetAndBuildNewPath}
                          className="border border-[#f43f5e]/40 hover:bg-[#f43f5e]/10 text-rose-600 dark:text-[#f43f5e] font-mono text-[10px] font-bold py-3.5 px-6 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Reset &amp; Build New Path
                        </button>
                        {user && (
                          <button 
                            onClick={handleSignOut}
                            className="ml-auto bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 dark:border-red-500/20 text-red-600 dark:text-red-200 font-mono text-[10px] font-bold py-3.5 px-6 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Sign Out Account
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
            {notice && (
              <div className="toast" role="status">
                <Check size={14} />{notice}
              </div>
            )}
          </main>
        )
      }
    </div>
  )}

      {/* VIEW: SECURE CREDENTIALS AND ACCESS GATE */}
      {currentView === "auth" && (
        <AuthPage 
          onBackToHome={() => setCurrentView("home")}
          onAuthSuccess={handleAuthSuccess}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* RESET ROADMAP CONFIRMATION MODAL */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel border-red-500/30 bg-[var(--bg-surface)] rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col gap-5">
            <button 
              onClick={() => setShowResetConfirmModal(false)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-main)]">Reset &amp; Build New Path?</h3>
                <p className="text-xs text-[var(--text-muted)] font-mono">Platform Calibration Reset</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed bg-[var(--bg-surface-subtle)] p-3.5 rounded-xl border border-[var(--border-color)]">
              Are you sure you want to create a new learning path? This will reset your current active roadmap and skill progress so you can configure new goals and build a fresh custom path. Your account and saved project notes will be preserved.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                disabled={isResettingPath}
                className="px-4 py-2.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeResetPath}
                disabled={isResettingPath}
                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isResettingPath ? "Resetting Path..." : "Yes, Reset & Start New"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOW IT WORKS MODAL OVERLAY */}
      <HowItWorksModal 
        isOpen={showHowItWorksModal} 
        onClose={() => setShowHowItWorksModal(false)} 
      />

    </div>
  );
}
