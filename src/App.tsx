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
  Paperclip, 
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
import { AuthPage } from "./components/AuthPage";
import simpleRoadMapImg from "./assets/images/simple_road_pin_map_1784812763624.jpg";
import { 
  saveOnboarding, 
  getOnboarding, 
  saveRoadmap, 
  getRoadmap, 
  saveProgress, 
  getProgress,
  deleteRoadmap,
  testFirestoreConnection
} from "./lib/firestoreService";

export default function App() {
  const { user, profile, loading: authLoading, logOut, updateOnboardingStatus } = useAuth();

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

  // Active Project Detail focus
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
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      baseTextRef.current = userMsgText;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        const prefix = baseTextRef.current ? baseTextRef.current.trim() + " " : "";
        setUserMsgText(prefix + fullTranscript.trimStart());
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
      try {
        await testFirestoreConnection();
        
        // 1. Fetch user's custom calibrated roadmap
        const dbRoadmap = await getRoadmap(user.uid);
        if (dbRoadmap) {
          setRoadmap(dbRoadmap);
          const inProgressMod = dbRoadmap.modules.find((m: any) => m.status === "In Progress");
          setSelectedModule(inProgressMod || dbRoadmap.modules[3] || dbRoadmap.modules[0]);
        } else {
          // Sync/Migrate from localStorage if exists
          const savedRoadmap = localStorage.getItem(`forgepath_roadmap_${user.uid}`);
          if (savedRoadmap) {
            try {
              const parsed = JSON.parse(savedRoadmap);
              setRoadmap(parsed);
              const inProgressMod = parsed.modules.find((m: any) => m.status === "In Progress");
              setSelectedModule(inProgressMod || parsed.modules[3] || parsed.modules[0]);
              // Upload to Firestore so they have server persistence
              await saveRoadmap(user.uid, parsed);
            } catch (e) {
              console.error("Migration parse error", e);
            }
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
      } catch (err) {
        console.error("Error synchronizing with Firestore database:", err);
      } finally {
        setDataLoading(false);
      }
    }
    fetchUserData();
  }, [user]);

  // Handle immediate navigation on profile load
  useEffect(() => {
    if (user && profile) {
      if ((currentView === "home" || currentView === "auth") && profile.hasCompletedOnboarding) {
        setCurrentView("dashboard");
      }
    }
  }, [user, profile, currentView]);

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
        progress = 45;
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
      if (profile?.hasCompletedOnboarding) {
        // If they already completed onboarding, restore their roadmap or build one, then go to dashboard
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
          // Fallback pre-generation
          const fallbackData = generateFallbackRoadmap(profile.fullName + "'s AI Path", "Custom Application Portfolio", ["Programming Fundamentals"]);
          setRoadmap(fallbackData);
          const inProgressMod = fallbackData.modules.find((m) => m.status === "In Progress");
          setSelectedModule(inProgressMod || fallbackData.modules[3] || fallbackData.modules[0]);
        }
        setCurrentView("dashboard");
      } else {
        setCurrentView("onboarding_1");
      }
    }
  };

  const handleAuthSuccess = (hasCompletedOnboarding: boolean) => {
    if (profile?.hasCompletedOnboarding || hasCompletedOnboarding) {
      const savedRoadmap = localStorage.getItem(`forgepath_roadmap_${user?.uid}`);
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
      
      const fallbackData = generateFallbackRoadmap(profile?.fullName || user?.displayName || user?.email?.split('@')[0] || "Learner", "Custom Application Portfolio", ["Programming Fundamentals"]);
      setRoadmap(fallbackData);
      const inProgressMod = fallbackData.modules.find((m) => m.status === "In Progress");
      setSelectedModule(inProgressMod || fallbackData.modules[3] || fallbackData.modules[0]);
      setCurrentView("dashboard");
    } else {
      setCurrentView("onboarding_1");
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
      const webhookUrl = "https://ahmadontech.app.n8n.cloud/webhook/forgepath/generate-roadmap";
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

    setRoadmap(updatedRoadmap);

    const nextInProg = finalModules.find(m => m.status === "In Progress");
    if (nextInProg) {
      setSelectedModule(nextInProg);
    } else {
      // If none are in progress, default to first or selected
      setSelectedModule(finalModules.find(m => m.id === moduleId) || finalModules[0]);
    }

    try {
      await saveRoadmap(user.uid, updatedRoadmap);
      await saveProgress(user.uid, {
        completedSkills: finalModules.filter(m => m.status === "Mastered").map(m => m.title),
        currentSkill: nextInProg?.title || "Path Completed!",
        completionPercentage: overallProgress
      });

      setNotice(`Module mastered! Progress updated to ${overallProgress}%`);
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      console.error("Error setting module master state in Firestore:", err);
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
      const res = await fetch("https://ahmadontech.app.n8n.cloud/webhook/forgepath/ai-mentor", {
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
      <div className="bg-[#05070a] text-on-surface min-h-screen flex flex-col items-center justify-center relative overflow-hidden antialiased">
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary-container/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-3/4 h-3/4 bg-secondary-container/3 blur-[150px] rounded-full"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-inverse-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-6">
            <Compass className="text-on-primary w-6 h-6 animate-spin-slow" />
          </div>
          <h2 className="text-lg font-bold tracking-widest text-primary uppercase mb-2">ForgePath AI</h2>
          <p className="text-xs text-on-surface-variant/60 font-mono tracking-wide animate-pulse">Synchronizing Firestore credentials & database state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#05070a] text-on-surface min-h-screen font-sans flex flex-col selection:bg-primary-container/20 selection:text-[#c0c1ff] relative overflow-x-hidden antialiased">
      
      {/* Decorative Blur Background Lights */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary-container/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-3/4 h-3/4 bg-secondary-container/3 blur-[150px] rounded-full"></div>
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-secondary/3 rounded-full blur-[100px] mix-blend-screen animate-pulse"></div>
      </div>

      {/* VIEW: HOME (CINEMATIC LANDING SCREEN) */}
      {currentView === "home" && (
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Main Top Header */}
          <header className="fixed top-0 w-full z-50 bg-[#090d16]/85 backdrop-blur-md border-b border-white/10 shadow-sm">
            <div className="max-w-7xl mx-auto flex justify-between items-center px-6 h-16">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView("home")}>
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
                  <Compass className="text-white w-5 h-5 animate-spin-slow" />
                </div>
                <span className="font-sans font-bold text-lg tracking-tight text-white">ForgePath AI</span>
              </div>
              
              <div className="hidden md:flex items-center gap-8">
                <a className="text-xs font-semibold text-indigo-400 hover:text-white transition-colors" href="#">Home Overview</a>
                <a className="text-xs font-semibold text-slate-400 hover:text-white transition-colors" href="#how-it-works">Roadmaps</a>
                <a className="text-xs font-semibold text-slate-400 hover:text-white transition-colors" href="#features">AI Mentor Hub</a>
              </div>

              <div className="flex items-center gap-4">
                {user ? (
                  <>
                    <span className="hidden sm:inline text-xs text-slate-400 font-medium">
                      Hey, <span className="text-white font-semibold">{profile?.fullName || user.email}</span>
                    </span>
                    <button 
                      onClick={() => {
                        if (profile?.hasCompletedOnboarding && roadmap) {
                          setCurrentView("dashboard");
                        } else {
                          setCurrentView("onboarding_1");
                        }
                      }}
                      className="bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-white text-xs uppercase tracking-wider font-semibold py-2 px-4 rounded-lg transition-all cursor-pointer"
                    >
                      Dashboard
                    </button>
                    <button 
                      onClick={() => {
                        logOut();
                        setCurrentView("home");
                      }}
                      className="text-slate-400 hover:text-white text-xs font-semibold py-2 px-3 transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setCurrentView("auth")}
                      className="text-slate-300 hover:text-white text-xs font-semibold py-2 px-4 transition-colors cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={handleBuildMyPathClick}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs uppercase tracking-wider font-bold py-2.5 px-5 rounded-lg transition-all hover:scale-[1.02] cursor-pointer shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
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
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-on-background leading-[1.1]">
                  Your skills are scattered.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#8083ff] to-secondary">
                    Your path doesn't have to be.
                  </span>
                </h1>
                <p className="text-lg text-on-surface-variant max-w-lg leading-relaxed">
                  ForgePath AI leverages advanced spatial mapping to transform your complex career goals into structured, milestone-oriented skill roadmaps and production-grade portfolio projects.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <button 
                    onClick={handleBuildMyPathClick}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs uppercase tracking-wider font-bold py-4 px-8 rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group hover:translate-y-[-1px] border border-indigo-400/30"
                  >
                    Build My Path
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a 
                    href="#how-it-works"
                    className="border border-white/10 hover:border-white/20 hover:bg-white/5 text-white text-xs uppercase tracking-wider font-semibold py-4 px-8 rounded-xl transition-all text-center"
                  >
                    Explore How It Works
                  </a>
                </div>
              </div>

              {/* Sophisticated visual map display */}
              <div className="relative w-full h-[450px] lg:h-[550px] rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-2xl group ai-glow bg-[#05070a]">
                <img 
                  src={simpleRoadMapImg} 
                  alt="Skill Roadmap Path" 
                  className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070a]/60 via-transparent to-transparent pointer-events-none"></div>
              </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5 scroll-smooth">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-3">How It Works</h2>
                <p className="text-on-surface-variant">Three modular phases to continuous mastery.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Horizontal progress bar for desktop */}
                <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 z-0"></div>

                {/* Step 1 */}
                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#122131] border border-outline/30 flex items-center justify-center text-xl font-bold text-primary mb-2 shadow-indigo-500/20 shadow-md">
                    1
                  </div>
                  <h3 className="text-xl font-semibold">Declare Your Destination</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
                    Specify the tech stack, dream engineering role, or a complex portfolio project you intend to build.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#122131] border border-primary/50 flex items-center justify-center text-xl font-bold text-primary mb-2 shadow-lg glow-hover">
                    2
                  </div>
                  <h3 className="text-xl font-semibold">Synthesize Roadmap</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
                    Our AI parses prerequisites, reviews your active skills, and creates a logical, progressive step-by-step curriculum.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#122131] border border-secondary/50 flex items-center justify-center text-xl font-bold text-secondary mb-2 shadow-lg ai-glow">
                    3
                  </div>
                  <h3 className="text-xl font-semibold">Build Real Portfolios</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
                    Unlock hands-on milestones, compile code under real-time guidance from the AI Mentor, and deploy working software.
                  </p>
                </div>
              </div>
            </section>

            {/* Value Proposition Bento Grid */}
            <section className="max-w-7xl mx-auto px-6 py-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Value 1 */}
                <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 hover:border-white/20 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary border border-primary/10">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold">Know What to Study Next</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Avoid direction clutter. We structure dependencies sequentially so you understand why and how skills build upon one another before investing time.
                  </p>
                </div>

                {/* Value 2 */}
                <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 hover:border-white/20 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-[#2c3a4c]/50 flex items-center justify-center text-on-surface border border-white/5">
                    <Workflow className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold">Demystify Prerequisites</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Gain insight into the computational structures behind every library. Explore detailed architectural requirements and dependencies.
                  </p>
                </div>

                {/* Value 3 */}
                <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 hover:border-white/20 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container/10 flex items-center justify-center text-secondary border border-secondary/10">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold">Production-Grade Assignments</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Move past simple sandbox tutorials. ForgePath structures live projects that call external APIs, connect servers, and demonstrate high technical proficiency.
                  </p>
                </div>

                {/* Value 4 */}
                <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 border-secondary/20 hover:border-secondary/30 transition-all ai-glow">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container/20 flex items-center justify-center text-secondary border border-secondary/20 animate-pulse">
                    <Brain className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-secondary">Interactive Forge Mentor</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    An elite conversational study companion that understands your current curriculum node, reviews project instructions, and unblocks logic bugs 24/7.
                  </p>
                </div>

              </div>
            </section>

            {/* Final CTA Banner */}
            <section className="max-w-7xl mx-auto px-6 py-16">
              <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Stop wondering what to learn next.</h2>
                <p className="text-sm text-on-surface-variant max-w-md leading-relaxed">
                  Calibrate your timeline, map your engineering background, and claim your active career progression.
                </p>
                <button 
                  onClick={handleBuildMyPathClick}
                  className="bg-[#494bd6] hover:bg-[#8083ff] text-white text-xs uppercase tracking-wider font-semibold py-4 px-10 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:scale-[1.02]"
                >
                  Build My Path
                </button>
              </div>
            </section>
          </main>
        </div>
      )}


      {/* ONBOARDING FLOW: STEP 1 (What do you want to become?) */}
      {currentView === "onboarding_1" && (
        <div className="relative z-10 flex flex-col min-h-screen bg-deep-space">
          {/* Progress Header */}
          <header className="w-full flex justify-between items-center px-6 md:px-12 h-20 border-b border-white/5 bg-[#051424]/40">
            <span className="font-bold text-lg text-primary tracking-tight">ForgePath AI</span>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-outline uppercase tracking-widest">Step 1 of 4</span>
              <div className="flex gap-1.5">
                <div className="w-6 h-1 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
                <div className="w-6 h-1 rounded-full bg-white/10"></div>
                <div className="w-6 h-1 rounded-full bg-white/10"></div>
                <div className="w-6 h-1 rounded-full bg-white/10"></div>
              </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-3xl mx-auto w-full pb-24">
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-on-surface-variant">
                What do you want to become?
              </h1>
              <p className="text-on-surface-variant leading-relaxed max-w-xl mx-auto">
                Tell us where you want to go. We'll map the optimal dependencies and logical curriculum layers to build your path.
              </p>
            </div>

            {/* Search Input Box */}
            <div className="w-full mb-8">
              <div className="glass-panel rounded-xl transition-all duration-300 p-1.5 focus-within:border-secondary/50 focus-within:shadow-[0_0_20px_rgba(3,198,178,0.15)] border-white/10 bg-white/[0.02]">
                <div className="flex items-center px-4 py-2">
                  <Brain className="text-secondary w-6 h-6 mr-3 opacity-80" />
                  <input 
                    type="text" 
                    autoFocus
                    value={targetCareer}
                    onChange={(e) => setTargetCareer(e.target.value)}
                    placeholder="e.g., AI Automation Developer, Full-Stack Engineer..."
                    className="w-full bg-transparent border-none text-on-surface font-sans text-xl md:text-2xl focus:ring-0 placeholder:text-on-surface-variant/40 placeholder:font-light py-2 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Example chips */}
            <div className="w-full text-center">
              <p className="font-mono text-[10px] text-outline uppercase tracking-wider mb-4">Popular Career Paths</p>
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
                        : "border-white/10 bg-[#122131]/30 text-on-surface-variant hover:text-on-surface hover:border-white/30"
                    }`}
                  >
                    {path}
                  </button>
                ))}
              </div>
            </div>
          </main>

          {/* Fixed bottom footer */}
          <footer className="p-6 border-t border-white/5 bg-[#051424]/40 flex justify-between items-center max-w-3xl mx-auto w-full rounded-t-xl">
            <button 
              onClick={() => setCurrentView("home")}
              className="text-xs font-bold text-on-surface-variant hover:text-on-surface tracking-wider uppercase flex items-center gap-1"
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
        <div className="relative z-10 flex flex-col min-h-screen bg-deep-space">
          <header className="w-full flex justify-between items-center px-6 md:px-12 h-20 border-b border-white/5 bg-[#051424]/40">
            <button 
              onClick={() => setCurrentView("onboarding_1")}
              className="w-9 h-9 rounded-full glass-panel flex items-center justify-center hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-on-surface-variant" />
            </button>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-outline uppercase tracking-widest">Step 2 of 4</span>
              <div className="flex gap-1.5">
                <div className="w-6 h-1 rounded-full bg-[#122131]"></div>
                <div className="w-6 h-1 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
                <div className="w-6 h-1 rounded-full bg-white/10"></div>
                <div className="w-6 h-1 rounded-full bg-white/10"></div>
              </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto w-full pb-24">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">What do you already know?</h1>
              <p className="text-on-surface-variant leading-relaxed max-w-xl mx-auto">
                Declaring your current stack helps ForgePath calibrate custom prerequisites. Mark everything you've already mastered.
              </p>
            </div>

            {/* Search filter for skills */}
            <div className="w-full max-w-xl mb-8 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-outline" />
              </div>
              <input 
                type="text" 
                value={skillSearchQuery}
                onChange={(e) => setSkillSearchQuery(e.target.value)}
                placeholder="Search skills, languages, libraries..."
                className="w-full bg-[#0F172A]/80 border border-white/10 rounded-xl py-4.5 pl-12 pr-4 text-on-surface placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/40 transition-all shadow-lg font-sans"
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
                          ? "bg-primary/10 border-primary/80 shadow-[0_0_20px_rgba(99,102,241,0.15)]" 
                          : "bg-[#0a0f1a]/50 border-white/5 hover:border-white/20 hover:bg-[#1c2b3c]/50"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isSelected ? "bg-primary/20 text-[#c0c1ff]" : "bg-white/5 text-on-surface-variant"
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

          <footer className="p-6 border-t border-white/5 bg-[#051424]/40 flex justify-between items-center max-w-4xl mx-auto w-full rounded-t-xl">
            <button 
              onClick={() => setCurrentView("onboarding_1")}
              className="text-xs font-bold text-on-surface-variant hover:text-on-surface tracking-wider uppercase flex items-center gap-1"
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
        <div className="relative z-10 flex flex-col min-h-screen bg-deep-space">
          <header className="w-full flex justify-between items-center px-6 md:px-12 h-20 border-b border-white/5 bg-[#051424]/40">
            <button 
              onClick={() => setCurrentView("onboarding_2")}
              className="w-9 h-9 rounded-full glass-panel flex items-center justify-center hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-on-surface-variant" />
            </button>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-outline uppercase tracking-widest">Step 3 of 4</span>
              <div className="flex gap-1.5">
                <div className="w-6 h-1 rounded-full bg-[#122131]"></div>
                <div className="w-6 h-1 rounded-full bg-[#122131]"></div>
                <div className="w-6 h-1 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
                <div className="w-6 h-1 rounded-full bg-white/10"></div>
              </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col justify-center px-6 max-w-5xl mx-auto w-full pb-24">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Configure your engine</h1>
              <p className="text-on-surface-variant leading-relaxed max-w-xl mx-auto">
                Calibrate study schedules and your preferred instructional format so the AI Mentor communicates on your wavelength.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-11 gap-12 items-start">
              {/* Left Column: Time dedication */}
              <section className="lg:col-span-5 flex flex-col gap-4">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                    <Clock className="text-primary w-5 h-5" />
                    Weekly Availability
                  </h2>
                  <p className="text-sm text-outline mt-1">How many study hours can you dedicate?</p>
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
                        className={`glass-card rounded-xl p-4 text-left flex items-start gap-4 transition-all duration-300 hover:border-white/20 cursor-pointer ${
                          isSelected ? "border-primary bg-primary/5" : ""
                        }`}
                      >
                        <div className="w-4.5 h-4.5 rounded-full border border-outline mt-1 flex items-center justify-center shrink-0">
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{option.label}</span>
                          <span className="font-mono text-xs text-on-surface-variant mt-1">{option.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Vertical border line indicator for desktop */}
              <div className="hidden lg:block lg:col-span-1 border-r border-white/5 h-64 mx-auto"></div>

              {/* Right Column: Methodologies */}
              <section className="lg:col-span-5 flex flex-col gap-4">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                    <Brain className="text-secondary w-5 h-5" />
                    Learning Methodology
                  </h2>
                  <p className="text-sm text-outline mt-1">Which instructional formats do you prefer? (Select multiple)</p>
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
                        className={`glass-card rounded-xl p-4 text-left flex items-center gap-4 transition-all duration-300 hover:border-white/20 cursor-pointer ${
                          isSelected ? "border-secondary bg-secondary/5" : ""
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected ? "text-secondary" : "text-on-surface-variant opacity-70"
                        }`}>
                          {option.icon}
                        </div>
                        <span className="text-sm font-semibold flex-1">{option.label}</span>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          isSelected ? "border-secondary bg-secondary/10 text-secondary" : "border-white/10"
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

          <footer className="p-6 border-t border-white/5 bg-[#051424]/40 flex justify-between items-center max-w-5xl mx-auto w-full rounded-t-xl">
            <button 
              onClick={() => setCurrentView("onboarding_2")}
              className="text-xs font-bold text-on-surface-variant hover:text-on-surface tracking-wider uppercase flex items-center gap-1"
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
        <div className="relative z-10 flex flex-col min-h-screen bg-deep-space">
          <header className="w-full flex justify-between items-center px-6 md:px-12 h-20 border-b border-white/5 bg-[#051424]/40">
            <button 
              onClick={() => setCurrentView("onboarding_3")}
              className="w-9 h-9 rounded-full glass-panel flex items-center justify-center hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-on-surface-variant" />
            </button>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-outline uppercase tracking-widest">Step 4 of 4</span>
              <div className="flex gap-1.5">
                <div className="w-6 h-1 rounded-full bg-[#122131]"></div>
                <div className="w-6 h-1 rounded-full bg-[#122131]"></div>
                <div className="w-6 h-1 rounded-full bg-[#122131]"></div>
                <div className="w-6 h-1 rounded-full bg-primary shadow-sm shadow-primary/40"></div>
              </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto w-full pb-24">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">What do you want to build?</h1>
              <p className="text-on-surface-variant leading-relaxed max-w-xl mx-auto">
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
                        : "bg-[#0a0f1a]/50 border-white/5 hover:border-white/20 hover:bg-[#1c2b3c]/50"
                    }`}
                  >
                    <div>
                      <h4 className="font-semibold text-sm text-white mb-1">{opt.label}</h4>
                      <p className="text-xs text-on-surface-variant/80">{opt.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-primary bg-primary/20 text-[#c0c1ff]" : "border-white/10"
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
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-4.5 text-on-surface placeholder:text-on-surface-variant/40 font-sans"
                />
              </div>
            </div>
          </main>

          <footer className="p-6 border-t border-white/5 bg-[#051424]/40 flex justify-between items-center max-w-4xl mx-auto w-full rounded-t-xl">
            <button 
              onClick={() => setCurrentView("onboarding_3")}
              className="text-xs font-bold text-on-surface-variant hover:text-on-surface tracking-wider uppercase flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleGenerateRoadmap}
              className="bg-primary hover:bg-[#8083ff] text-on-primary py-3.5 px-8 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              Generate My Path
              <Sparkles className="w-4 h-4" />
            </button>
          </footer>
        </div>
      )}


      {/* VIEW: FORGING PATH LOADING SCREEN */}
      {currentView === "loading" && (
        <div className="relative z-10 flex flex-col min-h-screen bg-[#05070a] justify-between p-6">
          <header className="w-full flex justify-center pt-8">
            <div className="flex items-center gap-2.5 opacity-85">
              <Compass className="text-primary w-6 h-6 animate-spin-slow" />
              <span className="font-sans font-bold text-base text-primary tracking-widest uppercase">ForgePath AI</span>
            </div>
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
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-2 shimmer">
                    Forging your path...
                  </h1>
                  <p className="text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                    Our n8n workflow engine is processing your goals, stack background, and time commitment to generate a custom roadmap.
                  </p>
                </div>

                {/* Loading stage card */}
                <div className="mt-10 w-full glass-panel border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                  <div className="flex flex-col gap-4 text-center">
                    <span className="font-mono text-xs text-secondary tracking-wide transition-opacity duration-300">
                      {loadingPhrases[loadingStep]}
                    </span>
                    
                    {/* Horizontal progress indicators */}
                    <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden relative">
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
                <h2 className="text-2xl font-bold text-white mb-2">Roadmap Generation Issue</h2>
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
                    className="bg-white/10 hover:bg-white/15 text-on-surface py-3 px-4 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Back to Onboarding
                  </button>
                </div>
              </div>
            )}
          </main>

          <footer className="w-full text-center pb-8">
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider">
              ForgePath Core 2.4 online
            </span>
          </footer>
        </div>
      )}


      {/* VIEW: MAIN DASHBOARD & COMMAND CENTER */}
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
              <div className="p-4 rounded-xl glass-panel text-center border border-white/5 bg-white/[0.01]">
                <Sparkles className="w-5 h-5 text-primary mx-auto mb-2 animate-pulse" />
                <h4 className="text-xs font-semibold text-white">Need more space?</h4>
                <p className="text-[10px] text-outline mt-1 mb-3">Upgrade to premium server slots and larger models.</p>
                <button 
                  onClick={() => alert("Upgrading to Pro...")}
                  className="w-full bg-secondary hover:bg-[#3cddc7] text-[#00201c] font-mono text-[10px] py-2 px-3 rounded-lg uppercase tracking-wider font-bold transition-all cursor-pointer"
                >
                  Upgrade to Pro
                </button>
              </div>

              {user && (
                <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-2">
                  <div className="flex items-center gap-2.5 px-0.5">
                    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {profile?.fullName?.charAt(0) || user.email?.charAt(0) || "A"}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-[10px] font-bold text-white truncate leading-tight">{profile?.fullName || user?.displayName || user?.email?.split('@')[0] || "Learner"}</p>
                      <p className="text-[8px] font-mono text-outline truncate leading-normal">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      logOut();
                      setCurrentView("home");
                    }}
                    className="w-full text-center font-mono text-[9px] text-red-400 hover:text-red-300 uppercase tracking-widest transition-colors py-1.5 cursor-pointer bg-red-500/5 hover:bg-red-500/10 rounded border border-red-500/10"
                  >
                    Disconnect Session
                  </button>
                </div>
              )}

              <button 
                onClick={() => setCurrentView("home")}
                className="text-center font-mono text-[9px] text-outline uppercase tracking-widest hover:text-white transition-colors py-2 cursor-pointer"
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
                  <div className="brand flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 border border-indigo-400/30 shrink-0">
                      <Compass className="text-white w-4 h-4 animate-spin-slow" />
                    </div>
                    <div>
                      <strong className="text-white font-bold text-sm block leading-tight">ForgePath AI</strong>
                      <span className="text-[10px] text-indigo-300/80 font-mono block">Command Center</span>
                    </div>
                  </div>
                  <button className="icon-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
                </header>
                
                <div className="workspace-header">
                  <div>
                    <span className="section-kicker">Your adaptive roadmap</span>
                    <h1 className="text-white">Your path to becoming an <span className="text-primary">{roadmap.pathName || "AI Developer"}</span></h1>
                    <p>Here's what you should focus on next.</p>
                  </div>
                  <button 
                    className="help-button" 
                    aria-label="Open roadmap help"
                    onClick={() => alert("ForgePath uses coordinates and 3D spatial relationships to model your professional curriculum. Hover and drag to inspect connection edges.")}
                  >
                    <HelpCircle size={18} /><span>How it works</span>
                  </button>
                </div>

                <div className="stats-grid">
                  <article className="stat-card">
                    <span>Overall progress</span>
                    <strong className="text-white">{roadmap.overallProgress}%</strong>
                    <div className="progress-track"><span style={{ width: `${roadmap.overallProgress}%` }} /></div>
                  </article>
                  <article className="stat-card">
                    <span>Completed Nodes</span>
                    <strong className="text-white">{roadmap.modules.filter(m => m.status === "Mastered").length} of {roadmap.modules.length}</strong>
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
                      <h2 className="text-white">Explore your learning path</h2>
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
                  <h2 className="text-white font-bold leading-tight">{selectedSkill.name}</h2>
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
                      <span className="status-badge flex items-center gap-1.5 text-outline border-white/5 bg-white/[0.01]">🔒 Locked</span>
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
                  <span className="text-outline flex items-center gap-1.5"><BookOpen size={13} />Recommended project</span>
                  <strong className="text-white">{selectedSkill.project.title}</strong>
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
                      const matchMod = roadmap.modules.find(m => m.id === targetId);
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
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#051424]">
              {/* Header top bar */}
              <header className="flex justify-between items-center px-6 md:px-10 h-16 border-b border-white/5 shrink-0 bg-[#051424]/90 backdrop-blur-md">
                <h2 className="font-bold text-lg text-white">
                  {activeTab === "projects" && "Portfolio Projects"}
                  {activeTab === "ai-mentor" && "Interactive Mentor"}
                  {activeTab === "progress" && "Progression Analytics"}
                  {activeTab === "settings" && "Platform Calibration"}
                </h2>

                <div className="flex items-center gap-4">
                  <span className="hidden sm:inline font-mono text-[10px] text-outline uppercase tracking-wider">
                    Goal: {roadmap.pathName}
                  </span>
                  <button className="md:hidden icon-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
                </div>
              </header>

              {/* Dynamic tabs controller container */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10">
                
                {/* TAB 2: PORTFOLIO PROJECTS */}
                {activeTab === "projects" && (
                <div className="flex flex-col gap-8 h-full">
                  {!activeProjectFocus ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Active Project Card */}
                      <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-secondary flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-9 h-9 rounded-lg bg-secondary/15 flex items-center justify-center border border-secondary/20">
                              <Layers className="text-secondary w-5 h-5" />
                            </div>
                            <span className="font-mono text-[9px] text-secondary bg-secondary/10 px-2 py-0.5 rounded-full uppercase">In Progress</span>
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2">Weather Intelligence Dashboard</h3>
                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            Integrate external meteorological APIs to pull, format, and render dynamic weather parameters in a glassmorphic dashboard interface.
                          </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                          <span className="text-[10px] text-outline font-mono">3-5 Hours • APIs</span>
                          <button 
                            onClick={() => setActiveProjectFocus(true)}
                            className="bg-primary hover:bg-[#8083ff] text-on-primary font-mono text-[10px] uppercase font-bold tracking-wider py-2 px-4 rounded-lg transition-all cursor-pointer"
                          >
                            Open Project
                          </button>
                        </div>
                      </div>

                      {/* Locked placeholder 1 */}
                      <div className="glass-panel rounded-2xl p-6 opacity-60 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                              <Lock className="text-outline w-4 h-4" />
                            </div>
                            <span className="font-mono text-[9px] text-on-surface-variant/70 bg-white/5 px-2 py-0.5 rounded-full uppercase">Locked</span>
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2">Personal Portfolio AI</h3>
                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            Build a customized agentic chat companion trained to represent your engineering credentials and experience.
                          </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-outline font-mono">
                          Requires: Webhooks
                        </div>
                      </div>

                      {/* Locked placeholder 2 */}
                      <div className="glass-panel rounded-2xl p-6 opacity-60 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                              <Lock className="text-outline w-4 h-4" />
                            </div>
                            <span className="font-mono text-[9px] text-on-surface-variant/70 bg-white/5 px-2 py-0.5 rounded-full uppercase">Locked</span>
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2">Automated News Summarizer</h3>
                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            Connect standard RSS pipelines to Gemini streaming models to automatically organize daily tech news summaries.
                          </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-outline font-mono">
                          Requires: AI Agents
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Project Detailed Step-by-Step workspace */
                    <div className="flex flex-col gap-6">
                      <button 
                        onClick={() => setActiveProjectFocus(false)}
                        className="text-xs font-semibold text-primary hover:text-[#e1e0ff] transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        ← Back to Project Selector
                      </button>

                      {/* Breadcrumb row */}
                      <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
                        <span>Projects</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white font-semibold">Weather Intelligence Dashboard</span>
                      </nav>

                      {/* Main workspace layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left column specifications */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                          
                          {/* Overview card */}
                          <div className="glass-panel rounded-2xl p-6 border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                              <Workflow className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className="px-2.5 py-1 rounded-full bg-[#122131] border border-white/5 text-[9px] text-secondary font-semibold font-mono uppercase">APIs</span>
                                <span className="px-2.5 py-1 rounded-full bg-[#122131] border border-white/5 text-[9px] text-on-surface-variant font-semibold font-mono uppercase">Beginner</span>
                                <span className="px-2.5 py-1 rounded-full bg-[#122131] border border-white/5 text-[9px] text-on-surface-variant font-semibold font-mono uppercase">3-5 Hours</span>
                              </div>
                              <h1 className="text-3xl font-bold text-white mb-4">Weather Intelligence Dashboard</h1>
                              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                                Create an interactive visual interface that establishes network socket connections to weather servers to digest atmospheric information. Write logic loops to gracefully parse JSON elements and present structured insights to the user.
                              </p>
                              
                              <div className="flex gap-4">
                                <button 
                                  onClick={() => {
                                    setActiveTab("ai-mentor");
                                    setActiveProjectFocus(false);
                                  }}
                                  className="bg-[#494bd6] hover:bg-[#8083ff] text-white font-mono text-[10px] font-bold py-3.5 px-6 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  Ask Mentor to start code
                                </button>
                                <button 
                                  onClick={async () => {
                                    const apisMod = roadmap.modules.find(m => m.id === "apis" || m.id === "apis_integration");
                                    if (apisMod) {
                                      await handleMarkModuleCompleted(apisMod.id);
                                    } else if (selectedModule) {
                                      await handleMarkModuleCompleted(selectedModule.id);
                                    }
                                  }}
                                  className="border border-[#44e2cd]/30 hover:bg-[#44e2cd]/5 text-[#44e2cd] font-mono text-[10px] font-bold py-3.5 px-6 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  Mark as Completed
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Problem and Bento grids */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Problem block */}
                            <div className="glass-panel p-6 rounded-2xl">
                              <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                                <AlertCircle className="text-primary w-5 h-5" /> The Problem
                              </h3>
                              <p className="text-xs text-on-surface-variant leading-relaxed">
                                Users need immediate access to structured meteorological data across diverse endpoints without dealing with complex developer tools, authentications, or rate limits.
                              </p>
                            </div>

                            {/* Skills practiced */}
                            <div className="glass-panel p-6 rounded-2xl">
                              <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                                <Award className="text-secondary w-5 h-5" /> Key Features
                              </h3>
                              <ul className="text-xs text-on-surface-variant space-y-2.5">
                                <li className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-secondary" /> Dynamic search query scanning
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-secondary" /> Graceful connection recovery
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-secondary" /> Dynamic temperature charts
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-secondary" /> Glassmorphic UI overlays
                                </li>
                              </ul>
                            </div>

                          </div>
                        </div>

                        {/* Right column sidebar project milestones */}
                        <div className="lg:col-span-4">
                          <div className="glass-panel rounded-2xl p-6 border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                              Project Steps
                              <span className="text-[10px] font-mono text-secondary bg-secondary/10 px-2 py-0.5 rounded">6 Milestones</span>
                            </h3>

                            <div className="flex flex-col gap-4">
                              {[
                                { step: 1, title: "Understand the target API", desc: "Acquire API keys and construct curl sequences to verify endpoints." },
                                { step: 2, title: "Mockup dynamic component tree", desc: "Build clean, modular visual frames for current weather and maps." },
                                { step: 3, title: "Establish Fetch network sockets", desc: "Hook state functions to digest live meteorological telemetry." },
                                { step: 4, title: "Clean and format payload variables", desc: "Verify coordinates, format metrics into metric/imperial structures." },
                                { step: 5, title: "Incorporate crash handlers", desc: "Handle offline alerts and missing locations gracefully." },
                                { step: 6, title: "Build and deploy production artifact", desc: "Prepare responsive static builds to demonstrate output." }
                              ].map((item) => (
                                <div key={item.step} className="flex gap-4 items-start relative">
                                  <div className="w-8 h-8 rounded-full bg-[#122131] border border-white/15 flex items-center justify-center text-xs font-mono text-primary shrink-0">
                                    {item.step}
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                                    <p className="text-[10px] text-on-surface-variant/80 mt-1">{item.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* TAB 3: AI MENTOR */}
              {activeTab === "ai-mentor" && (
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-auto lg:h-[calc(100vh-14rem)] overflow-visible lg:overflow-hidden">
                  
                  {/* Left Column: Context Navigator widget (order-2 on mobile so chat comes first!) */}
                  <aside className="order-2 lg:order-1 w-full lg:w-80 shrink-0 flex flex-col gap-6 overflow-y-auto">
                    <div className="glass-panel rounded-2xl p-6 border-white/5 bg-[#0a0f1a]/40">
                      <h3 className="text-md font-bold mb-4 text-white flex items-center gap-2">
                        <Brain className="text-secondary w-5 h-5 animate-pulse" /> Active Context
                      </h3>

                      <div className="flex flex-col gap-5">
                        {/* Target path stats */}
                        <div>
                          <span className="text-[10px] font-mono text-outline uppercase tracking-wider block mb-1">Target Path</span>
                          <span className="text-sm font-semibold text-white">{roadmap.pathName}</span>
                          <div className="w-full bg-[#122131] h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-[#494bd6] h-full rounded-full w-[45%]"></div>
                          </div>
                          <span className="text-[10px] text-on-surface-variant/80 mt-1 block text-right">45% Milestone Progress</span>
                        </div>

                        {/* active focus node */}
                        <div>
                          <span className="text-[10px] font-mono text-outline uppercase tracking-wider block mb-1">Active Study Focus</span>
                          <div className="bg-[#122131]/60 rounded-lg p-3 border border-white/5 flex items-center gap-2.5">
                            <Cpu className="text-secondary w-4.5 h-4.5" />
                            <span className="text-xs font-semibold text-white">APIs &amp; Connectors</span>
                          </div>
                        </div>

                        {/* Active Recommended Project representation */}
                        <div>
                          <span className="text-[10px] font-mono text-outline uppercase tracking-wider block mb-1.5">Project Assignment</span>
                          <div className="bg-[#122131]/60 rounded-xl p-3 border border-white/5">
                            <div className="w-full h-24 rounded bg-white/5 mb-3 overflow-hidden relative flex items-center justify-center border border-white/5">
                              <Workflow className="text-on-surface-variant/40 w-10 h-10 animate-pulse" />
                            </div>
                            <h4 className="text-xs font-bold text-white leading-tight">Weather Intelligence Dashboard</h4>
                            <span className="text-[10px] text-secondary font-mono mt-1 block">Status: IN PROGRESS</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </aside>

                  {/* Right Column: Complete Chat container */}
                  <section className="order-1 lg:order-2 flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden relative border-white/10 shadow-2xl h-[580px] sm:h-[620px] lg:h-full min-h-[480px]">
                    {/* Chat Header */}
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#010f1f]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center border border-secondary/20 animate-pulse">
                          <Brain className="text-secondary w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">Forge Mentor</span>
                          <span className="text-[9px] font-mono text-[#10b981] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping"></span> Online
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Messages history viewport */}
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                      {chatMessages.map((msg, idx) => {
                        const isAI = msg.role === "model";
                        return (
                          <div key={idx} className={`flex gap-4 max-w-[85%] ${isAI ? "" : "ml-auto flex-row-reverse"}`}>
                            {/* Avatar Icon */}
                            <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center border ${
                              isAI ? "border-secondary/20 bg-[#122131]/80 text-secondary" : "border-primary/20 bg-primary/10 text-primary"
                            }`}>
                              {isAI ? <Brain className="w-5 h-5" /> : <Code className="w-5 h-5" />}
                            </div>

                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-2 min-w-0">
                                <span className="text-[10px] font-mono text-outline">
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
                                        : "text-on-surface-variant/70 hover:text-white hover:bg-white/5 border border-transparent"
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
                              <div className={`rounded-2xl p-4 text-xs leading-relaxed shadow-sm relative overflow-hidden border ${
                                isAI 
                                  ? "bg-[#010f1f]/60 border-white/5 rounded-tl-sm text-on-surface" 
                                  : "bg-primary/5 border-primary/20 rounded-tr-sm text-white"
                              }`}>
                                {isAI ? (
                                  <div className="markdown-body space-y-2 text-xs text-on-surface [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_pre]:bg-black/60 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2 [&_h1]:text-sm [&_h1]:font-bold [&_h2]:text-xs [&_h2]:font-bold [&_h3]:text-xs [&_h3]:font-semibold [&_a]:text-secondary [&_a]:underline">
                                    <ReactMarkdown>{formatChatMessageText(msg.text)}</ReactMarkdown>
                                  </div>
                                ) : (
                                  <p className="whitespace-pre-wrap">{msg.text}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {isChatLoading && (
                        <div className="flex gap-4 max-w-[80%]">
                          <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center border border-secondary/20 bg-[#122131]/80 text-secondary animate-pulse">
                            <Brain className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-mono text-outline">Forge Mentor</span>
                            <div className="rounded-2xl p-4 bg-[#010f1f]/60 border border-white/5 rounded-tl-sm text-on-surface">
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
                    <div className="p-4 bg-[#010f1f]/90 border-t border-white/5 backdrop-blur-md shrink-0 flex flex-col gap-3">
                      {/* suggested suggestion chips */}
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
                        {chatSuggestChips.map((chip, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendChatMessage(chip)}
                            className="flex-shrink-0 px-3.5 py-1.5 rounded-full border border-white/10 bg-[#122131]/40 hover:bg-[#1c2b3c]/80 hover:border-white/30 text-xs text-on-surface-variant hover:text-on-surface transition-all whitespace-nowrap cursor-pointer"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>

                      {/* Voice listening status indicator bar */}
                      {isListening && (
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] font-mono animate-pulse">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span>Listening... Speak into your microphone. Transcribing live into text input below.</span>
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
                        
                        <div className={`relative flex items-center gap-2 bg-[#05070a] border rounded-xl p-2 transition-all ${
                          isListening 
                            ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
                            : "border-white/10 focus-within:border-secondary focus-within:shadow-[0_0_15px_rgba(3,198,178,0.15)]"
                        }`}>
                          <button 
                            type="button"
                            className="p-2 text-on-surface-variant hover:text-white rounded-lg cursor-pointer"
                            aria-label="Attach file"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>
                          
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
                            className="w-full bg-transparent border-none text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:ring-0 outline-none py-2 px-2"
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
                                : "text-on-surface-variant hover:text-white hover:bg-white/5"
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


              {/* TAB 4: ANALYTICS */}
              {activeTab === "progress" && (
                <div className="flex flex-col gap-8">
                  {/* Detailed summary milestone graph */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Progression tracking bento card */}
                    <div className="lg:col-span-8 glass-panel rounded-2xl p-6 flex flex-col gap-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-primary w-5 h-5" /> Detailed Completion Rates
                      </h3>

                      <div className="space-y-4">
                        {roadmap.modules.map((m, idx) => {
                          let pct = 0;
                          if (m.status === "Mastered") {
                            pct = 100;
                          } else if (m.status === "In Progress") {
                            pct = 45;
                          }
                          return (
                            <div key={idx} className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-white">{m.title}</span>
                                <span className="font-mono text-outline">{pct}% • {m.status}</span>
                              </div>
                              <div className="w-full bg-[#122131] h-2 rounded-full overflow-hidden">
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

                    {/* Right column weekly activity graph */}
                    <div className="lg:col-span-4 glass-panel rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Flame className="text-secondary w-5 h-5" /> Study Momentum
                      </h3>

                      {/* Fake weekly activity bar chart */}
                      <div className="h-44 w-full flex items-end gap-1.5 mb-4 relative pt-6 border-b border-white/5">
                        <div className="absolute inset-0 border-b border-white/5 z-0" style={{ top: "25%" }}></div>
                        <div className="absolute inset-0 border-b border-white/5 z-0" style={{ top: "50%" }}></div>
                        <div className="absolute inset-0 border-b border-white/5 z-0" style={{ top: "75%" }}></div>

                        <div className="flex-1 bg-primary/20 rounded-t-sm z-10" style={{ height: "20%" }}></div>
                        <div className="flex-1 bg-primary/20 rounded-t-sm z-10" style={{ height: "40%" }}></div>
                        <div className="flex-1 bg-[#44e2cd]/60 rounded-t-sm z-10 shadow-[0_0_10px_rgba(68,226,205,0.3)]" style={{ height: "80%" }}></div>
                        <div className="flex-1 bg-primary/30 rounded-t-sm z-10" style={{ height: "55%" }}></div>
                        <div className="flex-1 bg-[#10b981]/80 rounded-t-sm z-10 shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ height: "95%" }}></div>
                        <div className="flex-1 bg-[#10b981]/40 rounded-t-sm z-10" style={{ height: "45%" }}></div>
                      </div>

                      <div className="flex justify-between text-[10px] font-mono text-outline">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                        <span>Sun</span>
                      </div>
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
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <User className="text-secondary w-5 h-5" /> Account Profile Details
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[9px] text-outline uppercase tracking-wider">Full Developer Name</span>
                          <span className="font-semibold text-white bg-[#0F172A] border border-white/5 rounded-xl px-4 py-3">
                            {profile?.fullName || user?.displayName || user?.email?.split('@')[0] || "Learner"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[9px] text-outline uppercase tracking-wider">Registered Email</span>
                          <span className="font-semibold text-white bg-[#0F172A] border border-white/5 rounded-xl px-4 py-3">
                            {user.email}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[9px] text-outline uppercase tracking-wider">Workspace Secure UID</span>
                          <span className="font-mono text-outline bg-[#0F172A] border border-white/5 rounded-xl px-4 py-3 truncate">
                            {user.uid}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[9px] text-outline uppercase tracking-wider">Authentication Provider</span>
                          <span className="font-semibold text-primary bg-[#0F172A] border border-white/5 rounded-xl px-4 py-3 capitalize">
                            {user.providerData?.[0]?.providerId || "Email / Password"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[9px] text-outline uppercase tracking-wider">Workspace Initialized At</span>
                          <span className="font-semibold text-on-surface-variant bg-[#0F172A] border border-white/5 rounded-xl px-4 py-3">
                            {profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : new Date().toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[9px] text-outline uppercase tracking-wider">Last Secure Access Audit</span>
                          <span className="font-semibold text-on-surface-variant bg-[#0F172A] border border-white/5 rounded-xl px-4 py-3">
                            {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : new Date().toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Calibration Panel */}
                  <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col gap-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Settings className="text-primary w-5.5 h-5.5" /> Platform Calibration Settings
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <label className="text-xs font-mono text-outline uppercase tracking-wider block mb-2">Target Stack &amp; Goal</label>
                        <input 
                          type="text" 
                          value={roadmap.pathName}
                          onChange={(e) => setRoadmap((prev) => prev ? { ...prev, pathName: e.target.value } : null)}
                          className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-mono text-outline uppercase tracking-wider block mb-2">Configure Time commitment</label>
                        <select 
                          value={weeklyHours}
                          onChange={(e) => setWeeklyHours(e.target.value)}
                          className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary"
                        >
                          <option value="1-5 hours">1-5 hours (Light exploration)</option>
                          <option value="5-10 hours">5-10 hours (Steady progress)</option>
                          <option value="10-20 hours">10-20 hours (Accelerated growth)</option>
                          <option value="20+ hours">20+ hours (Immersion mode)</option>
                        </select>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex flex-wrap gap-4">
                        <button 
                          onClick={async () => {
                            if (user && roadmap) {
                              try {
                                await saveRoadmap(user.uid, roadmap);
                                setNotice("Curriculum settings calibrated and persisted successfully.");
                                setTimeout(() => setNotice(""), 3000);
                              } catch (err) {
                                console.error("Error saving calibration to Firestore:", err);
                              }
                            }
                          }}
                          className="bg-primary hover:bg-[#8083ff] text-on-primary font-mono text-[10px] font-bold py-3.5 px-6 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Save Configurations
                        </button>
                        <button 
                          onClick={async () => {
                            if (user) {
                              if (confirm("Are you sure you want to completely reset your active roadmap? This will delete all your custom module configurations and progress in the Firestore database.")) {
                                try {
                                  await deleteRoadmap(user.uid);
                                  await updateOnboardingStatus(false);
                                  setRoadmap(null);
                                  setSelectedModule(null);
                                  setCurrentView("onboarding_1");
                                } catch (err) {
                                  console.error("Error deleting roadmap from Firestore:", err);
                                }
                              }
                            } else {
                              setCurrentView("onboarding_1");
                            }
                          }}
                          className="border border-[#f43f5e]/30 hover:bg-[#f43f5e]/5 text-[#f43f5e] font-mono text-[10px] font-bold py-3.5 px-6 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Reset &amp; Build New Path
                        </button>
                        {user && (
                          <button 
                            onClick={() => {
                              logOut();
                              setCurrentView("home");
                            }}
                            className="ml-auto bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-200 font-mono text-[10px] font-bold py-3.5 px-6 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
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
          </main>
          )}
        </div>
      )}

      {/* VIEW: SECURE CREDENTIALS AND ACCESS GATE */}
      {currentView === "auth" && (
        <AuthPage 
          onBackToHome={() => setCurrentView("home")}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

    </div>
  );
}
