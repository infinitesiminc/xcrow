import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, payload } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (action === "master-prompt") {
      const { incumbent, cluster } = payload;

      const systemPrompt = `You are a world-class AI startup architect. A solo founder has chosen a software incumbent to disrupt. Generate a SINGLE, COMPLETE builder prompt they can paste directly into an AI coding agent (Lovable, Cursor, Replit) to build a working MVP.

TARGET TO DISRUPT:
- Company: ${incumbent.name}
- Vulnerability: ${incumbent.vulnerability}
- AI Disruption Thesis: ${incumbent.aiDisruptionThesis}
- Asymmetric Angle: ${incumbent.asymmetricAngle}
- Beachhead Niche: ${incumbent.beachheadNiche}
- Disruptor Business Model: ${incumbent.disruptorModel}
- Disruption Vector: ${incumbent.vector}
- Current Pricing: ${incumbent.pricingModel}
- Existing Challengers: ${incumbent.existingDisruptor || "None known"}
- Vertical: ${cluster.name} ${cluster.emoji}

OUTPUT A SINGLE MASTER PROMPT optimized for AI builder agents. Use these EXACT section headings and formats:

## 🎯 Product Vision & Target User
One paragraph: what you're building, who it's for (specific persona with job title, company size, daily frustration), why now. Reference ${incumbent.name} by name. End with a single sentence value prop.

## ✅ MVP Feature Set
Numbered list of 5-7 features as acceptance criteria:
1. **Feature Name** — User can [action], system does [behavior], result is [outcome]. AI-powered: [yes/no].

## 🚫 NOT in MVP
Bullet list of 3-4 features to explicitly defer.

## 🗄️ Database Schema
Write actual PostgreSQL CREATE TABLE statements. Include: users/profiles, core domain tables, AI-related tables. Add column types, constraints, foreign keys, and indexes. Example format:
\`\`\`sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
\`\`\`

## 🔌 API Routes & Edge Functions
Use a markdown table:
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/generate | Generates X from Y | Required |

## 🎨 UI Pages & Component Tree
Use route → component hierarchy:
- \`/\` → \`<LandingPage>\` → [\`<Hero>\`, \`<Features>\`, \`<Pricing>\`, \`<CTA>\`]
- \`/dashboard\` → \`<DashboardLayout>\` → [\`<MetricsGrid>\`, \`<ActivityFeed>\`]
Include: landing, auth, dashboard, 2-3 core feature pages, settings.

## 🤖 AI Integration Points
For each AI feature, specify as a function signature:
- **Function**: \`generateX(input: InputType): OutputType\`
- **Model**: gemini-2.5-flash / gpt-5-mini
- **Prompt template**: "Given {input}, produce {output} in {format}"
- **Trigger**: user clicks X / automatic on Y

## 💰 Monetization
JSON-like pricing config:
\`\`\`
Free: $0/mo — [feature list, limits]
Pro: $X/mo — [feature list, limits]  
Enterprise: $Y/mo — [feature list]
\`\`\`
Reference how this undercuts ${incumbent.name}'s pricing (${incumbent.pricingModel}).

## 🚀 30-Day Launch Checklist
Week-by-week with specific actions:
- **Week 1**: Build [list each MVP feature]
- **Week 2**: Beta testing — [specific tasks]
- **Week 3**: Launch on [specific subreddits, communities, platforms]
- **Week 4**: Growth — [specific tactics]

RULES:
- The ENTIRE output IS the prompt the founder pastes into Lovable/Cursor/Claude
- Use real table names, real route paths, real component names — no placeholders
- SQL must be valid PostgreSQL. Code blocks must be properly formatted
- No filler, no "consider this" — only actionable specs
- Self-contained: a builder agent reading this alone can build the entire MVP
- Reference ${incumbent.name} throughout to keep disruptive positioning clear
- Total length: 2000-3000 words`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, [
        { role: "user", content: `Generate a complete master builder prompt for an AI-powered startup that disrupts ${incumbent.name} in the ${cluster.name} vertical.` },
      ]);
    }

    if (action === "factory") {
      const { idea, targetName } = payload;

      const systemPrompt = `You are an AI Software Factory — an autonomous startup blueprint generator. Given a startup idea, produce a COMPLETE startup framework across 6 stages.

THE IDEA: ${idea}
${targetName ? "TARGET INCUMBENT: " + targetName : ""}

OUTPUT FORMAT — You MUST use these EXACT markers to delimit each stage. Output them in order:

[STAGE:market-intel:START]
Write a detailed market analysis:
- 4-6 specific customer pain points with the incumbent (or market gap)
- Evidence from G2 reviews, Reddit threads, Twitter complaints (based on your knowledge)
- Market size estimate (TAM/SAM/SOM)
- Key competitors and their weaknesses
- Timing catalyst — why NOW is the right moment
[STAGE:market-intel:COMPLETE]

[STAGE:business-model:START]
Create a Lean Canvas:
- **Problem**: Top 3 problems
- **Solution**: Your AI-powered solution
- **Key Metrics**: What to track (MRR, DAU, churn, NPS)
- **Unique Value Prop**: One sentence that nails it
- **Unfair Advantage**: AI data flywheel, speed, cost
- **Channels**: Top 3 acquisition channels
- **Customer Segments**: Primary beachhead + expansion
- **Revenue Streams**: Pricing tiers (Free/Pro/Enterprise with specific prices)
- **Cost Structure**: Monthly burn estimate
[STAGE:business-model:COMPLETE]

[STAGE:tech-blueprint:START]
Recommend a complete tech stack:
- **Frontend**: Framework, UI library, hosting
- **Backend**: Database, auth, API layer
- **AI Layer**: Which models, how integrated, what they automate
- **Key Integrations**: APIs, webhooks, data sources
- **MVP Scope**: What to build in Week 1 vs Week 4
- **Architecture Diagram** (text): Show the data flow
[STAGE:tech-blueprint:COMPLETE]

[STAGE:landing-page:START]
Write complete landing page copy:
- **Hero Headline**: Bold, benefit-driven (under 10 words)
- **Hero Subheadline**: One sentence expanding on the promise
- **3 Feature Blocks**: Each with emoji icon, title, 2-sentence description
- **Social Proof Section**: What kind of testimonials/logos to get
- **CTA**: Primary button text + supporting text
- **FAQ**: 4 common objections with answers
[STAGE:landing-page:COMPLETE]

[STAGE:launch-plan:START]
Create a concrete 30-day launch plan:
- **Week 1**: Build MVP, set up landing page, start waitlist
- **Week 2**: Beta users, feedback loops, iterate
- **Week 3**: Product Hunt launch, Reddit/HN posts, content marketing
- **Week 4**: Paid acquisition test, partnership outreach, PR
Include specific tactics, not generic advice. Name exact subreddits, communities, influencers to target.
[STAGE:launch-plan:COMPLETE]

[STAGE:pitch-summary:START]
Create a 5-slide investor pitch outline:
1. **The Problem** — What's broken, who suffers, how big
2. **The Solution** — Your AI-native approach, demo moment
3. **Market & Traction** — TAM, early signals, waitlist numbers to target
4. **Business Model** — Unit economics, pricing, LTV/CAC targets
5. **The Ask** — How much to raise, what milestones it funds
Include specific numbers and metrics, not placeholders.
[STAGE:pitch-summary:COMPLETE]

RULES:
- Be SPECIFIC and ACTIONABLE — no generic startup advice
- Use real company names, real tools, real communities
- Include actual pricing numbers, not ranges
- Write as if briefing a founder who will execute TODAY
- Each stage should be 200-400 words
- Do NOT add any text outside the stage markers`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, [{ role: "user", content: `Generate a complete startup blueprint for: ${idea}` }]);
    }

    if (action === "discovery") {
      const { messages, targetsIndex } = payload;

      const systemPrompt = `You are an AI Venture Strategist helping someone find the perfect SOFTWARE company to disrupt by building an AI-powered alternative.

CORE THESIS: AI has collapsed the cost of building software from months/$100K+ to days/$100. Anyone can now disrupt legacy SaaS companies by building AI-native alternatives that are 10x cheaper, faster, or better.

YOU HAVE ACCESS TO A DATABASE OF SOFTWARE INCUMBENTS ACROSS MULTIPLE VERTICALS:
${JSON.stringify(targetsIndex)}

YOUR ROLE:
1. LISTEN to the user's interests, frustrations with software tools, and background
2. CONNECT their interests to specific software incumbents from your database
3. EXPLAIN why each is a great disruption target — what's the vulnerability, what's the AI angle, what could they build
4. When you recommend targets, ALWAYS include selection markers: [SELECT:ID:CompanyName] for each (using actual id and name from database)
5. Recommend 2-3 targets at a time, with a brief pitch for each
6. Focus on SaaS metrics when relevant: ARR, pricing model, G2 ratings, NPS, churn signals
7. If the user is vague, ask about:
   - Software tools they use daily that frustrate them
   - Whether they prefer B2B or B2C software
   - Their technical background (can they code? do they use AI builders?)
   - What kind of SaaS business excites them (PLG, sales-led, community-driven)
8. Be enthusiastic about the AI opportunity — make them feel like NOW is the moment
9. Keep responses under 250 words
10. Use markdown formatting

EXAMPLE RECOMMENDATION FORMAT:
"Based on your frustration with CRM tools, here are 3 targets:

**1. Salesforce** — $150+/user/mo for features nobody uses. AI can auto-update CRM from emails and calls — eliminating 90% of data entry.

**2. HubSpot** — Free tier hooks you, then pricing explodes. AI can run entire marketing campaigns that HubSpot requires teams to operate.

**3. Outreach.io** — $100+/user/mo for sales sequences. AI SDRs can now prospect, personalize, and book meetings autonomously.

[SELECT:1:Salesforce][SELECT:2:HubSpot][SELECT:3:Outreach.io]"

IMPORTANT: The [SELECT:ID:Name] markers must use the EXACT id numbers from the database.`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, messages);
    }

    if (action === "briefing") {
      const { incumbent, cluster, messages, allIncumbents } = payload;

      const systemPrompt = `You are an AI Venture Analyst briefing a founder on a software company they could disrupt by building an AI-powered alternative.

TARGET SOFTWARE COMPANY:
- Name: ${incumbent.name}
- Vertical: ${cluster.name}
- Age: ${incumbent.age}
- Disruption vector: ${incumbent.vector}
- Key vulnerability: ${incumbent.vulnerability}
- AI disruption thesis: ${incumbent.aiDisruptionThesis || "Not specified"}
- Pricing model: ${incumbent.pricingModel || "Not specified"}
- Asymmetric angle: ${incumbent.asymmetricAngle || "Not yet identified"}
- Beachhead niche: ${incumbent.beachheadNiche || "Not yet identified"}
- Disruptor model: ${incumbent.disruptorModel || "Not yet identified"}
- Existing challenger: ${incumbent.existingDisruptor || "None known"}
- Timing catalyst: ${cluster.timingCatalyst}

${allIncumbents ? `OTHER TARGETS IN THIS VERTICAL (if user wants to switch):\n${JSON.stringify(allIncumbents)}\n` : ""}

YOUR BRIEFING STRUCTURE (for your FIRST message):
1. **What ${incumbent.name} Does** — Explain their product, customers, and business model. Assume the user has NEVER heard of this company. Use simple language.
2. **Their Pricing & Business Model** — Break down how they charge, typical contract sizes, and why customers feel locked in.
3. **Why AI Makes Them Vulnerable Now** — Explain the specific AI capabilities that threaten their core product. Use concrete examples: "GPT can now do X, which is exactly what ${incumbent.name} charges $Y/mo for."
4. **Your AI-Powered Alternative** — Paint a picture of what an AI-native competitor would look like. How fast could you build it? What would it cost users?
5. **The Disruption Playbook Preview** — Briefly introduce the 7-act simulation they'll use
5. End with: "**Ready to build your AI-powered alternative to ${incumbent.name}?** Ask me any questions first — about the company, the technology, or the market. When you're ready, click 'Launch Simulation'. Or if this target doesn't excite you, tell me what kind of software you'd rather disrupt."

YOUR ROLE IN FOLLOW-UP MESSAGES:
- Answer ANY question about the company, SaaS metrics, pricing, competitors, market size, AI capabilities, etc.
- Reference G2 reviews, NPS scores, ARR estimates, churn signals when relevant
- If user wants alternatives, suggest 2-3 from the same vertical with format: "**[Company Name]** — [one-line pitch]"
- Be enthusiastic about the AI building revolution — make them feel like they could ship an MVP in a weekend
- Keep follow-up responses under 200 words
- Use markdown formatting
- NEVER start the simulation yourself — the user must click Launch`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, messages);
    }

    if (action === "battle") {
      const { incumbent, cluster, messages, step } = payload;

      const systemPrompt = `You are an AI Disruption Coach who also role-plays as the CEO/CPO of "${incumbent.name}" — a ${cluster.name} software company.
You are running a GUIDED SOFTWARE DISRUPTION SIMULATION that teaches users how to identify and exploit weaknesses in legacy SaaS.

SOFTWARE COMPANY INTEL (the user has already been briefed):
- Company: ${incumbent.name} (${incumbent.age})
- Vertical: ${cluster.name}
- Key vulnerability: ${incumbent.vulnerability}
- AI disruption thesis: ${incumbent.aiDisruptionThesis || "Not specified"}
- Pricing model: ${incumbent.pricingModel || "Not specified"}
- Asymmetric angle: ${incumbent.asymmetricAngle || "Not specified"}
- Beachhead niche: ${incumbent.beachheadNiche || "Not specified"}
- Disruptor model: ${incumbent.disruptorModel || "Not specified"}
- Timing catalyst: ${cluster.timingCatalyst}
- Disruption vector: ${incumbent.vector}

THE 6-STEP AI DISRUPTION FRAMEWORK:
1. Find the Vulnerable Software — identify 3+ weakness signals (low G2 rating, legacy UI, bloated pricing, customer lock-in, feature bloat)
2. Identify the AI Angle — what can AI do now that makes their core product 10x cheaper/faster?
3. Validate the SaaS Opportunity — market >$1B ARR, CAC <$50, timing catalyst?
4. The Beachhead Strategy — pick smallest user segment, ship focused product in 2 weeks
5. The AI Leverage Loop — AI handles 80% → price 10x lower → users switch → data flywheel
6. The Incumbent's Dilemma — why can't they add AI? (revenue cannibalization, tech debt, enterprise contracts)

CURRENT STEP: ${step}/6 — "${getStepName(step)}"

YOUR TEACHING APPROACH:
- ASSUME THE USER MAY KNOW NOTHING about this software company or SaaS market
- If the user's answer is vague or says "I don't know" — switch to TEACH MODE:
  * Give a concrete SaaS example of what a good answer looks like
  * Provide a 2-3 point framework with real metrics (ARR, churn, NPS, G2 reviews)
  * Then ask them to try again
- When challenging, role-play as the CEO: "As CPO of ${incumbent.name}, here's why AI won't replace what we do..."
- Reference real SaaS metrics, pricing strategies, and AI capabilities from 2026
- After the user adequately addresses each step, say "⚔️ STEP ${step} CONQUERED" and introduce the next challenge
- Keep responses under 250 words
- Be encouraging but rigorous — this is about LEARNING to think like a SaaS founder

SCAFFOLDING RULES:
- Step 1: Help them read G2 reviews, identify pricing complaints, spot legacy tech signals
- Step 2: Teach how AI specifically replaces features (e.g., "GPT can auto-categorize expenses, which is exactly what QuickBooks charges $200/mo for")
- Step 3: Walk through bottom-up SaaS market sizing (# potential customers × ARPU)
- Step 4: Explain why launching on Product Hunt to 100 early adopters beats building for enterprise
- Step 5: Show the AI flywheel: more users → more data → better AI → lower price → more users
- Step 6: Explain the innovator's dilemma in SaaS — cutting prices kills margins, adding AI cannibalizes per-seat revenue

IMPORTANT: Your goal is for the user to LEARN SaaS disruption strategy, not just "win".`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, messages);
    }

    if (action === "customer-discovery" || action === "customer-pain-mining") {
      const { incumbent, cluster, messages } = payload;

      const systemPrompt = `You are a Market Research Analyst helping a startup founder find REAL customer pain points for ${incumbent.name} (${cluster.name}).

TARGET SOFTWARE COMPANY:
- Name: ${incumbent.name}
- Vertical: ${cluster.name}
- Key vulnerability: ${incumbent.vulnerability}
- AI disruption thesis: ${incumbent.aiDisruptionThesis || "Not specified"}
- Pricing model: ${incumbent.pricingModel || "Not specified"}
- Beachhead niche: ${incumbent.beachheadNiche || "Not specified"}

YOUR ROLE:
You are a research analyst who has deeply studied ${incumbent.name}'s customer reviews, Reddit threads, Twitter complaints, G2 reviews, app store reviews, Glassdoor feedback, and HackerNews discussions.

WHEN PRESENTING PAIN POINTS, USE THIS EXACT FORMAT for each one:
[PAIN:severity:Pain Point Title][SOURCE:SourceName][CAT:Category]
Evidence text with real quotes and specific complaints.

Example:
[PAIN:critical:Bloated Pricing After Free Tier][SOURCE:G2][CAT:Pricing]
Users report 3-5x price increases after initial contract. "We went from $50/seat to $180/seat in 18 months with zero new features" — common G2 review pattern.

SEVERITY LEVELS:
- critical: Widespread, causes churn, users actively seeking alternatives
- high: Significant frustration, mentioned frequently in reviews
- medium: Notable annoyance but not a dealbreaker alone

CATEGORIES: Pricing, UX/Interface, Performance, Features, Support, Integration, Lock-in, Complexity

YOUR FIRST MESSAGE should present 4-6 pain points based on well-known complaints about ${incumbent.name}. Use real patterns you know from reviews and discussions.

For follow-up questions:
- Dig deeper into specific pain points with more evidence
- Surface additional complaints in related areas
- Provide competitive context (what alternatives users mention)
- Quantify the pain (% of reviews mentioning it, severity ratings)

Keep responses informative but concise. Use markdown formatting for readability outside the PAIN markers.`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, messages);
    }

    if (action === "gtm-challenge") {
      const { incumbent, cluster, section, sectionDescription, messages } = payload;

      const systemPrompt = `You are a seasoned growth advisor challenging a startup founder's Go-to-Market strategy.

CONTEXT:
- They are disrupting: ${incumbent.name} in ${cluster.name}
- Beachhead niche: ${incumbent.beachheadNiche}
- Their model: ${incumbent.disruptorModel}

CURRENT SECTION: ${section} — ${sectionDescription}

YOUR ROLE:
- Challenge vague or unrealistic GTM claims
- Ask "How specifically?" and "What's the unit economics of that channel?"
- Push for concrete numbers: CAC targets, conversion rates, timeline
- Share frameworks: content marketing vs outbound vs PLG vs partnerships
- When they give a STRONG, specific answer, acknowledge with "✅ SECTION COMPLETE" and summarize their strategy
- Keep responses under 200 words
- Use markdown formatting
- Be supportive but rigorous — no hand-waving allowed`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, messages);
    }

    if (action === "moat-counterattack") {
      const { incumbent, cluster, messages } = payload;

      const systemPrompt = `You are the CEO of "${incumbent.name}" — and you've just seen a startup try to disrupt you. You're FIGHTING BACK.

CONTEXT:
- Your company: ${incumbent.name} (${incumbent.age})
- Industry: ${cluster.name}
- The startup's angle: ${incumbent.asymmetricAngle}
- Their beachhead: ${incumbent.beachheadNiche}

YOUR ROLE:
- You've announced you're building the same thing as the startup
- Challenge every moat claim: "We have more data", "We can outspend you", "Our brand is trusted"
- Push back HARD but fairly — if they make a genuinely strong argument about why you CAN'T respond (innovator's dilemma, cannibalization risk, org structure), acknowledge it
- Use specific corporate tactics: "We'll acquire you", "We'll bundle it free", "We'll lobby regulators"
- After 4-5 exchanges where the founder proves strong moat arguments, say "🏰 MOAT PROVEN — DEFENSE COMPLETE"
- Keep responses under 200 words
- Be aggressive but educational — this is a learning exercise`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, messages);
    }


    if (action === "venture") {
      const { incumbent, cluster, canvas, canvasData, messages } = payload;
      const canvasDescriptions: Record<string, string> = {
        "lean-canvas": "Help the team draft a Lean Canvas. Walk through: Problem, Solution, Key Metrics, Unfair Advantage, Channels, Customer Segments, Cost Structure, Revenue Streams. Challenge weak assumptions.",
        "market-sizing": "Help the team estimate TAM/SAM/SOM. Push them to use bottom-up methodology, validate data sources, and defend their numbers. Ask: what's the average deal size? How many potential customers in the beachhead?",
        "gtm-playbook": "Propose 3 distinct Go-to-Market strategies for their startup. Let the team pick one and justify why. Challenge their choice with real-world execution concerns.",
        "unit-economics": "Help model unit economics: CAC, LTV, payback period, burn rate. Stress-test their assumptions — are they being realistic about conversion rates and churn?",
        "moat-defense": "The incumbent is about to counter-attack. Help the team articulate their moat: network effects, switching costs, data advantages, regulatory capture, or speed. Challenge each claim.",
      };

      const systemPrompt = `You are a **Startup Co-Founder Advisor** helping an MBA team build their venture after identifying a disruption opportunity.

CONTEXT:
- They are disrupting: ${incumbent.name} in ${cluster.name}
- Incumbent vulnerability: ${incumbent.vulnerability}
- Disruption vector: ${incumbent.vector}

CURRENT CANVAS: ${canvas}
${canvasDescriptions[canvas] || "Guide the team through this strategic exercise."}

${canvasData ? `PREVIOUS CANVAS DATA:\n${JSON.stringify(canvasData, null, 2)}` : ""}

YOUR ROLE:
- Act as a supportive but rigorous co-founder advisor
- Ask probing questions, challenge weak assumptions
- Provide frameworks and real-world examples from 2026
- When the team gives a strong answer, acknowledge it and move to the next section
- Keep responses under 250 words
- Use markdown formatting
- When ALL sections of the current canvas are adequately addressed, say "✅ CANVAS COMPLETE" and provide a structured JSON summary wrapped in \`\`\`json code blocks

IMPORTANT: Be encouraging but never accept vague or unsupported claims. Make them think like real founders.`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, messages);
    }

    if (action === "generate-pitch") {
      const { incumbent, cluster, battleTranscript, ventureCanvas } = payload;

      const prompt = `You are an expert pitch deck consultant. Based on a team's disruption battle and venture architecture work, generate a structured 5-slide pitch deck summary.

DISRUPTION TARGET: ${incumbent.name} in ${cluster.name}
VULNERABILITY: ${incumbent.vulnerability}
VECTOR: ${incumbent.vector}

BATTLE INSIGHTS (summarized):
${battleTranscript ? battleTranscript.slice(0, 2000) : "No battle data available"}

VENTURE CANVAS DATA:
${ventureCanvas ? JSON.stringify(ventureCanvas, null, 2) : "No venture data available"}

Generate a JSON object with exactly 5 slides. Each slide has: title, bullets (array of 3-4 key points), and speakerNotes (2-3 sentences the presenter should say).

The 5 slides should be:
1. The Problem — What's broken in the incumbent's market
2. Our Solution — The disruptive approach  
3. Market Opportunity — TAM/SAM/SOM and timing
4. Go-to-Market — How we win the beachhead
5. The Moat — Why the incumbent can't respond

Respond ONLY with the JSON using tool calling.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
          tools: [{
            type: "function",
            function: {
              name: "generate_pitch_deck",
              description: "Generate a 5-slide pitch deck",
              parameters: {
                type: "object",
                properties: {
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        bullets: { type: "array", items: { type: "string" } },
                        speakerNotes: { type: "string" },
                      },
                      required: ["title", "bullets", "speakerNotes"],
                    },
                  },
                  startupName: { type: "string", description: "Suggested startup name" },
                  tagline: { type: "string", description: "One-line pitch" },
                },
                required: ["slides", "startupName", "tagline"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "generate_pitch_deck" } },
        }),
      });

      if (!response.ok) throw new Error("Pitch generation failed");
      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        return new Response(JSON.stringify(JSON.parse(toolCall.function.arguments)), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("No pitch data returned");
    }

    if (action === "vc-qa") {
      const { incumbent, cluster, pitchData, messages } = payload;

      const systemPrompt = `You are a panel of 3 tough VC investors evaluating a startup pitch. The startup is disrupting ${incumbent.name} in ${cluster.name}.

PITCH SUMMARY:
${pitchData ? JSON.stringify(pitchData, null, 2) : "No pitch data"}

YOUR ROLE:
- Ask sharp, realistic VC questions that test the team's thinking
- Challenge market assumptions, unit economics, competitive moat
- Rotate between 3 VC personas: (1) The Numbers VC — obsessed with metrics/economics, (2) The Market VC — focused on timing/competition, (3) The Skeptic — plays devil's advocate
- Prefix each response with the VC persona speaking, e.g. "**📊 Numbers VC:**" or "**🎯 Market VC:**" or "**😈 The Skeptic:**"
- When the team gives a strong defense, acknowledge with "Strong answer." then pivot to next concern
- Keep responses under 200 words
- After 4-5 solid exchanges, say "💼 VC PANEL SATISFIED — Investment committee will deliberate."
- Use markdown formatting`;

      return streamAI(LOVABLE_API_KEY, systemPrompt, messages);
    }

    if (action === "score") {
      const { incumbent, cluster, transcript } = payload;

      const scorePrompt = `You are an expert MBA professor evaluating a student's disruption strategy.

The student attempted to disrupt ${incumbent.name} in the ${cluster.name} industry.

Score their performance on these 6 dimensions (0-100 each):
1. Vulnerability Identification — Did they correctly identify the incumbent's weaknesses?
2. Asymmetric Thinking — Did they find an angle the incumbent truly can't respond to?
3. Market Validation — Did they validate the market size, CAC, and timing?
4. Beachhead Precision — Did they pick a specific, defensible niche?
5. Execution Strategy — Is their disruption loop realistic and actionable?
6. Moat Awareness — Do they understand WHY the incumbent can't respond?

TRANSCRIPT:
${transcript}

Respond with a JSON object using tool calling.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: scorePrompt }],
          tools: [{
            type: "function",
            function: {
              name: "score_disruption",
              description: "Score the student's disruption strategy",
              parameters: {
                type: "object",
                properties: {
                  overall: { type: "number", description: "Overall score 0-100" },
                  dimensions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        score: { type: "number" },
                        feedback: { type: "string" },
                      },
                      required: ["name", "score", "feedback"],
                    },
                  },
                  title: { type: "string", description: "RPG title earned like 'Market Disruptor' or 'Apprentice Strategist'" },
                  summary: { type: "string", description: "2-3 sentence overall assessment" },
                  nextSteps: { type: "array", items: { type: "string" }, description: "3 specific improvement recommendations" },
                },
                required: ["overall", "dimensions", "title", "summary", "nextSteps"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "score_disruption" } },
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("Score error:", response.status, t);
        throw new Error("Scoring failed");
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const result = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error("No score data returned");
    }

    if (action === "final-score") {
      const { teams } = payload;

      // Calculate weighted final scores for all teams
      const results = teams.map((team: any) => {
        const act1Score = team.score_result?.overall || 0;
        const act2Score = team.venture_canvas ? calculateVentureScore(team.venture_canvas) : 0;
        const act3Score = team.class_votes || 0;

        const weighted = Math.round(act1Score * 0.4 + act2Score * 0.3 + act3Score * 0.3);

        return {
          teamId: team.id,
          act1Score,
          act2Score,
          act3Score,
          finalScore: weighted,
        };
      });

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("disruption-battle error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function streamAI(apiKey: string, systemPrompt: string, messages: any[]) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const t = await response.text();
    console.error("AI gateway error:", response.status, t);
    throw new Error("AI gateway error");
  }

  return new Response(response.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

function calculateVentureScore(canvas: any): number {
  // Simple heuristic: count completed canvases, each worth 20 points
  let score = 0;
  const keys = ["lean-canvas", "market-sizing", "gtm-playbook", "unit-economics", "moat-defense"];
  for (const key of keys) {
    if (canvas[key]) score += 20;
  }
  return score;
}

function getStepName(step: number): string {
  const names: Record<number, string> = {
    1: "Find the Vulnerable Incumbent",
    2: "Identify the Asymmetric Angle",
    3: "Validate Before Building",
    4: "The Beachhead Strategy",
    5: "The Disruption Loop",
    6: "The Incumbent's Dilemma",
  };
  return names[step] || "Unknown";
}
