export interface ModuleProject {
  title: string;
  description: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  whyItMatters: string;
  prerequisites: string[];
  recommendedProject: ModuleProject;
  status: 'Mastered' | 'In Progress' | 'Locked';
}

export interface Roadmap {
  pathName: string;
  overallProgress: number;
  modules: Module[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
