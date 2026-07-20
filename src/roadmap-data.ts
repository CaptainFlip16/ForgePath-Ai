export type SkillStatus = 'completed' | 'current' | 'locked' | 'destination'

export type Skill = {
  id: string
  name: string
  shortName: string
  description: string
  whyItMatters: string
  status: SkillStatus
  prerequisites: string[]
  progress: number
  position: [number, number, number]
  project: {
    title: string
    description: string
  }
}

export const skills: Skill[] = [
  {
    id: 'fundamentals',
    name: 'Web Fundamentals',
    shortName: 'Fundamentals',
    description: 'Build a durable foundation in semantic HTML, modern CSS, and the browser platform.',
    whyItMatters: 'Every reliable AI product begins with an accessible, well-structured interface.',
    status: 'completed',
    prerequisites: [],
    progress: 100,
    position: [-6, -0.6, 0],
    project: { title: 'Responsive portfolio', description: 'Ship a polished, accessible personal site.' },
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    shortName: 'JavaScript',
    description: 'Master the language patterns that power interactive web applications.',
    whyItMatters: 'JavaScript is the connective tissue between your interface, APIs, and AI models.',
    status: 'completed',
    prerequisites: ['Fundamentals'],
    progress: 100,
    position: [-4, 0.5, -0.35],
    project: { title: 'Interactive data explorer', description: 'Transform and visualize a public dataset.' },
  },
  {
    id: 'apis',
    name: 'APIs',
    shortName: 'APIs',
    description: 'Learn to request, validate, transform, and safely present data from external services.',
    whyItMatters: 'The connective tissue of the modern web. Essential for integrating AI models into applications.',
    status: 'current',
    prerequisites: ['Programming', 'JavaScript'],
    progress: 25,
    position: [-1.5, -0.25, 0.35],
    project: { title: 'Build a practical API project', description: 'Connect a real interface to a production API.' },
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    shortName: 'Webhooks',
    description: 'Design event-driven systems that react to changes in real time.',
    whyItMatters: 'Webhooks let your products respond to external events without wasteful polling.',
    status: 'locked',
    prerequisites: ['APIs'],
    progress: 0,
    position: [0.8, 0.8, -0.75],
    project: { title: 'Event inbox', description: 'Receive, verify, and inspect webhook events.' },
  },
  {
    id: 'agents',
    name: 'AI Agents',
    shortName: 'AI Agents',
    description: 'Create intelligent systems that reason, use tools, and complete multi-step tasks.',
    whyItMatters: 'Agents turn model intelligence into dependable product workflows.',
    status: 'locked',
    prerequisites: ['APIs', 'Webhooks'],
    progress: 0,
    position: [2.5, -0.55, 0.2],
    project: { title: 'Research assistant', description: 'Build an agent with safe, focused tools.' },
  },
  {
    id: 'rag',
    name: 'RAG Systems',
    shortName: 'RAG',
    description: 'Ground AI responses in relevant, trusted, and current information.',
    whyItMatters: 'Retrieval makes AI applications more accurate, useful, and specific to your users.',
    status: 'locked',
    prerequisites: ['AI Agents'],
    progress: 0,
    position: [4.35, 0.7, -0.45],
    project: { title: 'Knowledge copilot', description: 'Answer questions from a curated document set.' },
  },
  {
    id: 'portfolio',
    name: 'Portfolio Project',
    shortName: 'Portfolio',
    description: 'Combine every skill into one credible, production-ready AI application.',
    whyItMatters: 'A finished product proves you can turn technical knowledge into user value.',
    status: 'destination',
    prerequisites: ['APIs', 'Webhooks', 'AI Agents', 'RAG'],
    progress: 0,
    position: [6.1, -0.15, 0.55],
    project: { title: 'Launch your capstone', description: 'Design, build, and publish a complete AI product.' },
  },
]

export const currentSkill = skills.find((skill) => skill.status === 'current') ?? skills[0]
