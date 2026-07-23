import { Roadmap, Module, ModuleProject } from "./types";

export function normalizeN8nRoadmap(data: any, fallbackGoal: string, fallbackBuild: string): Roadmap {
  if (!data) {
    throw new Error("Empty response received from n8n webhook.");
  }

  // 1. Unwrap nested response wrappers if present
  let raw = data;
  if (Array.isArray(data) && data.length > 0) {
    raw = data[0];
  }
  if (raw.body) {
    try {
      raw = typeof raw.body === 'string' ? JSON.parse(raw.body) : raw.body;
    } catch (e) {
      // keep raw
    }
  }
  if (raw.roadmap) raw = raw.roadmap;
  else if (raw.data) raw = raw.data;
  else if (raw.output) raw = raw.output;
  
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch (e) {
      // keep raw
    }
  }

  // Extract path name
  const pathName = raw.roadmapTitle || raw.pathName || raw.title || raw.goal || fallbackGoal || "AI Engineering Path";

  // Extract skills / modules
  const rawSkills = raw.skills || raw.modules || raw.nodes || raw.steps || [];

  if (!Array.isArray(rawSkills) || rawSkills.length === 0) {
    throw new Error("Invalid response format: No skills or modules found in n8n response.");
  }

  const modules: Module[] = rawSkills.map((item: any, idx: number) => {
    const rawStatus = String(item.status || "").toLowerCase();
    let status: 'Mastered' | 'In Progress' | 'Locked' = 'Locked';

    if (rawStatus === 'completed' || rawStatus === 'mastered' || rawStatus === 'done' || rawStatus === 'passed') {
      status = 'Mastered';
    } else if (rawStatus === 'current' || rawStatus === 'in progress' || rawStatus === 'in_progress' || rawStatus === 'active') {
      status = 'In Progress';
    } else {
      status = 'Locked';
    }

    const title = item.title || item.name || item.skillName || `Milestone ${idx + 1}`;
    const id = item.id || `mod_${idx + 1}_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const description = item.description || item.summary || item.details || `Master key principles and practical concepts for ${title}.`;
    const whyItMatters = item.whyItMatters || item.why_it_matters || item.importance || `Essential foundational capability for ${pathName}.`;

    let prerequisites: string[] = [];
    if (Array.isArray(item.prerequisites)) {
      prerequisites = item.prerequisites.map((p: any) => typeof p === 'string' ? p : p.title || String(p));
    } else if (typeof item.prerequisites === 'string') {
      prerequisites = [item.prerequisites];
    } else if (idx > 0) {
      const prevTitle = rawSkills[idx - 1].title || rawSkills[idx - 1].name || `Milestone ${idx}`;
      prerequisites = [prevTitle];
    }

    // Recommended project
    let recProj: ModuleProject = {
      title: `${title} Portfolio Project`,
      description: `Build and deploy a real-world application showcasing ${title}.`
    };

    if (item.recommendedProject && typeof item.recommendedProject === 'object') {
      recProj = {
        title: item.recommendedProject.title || recProj.title,
        description: item.recommendedProject.description || recProj.description
      };
    } else if (item.project && typeof item.project === 'object') {
      recProj = {
        title: item.project.title || recProj.title,
        description: item.project.description || recProj.description
      };
    } else if (typeof item.recommendedProject === 'string') {
      recProj = { title: `${title} Capstone`, description: item.recommendedProject };
    }

    return {
      id,
      title,
      description,
      whyItMatters,
      prerequisites,
      recommendedProject: recProj,
      status
    };
  });

  // Ensure at least one module is set to 'In Progress' if none are
  const hasInProgress = modules.some((m) => m.status === 'In Progress');
  if (!hasInProgress && modules.length > 0) {
    const firstLocked = modules.find((m) => m.status === 'Locked');
    if (firstLocked) {
      firstLocked.status = 'In Progress';
    } else if (modules[0].status !== 'Mastered') {
      modules[0].status = 'In Progress';
    }
  }

  // Calculate overall progress
  const completedCount = modules.filter((m) => m.status === 'Mastered').length;
  const overallProgress = Math.round((completedCount / modules.length) * 100);

  return {
    pathName,
    overallProgress,
    modules
  };
}

export function generateFallbackRoadmap(become: string, build: string, skills: string[]): Roadmap {
  const goal = become || "AI Automation Developer";
  const targetProject = build || "Custom Portfolio Project";

  // Build sequential modules tailored to their target career path
  const modules: Roadmap["modules"] = [
    {
      id: "fundamentals",
      title: "Programming Fundamentals",
      description: `Core logic, variables, control flows, and basic computational thinking required for ${goal}.`,
      whyItMatters: "The logical foundation of all code and automation systems. You cannot orchestrate intelligence without basic control blocks.",
      prerequisites: ["None"],
      recommendedProject: {
        title: "Syntax Orchestrator",
        description: "Build a modular CLI utility that automates directory scanning and filters logs."
      },
      status: "Mastered"
    },
    {
      id: "js",
      title: "JavaScript & Async Systems",
      description: "Asynchronous execution loops, promises, fetch cycles, and dynamic state bindings.",
      whyItMatters: "The primary connective runtime for APIs and web automation. Essential for building real-time scrapers or integration connectors.",
      prerequisites: ["Programming Fundamentals"],
      recommendedProject: {
        title: "Async Data Scraper",
        description: "Create a Node.js script that concurrently pulls and formats structured data from multiple public static endpoints."
      },
      status: "Mastered"
    },
    {
      id: "react",
      title: "React & Component Trees",
      description: "Declarative state, layout rendering, visual lifecycles, and modern hook orchestration.",
      whyItMatters: "Enables you to build clean, performant interfaces that let users interact with your background AI engines seamlessly.",
      prerequisites: ["JavaScript & Async Systems"],
      recommendedProject: {
        title: "Dynamic Control Hub",
        description: "Design an interactive, glassmorphic panel to visualize real-time structured data feeds."
      },
      status: "Mastered"
    },
    {
      id: "apis",
      title: "APIs & Integration Core",
      description: "HTTP verbs, REST principles, JSON body mapping, token authorization headers, and rate-limiting handles.",
      whyItMatters: `The connective tissue of the modern web. Vital for connecting ${goal} pipelines to external AI engines like Gemini.`,
      prerequisites: ["React & Component Trees"],
      recommendedProject: {
        title: "Weather Intelligence Dashboard",
        description: "Build a responsive interface that queries a real meteorological API, parses weather intelligence, and displays forecasts."
      },
      status: "In Progress"
    },
    {
      id: "webhooks",
      title: "Webhooks & Event Triggers",
      description: "Event-driven architecture, webhook listeners, push-notification relays, and serverless background workers.",
      whyItMatters: "Moves your applications from polling-based architecture to reactive systems that trigger instant AI logic on external events.",
      prerequisites: ["APIs & Integration Core"],
      recommendedProject: {
        title: "Instant Notification Relay",
        description: "Create an active listener endpoint that triggers a custom automation script when an external Git push occurs."
      },
      status: "Locked"
    },
    {
      id: "ai_agents",
      title: "AI Agents & Autonomous LLMs",
      description: "Function calling, prompt engineering structures, agentic memory loops, and Gemini API streaming.",
      whyItMatters: `The ultimate goal of ${goal}. Empowers your applications to reason, utilize tools autonomously, and solve open-ended tasks.`,
      prerequisites: ["Webhooks & Event Triggers"],
      recommendedProject: {
        title: "Autonomous Path Navigator",
        description: `Build a highly customized conversational assistant trained to solve issues on ${targetProject}.`
      },
      status: "Locked"
    }
  ];

  // If they selected certain skills, let's mark them as mastered or customize
  return {
    pathName: goal,
    overallProgress: 25,
    modules: modules
  };
}

/**
 * Formats AI chat messages according to UI formatting guidelines:
 * 1. Converts Markdown headings (# or ##) into simple bolding (**Header**).
 * 2. Converts Markdown pipe tables into clean bulleted list items.
 * 3. Ensures clean spacing between sections.
 */
export function formatChatMessageText(text: string): string {
  if (!text) return "";

  // 1. Replace markdown headers (# Header, ## Header, ### Header) with bold text **Header**
  let formatted = text.replace(/^(#{1,6})\s+(.+)$/gm, (_, _hash, content) => {
    return `**${content.trim()}**`;
  });

  // 2. Parse and convert Markdown tables (lines with pipe characters '|') into bullet points
  const lines = formatted.split("\n");
  const processedLines: string[] = [];
  let inTable = false;
  let headers: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if line looks like a table row (contains | and has at least 2 columns)
    if (line.startsWith("|") || (line.includes("|") && line.endsWith("|"))) {
      // Split by pipe
      const cells = line
        .split("|")
        .map((c) => c.trim())
        .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);

      // Check if this is a separator line (e.g. |---|---| or |:---|)
      const isSeparator = cells.length > 0 && cells.every((c) => /^[:\-\s]+$/.test(c));

      if (isSeparator) {
        inTable = true;
        continue;
      }

      if (!inTable && cells.length > 0) {
        // This is the header row
        headers = cells;
        inTable = true;
      } else if (cells.length > 0) {
        // This is a data row
        const rowParts = cells.map((cell, idx) => {
          const headerLabel = headers[idx] ? `**${headers[idx]}**: ` : "";
          return `${headerLabel}${cell}`;
        });
        processedLines.push(`• ${rowParts.join(" — ")}`);
      }
    } else {
      if (inTable) {
        inTable = false;
        headers = [];
      }
      processedLines.push(lines[i]);
    }
  }

  formatted = processedLines.join("\n");

  // 3. Clean up excessive blank lines (more than 2 consecutive newlines)
  formatted = formatted.replace(/\n{3,}/g, "\n\n").trim();

  return formatted;
}
