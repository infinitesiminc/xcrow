

## AI Job Impact Analyzer & Skill Bridge

### Overview
An app where users enter their company and job title to get a task-level analysis of how AI is changing their role, then receive personalized skill recommendations to adapt.

### Pages & Flow

**1. Landing Page**
- Clean hero with headline: "How is AI changing your job?"
- Simple form: Company name + Job title inputs
- "Analyze My Role" CTA button
- Brief explainer of how it works (3-step visual)

**2. Analysis Results Page**
- Job title & company displayed at top
- **Task Breakdown Table**: Lists key tasks for the role, each showing:
  - Task name
  - Current state: "Mostly Human" / "Human + AI" / "Mostly AI"
  - Future trend: arrow indicating shift direction
  - Impact level: Low / Medium / High
- **Summary Stats**: % of tasks being augmented, % at risk of full automation, % requiring new skills
- Visual chart showing human vs AI task distribution

**3. Skill Gap & Recommendations**
- List of skill gaps identified from the analysis
- Each skill shows: name, priority (High/Medium/Low), brief description of why it matters
- Skills categorized into: "AI Tools to Learn", "Human Skills to Strengthen", "New Capabilities to Build"
- Option to save (prompts sign-up if not logged in)

**4. Saved Paths (for logged-in users)**
- Dashboard showing saved analyses and skill recommendations
- Ability to mark skills as "learning" or "completed"

### How It Works
- **Common roles** (e.g., Marketing Manager, Software Engineer, Accountant): Use pre-built data for fast results
- **Niche/custom roles**: AI generates the analysis via Lovable AI (Gemini)
- Results feel consistent regardless of source

### Auth
- Full app works without login
- "Save your results" prompts optional sign-up (email auth via Lovable Cloud)

### Design
- Clean, minimal white design with lots of whitespace
- Subtle blue/indigo accents for CTAs and highlights
- Simple typography, card-based layouts
- Smooth transitions between steps

### Backend (Lovable Cloud)
- Edge function calling Lovable AI for niche role analysis
- Supabase DB to store saved analyses for logged-in users
- Auth for optional accounts

