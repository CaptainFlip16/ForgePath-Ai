# 🌌 ForgePath AI - Intelligent Tech Career Navigator

**ForgePath AI** is an immersive, AI-powered tech career navigator, personalized learning roadmap constructor, interactive 3D skill universe, portfolio project platform, and context-aware AI Mentor.

It is designed to solve a real problem faced by students, self-taught programmers, beginner developers, and aspiring technology professionals: **not knowing what to learn, in what order to learn it, how to track progress, and where to get personalized guidance.**

Instead of forcing every learner through the same generic curriculum, ForgePath AI creates a personalized learning path based on each user's:

- 🎯 **Career Goal**
- 🧠 **Current Skill Level**
- ⏱️ **Weekly Time Commitment**
- 📚 **Learning Preferences**
- 🏗️ **Desired Outcomes**
- 💻 **Project Goals**

The platform then transforms this information into an interactive, AI-powered learning journey.

---

## 🔗 Live Application Link

* 🚀 **Live Public URL**: [👉 Click here to access ForgePath AI](https://ais-pre-tiw3is6zfwxlv42kh2bilf-481589291129.asia-southeast1.run.app)
* 🔗 **Development Workspace URL**: [Access Active Preview](https://ais-dev-tiw3is6zfwxlv42kh2bilf-481589291129.asia-southeast1.run.app)
* 💻 **Public GitHub Repository**: [View the Source Code](YOUR_GITHUB_REPOSITORY_URL)

---

## 🎯 The Problem ForgePath AI Solves

The modern technology learning ecosystem is full of resources, courses, tutorials, documentation, and frameworks.

However, having too many resources creates another problem: **information overload**.

Many learners struggle with:

- ❌ Not knowing where to start
- ❌ Not knowing what to learn next
- ❌ Following random tutorials without a structured path
- ❌ Losing motivation and visibility into their progress
- ❌ Not knowing how individual skills connect to real-world projects
- ❌ Receiving generic AI answers that do not understand their actual learning journey

ForgePath AI addresses this problem by creating a personalized learning environment that connects:

> **The learner → Their goals → Their roadmap → Their skills → Their projects → Their progress → Their AI Mentor**

---

## 👥 Who Is ForgePath AI For?

ForgePath AI is designed for:

- 🎓 **Students** learning technology and programming
- 👨‍💻 **Beginner and aspiring developers**
- 🧑‍💻 **Self-taught programmers**
- 🚀 **Career switchers** transitioning into technology
- 🛠️ **Learners** who need a structured path toward a specific technical goal

---

## ✨ Core Features

### 🧭 Personalized AI Learning Roadmaps

Users complete an onboarding process that captures their background and goals. This information is processed by an AI-powered workflow to generate a structured learning roadmap featuring:

- Structured skills & recommended learning order
- Comprehensive skill descriptions & importance rationale
- Prerequisites & dependencies
- Current vs. locked learning stages
- Recommended portfolio projects

---

### 🌌 Interactive 3D Skill Universe

The personalized roadmap is transformed into an interactive 3D Skill Universe, where skills are visualized as interactive 3D nodes/planets:

- 🔒 **Locked**
- 🟢 **Unlocked**
- ✨ **Current Skill**
- ✅ **Completed**

When a user completes a skill, the 3D universe updates, progress calculates, the next skill unlocks, and state changes are persisted directly to Firebase Firestore.

---

### 🤖 ForgePath AI Mentor

A context-aware AI Mentor built around the user's specific roadmap and progress. Instead of serving generic answers, the mentor evaluates:

- Personalized roadmap context
- Current active skill & completed milestones
- Learning goals & overall progress

#### AI Mentor Capabilities
- 💬 Text-based queries
- 🎙️ Voice input support
- 🧠 Personalized, roadmap-aware explanations
- 🔊 Speak Aloud (Text-to-Speech) responses
- 🛠️ Deep technical guidance

---

### 🎙️ Voice Input & 🔊 Speak Aloud

Users can interact with the AI Mentor using naturally spoken language through integrated speech recognition and text-to-speech technologies.

```text
User speaks ──> Browser Speech Recognition ──> Text converted ──> AI Mentor processing ──> Audio response
```

---

### 📊 Persistent Progress Analytics & Tracking

- **Data Persistence**: Powered by Firebase Firestore. Skill status, completion percentages, and project milestones persist seamlessly across logins and browser refreshes.
- **Progress Insights**: Real-time progress history tracking without fake static visual metrics.

---

### 💻 Portfolio Projects

Practical project-based learning connected directly to acquired skills:

- Detailed project scope, difficulty level, and estimated completion time
- Step-by-step milestones & skill requirements
- Unlockable progression tied to roadmap advancement

---

### 🔐 Security, Authentication & Data Isolation

- **Firebase Authentication**: Supports Email/Password & Google Sign-In.
- **Data Isolation**: User data structures are tied strictly to unique Firebase UIDs (`uid`), ensuring robust data separation and privacy across users.

---

## 🔄 n8n AI Automation Architecture

n8n acts as the automation and orchestration engine:

### 1. Roadmap Generation
```text
Onboarding Complete ──> Frontend Webhook ──> Input Validation ──> AI Agent ──> Firestore Persistence ──> Frontend Render
```

### 2. AI Mentor Query Workflow
```text
User Question ──> n8n Webhook ──> UID Validation ──> Fetch Firestore Context ──> Contextual AI Response
```

### 3. Email Notification & Status Tracking Workflow
```text
Parse AI Output ──> Gmail Node ──┬──> [Success] ──> Update Sheet: Sent  ───┬──> Respond to Webhook
                                 └──> [Failure] ──> Update Sheet: Failed ──┘ 
```

---

## 🏗️ Application Architecture

```text
┌──────────────────────────────────────────┐
│          ForgePath AI Frontend           │
│ React + TypeScript + Vite                │
│ Tailwind CSS                             │
│ React Three Fiber + Three.js             │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│          Firebase Authentication         │
│ Email/Password + Google Authentication   │
│ Unique User UID                          │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│            Firebase Firestore            │
│ User Profile & Preferences               │
│ Personalized Roadmap & Progress History  │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│                  n8n                     │
│ Webhooks & Input Validation              │
│ Context Retrieval & AI Agent             │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│          AI-Powered Experience           │
│ Personalized Roadmaps & AI Mentor        │
│ Voice & Audio Interactions               │
└──────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack & Services

| Category | Tools & Technologies |
| :--- | :--- |
| **Frontend** | React, TypeScript, JavaScript, Vite, Tailwind CSS, React Three Fiber, Three.js, React Three Drei, Framer Motion |
| **Backend & Storage** | Firebase Authentication, Firebase Firestore, n8n, Webhooks |
| **AI & Orchestration** | Google Gemini, OpenRouter, AI Agents, Context-Aware System Prompts |
| **Development** | Google AI Studio, Stitch, v0, GitHub, Google Cloud Run |

---

## 🎨 Design System

- 🌙 **Dark Theme** & ☀️ **Light Theme** support
- 🎨 Theme-aware CSS color tokens & smooth transitions
- 🌌 Animated, responsive canvas backgrounds
- 📱 Mobile-first responsive layouts

---

## 📸 Screenshots

### 🏠 Landing Page
The landing page introduces the ForgePath AI platform and its personalized learning experience.

<p align="center">
  <img width="100%" alt="Landing Page" src="https://github.com/user-attachments/assets/fea24686-b9cc-4b15-8016-04fe963db03a" />
</p>

---

### 🌌 3D Skill Universe
Interactive 3D visualization of the user's personalized learning roadmap and skill progress.

<p align="center">
  <img width="100%" alt="Dashboard" src="https://github.com/user-attachments/assets/654a051c-4259-4171-bf8e-8d5c231461d4" />
</p>

---

### 🤖 AI Mentor
Personalized learning guidance tailored specifically to the user's current roadmap and progress.

<p align="center">
  <img width="100%" alt="AI Mentor" src="https://github.com/user-attachments/assets/9a0a25af-867c-49b7-8c0b-17a6de450eee" />
</p>

---

### 📊 Progress Analytics
Real user progress and persistent learning history stored and retrieved from Firestore.

<p align="center">
  <img width="2016" height="2600" alt="Progress Page" src="https://github.com/user-attachments/assets/4bd1c8a2-b6e1-4767-aa3b-6e4c7e39fdb0" />
</p>

---

## 🚀 How to Run Locally

### Prerequisites

Make sure you have installed:
- [Node.js](https://nodejs.org/) (v18+)
- `npm` or `yarn`
- `git`

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   ```

2. **Navigate to the Project Directory**
   ```bash
   cd forgepath-ai
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Configure Environment Variables**

   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   ```

   > ⚠️ **Security Note:** Never commit API keys, private credentials, or `.env` files to public repositories.

5. **Start Development Server**
   ```bash
   npm run dev
   ```

---

## 🌟 Why ForgePath AI?

> **Learner** ──> **Personalized Goal** ──> **AI Roadmap** ──> **3D Universe** ──> **Progress Tracking** ──> **Portfolio Projects** ──> **AI Mentor**

ForgePath AI combines AI, 3D visualization, automation, persistent storage, and project-based learning into a single cohesive, personal learning assistant.

---

## 👨‍💻 Built By

**Muhammad Ahmad Shafique**  
*Slot 1*  
**Air University, Islamabad**  

*An individual end-to-end AI application project.*

---

## 🎓 Final Project

Created for the **ACT AI Final Project — Ship Your AI App**.  
*Independently designed, developed, integrated, and deployed.*
