import { Roadmap } from "./types";

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
