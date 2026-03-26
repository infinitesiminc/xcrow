/**
 * AI Tool Registry — Enterprise-ready tool catalogue.
 * Covers tools across the modern AI stack: from foundation models to deployment.
 * Each tool is tagged as "learnable" (users can practice) or "reference" (industry context).
 */

export type ToolCategory =
  | "foundation-models"
  | "coding-agents"
  | "agentic-frameworks"
  | "data-platforms"
  | "mlops-infra"
  | "cloud-ai"
  | "simulation-digital-twin"
  | "robotics-physical-ai"
  | "cybersecurity"
  | "enterprise-ai"
  | "design-media"
  | "search-retrieval"
  | "networking-edge"
  | "hardware-compute"
  | "vertical-industry";

export type ToolMaturity = "ga" | "preview" | "beta" | "research";
export type ToolType = "learnable" | "reference";

export interface ToolProduct {
  name: string;
  description: string;
  type: ToolType;
  url?: string;
  useCases?: string[];
}

export interface GTCTool {
  name: string;
  company: string;
  category: ToolCategory;
  description: string;
  /** Latest known version or release name */
  version?: string;
  url?: string;
  icon: string;
  /** Whether users can practice with this tool or it's industry context */
  type: ToolType;
  /** GA, Preview, Beta, or Research */
  maturity: ToolMaturity;
  /** Free, Freemium, Paid, Enterprise, Open Source */
  pricing?: string;
  /** Skill IDs this tool maps to (from canonical 183 skills) */
  skillMappings?: string[];
  /** Use-case tags for enterprise filtering */
  useCases?: string[];
  /** Sub-products within the platform */
  products?: ToolProduct[];
}

export const GTC_TOOLS: GTCTool[] = [
  // ═══════════════════════════════════════════
  // FOUNDATION MODELS
  // ═══════════════════════════════════════════
  { name: "ChatGPT", company: "OpenAI", category: "foundation-models", version: "GPT-5", description: "Flagship conversational AI with reasoning, vision, and tool-use capabilities.", icon: "💬", url: "https://chat.openai.com", type: "learnable", maturity: "ga", pricing: "Freemium", useCases: ["content-creation", "analysis", "coding", "research"], products: [
    { name: "ChatGPT", description: "Conversational AI interface for reasoning, writing, and analysis.", type: "learnable", url: "https://chat.openai.com" },
    { name: "GPT-5 API", description: "API access to GPT-5 for building custom applications.", type: "learnable", url: "https://platform.openai.com" },
    { name: "DALL-E 3", description: "Text-to-image generation integrated into ChatGPT.", type: "learnable" },
    { name: "Whisper", description: "Speech-to-text transcription and translation model.", type: "learnable" },
    { name: "Codex", description: "Cloud-based AI coding agent for parallel task execution.", type: "learnable" },
    { name: "Sora", description: "Text-to-video generation model for creative content.", type: "learnable", url: "https://openai.com/sora" },
  ] },
  { name: "Claude", company: "Anthropic", category: "foundation-models", version: "Claude 4 Opus", description: "Safety-focused reasoning model excelling at long-context analysis, coding, and nuanced tasks.", icon: "🟠", url: "https://claude.ai", type: "learnable", maturity: "ga", pricing: "Freemium", useCases: ["analysis", "coding", "writing", "research"] },
  { name: "Gemini", company: "Google", category: "foundation-models", version: "Gemini 2.5 Pro", description: "Multimodal model with native image, video, and code understanding across Google's ecosystem.", icon: "✨", url: "https://gemini.google.com", type: "learnable", maturity: "ga", pricing: "Freemium", useCases: ["multimodal", "analysis", "coding", "search"] },
  { name: "Llama", company: "Meta", category: "foundation-models", version: "Llama 4", description: "Open-weight frontier model family for self-hosted and fine-tuned deployments.", icon: "🦙", url: "https://llama.meta.com", type: "learnable", maturity: "ga", pricing: "Open Source", useCases: ["self-hosted", "fine-tuning", "enterprise-ai"] },
  { name: "Mistral", company: "Mistral AI", category: "foundation-models", version: "Mistral Large 2", description: "European open-source LLM with strong multilingual and reasoning capabilities.", icon: "🌬️", url: "https://mistral.ai", type: "learnable", maturity: "ga", pricing: "Open Source", useCases: ["multilingual", "enterprise-ai", "self-hosted"] },
  { name: "Nemotron", company: "NVIDIA", category: "foundation-models", version: "Nemotron 4", description: "Open frontier reasoning models for language, vision, RAG, safety, and speech.", icon: "🤖", type: "reference", maturity: "ga", pricing: "Open Source", useCases: ["enterprise-ai", "rag", "safety"] },
  { name: "Cohere", company: "Cohere", category: "foundation-models", version: "Command R+", description: "Enterprise LLM optimized for RAG, search, and business workflows.", icon: "🗣️", url: "https://cohere.com", type: "learnable", maturity: "ga", pricing: "Paid", useCases: ["enterprise-ai", "rag", "search"] },

  // ═══════════════════════════════════════════
  // CODING AGENTS
  // ═══════════════════════════════════════════
  { name: "Cursor", company: "Anysphere", category: "coding-agents", version: "1.0", description: "AI-first code editor — chat with your codebase, generate and refactor code inline.", icon: "✏️", url: "https://cursor.com", type: "learnable", maturity: "ga", pricing: "Freemium", useCases: ["software-development", "code-review", "refactoring"] },
  { name: "Claude Code", company: "Anthropic", category: "coding-agents", version: "GA", description: "Terminal-based agentic coder — reads files, compiles, tests, and iterates autonomously.", icon: "🔨", url: "https://docs.anthropic.com/en/docs/claude-code", type: "learnable", maturity: "ga", pricing: "Paid", useCases: ["software-development", "testing", "devops"] },
  { name: "Codex", company: "OpenAI", category: "coding-agents", version: "2025", description: "Cloud-based AI coding agent for parallel task execution and PR generation.", icon: "👨‍💻", type: "learnable", maturity: "ga", pricing: "Paid", useCases: ["software-development", "automation", "code-review"] },
  { name: "GitHub Copilot", company: "GitHub", category: "coding-agents", version: "X", description: "AI pair programmer integrated into VS Code, JetBrains, and CLI workflows.", icon: "🐙", url: "https://github.com/features/copilot", type: "learnable", maturity: "ga", pricing: "Freemium", useCases: ["software-development", "code-completion", "documentation"] },
  { name: "Windsurf", company: "Codeium", category: "coding-agents", version: "2025", description: "AI-powered IDE with deep codebase understanding and flow-state coding.", icon: "🏄", url: "https://codeium.com/windsurf", type: "learnable", maturity: "ga", pricing: "Freemium", useCases: ["software-development", "refactoring"] },
  { name: "Lovable", company: "Lovable", category: "coding-agents", version: "2025", description: "AI full-stack app builder — describe what you want, get a deployed web app.", icon: "💜", url: "https://lovable.dev", type: "learnable", maturity: "ga", pricing: "Freemium", useCases: ["app-development", "prototyping", "no-code"] },

  // ═══════════════════════════════════════════
  // AGENTIC FRAMEWORKS
  // ═══════════════════════════════════════════
  { name: "Open Claw", company: "Open Source", category: "agentic-frameworks", version: "1.0", description: "Agentic OS — spawns sub-agents, uses tools, schedules cron jobs. The 'Linux of agents.'", icon: "🦀", type: "learnable", maturity: "ga", pricing: "Open Source", useCases: ["agent-orchestration", "automation", "tool-use"] },
  { name: "Nemo Claw", company: "NVIDIA", category: "agentic-frameworks", version: "GA", description: "Enterprise-secure Open Claw with policy guardrails, privacy router, and Open Shell.", icon: "🛡️", type: "reference", maturity: "ga", pricing: "Enterprise", useCases: ["enterprise-ai", "security", "compliance"] },
  { name: "LangChain", company: "LangChain", category: "agentic-frameworks", version: "0.3", description: "Agent orchestration framework — 1B+ downloads for building custom AI pipelines.", icon: "🔗", url: "https://langchain.com", type: "learnable", maturity: "ga", pricing: "Open Source", useCases: ["agent-orchestration", "rag", "tool-use"] },
  { name: "LangGraph", company: "LangChain", category: "agentic-frameworks", version: "0.2", description: "Stateful multi-agent workflow framework built on LangChain.", icon: "📊", url: "https://langchain.com/langgraph", type: "learnable", maturity: "ga", pricing: "Open Source", useCases: ["multi-agent", "workflow", "state-management"] },
  { name: "CrewAI", company: "CrewAI", category: "agentic-frameworks", version: "2.0", description: "Multi-agent orchestration — role-based agents collaborating on complex tasks.", icon: "👥", url: "https://crewai.com", type: "learnable", maturity: "ga", pricing: "Open Source", useCases: ["multi-agent", "automation", "research"] },
  { name: "AutoGen", company: "Microsoft", category: "agentic-frameworks", version: "0.4", description: "Multi-agent conversation framework for building complex AI workflows.", icon: "🔄", url: "https://github.com/microsoft/autogen", type: "learnable", maturity: "ga", pricing: "Open Source", useCases: ["multi-agent", "conversation", "automation"] },
  { name: "Open Shell", company: "NVIDIA", category: "agentic-frameworks", version: "GA", description: "Security layer for Open Claw — policy engine and privacy router for enterprise agents.", icon: "🔒", type: "reference", maturity: "ga", pricing: "Open Source", useCases: ["security", "policy", "compliance"] },

  // ═══════════════════════════════════════════
  // DATA PLATFORMS
  // ═══════════════════════════════════════════
  { name: "Snowflake", company: "Snowflake", category: "data-platforms", version: "2025", description: "Cloud data platform with Cortex AI for analytics, ML, and LLM-powered queries.", icon: "❄️", url: "https://snowflake.com", type: "learnable", maturity: "ga", pricing: "Paid", useCases: ["data-warehouse", "analytics", "ml"], products: [
    { name: "Snowflake Cortex", description: "AI/ML engine for LLM-powered queries and predictions inside Snowflake.", type: "learnable", useCases: ["analytics", "llm"] },
    { name: "Snowpark", description: "Developer framework for building data pipelines in Python, Java, and Scala.", type: "learnable", useCases: ["data-engineering"] },
    { name: "Streamlit", description: "Python framework for building interactive data apps and dashboards.", type: "learnable", url: "https://streamlit.io", useCases: ["data-apps", "visualization"] },
    { name: "Arctic", description: "Open-source enterprise LLM optimized for SQL and coding tasks.", type: "learnable", useCases: ["coding", "sql"] },
  ] },
  { name: "Databricks", company: "Databricks", category: "data-platforms", version: "2025", description: "Unified data + AI lakehouse platform with MosaicML training capabilities.", icon: "🧱", url: "https://databricks.com", type: "learnable", maturity: "ga", pricing: "Paid", useCases: ["data-lakehouse", "ml-training", "analytics"], products: [
    { name: "Delta Lake", description: "Open-source storage layer for reliable data lakes with ACID transactions.", type: "learnable", useCases: ["data-lake", "reliability"] },
    { name: "Unity Catalog", description: "Unified governance for data, analytics, and AI assets across clouds.", type: "learnable", useCases: ["governance", "cataloging"] },
    { name: "MLflow", description: "Open-source platform for ML lifecycle: tracking, packaging, and deployment.", type: "learnable", url: "https://mlflow.org", useCases: ["mlops", "experiment-tracking"] },
    { name: "MosaicML", description: "Efficient LLM pre-training and fine-tuning at scale.", type: "reference", useCases: ["training", "fine-tuning"] },
    { name: "Databricks SQL", description: "Serverless SQL analytics on lakehouse data.", type: "learnable", useCases: ["analytics", "sql"] },
  ] },
  { name: "BigQuery", company: "Google", category: "data-platforms", version: "2025", description: "Serverless analytics data warehouse — now GPU-accelerated with NVIDIA KUDF.", icon: "📈", url: "https://cloud.google.com/bigquery", type: "learnable", maturity: "ga", pricing: "Paid", useCases: ["analytics", "data-warehouse", "ml"] },
  { name: "KUDF", company: "NVIDIA", category: "data-platforms", version: "GA", description: "GPU-accelerated data frames for structured data — 5x+ speedups over CPU Spark/Pandas.", icon: "📊", type: "reference", maturity: "ga", pricing: "Open Source", useCases: ["data-processing", "acceleration"] },
  { name: "KVS", company: "NVIDIA", category: "data-platforms", version: "GA", description: "GPU-accelerated vector stores for semantic search across PDFs, video, and speech.", icon: "🔍", type: "reference", maturity: "ga", pricing: "Open Source", useCases: ["vector-search", "rag", "semantic-search"] },

  // ═══════════════════════════════════════════
  // MLOps & INFRASTRUCTURE
  // ═══════════════════════════════════════════
  { name: "CUDA", company: "NVIDIA", category: "mlops-infra", version: "13.0", description: "GPU computing platform — 20 years of accelerated computing, billions of GPUs deployed.", icon: "⚡", url: "https://developer.nvidia.com/cuda-toolkit", type: "reference", maturity: "ga", pricing: "Free", useCases: ["gpu-computing", "acceleration"] },
  { name: "PyTorch", company: "Meta / Linux Foundation", category: "mlops-infra", version: "2.5", description: "Dominant deep learning framework for research and production ML.", icon: "🔥", url: "https://pytorch.org", type: "learnable", maturity: "ga", pricing: "Open Source", useCases: ["ml-training", "research", "model-development"] },
  { name: "Hugging Face", company: "Hugging Face", category: "mlops-infra", version: "2025", description: "Model hub, Transformers library, and deployment platform. The GitHub of AI models.", icon: "🤗", url: "https://huggingface.co", type: "learnable", maturity: "ga", pricing: "Freemium", useCases: ["model-hub", "fine-tuning", "deployment"] },
  { name: "Weights & Biases", company: "W&B", category: "mlops-infra", version: "2025", description: "ML experiment tracking, model registry, and production monitoring.", icon: "📉", url: "https://wandb.ai", type: "learnable", maturity: "ga", pricing: "Freemium", useCases: ["experiment-tracking", "monitoring", "mlops"] },
  { name: "Dynamo", company: "NVIDIA", category: "mlops-infra", version: "GA", description: "Inference OS for AI factories — disaggregated inference pipeline, 35x performance increase.", icon: "⚙️", type: "reference", maturity: "ga", pricing: "Enterprise", useCases: ["inference", "optimization", "scaling"] },
  { name: "Kubernetes", company: "CNCF", category: "mlops-infra", version: "1.32", description: "Container orchestration standard — foundation for AI workload deployment at scale.", icon: "☸️", type: "learnable", maturity: "ga", pricing: "Open Source", useCases: ["orchestration", "deployment", "scaling"] },
  { name: "Fireworks AI", company: "Fireworks", category: "mlops-infra", version: "2025", description: "Fast inference platform for deploying open-source and custom models.", icon: "🎆", url: "https://fireworks.ai", type: "learnable", maturity: "ga", pricing: "Paid", useCases: ["inference", "model-serving", "fine-tuning"] },

  // ═══════════════════════════════════════════
  // CLOUD AI PLATFORMS
  // ═══════════════════════════════════════════
  { name: "Azure AI Foundry", company: "Microsoft", category: "cloud-ai", version: "2025", description: "Azure's unified AI platform for model deployment, fine-tuning, and enterprise AI.", icon: "☁️", url: "https://azure.microsoft.com/en-us/products/ai-studio", type: "learnable", maturity: "ga", pricing: "Paid", useCases: ["model-deployment", "enterprise-ai", "fine-tuning"] },
  { name: "AWS Bedrock", company: "Amazon", category: "cloud-ai", version: "2025", description: "Managed foundation model service with built-in guardrails and RAG.", icon: "🪨", url: "https://aws.amazon.com/bedrock/", type: "learnable", maturity: "ga", pricing: "Paid", useCases: ["model-deployment", "rag", "enterprise-ai"] },
  { name: "Google Vertex AI", company: "Google", category: "cloud-ai", version: "2025", description: "End-to-end ML platform for training, tuning, and serving AI models.", icon: "🔺", url: "https://cloud.google.com/vertex-ai", type: "learnable", maturity: "ga", pricing: "Paid", useCases: ["ml-platform", "training", "deployment"] },
  { name: "Oracle Cloud AI", company: "Oracle", category: "cloud-ai", version: "2025", description: "Enterprise AI cloud hosting OpenAI and Cohere workloads.", icon: "☁️", type: "reference", maturity: "ga", pricing: "Paid", useCases: ["enterprise-ai", "model-hosting"] },
  { name: "CoreWeave", company: "CoreWeave", category: "cloud-ai", version: "2025", description: "AI-native cloud built solely for GPU workloads — fastest growing AI cloud.", icon: "🚀", type: "reference", maturity: "ga", pricing: "Paid", useCases: ["gpu-cloud", "training", "inference"] },

  // ═══════════════════════════════════════════
  // SIMULATION & DIGITAL TWINS
  // ═══════════════════════════════════════════
  { name: "Omniverse", company: "NVIDIA", category: "simulation-digital-twin", version: "2025", description: "Digital twin platform for simulating AI factories, cities, and industrial systems.", icon: "🌐", url: "https://www.nvidia.com/omniverse/", type: "reference", maturity: "ga", pricing: "Enterprise", useCases: ["digital-twin", "simulation", "industrial"] },
  { name: "Cosmos", company: "NVIDIA", category: "simulation-digital-twin", version: "GA", description: "World foundation models — generates synthetic training data for physical AI.", icon: "🌍", type: "reference", maturity: "ga", pricing: "Open Source", useCases: ["synthetic-data", "world-models", "training"] },
  { name: "Newton", company: "NVIDIA", category: "simulation-digital-twin", version: "GA", description: "GPU-accelerated differentiable physics simulation for training robots.", icon: "🍎", type: "reference", maturity: "ga", pricing: "Open Source", useCases: ["physics-simulation", "robotics-training"] },
  { name: "Earth 2", company: "NVIDIA", category: "simulation-digital-twin", version: "GA", description: "AI physics models for high-resolution weather and climate forecasting.", icon: "🌦️", type: "reference", maturity: "ga", pricing: "Enterprise", useCases: ["climate", "weather", "forecasting"] },
  { name: "DSX", company: "NVIDIA", category: "simulation-digital-twin", version: "GA", description: "AI factory management platform — digital twin blueprint for infrastructure optimization.", icon: "🏭", type: "reference", maturity: "ga", pricing: "Enterprise", useCases: ["ai-factory", "infrastructure", "optimization"] },

  // ═══════════════════════════════════════════
  // ROBOTICS & PHYSICAL AI
  // ═══════════════════════════════════════════
  { name: "Isaac Lab", company: "NVIDIA", category: "robotics-physical-ai", version: "2025", description: "Open-source robot training and evaluation in simulation environments.", icon: "🤸", type: "reference", maturity: "ga", pricing: "Open Source", useCases: ["robot-training", "simulation", "reinforcement-learning"] },
  { name: "Groot", company: "NVIDIA", category: "robotics-physical-ai", version: "N1", description: "Foundation models for humanoid robots — reasoning and action generation.", icon: "🦾", type: "reference", maturity: "preview", pricing: "Enterprise", useCases: ["humanoid-robots", "manipulation", "locomotion"] },
  { name: "Alpamo", company: "NVIDIA", category: "robotics-physical-ai", version: "GA", description: "Autonomous vehicle AI — first thinking & reasoning self-driving system.", icon: "🚗", type: "reference", maturity: "ga", pricing: "Enterprise", useCases: ["autonomous-driving", "robotaxi"] },

  // ═══════════════════════════════════════════
  // CYBERSECURITY
  // ═══════════════════════════════════════════
  { name: "CrowdStrike Falcon", company: "CrowdStrike", category: "cybersecurity", version: "2025", description: "AI-native endpoint protection and threat intelligence platform.", icon: "🛡️", url: "https://www.crowdstrike.com", type: "learnable", maturity: "ga", pricing: "Paid", useCases: ["endpoint-security", "threat-detection", "incident-response"] },
  { name: "Confidential Computing", company: "NVIDIA", category: "cybersecurity", version: "GA", description: "GPU-level encryption — even the cloud operator cannot see your data or models.", icon: "🔐", type: "reference", maturity: "ga", pricing: "Enterprise", useCases: ["data-privacy", "compliance", "regulated-industries"] },

  // ═══════════════════════════════════════════
  // ENTERPRISE AI PLATFORMS
  // ═══════════════════════════════════════════
  { name: "Salesforce Einstein", company: "Salesforce", category: "enterprise-ai", version: "GPT", description: "AI-powered CRM with conversational agents, predictive analytics, and workflow automation.", icon: "💼", url: "https://www.salesforce.com/artificial-intelligence/", type: "learnable", maturity: "ga", pricing: "Paid", useCases: ["crm", "sales", "customer-service", "automation"], products: [
    { name: "Einstein GPT", description: "Generative AI for CRM — auto-generates emails, summaries, and insights.", type: "learnable", useCases: ["sales", "content-creation"] },
    { name: "Agentforce", description: "Autonomous AI agents for sales, service, and marketing workflows.", type: "learnable", useCases: ["automation", "agents"] },
    { name: "Data Cloud", description: "Real-time customer data platform unifying all data sources.", type: "learnable", useCases: ["data-integration", "analytics"] },
    { name: "Flow Orchestration", description: "Visual workflow builder for automating business processes.", type: "learnable", useCases: ["workflow-automation"] },
  ] },
  { name: "Palantir AIP", company: "Palantir", category: "enterprise-ai", version: "2025", description: "AI platform for airgapped/sovereign deployments and operational decision-making.", icon: "👁️", url: "https://www.palantir.com/aip/", type: "reference", maturity: "ga", pricing: "Enterprise", useCases: ["defense", "government", "operations", "analytics"] },
  { name: "IBM watsonx", company: "IBM", category: "enterprise-ai", version: "2025", description: "Enterprise AI and data platform — GPU-accelerated with foundation model studio.", icon: "🏢", url: "https://www.ibm.com/watsonx", type: "learnable", maturity: "ga", pricing: "Paid", useCases: ["enterprise-ai", "governance", "data-management"], products: [
    { name: "watsonx.ai", description: "Foundation model studio for training, tuning, and deploying AI models.", type: "learnable", useCases: ["model-training", "fine-tuning"] },
    { name: "watsonx.data", description: "Open lakehouse architecture for analytics and AI workloads.", type: "learnable", useCases: ["data-lakehouse", "analytics"] },
    { name: "watsonx.governance", description: "AI governance toolkit for monitoring, compliance, and risk management.", type: "learnable", useCases: ["governance", "compliance"] },
  ] },
  { name: "ServiceNow AI Agents", company: "ServiceNow", category: "enterprise-ai", version: "2025", description: "AI agents for IT service management, HR, and enterprise workflow automation.", icon: "⚡", url: "https://www.servicenow.com", type: "learnable", maturity: "ga", pricing: "Paid", useCases: ["itsm", "workflow-automation", "hr"] },
  { name: "SAP Joule", company: "SAP", category: "enterprise-ai", version: "2025", description: "AI copilot embedded across SAP's ERP, supply chain, and HR modules.", icon: "🔷", url: "https://www.sap.com/products/artificial-intelligence.html", type: "learnable", maturity: "ga", pricing: "Paid", useCases: ["erp", "supply-chain", "hr", "finance"] },

  // ═══════════════════════════════════════════
  // DESIGN & MEDIA
  // ═══════════════════════════════════════════
  { name: "Midjourney", company: "Midjourney", category: "design-media", version: "V6.1", description: "AI image generation with photorealistic and artistic output.", icon: "🎨", url: "https://midjourney.com", type: "learnable", maturity: "ga", pricing: "Paid", useCases: ["image-generation", "design", "creative"] },
  { name: "DALL-E", company: "OpenAI", category: "design-media", version: "3", description: "Text-to-image generation integrated into ChatGPT for visual content creation.", icon: "🖼️", type: "learnable", maturity: "ga", pricing: "Freemium", useCases: ["image-generation", "design", "marketing"] },
  { name: "Runway", company: "Runway", category: "design-media", version: "Gen-3 Alpha", description: "AI video generation and editing — text-to-video, image-to-video, and motion brush.", icon: "🎬", url: "https://runwayml.com", type: "learnable", maturity: "ga", pricing: "Freemium", useCases: ["video-generation", "editing", "creative"] },
  { name: "RTX / DLSS", company: "NVIDIA", category: "design-media", version: "DLSS 5", description: "Neuro rendering — fusion of 3D graphics and generative AI for real-time visuals.", icon: "🎮", url: "https://www.nvidia.com/rtx/", type: "reference", maturity: "ga", pricing: "Free", useCases: ["graphics", "gaming", "rendering"] },
  { name: "Figma AI", company: "Figma", category: "design-media", version: "2025", description: "AI-powered design tool with auto-layout, content generation, and prototype creation.", icon: "🎯", url: "https://figma.com", type: "learnable", maturity: "ga", pricing: "Freemium", useCases: ["ui-design", "prototyping", "collaboration"] },
  { name: "Canva AI", company: "Canva", category: "design-media", version: "2025", description: "AI-assisted design platform for presentations, social media, and marketing materials.", icon: "🖌️", url: "https://canva.com", type: "learnable", maturity: "ga", pricing: "Freemium", useCases: ["graphic-design", "marketing", "presentations"] },

  // ═══════════════════════════════════════════
  // SEARCH & RETRIEVAL
  // ═══════════════════════════════════════════
  { name: "Perplexity", company: "Perplexity AI", category: "search-retrieval", version: "2025", description: "AI-powered search engine with cited answers and real-time web knowledge.", icon: "🔎", url: "https://perplexity.ai", type: "learnable", maturity: "ga", pricing: "Freemium", useCases: ["research", "search", "fact-checking"] },
  { name: "NotebookLM", company: "Google", category: "search-retrieval", version: "2025", description: "AI research assistant that analyzes uploaded documents and generates audio summaries.", icon: "📓", url: "https://notebooklm.google.com", type: "learnable", maturity: "ga", pricing: "Free", useCases: ["research", "document-analysis", "summarization"] },

  // ═══════════════════════════════════════════
  // NETWORKING & EDGE
  // ═══════════════════════════════════════════
  { name: "Aerial AI RAN", company: "NVIDIA", category: "networking-edge", version: "GA", description: "Platform for reinventing telecom base stations into AI-powered infrastructure.", icon: "📡", type: "reference", maturity: "ga", pricing: "Enterprise", useCases: ["telecom", "edge-ai", "5g"] },
  { name: "Spectrum X", company: "NVIDIA", category: "networking-edge", version: "6", description: "Co-packaged optical networking switch for AI factory interconnects.", icon: "💡", type: "reference", maturity: "ga", pricing: "Enterprise", useCases: ["networking", "data-center", "high-bandwidth"] },
  { name: "NVLink", company: "NVIDIA", category: "networking-edge", version: "576-GPU", description: "Scale-up GPU interconnect — copper and optical for multi-rack AI systems.", icon: "🔗", type: "reference", maturity: "ga", pricing: "Enterprise", useCases: ["gpu-interconnect", "scaling", "training"] },

  // ═══════════════════════════════════════════
  // HARDWARE & COMPUTE
  // ═══════════════════════════════════════════
  { name: "Blackwell", company: "NVIDIA", category: "hardware-compute", version: "GB300", description: "Current-gen AI GPU — in full production, shipping at scale to every major cloud.", icon: "⬛", type: "reference", maturity: "ga", pricing: "Enterprise", useCases: ["training", "inference", "ai-factory"] },
  { name: "Vera Rubin", company: "NVIDIA", category: "hardware-compute", version: "2026", description: "Next-gen GPU system — 288GB per chip, already deployed at Microsoft Azure.", icon: "🔥", type: "reference", maturity: "preview", pricing: "Enterprise", useCases: ["training", "inference", "next-gen"] },
  { name: "Feynman", company: "NVIDIA", category: "hardware-compute", version: "2027", description: "Future GPU architecture with new GPU, LPU, CPU, and networking in one system.", icon: "🔮", type: "reference", maturity: "research", pricing: "Enterprise", useCases: ["future-compute", "ai-factory"] },
  { name: "Groq LPU", company: "Groq", category: "hardware-compute", version: "LP30", description: "Deterministic dataflow processor for ultra-low-latency inference.", icon: "⚡", url: "https://groq.com", type: "reference", maturity: "ga", pricing: "Paid", useCases: ["inference", "low-latency", "real-time"] },

  // ═══════════════════════════════════════════
  // VERTICAL INDUSTRY
  // ═══════════════════════════════════════════
  { name: "Bionemо", company: "NVIDIA", category: "vertical-industry", version: "GA", description: "Open models for biology, chemistry, drug discovery, and molecular design.", icon: "🧬", type: "reference", maturity: "ga", pricing: "Open Source", useCases: ["drug-discovery", "genomics", "molecular-design"] },
  { name: "Parabricks", company: "NVIDIA", category: "vertical-industry", version: "GA", description: "GPU-accelerated genomics analysis for clinical and research applications.", icon: "🧪", type: "reference", maturity: "ga", pricing: "Enterprise", useCases: ["genomics", "clinical", "research"] },
  { name: "cuOpt", company: "NVIDIA", category: "vertical-industry", version: "GA", description: "Decision optimization for logistics, routing, and supply chain management.", icon: "📦", type: "reference", maturity: "ga", pricing: "Enterprise", useCases: ["logistics", "supply-chain", "optimization"] },
];

/** Get unique company names sorted by tool count */
export function getCompanies(): string[] {
  const map = new Map<string, number>();
  for (const t of GTC_TOOLS) {
    map.set(t.company, (map.get(t.company) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
}

/** Get unique categories */
export function getCategories(): ToolCategory[] {
  const cats = new Set<ToolCategory>();
  for (const t of GTC_TOOLS) cats.add(t.category);
  return [...cats];
}

/** Get only learnable tools */
export function getLearnableTools(): GTCTool[] {
  return GTC_TOOLS.filter(t => t.type === "learnable");
}

/** Get tools by category */
export function getToolsByCategory(category: ToolCategory): GTCTool[] {
  return GTC_TOOLS.filter(t => t.category === category);
}

/** Category labels and colors */
export const CATEGORY_CONFIG: Record<ToolCategory, { label: string; color: string; description: string }> = {
  "foundation-models": { label: "Foundation Models", color: "hsl(280, 70%, 60%)", description: "LLMs and multimodal AI models" },
  "coding-agents": { label: "Coding Agents", color: "hsl(200, 80%, 55%)", description: "AI-powered development tools" },
  "agentic-frameworks": { label: "Agentic Frameworks", color: "hsl(30, 90%, 55%)", description: "Multi-agent orchestration and automation" },
  "data-platforms": { label: "Data Platforms", color: "hsl(160, 70%, 45%)", description: "Data warehouses, lakehouses, and processing" },
  "mlops-infra": { label: "MLOps & Infra", color: "hsl(220, 60%, 50%)", description: "ML training, deployment, and operations" },
  "cloud-ai": { label: "Cloud AI", color: "hsl(210, 70%, 60%)", description: "Managed AI services from major clouds" },
  "simulation-digital-twin": { label: "Simulation", color: "hsl(180, 60%, 50%)", description: "Digital twins and physics simulation" },
  "robotics-physical-ai": { label: "Robotics", color: "hsl(0, 70%, 55%)", description: "Physical AI and autonomous systems" },
  "cybersecurity": { label: "Cybersecurity", color: "hsl(350, 60%, 50%)", description: "AI-powered threat detection and data privacy" },
  "enterprise-ai": { label: "Enterprise AI", color: "hsl(50, 70%, 50%)", description: "CRM, ERP, and business workflow AI" },
  "design-media": { label: "Design & Media", color: "hsl(310, 60%, 55%)", description: "Image, video, and creative AI tools" },
  "search-retrieval": { label: "Search & Retrieval", color: "hsl(120, 50%, 45%)", description: "AI search and document analysis" },
  "networking-edge": { label: "Networking", color: "hsl(190, 60%, 50%)", description: "AI infrastructure networking and edge" },
  "hardware-compute": { label: "Hardware", color: "hsl(240, 40%, 50%)", description: "GPUs, accelerators, and compute systems" },
  "vertical-industry": { label: "Vertical Industry", color: "hsl(140, 60%, 45%)", description: "Domain-specific AI for healthcare, logistics, etc." },
};
