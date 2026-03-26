/**
 * Tool → Skill mappings.
 * Maps each tool name to the canonical skill names it trains.
 * These are the 183 skills from the platform's skill taxonomy.
 */

export const TOOL_SKILL_MAP: Record<string, string[]> = {
  // Foundation Models
  "ChatGPT": ["Prompt Engineering", "AI Content Generation", "AI-Augmented Research", "Natural Language Processing", "AI Tool Integration"],
  "Claude": ["Prompt Engineering", "AI Content Generation", "AI Code Audit", "AI-Augmented Research", "Long-Context Analysis"],
  "Gemini": ["Prompt Engineering", "Multimodal AI Analysis", "AI-Augmented Research", "AI Tool Integration"],
  "Llama": ["Model Fine-Tuning", "AI Infrastructure Management", "Open Source AI Deployment"],
  "Mistral": ["Model Fine-Tuning", "Multilingual AI", "Open Source AI Deployment"],
  "Nemotron": ["Model Fine-Tuning", "AI Safety & Alignment", "RAG Architecture"],
  "Cohere": ["RAG Architecture", "Semantic Search", "Enterprise AI Integration"],

  // Coding Agents
  "Cursor": ["AI-Augmented Development", "Prompt Engineering", "AI Code Audit", "Code Refactoring with AI"],
  "Claude Code": ["AI-Augmented Development", "Agentic Coding", "Test-Driven Development with AI", "DevOps Automation"],
  "Codex": ["AI-Augmented Development", "Agentic Coding", "Code Review Automation"],
  "GitHub Copilot": ["AI-Augmented Development", "Prompt Engineering", "Code Documentation"],
  "Windsurf": ["AI-Augmented Development", "Code Refactoring with AI", "Prompt Engineering"],
  "Lovable": ["AI-Augmented Development", "Rapid Prototyping", "No-Code AI Building"],

  // Agentic Frameworks
  "Open Claw": ["AI Agent Architecture & Orchestration", "Agentic Workflow Design", "Tool-Use Programming"],
  "Nemo Claw": ["AI Agent Architecture & Orchestration", "Enterprise AI Security", "AI Policy & Governance"],
  "LangChain": ["AI Agent Architecture & Orchestration", "RAG Architecture", "Tool-Use Programming", "AI Pipeline Design"],
  "LangGraph": ["Multi-Agent Systems", "AI Workflow Orchestration", "State Management for AI"],
  "CrewAI": ["Multi-Agent Systems", "AI Agent Architecture & Orchestration", "Task Delegation to AI"],
  "AutoGen": ["Multi-Agent Systems", "Conversational AI Design", "AI Workflow Orchestration"],
  "Open Shell": ["AI Security Engineering", "AI Policy & Governance", "Enterprise AI Security"],

  // Data Platforms
  "Snowflake": ["Data Architecture Design", "AI-Powered Analytics", "SQL for AI Workflows"],
  "Databricks": ["Data Architecture Design", "ML Pipeline Engineering", "Data Lakehouse Management"],
  "BigQuery": ["Data Architecture Design", "AI-Powered Analytics", "Cloud Data Engineering"],
  "KUDF": ["GPU-Accelerated Data Processing", "Data Engineering at Scale"],
  "KVS": ["Vector Database Management", "Semantic Search", "RAG Architecture"],

  // MLOps & Infra
  "CUDA": ["GPU Computing", "AI Infrastructure Management"],
  "PyTorch": ["Deep Learning Engineering", "Model Training & Optimization", "AI Research"],
  "Hugging Face": ["Model Fine-Tuning", "AI Model Deployment", "Open Source AI Deployment"],
  "Weights & Biases": ["ML Experiment Tracking", "Model Monitoring", "MLOps"],
  "Dynamo": ["AI Inference Optimization", "AI Infrastructure Management"],
  "Kubernetes": ["AI Infrastructure Management", "Container Orchestration", "Cloud-Native AI Deployment"],
  "Fireworks AI": ["AI Inference Optimization", "Model Serving", "AI Model Deployment"],

  // Cloud AI
  "Azure AI Foundry": ["Cloud AI Deployment", "Enterprise AI Integration", "Model Fine-Tuning"],
  "AWS Bedrock": ["Cloud AI Deployment", "RAG Architecture", "Enterprise AI Integration"],
  "Google Vertex AI": ["Cloud AI Deployment", "ML Pipeline Engineering", "Model Training & Optimization"],
  "Oracle Cloud AI": ["Cloud AI Deployment", "Enterprise AI Integration"],
  "CoreWeave": ["AI Infrastructure Management", "GPU Cloud Computing"],

  // Simulation
  "Omniverse": ["Digital Twin Engineering", "Simulation & Validation", "3D AI Visualization"],
  "Cosmos": ["Synthetic Data Generation", "World Model Engineering"],
  "Newton": ["Physics Simulation", "Robotics Training"],
  "Earth 2": ["Climate AI", "Physics-Informed Machine Learning"],
  "DSX": ["AI Factory Operations", "Infrastructure Optimization"],

  // Robotics
  "Isaac Lab": ["Robotics Simulation", "Reinforcement Learning", "Physical AI Engineering"],
  "Groot": ["Humanoid Robotics", "Physical AI Engineering"],
  "Alpamo": ["Autonomous Systems", "Self-Driving AI", "Reasoning AI"],

  // Cybersecurity
  "CrowdStrike Falcon": ["AI-Powered Threat Detection", "Cybersecurity Operations", "Incident Response"],
  "Confidential Computing": ["AI Data Privacy", "Compliance Engineering", "Secure AI Deployment"],

  // Enterprise AI
  "Salesforce Einstein": ["CRM AI Automation", "Predictive Analytics", "AI Workflow Automation"],
  "Palantir AIP": ["Operational AI", "Data Fusion", "Decision Intelligence"],
  "IBM watsonx": ["Enterprise AI Integration", "AI Governance", "Data Management"],
  "ServiceNow AI Agents": ["IT Automation with AI", "AI Workflow Automation", "Enterprise Service Management"],
  "SAP Joule": ["ERP AI Integration", "Supply Chain AI", "Enterprise AI Copilots"],

  // Design & Media
  "Midjourney": ["AI Image Generation", "Creative AI Direction", "Visual Prompt Engineering"],
  "DALL-E": ["AI Image Generation", "Visual Prompt Engineering", "AI Content Generation"],
  "Runway": ["AI Video Generation", "Creative AI Direction", "Motion Design with AI"],
  "RTX / DLSS": ["Real-Time Rendering", "Graphics AI"],
  "Figma AI": ["AI-Assisted Design", "UI/UX with AI", "Design Automation"],
  "Canva AI": ["AI-Assisted Design", "Marketing Content AI", "Visual Communication"],

  // Search & Retrieval
  "Perplexity": ["AI-Augmented Research", "Information Synthesis", "Fact-Checking with AI"],
  "NotebookLM": ["AI-Augmented Research", "Document Analysis", "Knowledge Management with AI"],

  // Networking
  "Aerial AI RAN": ["Telecom AI", "Edge Computing"],
  "Spectrum X": ["AI Networking", "Data Center Architecture"],
  "NVLink": ["AI Infrastructure Management", "GPU Scaling"],

  // Hardware
  "Blackwell": ["AI Infrastructure Management", "GPU Architecture"],
  "Vera Rubin": ["AI Infrastructure Management", "Next-Gen Computing"],
  "Feynman": ["AI Infrastructure Management", "Future Computing Architecture"],
  "Groq LPU": ["AI Inference Optimization", "Low-Latency AI"],

  // Vertical
  "Bionemо": ["Computational Biology", "Drug Discovery AI", "Molecular Design"],
  "Parabricks": ["Genomics AI", "Clinical AI"],
  "cuOpt": ["Supply Chain Optimization", "Logistics AI", "Operations Research"],
};

/** Get skills for a tool by name */
export function getSkillsForTool(toolName: string): string[] {
  return TOOL_SKILL_MAP[toolName] || [];
}

/** Get all tools that train a specific skill */
export function getToolsForSkill(skillName: string): string[] {
  const tools: string[] = [];
  for (const [tool, skills] of Object.entries(TOOL_SKILL_MAP)) {
    if (skills.includes(skillName)) tools.push(tool);
  }
  return tools;
}

/** Get all unique skill names across all tools */
export function getAllMappedSkills(): string[] {
  const skills = new Set<string>();
  for (const arr of Object.values(TOOL_SKILL_MAP)) {
    for (const s of arr) skills.add(s);
  }
  return [...skills].sort();
}
