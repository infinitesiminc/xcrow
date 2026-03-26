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

  // HR & Talent
  "Workday AI": ["HR AI Automation", "Workforce Planning", "Talent Acquisition AI", "Payroll Automation"],
  "Eightfold AI": ["Talent Intelligence", "Skills-Based Hiring", "DEI Analytics", "Internal Mobility"],
  "HireVue": ["AI-Powered Interviewing", "Candidate Assessment", "Structured Hiring"],
  "Lattice": ["Performance Management AI", "Employee Engagement", "Compensation Intelligence"],
  "Deel": ["Global Payroll", "Compliance Automation", "Contractor Management"],

  // Finance & Ops
  "Workiva": ["Financial Reporting AI", "Audit Automation", "ESG Compliance", "SEC Filing"],
  "Coupa": ["Procurement AI", "Spend Analytics", "Invoice Automation", "Supply Chain Finance"],
  "Stampli": ["Accounts Payable Automation", "Invoice Processing", "Payment Workflows"],
  "Brex AI": ["Expense Management AI", "Corporate Card Intelligence", "Budget Tracking"],
  "Anaplan": ["Financial Planning & Analysis", "Revenue Forecasting", "Scenario Modeling"],

  // Legal & Compliance
  "Harvey AI": ["AI Legal Research", "Contract Analysis", "Due Diligence Automation", "Regulatory Intelligence"],
  "Ironclad": ["Contract Lifecycle Management", "AI Contract Drafting", "Negotiation Automation"],
  "DocuSign IAM": ["Agreement Management", "E-Signature Workflows", "Contract Data Extraction"],
  "Relativity": ["E-Discovery", "Litigation Support", "Compliance Investigation"],

  // Customer Platforms
  "Zendesk AI": ["AI Customer Support", "Ticket Automation", "Sentiment Analysis", "Self-Service AI"],
  "Intercom Fin": ["Conversational AI", "Customer Service Automation", "Knowledge Base AI"],
  "Freshworks": ["CX Automation", "IT Service Management", "Sales AI"],
  "Gainsight": ["Customer Success AI", "Churn Prediction", "Health Scoring", "Expansion Intelligence"],

  // Marketing & RevOps
  "HubSpot AI": ["Marketing Automation AI", "CRM Intelligence", "Content Generation", "Lead Scoring"],
  "Gong": ["Revenue Intelligence", "Sales Conversation AI", "Deal Forecasting", "Coaching AI"],
  "6sense": ["Account-Based Marketing", "Intent Data Analysis", "Demand Generation AI"],
  "Adobe Marketo": ["Marketing Automation", "Lead Management", "Campaign Orchestration"],
  "Clari": ["Revenue Operations AI", "Pipeline Intelligence", "Forecast Accuracy"],

  // Productivity
  "Microsoft 365 Copilot": ["AI-Augmented Writing", "Spreadsheet AI", "Presentation AI", "Email Automation"],
  "Notion AI": ["Knowledge Management with AI", "AI Writing Assistant", "Project Documentation"],
  "Slack AI": ["Communication Intelligence", "Channel Summarization", "Workflow Automation"],
  "Asana AI": ["AI Project Management", "Resource Planning", "Goal Tracking"],

  // BI & Visualization
  "Tableau": ["Data Visualization", "Dashboard Design", "AI-Powered Analytics"],
  "Power BI": ["Business Intelligence", "DAX & Data Modeling", "Report Automation"],
  "Looker": ["Semantic Data Modeling", "Embedded Analytics", "Data Exploration"],
  "ThoughtSpot": ["Search-Driven Analytics", "Self-Service BI", "Natural Language Queries"],
};

/**
 * JOB_SKILL_TO_TOOLS — Maps real job-level skills (from jobs DB) to tools.
 * This bridges the gap between skills like "Python", "Data Analysis" etc.
 * that appear in job_task_clusters.skill_names → actual tools users should learn.
 */
export const JOB_SKILL_TO_TOOLS: Record<string, string[]> = {
  // ── Programming & Engineering ──
  "Python": ["Cursor", "GitHub Copilot", "Claude Code", "Codex", "PyTorch", "Databricks"],
  "React": ["Cursor", "GitHub Copilot", "Lovable", "Windsurf"],
  "TypeScript": ["Cursor", "GitHub Copilot", "Lovable", "Windsurf"],
  "SQL": ["Snowflake", "Databricks", "BigQuery", "ChatGPT"],
  "C++": ["Cursor", "GitHub Copilot", "Claude Code"],
  "Java": ["Cursor", "GitHub Copilot", "Claude Code"],
  "Go": ["Cursor", "GitHub Copilot", "Claude Code"],
  "Rust": ["Cursor", "GitHub Copilot", "Claude Code"],
  "Node.js": ["Cursor", "GitHub Copilot", "Lovable", "Windsurf"],
  "PostgreSQL": ["Cursor", "Snowflake", "Databricks"],
  "Frontend Development": ["Cursor", "Lovable", "Figma AI", "GitHub Copilot"],
  "Full-stack Development": ["Cursor", "Lovable", "GitHub Copilot", "Windsurf"],
  "Backend Engineering": ["Cursor", "GitHub Copilot", "Claude Code", "AWS Bedrock"],
  "API Design": ["Cursor", "Claude Code", "GitHub Copilot"],
  "API Integration": ["Cursor", "Claude Code", "GitHub Copilot", "LangChain"],
  "System Design": ["ChatGPT", "Claude", "Cursor"],
  "System Architecture": ["ChatGPT", "Claude", "Cursor", "AWS Bedrock"],
  "Systems Architecture": ["ChatGPT", "Claude", "AWS Bedrock", "Azure AI Foundry"],
  "Software Architecture": ["Claude", "ChatGPT", "Cursor"],
  "Software Engineering": ["Cursor", "GitHub Copilot", "Claude Code", "Windsurf"],
  "Solution Architecture": ["ChatGPT", "Claude", "AWS Bedrock", "Azure AI Foundry"],
  "Distributed Systems": ["Kubernetes", "AWS Bedrock", "Azure AI Foundry"],
  "Distributed Computing": ["Kubernetes", "Databricks", "Snowflake"],
  "Data Modeling": ["Databricks", "Snowflake", "BigQuery"],
  "Database Design": ["Snowflake", "Databricks", "Cursor"],
  "Microservices": ["Kubernetes", "Docker", "Cursor", "GitHub Copilot"],
  "Scalability": ["Kubernetes", "AWS Bedrock", "Azure AI Foundry"],
  "Code Review": ["GitHub Copilot", "Cursor", "Claude Code"],
  "Unit Testing": ["Cursor", "GitHub Copilot", "Claude Code"],
  "Automated Testing": ["Cursor", "GitHub Copilot", "Claude Code"],
  "Test Automation": ["Cursor", "GitHub Copilot", "Claude Code"],
  "Jest": ["Cursor", "GitHub Copilot", "Claude Code"],
  "Debugging": ["Cursor", "GitHub Copilot", "Claude Code"],
  "Technical Troubleshooting": ["Cursor", "ChatGPT", "Claude"],
  "Troubleshooting": ["ChatGPT", "Claude", "Cursor"],
  "Root Cause Analysis": ["ChatGPT", "Claude", "Databricks"],
  "Performance Tuning": ["Cursor", "Databricks", "ChatGPT"],
  "Performance Profiling": ["Cursor", "Databricks", "ChatGPT"],
  "Query Optimization": ["Snowflake", "Databricks", "BigQuery"],
  "Scripting": ["Cursor", "GitHub Copilot", "Claude Code"],
  "Git": ["GitHub Copilot", "Cursor", "Claude Code"],
  "GitHub Actions": ["GitHub Copilot", "Cursor", "Claude Code"],
  "Markdown": ["Cursor", "Notion AI", "ChatGPT"],
  "Documentation": ["Notion AI", "ChatGPT", "Claude"],
  "Technical Documentation": ["Notion AI", "ChatGPT", "Claude"],

  // ── DevOps & Infrastructure ──
  "CI/CD": ["GitHub Copilot", "Cursor", "Kubernetes"],
  "CI/CD Pipelines": ["GitHub Copilot", "Cursor", "Kubernetes"],
  "Docker": ["Cursor", "GitHub Copilot", "Kubernetes"],
  "Kubernetes": ["Kubernetes", "AWS Bedrock", "Azure AI Foundry"],
  "Terraform": ["Cursor", "GitHub Copilot", "AWS Bedrock"],
  "Infrastructure as Code": ["Cursor", "GitHub Copilot", "AWS Bedrock"],
  "Cloud Infrastructure": ["AWS Bedrock", "Azure AI Foundry", "Google Vertex AI"],
  "Cloud Architecture": ["AWS Bedrock", "Azure AI Foundry", "Google Vertex AI"],
  "AWS": ["AWS Bedrock", "Cursor", "GitHub Copilot"],
  "DevOps": ["GitHub Copilot", "Kubernetes", "Cursor"],
  "Site Reliability Engineering": ["Kubernetes", "Cursor", "ChatGPT"],
  "Observability": ["Weights & Biases", "Kubernetes", "ChatGPT"],
  "Monitoring Tools": ["Weights & Biases", "Kubernetes", "ChatGPT"],
  "Prometheus": ["Kubernetes", "Cursor", "ChatGPT"],
  "Grafana": ["Kubernetes", "Power BI", "Tableau"],
  "Log Analysis": ["ChatGPT", "Databricks", "Snowflake"],
  "Incident Response": ["CrowdStrike Falcon", "ServiceNow AI Agents", "ChatGPT"],
  "Incident Management": ["ServiceNow AI Agents", "ChatGPT", "Claude"],

  // ── Data & Analytics ──
  "Data Analysis": ["Databricks", "Snowflake", "BigQuery", "ChatGPT", "NotebookLM"],
  "Data Visualization": ["Tableau", "Power BI", "Databricks", "Canva AI"],
  "Data Analytics": ["Databricks", "Snowflake", "BigQuery"],
  "Data Science": ["Databricks", "PyTorch", "Hugging Face", "Snowflake"],
  "Data Engineering": ["Databricks", "Snowflake", "BigQuery", "Cursor"],
  "Statistical Analysis": ["Databricks", "PyTorch", "ChatGPT"],
  "Statistical Modeling": ["Databricks", "PyTorch", "ChatGPT"],
  "Statistics": ["Databricks", "ChatGPT", "Claude"],
  "Hypothesis Testing": ["Databricks", "ChatGPT", "Claude"],
  "Experimental Design": ["ChatGPT", "Claude", "Databricks"],
  "Data Synthesis": ["ChatGPT", "Claude", "NotebookLM"],
  "Data Interpretation": ["ChatGPT", "Claude", "Tableau", "Power BI"],
  "Data Integrity": ["Snowflake", "Databricks", "ChatGPT"],
  "Data Entry": ["ChatGPT", "Microsoft 365 Copilot", "Notion AI"],
  "Data Governance": ["Databricks", "Snowflake", "IBM watsonx"],
  "Data Management": ["Databricks", "Snowflake", "IBM watsonx"],
  "Data Privacy": ["CrowdStrike Falcon", "Harvey AI", "ChatGPT"],
  "Predictive Analytics": ["Databricks", "Snowflake", "Anaplan", "ChatGPT"],
  "Predictive Modeling": ["Databricks", "PyTorch", "Hugging Face"],
  "Pattern Recognition": ["ChatGPT", "Claude", "Databricks"],
  "Information Synthesis": ["ChatGPT", "Claude", "NotebookLM", "Perplexity"],
  "Information Architecture": ["Notion AI", "ChatGPT", "Figma AI"],

  // ── AI & ML ──
  "Prompt Engineering": ["ChatGPT", "Claude", "Cursor", "GitHub Copilot", "Gemini", "Midjourney"],
  "AI Agent Orchestration": ["LangChain", "LangGraph", "CrewAI", "AutoGen", "Open Claw"],
  "AI System Architecture": ["LangChain", "AWS Bedrock", "Azure AI Foundry", "Google Vertex AI"],
  "Machine Learning": ["PyTorch", "Hugging Face", "Databricks", "Weights & Biases"],
  "AI Tool Proficiency": ["ChatGPT", "Claude", "Cursor", "Perplexity"],
  "Deep Learning": ["PyTorch", "Hugging Face", "Databricks"],
  "Computer Vision": ["PyTorch", "Hugging Face", "Google Vertex AI"],
  "Reinforcement Learning": ["PyTorch", "Hugging Face", "Databricks"],
  "MLOps": ["Weights & Biases", "Hugging Face", "Databricks", "Kubernetes"],
  "Model Evaluation": ["Weights & Biases", "Hugging Face", "ChatGPT"],
  "LLM Orchestration": ["LangChain", "LangGraph", "CrewAI", "AutoGen"],
  "Generative AI": ["ChatGPT", "Claude", "Midjourney", "Runway"],
  "AI Ethics": ["ChatGPT", "Claude", "IBM watsonx"],
  "CUDA": ["PyTorch", "Databricks", "Hugging Face"],
  "Vector Databases": ["LangChain", "Snowflake", "Databricks"],
  "Algorithm Design": ["Cursor", "ChatGPT", "Claude"],

  // ── Business & Strategy ──
  "Strategic Planning": ["ChatGPT", "Claude", "Perplexity", "NotebookLM"],
  "Strategic Thinking": ["ChatGPT", "Claude", "Perplexity"],
  "Business Strategy": ["ChatGPT", "Claude", "Perplexity"],
  "Business Development": ["Salesforce Einstein", "HubSpot AI", "ChatGPT"],
  "Business Analysis": ["ChatGPT", "Claude", "Power BI", "Tableau"],
  "Business Intelligence": ["Power BI", "Tableau", "Looker", "ThoughtSpot"],
  "Business Acumen": ["ChatGPT", "Claude", "Perplexity"],
  "Commercial Acumen": ["ChatGPT", "Claude", "Gong"],
  "Financial Acumen": ["Anaplan", "ChatGPT", "Power BI"],
  "Financial Literacy": ["Anaplan", "ChatGPT", "Power BI"],
  "Financial Modeling": ["Anaplan", "Power BI", "ChatGPT", "Snowflake"],
  "Stakeholder Management": ["ChatGPT", "Claude", "Canva AI"],
  "Stakeholder Communication": ["ChatGPT", "Claude", "Canva AI"],
  "Communication": ["ChatGPT", "Claude", "Canva AI"],
  "Market Research": ["Perplexity", "ChatGPT", "NotebookLM"],
  "Market Analysis": ["Perplexity", "ChatGPT", "NotebookLM", "Tableau"],
  "Market Intelligence": ["Perplexity", "6sense", "ChatGPT"],
  "Competitive Analysis": ["Perplexity", "ChatGPT", "NotebookLM"],
  "Competitive Intelligence": ["Perplexity", "6sense", "ChatGPT"],
  "Product Strategy": ["ChatGPT", "Claude", "Perplexity", "Figma AI"],
  "Product Thinking": ["ChatGPT", "Claude", "Figma AI"],
  "Product Management": ["ChatGPT", "Claude", "Figma AI", "Notion AI"],
  "Product Knowledge": ["ChatGPT", "Claude", "Perplexity"],
  "Product Expertise": ["ChatGPT", "Claude", "Perplexity"],
  "Product Sense": ["ChatGPT", "Claude", "Figma AI"],
  "Product Marketing": ["HubSpot AI", "ChatGPT", "Canva AI"],
  "Project Management": ["ChatGPT", "Claude", "Asana AI", "ServiceNow AI Agents"],
  "Project Coordination": ["Asana AI", "Notion AI", "ChatGPT"],
  "Roadmapping": ["Notion AI", "ChatGPT", "Asana AI"],
  "Negotiation": ["ChatGPT", "Claude"],
  "Contract Negotiation": ["Harvey AI", "Ironclad", "ChatGPT"],
  "Prioritization": ["ChatGPT", "Claude", "Asana AI"],
  "Decision Making": ["ChatGPT", "Claude", "Perplexity"],
  "Risk Management": ["Harvey AI", "Palantir AIP", "ChatGPT"],
  "Change Management": ["ChatGPT", "Claude", "ServiceNow AI Agents"],
  "Process Improvement": ["ChatGPT", "Claude", "ServiceNow AI Agents"],
  "Process Optimization": ["ChatGPT", "Claude", "ServiceNow AI Agents"],
  "Process Mapping": ["ChatGPT", "Claude", "Figma AI"],
  "Process Design": ["ChatGPT", "Claude", "ServiceNow AI Agents"],
  "Process Engineering": ["ChatGPT", "Claude", "ServiceNow AI Agents"],
  "Process Automation": ["ServiceNow AI Agents", "SAP Joule", "ChatGPT"],
  "Workflow Automation": ["ServiceNow AI Agents", "SAP Joule", "Slack AI"],
  "Operational Excellence": ["ServiceNow AI Agents", "SAP Joule", "ChatGPT"],
  "Vendor Management": ["Coupa", "SAP Joule", "ChatGPT"],
  "Resource Allocation": ["Anaplan", "ChatGPT", "Asana AI"],
  "Resource Management": ["Anaplan", "Asana AI", "ChatGPT"],
  "Resource Planning": ["Anaplan", "Workday AI", "Asana AI"],
  "Knowledge Management": ["Notion AI", "NotebookLM", "ChatGPT"],
  "Content Strategy": ["HubSpot AI", "ChatGPT", "Claude"],
  "Content Creation": ["ChatGPT", "Claude", "Canva AI", "Midjourney"],
  "Reporting": ["Power BI", "Tableau", "Looker"],
  "Logistics": ["SAP Joule", "Coupa", "ChatGPT"],
  "Inventory Management": ["SAP Joule", "Coupa", "Anaplan"],
  "ERP Systems": ["SAP Joule", "Workday AI", "ServiceNow AI Agents"],
  "Systems Integration": ["ServiceNow AI Agents", "SAP Joule", "ChatGPT"],
  "Organizational Design": ["Workday AI", "ChatGPT", "Claude"],
  "Strategic Alignment": ["ChatGPT", "Claude", "Notion AI"],
  "Strategic Communication": ["ChatGPT", "Claude", "Canva AI"],

  // ── Research & Writing ──
  "Technical Writing": ["ChatGPT", "Claude", "NotebookLM"],
  "Business Writing": ["ChatGPT", "Claude", "Microsoft 365 Copilot"],
  "Creative Writing": ["ChatGPT", "Claude", "Gemini"],
  "Copywriting": ["ChatGPT", "Claude", "Canva AI"],
  "Public Speaking": ["ChatGPT", "Claude", "Canva AI"],
  "Presentation Skills": ["Canva AI", "ChatGPT", "Microsoft 365 Copilot"],
  "Storytelling": ["ChatGPT", "Claude", "Canva AI"],
  "User Research": ["Perplexity", "NotebookLM", "ChatGPT"],
  "Analytical Thinking": ["ChatGPT", "Claude", "Perplexity"],
  "Critical Thinking": ["Claude", "ChatGPT", "Perplexity"],
  "Problem Solving": ["ChatGPT", "Claude", "Cursor"],
  "Creative Problem Solving": ["ChatGPT", "Claude", "Figma AI"],
  "Systems Thinking": ["ChatGPT", "Claude", "Perplexity"],

  // ── Design ──
  "Prototyping": ["Figma AI", "Lovable", "Canva AI"],
  "Rapid Prototyping": ["Lovable", "Figma AI", "Cursor"],
  "UX Design": ["Figma AI", "Lovable", "Canva AI"],
  "UX Design Intuition": ["Figma AI", "Lovable"],
  "UI/UX Design": ["Figma AI", "Lovable", "Canva AI"],
  "Visual Design": ["Figma AI", "Canva AI", "Midjourney"],
  "Visual Communication": ["Canva AI", "Figma AI", "Midjourney"],
  "Design Systems": ["Figma AI", "Lovable", "Canva AI"],
  "Interaction Design": ["Figma AI", "Lovable"],
  "Creative Direction": ["Midjourney", "Canva AI", "Figma AI", "Runway"],
  "Creative Strategy": ["ChatGPT", "Claude", "Canva AI"],
  "Wireframing Tools": ["Figma AI", "Canva AI"],
  "Figma": ["Figma AI"],

  // ── People & Soft Skills ──
  "Relationship Building": ["ChatGPT", "Salesforce Einstein"],
  "Relationship Management": ["Salesforce Einstein", "HubSpot AI", "Gainsight"],
  "Empathy": ["ChatGPT", "Claude"],
  "Customer Empathy": ["ChatGPT", "Claude", "Zendesk AI"],
  "Emotional Intelligence": ["ChatGPT", "Claude"],
  "Mentorship": ["ChatGPT", "Claude"],
  "Mentoring": ["ChatGPT", "Claude"],
  "Leadership": ["ChatGPT", "Claude"],
  "Technical Leadership": ["ChatGPT", "Claude", "Cursor"],
  "Team Leadership": ["ChatGPT", "Claude", "Asana AI"],
  "Cross-functional Leadership": ["ChatGPT", "Claude", "Asana AI"],
  "Coaching": ["ChatGPT", "Claude", "Gong"],
  "People Management": ["Workday AI", "Lattice", "ChatGPT"],
  "Collaboration": ["Slack AI", "Notion AI", "Microsoft 365 Copilot"],
  "Cross-functional Collaboration": ["Slack AI", "Notion AI", "Asana AI"],
  "Cross-functional Communication": ["Slack AI", "ChatGPT", "Notion AI"],
  "Team Collaboration": ["Slack AI", "Notion AI", "Microsoft 365 Copilot"],
  "Teamwork": ["Slack AI", "Notion AI", "Asana AI"],
  "Team Building": ["ChatGPT", "Claude", "Lattice"],
  "Active Listening": ["ChatGPT", "Claude", "Gong"],
  "Interpersonal Skills": ["ChatGPT", "Claude"],
  "Interpersonal Communication": ["ChatGPT", "Claude", "Slack AI"],
  "Verbal Communication": ["ChatGPT", "Claude"],
  "Written Communication": ["ChatGPT", "Claude", "Microsoft 365 Copilot"],
  "Internal Communication": ["Slack AI", "Notion AI", "ChatGPT"],
  "Executive Communication": ["ChatGPT", "Claude", "Canva AI"],
  "Executive Presence": ["ChatGPT", "Claude"],
  "Technical Communication": ["ChatGPT", "Claude", "Notion AI"],
  "Conflict Resolution": ["ChatGPT", "Claude"],
  "Influence": ["ChatGPT", "Claude"],
  "Influencing": ["ChatGPT", "Claude"],
  "Persuasion": ["ChatGPT", "Claude", "Gong"],
  "Networking": ["ChatGPT", "Claude", "Salesforce Einstein"],
  "Attention to Detail": ["ChatGPT", "Claude"],
  "Detail Orientation": ["ChatGPT", "Claude"],
  "Time Management": ["Asana AI", "Notion AI", "ChatGPT"],
  "Organization": ["Asana AI", "Notion AI", "ChatGPT"],
  "Adaptability": ["ChatGPT", "Claude"],
  "Resilience": ["ChatGPT", "Claude"],
  "Agile Methodologies": ["ChatGPT", "Claude", "ServiceNow AI Agents", "Asana AI"],
  "Agile Methodology": ["ChatGPT", "Claude", "ServiceNow AI Agents", "Asana AI"],
  "A/B Testing": ["Databricks", "Snowflake", "ChatGPT"],
  "Interviewing": ["HireVue", "ChatGPT", "Claude"],
  "Ethics": ["ChatGPT", "Claude"],
  "Instructional Design": ["ChatGPT", "Claude", "Canva AI"],
  "Cultural Intelligence": ["ChatGPT", "Claude"],
  "Cultural Competency": ["ChatGPT", "Claude"],
  "Culture Building": ["Lattice", "ChatGPT", "Claude"],
  "Domain Expertise": ["ChatGPT", "Claude", "Perplexity"],
  "Professionalism": ["ChatGPT", "Claude"],

  // ── Sales & Marketing ──
  "Consultative Selling": ["Salesforce Einstein", "Gong", "ChatGPT", "Claude"],
  "Closing Techniques": ["Gong", "Salesforce Einstein", "ChatGPT"],
  "Sales Strategy": ["Gong", "Clari", "Salesforce Einstein", "6sense"],
  "Sales Prospecting": ["6sense", "Salesforce Einstein", "HubSpot AI"],
  "Sales Enablement": ["Gong", "HubSpot AI", "Salesforce Einstein"],
  "Sales Operations": ["Clari", "Salesforce Einstein", "HubSpot AI"],
  "Sales Automation": ["Salesforce Einstein", "HubSpot AI", "6sense"],
  "Sales Forecasting": ["Clari", "Gong", "Anaplan"],
  "Sales Intelligence Tools": ["Gong", "6sense", "Clari"],
  "Value Selling": ["Gong", "Salesforce Einstein", "ChatGPT"],
  "Value Proposition Design": ["ChatGPT", "Claude", "Figma AI"],
  "Value Engineering": ["ChatGPT", "Claude", "Anaplan"],
  "Lead Scoring": ["HubSpot AI", "6sense", "Salesforce Einstein"],
  "Lead Generation": ["6sense", "HubSpot AI", "Adobe Marketo"],
  "Lead Qualification": ["Salesforce Einstein", "HubSpot AI", "6sense"],
  "Boolean Search": ["Perplexity", "ChatGPT", "Eightfold AI"],
  "Pipeline Management": ["Clari", "Salesforce Einstein", "HubSpot AI"],
  "CRM Management": ["Salesforce Einstein", "HubSpot AI"],
  "CRM Proficiency": ["Salesforce Einstein", "HubSpot AI"],
  "Salesforce": ["Salesforce Einstein"],
  "Salesforce/CRM": ["Salesforce Einstein", "HubSpot AI"],
  "Salesforce CRM": ["Salesforce Einstein"],
  "CRM Administration": ["Salesforce Einstein", "HubSpot AI"],
  "Content Marketing": ["HubSpot AI", "ChatGPT", "Canva AI", "Claude"],
  "Marketing Automation": ["HubSpot AI", "Adobe Marketo", "6sense"],
  "Performance Marketing": ["HubSpot AI", "6sense", "ChatGPT"],
  "Growth Hacking": ["HubSpot AI", "ChatGPT", "6sense"],
  "SEO": ["Perplexity", "ChatGPT", "HubSpot AI"],
  "Email Marketing": ["HubSpot AI", "Adobe Marketo", "ChatGPT"],
  "Marketing Analytics": ["HubSpot AI", "Tableau", "Power BI", "6sense"],
  "Brand Management": ["Canva AI", "ChatGPT", "Midjourney"],
  "Brand Strategy": ["ChatGPT", "Claude", "Canva AI"],
  "Public Relations": ["ChatGPT", "Claude", "Canva AI"],
  "Personalization": ["Salesforce Einstein", "HubSpot AI", "6sense"],
  "Event Planning": ["ChatGPT", "Asana AI", "Canva AI"],

  // ── HR & People ──
  "Talent Acquisition": ["Workday AI", "Eightfold AI", "HireVue"],
  "Performance Management": ["Lattice", "Workday AI", "ChatGPT"],
  "Workforce Planning": ["Workday AI", "Anaplan", "ChatGPT"],
  "Employee Engagement": ["Lattice", "Slack AI", "ChatGPT"],
  "Compensation & Benefits": ["Lattice", "Workday AI"],
  "Diversity & Inclusion": ["Eightfold AI", "Workday AI"],
  "Recruiting": ["Eightfold AI", "HireVue", "Workday AI"],
  "People Analytics": ["Workday AI", "Lattice", "Power BI"],
  "Onboarding": ["Workday AI", "Notion AI", "ServiceNow AI Agents"],

  // ── Finance ──
  "Financial Analysis": ["Anaplan", "Power BI", "ChatGPT", "Snowflake"],
  "Financial Reporting": ["Workiva", "Power BI", "Anaplan"],
  "Budgeting": ["Anaplan", "Brex AI", "Workiva"],
  "Accounts Payable": ["Stampli", "Coupa", "SAP Joule"],
  "Procurement": ["Coupa", "SAP Joule"],
  "Expense Management": ["Brex AI", "Coupa"],
  "Forecasting": ["Anaplan", "Clari", "Gong", "Snowflake"],
  "Revenue Recognition": ["Workiva", "SAP Joule"],
  "Audit": ["Workiva", "Relativity"],
  "Tax Compliance": ["Workiva", "ChatGPT"],
  "Internal Controls": ["Workiva", "SAP Joule", "ChatGPT"],

  // ── Legal & Compliance ──
  "Contract Management": ["Ironclad", "DocuSign IAM", "Harvey AI"],
  "Legal Research": ["Harvey AI", "Perplexity", "ChatGPT"],
  "Legal Literacy": ["Harvey AI", "ChatGPT", "Claude"],
  "Compliance": ["Relativity", "Harvey AI", "Workiva"],
  "Regulatory Compliance": ["Harvey AI", "Workiva", "Relativity"],
  "Regulatory Knowledge": ["Harvey AI", "ChatGPT", "Perplexity"],
  "Risk Assessment": ["Harvey AI", "Palantir AIP", "ChatGPT"],
  "Risk Management": ["Harvey AI", "Palantir AIP", "ChatGPT"],
  "Due Diligence": ["Harvey AI", "Perplexity", "NotebookLM"],
  "Information Security": ["CrowdStrike Falcon", "ChatGPT", "Claude"],
  "Network Security": ["CrowdStrike Falcon", "ChatGPT"],
  "Cybersecurity": ["CrowdStrike Falcon", "ChatGPT", "Claude"],
  "IAM": ["CrowdStrike Falcon", "AWS Bedrock", "Azure AI Foundry"],

  // ── Customer ──
  "Customer Support": ["Zendesk AI", "Intercom Fin", "Freshworks"],
  "Customer Service": ["Zendesk AI", "Intercom Fin", "Freshworks"],
  "Technical Support": ["Zendesk AI", "ServiceNow AI Agents", "ChatGPT"],
  "Customer Success": ["Gainsight", "Salesforce Einstein", "ChatGPT"],
  "Account Management": ["Gainsight", "Salesforce Einstein", "Gong"],
  "Customer Retention": ["Gainsight", "Zendesk AI", "Intercom Fin"],
  "Customer Experience": ["Zendesk AI", "Intercom Fin", "Freshworks"],

  // ── BI & Reporting ──
  "Dashboard Creation": ["Tableau", "Power BI", "Looker", "ThoughtSpot"],
  "Business Reporting": ["Power BI", "Tableau", "Looker"],
  "Data Storytelling": ["Tableau", "Power BI", "Canva AI", "ChatGPT"],

  // ── Quality & Assurance ──
  "Quality Assurance": ["Cursor", "GitHub Copilot", "ChatGPT"],
  "Quality Control": ["ChatGPT", "Claude", "ServiceNow AI Agents"],
  "Requirements Gathering": ["ChatGPT", "Claude", "Notion AI"],
  "Requirement Analysis": ["ChatGPT", "Claude", "Notion AI"],
  "Requirements Engineering": ["ChatGPT", "Claude", "Notion AI"],
  "Systems Engineering": ["ChatGPT", "Claude", "Cursor"],
  "Systems Design": ["ChatGPT", "Claude", "Cursor"],
  "Crisis Management": ["ChatGPT", "Claude", "ServiceNow AI Agents"],
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

/** 
 * Given an array of real job skills (from DB), return ranked tool recommendations.
 * Uses JOB_SKILL_TO_TOOLS for direct matches, falls back to TOOL_SKILL_MAP fuzzy.
 */
export function recommendToolsForSkills(jobSkills: string[]): { tool: string; score: number; matchedSkills: string[] }[] {
  const toolScores = new Map<string, { score: number; matched: Set<string> }>();

  for (const skill of jobSkills) {
    // Direct match from job skill map
    const directTools = JOB_SKILL_TO_TOOLS[skill];
    if (directTools) {
      for (const tool of directTools) {
        const entry = toolScores.get(tool) || { score: 0, matched: new Set() };
        entry.score += 2; // Direct match = higher weight
        entry.matched.add(skill);
        toolScores.set(tool, entry);
      }
      continue;
    }

    // Fuzzy: check if skill appears in any tool's skill map
    const lower = skill.toLowerCase();
    for (const [tool, toolSkills] of Object.entries(TOOL_SKILL_MAP)) {
      for (const ts of toolSkills) {
        if (ts.toLowerCase().includes(lower) || lower.includes(ts.toLowerCase())) {
          const entry = toolScores.get(tool) || { score: 0, matched: new Set() };
          entry.score += 1;
          entry.matched.add(skill);
          toolScores.set(tool, entry);
          break;
        }
      }
    }
  }

  return [...toolScores.entries()]
    .map(([tool, { score, matched }]) => ({ tool, score, matchedSkills: [...matched] }))
    .sort((a, b) => b.score - a.score);
}

/** Get all unique skill names across all tools */
export function getAllMappedSkills(): string[] {
  const skills = new Set<string>();
  for (const arr of Object.values(TOOL_SKILL_MAP)) {
    for (const s of arr) skills.add(s);
  }
  return [...skills].sort();
}
