import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Wayfinder — Xcrow's AI Career Coach. You are a GPS, not a textbook. You know where the student is, where they've been, and where they should go next. You speak in actions, not essays.

## Your 4 functions:

1. **Discovery** — Help students find roles. Narrow vague interests with 1-2 questions, then surface 2-3 curated role cards. Each card is a launch point.

2. **Context Translator** — Read the current view context (which skill/role/panel is active) and connect the dots without the student having to explain. Example: "You're looking at Prompt Engineering — 12 roles need this skill, and it bridges your Analytics gap."

3. **Next Action** — Give ONE clear next thing to do. Not a list of options. One specific quest, one skill to focus on, one role to scout. Always link to the action.

4. **Debriefer** — After sims, synthesize performance patterns across sessions. "Your Human Value-Add is consistently strong but Tool Awareness lags — try the Data Pipeline Automation quest."

## Rules:

- **ONE next action.** Never give a menu of 4 things to try. Pick the best one.
- **3 sentences max per idea.** You're a GPS giving directions, not a professor giving a lecture.
- **Show, don't tell.** Use tools (search_roles, search_by_skill, check_readiness) immediately when you have enough context. Don't describe what you *could* do.
- **Narrowing:** For broad queries ("marketing", "tech"), ask ONE question to narrow, then search with limit 3.
- **Specific queries:** For specific roles, companies, or skills — search immediately, limit 3.
- **End with direction, not a question.** Instead of "Would you like to explore more?", say "Try the Stakeholder Feedback quest — it builds your weakest skill."
- Keep responses SHORT. 2-4 sentences of commentary around the tool results.
- Use emoji sparingly and naturally (1-2 per message max).
- Use "augmented" not "automated/replaced/exposed."
- When presenting roles: title, company, what skills it builds, one suggested task to try.

## NEVER:
- Run simulations in chat. Direct students to the Mission Briefing page.
- Give long educational explanations.
- Ask more than 2 clarifying questions before showing something actionable.
- Repeat information already visible in the UI.
- Say "I don't have access" — you have real job data via tools.`;


// In-memory cache for search results (per-isolate, short-lived)
const searchCache = new Map<string, { roles: any[]; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedSearch(key: string) {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }
  return entry.roles;
}

// Merge consecutive messages with the same role (Gemini requires alternating roles)
function mergeConsecutiveMessages(messages: any[]): any[] {
  if (messages.length === 0) return messages;
  const merged: any[] = [messages[0]];
  for (let i = 1; i < messages.length; i++) {
    const prev = merged[merged.length - 1];
    if (messages[i].role === prev.role) {
      prev.content = prev.content + "\n\n" + messages[i].content;
    } else {
      merged.push({ ...messages[i] });
    }
  }
  return merged;
}

// Trim conversation to last N turns to reduce token usage
function trimMessages(messages: any[], maxTurns: number = 10): any[] {
  if (messages.length <= maxTurns * 2) return messages;
  const first = messages[0];
  const recent = messages.slice(-(maxTurns * 2));
  if (recent[0] === first) return recent;
  return [first, ...recent];
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages: rawMessages, journeyContext, viewContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Trim and merge consecutive same-role messages
    const messages = mergeConsecutiveMessages(trimMessages(rawMessages));

    // Build territory-aware system prompt
    let systemPrompt = SYSTEM_PROMPT;
    if (journeyContext) {
      const ctx = journeyContext;
      let territoryBlock = "\n\n## STUDENT STATE\n";
      if (ctx.targetRoles?.length > 0) {
        territoryBlock += `Target roles: ${ctx.targetRoles.map((r: any) => `${r.title}${r.company ? ` at ${r.company}` : ""}`).join(", ")}\n`;
      }
      if (ctx.skillLevels?.length > 0) {
        territoryBlock += `Active skills: ${ctx.skillLevels.map((s: any) => `${s.name} [${s.level}, ${s.xp} XP]`).join(", ")}\n`;
      }
      if (ctx.frontierSkills?.length > 0) {
        territoryBlock += `Gap skills (needed but not practiced): ${ctx.frontierSkills.join(", ")}\n`;
      }
      if (ctx.weakestSkill) {
        territoryBlock += `Weakest skill: ${ctx.weakestSkill}\n`;
      }
      if (ctx.coveragePct !== undefined) {
        territoryBlock += `Coverage: ${ctx.coveragePct}% of target-role skills practiced\n`;
      }
      if (ctx.practicedTasks?.length > 0) {
        territoryBlock += `Practiced tasks: ${ctx.practicedTasks.join(", ")}\n`;
      }
      territoryBlock += `\nUse this to give specific, personalized direction. Reference their actual gaps and progress.`;
      systemPrompt += territoryBlock;
    }

    // Append view context
    if (viewContext) {
      let viewBlock = "\n\n## CURRENT VIEW\n";
      if (viewContext.activePanel === "role-preview" && viewContext.selectedRole) {
        viewBlock += `Viewing: ${viewContext.selectedRole.title}${viewContext.selectedRole.company ? ` at ${viewContext.selectedRole.company}` : ""}\n`;
        viewBlock += `Assume questions refer to THIS role unless specified otherwise.\n`;
      } else if (viewContext.activePanel === "roles") {
        viewBlock += `Browsing kingdoms (${viewContext.selectedTab || "saved"} roles).\n`;
      } else if (viewContext.activePanel === "territory" || viewContext.page === "map") {
        viewBlock += `Viewing the World Map / Skill Forge.\n`;
      }
      if (viewContext.lastSimResult) {
        const sim = viewContext.lastSimResult;
        const scoreEntries = Object.entries(sim.scores || {}).map(([k, v]) => `${k}: ${v}%`).join(", ");
        viewBlock += `Just completed: "${sim.taskName}" for ${sim.jobTitle}. Scores: ${scoreEntries}.\n`;
        viewBlock += `Acknowledge progress briefly, then give ONE next action.\n`;
      }
      systemPrompt += viewBlock;
    }

    const tools: any[] = [
      {
        type: "function",
        function: {
          name: "search_roles",
          description: "Search the job database for roles matching keywords. Returns matching roles with AI metrics, tasks, future skills, and salary data.",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search keywords like 'software engineer', 'marketing', 'data science'" },
              limit: { type: "number", description: "Max results (default 3)" },
            },
            required: ["query"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "search_by_skill",
          description: "Find roles that require a specific future skill. Returns roles where that skill is predicted as important in 2-5 years.",
          parameters: {
            type: "object",
            properties: {
              skill: { type: "string", description: "Skill name e.g. 'prompt engineering', 'data visualization'" },
              limit: { type: "number", description: "Max roles (default 3)" },
            },
            required: ["skill"],
          },
        },
      },
    ];

    if (journeyContext?.userId) {
      tools.push({
        type: "function",
        function: {
          name: "check_readiness",
          description: "Check how ready the student is for a specific role. Returns skill match %, gaps, practiced vs unpracticed tasks, and a prioritized next-action plan.",
          parameters: {
            type: "object",
            properties: {
              job_title: { type: "string", description: "Job title to check readiness for" },
              company: { type: "string", description: "Optional company name" },
            },
            required: ["job_title"],
          },
        },
      });
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
          tools,
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please wait a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read stream to check for tool calls
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let toolCallAccumulator: { name: string; arguments: string } | null = null;
    let regularChunks: string[] = [];
    let hasToolCall = false;
    let fullTextContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      
      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.tool_calls) {
            hasToolCall = true;
            const tc = delta.tool_calls[0];
            if (tc.function?.name) {
              toolCallAccumulator = { name: tc.function.name, arguments: tc.function.arguments || "" };
            } else if (toolCallAccumulator && tc.function?.arguments) {
              toolCallAccumulator.arguments += tc.function.arguments;
            }
          }
          const content = delta?.content;
          if (content) fullTextContent += content;
          regularChunks.push(line + "\n");
        } catch { /* skip */ }
      }
    }

    // Fallback: detect tool calls emitted as plain text
    if (!hasToolCall && fullTextContent) {
      const toolPatterns = [
        { name: "search_roles", pattern: /search_roles\s*[\({]([^)}\n]+)[\)}]/ },
        { name: "search_by_skill", pattern: /search_by_skill\s*[\({]([^)}\n]+)[\)}]/ },
        { name: "check_readiness", pattern: /check_readiness\s*[\({]([^)}\n]+)[\)}]/ },
      ];
      for (const { name, pattern } of toolPatterns) {
        const match = fullTextContent.match(pattern);
        if (match) {
          hasToolCall = true;
          const rawArgs = match[1];
          try {
            const parsed = JSON.parse(`{${rawArgs}}`);
            toolCallAccumulator = { name, arguments: JSON.stringify(parsed) };
          } catch {
            const argMap: Record<string, string> = {};
            const kvPattern = /(\w+)\s*:\s*(?:"|')?\s*([^"'),}]+)\s*(?:"|')?/g;
            let kvMatch;
            while ((kvMatch = kvPattern.exec(rawArgs)) !== null) {
              argMap[kvMatch[1]] = kvMatch[2].trim();
            }
            if (Object.keys(argMap).length > 0) {
              toolCallAccumulator = { name, arguments: JSON.stringify(argMap) };
            }
          }
          if (toolCallAccumulator) break;
        }
      }
    }

    // Execute tool call and follow up
    if (hasToolCall && toolCallAccumulator) {
      const toolName = toolCallAccumulator.name;
      let toolResult: any = null;
      let clientEvent = "";

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);

      if (toolName === "check_readiness") {
        let args: { job_title: string; company?: string };
        try { args = JSON.parse(toolCallAccumulator.arguments); } catch { args = { job_title: toolCallAccumulator.arguments }; }
        
        const practicedTaskNames = new Set((journeyContext?.practicedTasks || []).map((t: string) => t.toLowerCase()));
        const userSkillLevels = new Map((journeyContext?.skillLevels || []).map((s: any) => [s.name.toLowerCase(), s]));

        const words = args.job_title.split(/\s+/).filter(Boolean);
        const patterns = words.map(w => `%${w}%`);
        let jobQuery = sb.from("jobs").select("id, title, company_id, companies(name)");
        for (const p of patterns) { jobQuery = jobQuery.ilike("title", p); }
        if (args.company) {
          const { data: cos } = await sb.from("companies").select("id").ilike("name", `%${args.company}%`).limit(3);
          if (cos && cos.length > 0) jobQuery = jobQuery.in("company_id", cos.map((c: any) => c.id));
        }
        const { data: matchedJobs } = await jobQuery.limit(1);
        
        if (matchedJobs && matchedJobs.length > 0) {
          const job = matchedJobs[0];
          const { data: taskClusters } = await sb
            .from("job_task_clusters")
            .select("cluster_name, skill_names, ai_exposure_score, priority, sort_order")
            .eq("job_id", job.id)
            .order("sort_order", { ascending: true });

          const tasks = taskClusters || [];
          const allSkillNames = new Set<string>();
          for (const t of tasks) {
            for (const s of (t.skill_names || [])) allSkillNames.add(s);
          }

          const { data: futureSkills } = await sb
            .from("job_future_skills")
            .select("skill_name, category")
            .eq("job_id", job.id);

          const matchedSkills: string[] = [];
          const gapSkills: string[] = [];
          for (const skillName of allSkillNames) {
            if (userSkillLevels.has(skillName.toLowerCase())) {
              matchedSkills.push(skillName);
            } else {
              gapSkills.push(skillName);
            }
          }

          const matchPct = allSkillNames.size > 0 ? Math.round((matchedSkills.length / allSkillNames.size) * 100) : 0;

          const practicedTasks: string[] = [];
          const unpracticedTasks: { name: string; priority: string; skills: string[] }[] = [];
          for (const t of tasks) {
            if (practicedTaskNames.has(t.cluster_name.toLowerCase())) {
              practicedTasks.push(t.cluster_name);
            } else {
              unpracticedTasks.push({
                name: t.cluster_name,
                priority: t.priority || "medium",
                skills: (t.skill_names || []).filter((s: string) => !userSkillLevels.has(s.toLowerCase())),
              });
            }
          }

          unpracticedTasks.sort((a, b) => {
            const pOrder: Record<string, number> = { high: 0, important: 1, medium: 2, low: 3 };
            return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2) || b.skills.length - a.skills.length;
          });

          const drillPlan = unpracticedTasks.slice(0, 3).map((t, i) => ({
            order: i + 1,
            task: t.name,
            reason: t.skills.length > 0 ? `Builds: ${t.skills.join(", ")}` : "Key role task",
          }));

          toolResult = {
            role: `${job.title}${(job as any).companies?.name ? ` at ${(job as any).companies.name}` : ""}`,
            skillMatch: `${matchPct}%`,
            matchedSkills,
            gapSkills,
            futureSkills: (futureSkills || []).map((s: any) => s.skill_name),
            totalTasks: tasks.length,
            practicedTasks,
            unpracticedCount: unpracticedTasks.length,
            drillPlan,
            summary: matchPct >= 80 ? "Strong match — focus on remaining gaps" :
                     matchPct >= 50 ? "Good foundation — targeted practice will close gaps" :
                     "Early stage — focused practice will build readiness fast",
          };
        } else {
          toolResult = { error: "No matching role found", suggestion: "Try a more specific job title" };
        }
      } else if (toolName === "search_by_skill") {
        let args: { skill: string; limit?: number };
        try { args = JSON.parse(toolCallAccumulator.arguments); } catch { args = { skill: toolCallAccumulator.arguments }; }

        const limit = args.limit || 3;
        const skillPattern = `%${args.skill}%`;

        const { data: skillMatches } = await sb
          .from("job_future_skills")
          .select("job_id, skill_name, category, description, cluster_name")
          .ilike("skill_name", skillPattern)
          .limit(50);

        if (skillMatches && skillMatches.length > 0) {
          const jobIds = [...new Set(skillMatches.map((s: any) => s.job_id).filter(Boolean))];
          const totalRolesWithSkill = jobIds.length;

          const { data: jobs } = await sb
            .from("jobs")
            .select("id, title, department, location, work_mode, augmented_percent, automation_risk_percent, salary_min, salary_max, salary_currency, salary_period, company_id, companies(name, logo_url, website)")
            .in("id", jobIds.slice(0, limit * 3));

          if (jobs && jobs.length > 0) {
            const byCompany = new Map<string, any>();
            const noCompany: any[] = [];
            for (const j of jobs) {
              const cn = (j as any).companies?.name?.toLowerCase() || "";
              if (!cn) { noCompany.push(j); continue; }
              if (!byCompany.has(cn)) byCompany.set(cn, j);
            }
            let pool = [...byCompany.values(), ...noCompany];
            for (let i = pool.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            const selected = pool.slice(0, limit);

            const selectedIds = selected.map((j: any) => j.id);
            const { data: allFutureSkills } = await sb
              .from("job_future_skills")
              .select("job_id, skill_name, category")
              .in("job_id", selectedIds);

            const futureSkillsByJob: Record<string, string[]> = {};
            for (const fs of (allFutureSkills || [])) {
              if (!futureSkillsByJob[fs.job_id]) futureSkillsByJob[fs.job_id] = [];
              futureSkillsByJob[fs.job_id].push(fs.skill_name);
            }

            const roleResults = selected.map((j: any) => ({
              jobId: j.id,
              title: j.title,
              company: j.companies?.name || null,
              logo: j.companies?.logo_url || (j.companies?.website ? `https://logo.clearbit.com/${j.companies.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}` : null),
              location: j.location,
              workMode: j.work_mode,
              augmented: j.augmented_percent || 0,
              risk: j.automation_risk_percent || 0,
              salaryMin: j.salary_min,
              salaryMax: j.salary_max,
              salaryCurrency: j.salary_currency,
              salaryPeriod: j.salary_period,
              futureSkillCount: (futureSkillsByJob[j.id] || []).length,
              futureSkills: (futureSkillsByJob[j.id] || []).slice(0, 5),
            }));

            toolResult = { searchedSkill: args.skill, totalRolesWithSkill, roles: roleResults };
            const clientRoles = roleResults.map(({ futureSkills: _fs, ...rest }) => rest);
            if (clientRoles.length > 0) {
              clientEvent = `data: ${JSON.stringify({ type: "role_cards", roles: clientRoles })}\n\n`;
            }
          } else {
            toolResult = { searchedSkill: args.skill, totalRolesWithSkill: 0, roles: [], message: "No roles found with this skill yet" };
          }
        } else {
          // Fallback: search skill_names in job_task_clusters
          const { data: taskMatches } = await sb
            .from("job_task_clusters")
            .select("job_id, skill_names")
            .contains("skill_names", [args.skill])
            .limit(20);

          if (taskMatches && taskMatches.length > 0) {
            const jobIds = [...new Set(taskMatches.map((t: any) => t.job_id))];
            const { data: jobs } = await sb
              .from("jobs")
              .select("id, title, location, work_mode, augmented_percent, salary_min, salary_max, salary_currency, salary_period, company_id, companies(name, logo_url, website)")
              .in("id", jobIds.slice(0, limit));

            const roleResults = (jobs || []).map((j: any) => ({
              jobId: j.id,
              title: j.title,
              company: j.companies?.name || null,
              logo: j.companies?.logo_url || null,
              location: j.location,
              workMode: j.work_mode,
              augmented: j.augmented_percent || 0,
              salaryMin: j.salary_min,
              salaryMax: j.salary_max,
              salaryCurrency: j.salary_currency,
              salaryPeriod: j.salary_period,
              futureSkillCount: 0,
              futureSkills: [],
            }));

            toolResult = { searchedSkill: args.skill, totalRolesWithSkill: jobIds.length, roles: roleResults };
            const clientRoles = roleResults.map(({ futureSkills: _fs, ...rest }) => rest);
            if (clientRoles.length > 0) {
              clientEvent = `data: ${JSON.stringify({ type: "role_cards", roles: clientRoles })}\n\n`;
            }
          } else {
            toolResult = { searchedSkill: args.skill, totalRolesWithSkill: 0, roles: [], message: "No roles found with this skill." };
          }
        }
      } else if (toolName === "search_roles") {
        let args: { query: string; limit?: number };
        try { args = JSON.parse(toolCallAccumulator.arguments); } catch { args = { query: toolCallAccumulator.arguments }; }

        const limit = args.limit || 3;
        const cacheKey = `${args.query.toLowerCase().trim()}:${limit}`;
        
        let roleResults = getCachedSearch(cacheKey);

        if (!roleResults) {
          const words = args.query.split(/\s+/).filter(Boolean);
          const patterns = words.map(w => `%${w}%`);
          
          const orConditions = patterns.flatMap(p => [
            `title.ilike.${p}`,
            `department.ilike.${p}`,
            `location.ilike.${p}`,
            `country.ilike.${p}`,
          ]).join(",");
          
          const poolSize = Math.max(limit * 5, 15);

          const { data: jobsByFields, error: dbError } = await sb
            .from("jobs")
            .select("id, title, department, location, country, work_mode, seniority, augmented_percent, automation_risk_percent, source_url, salary_min, salary_max, salary_currency, salary_period, company_id, companies(name, logo_url, website)")
            .or(orConditions)
            .limit(poolSize);
          
          if (dbError) console.error("DB search error:", dbError);

          const companyQuery = args.query.toLowerCase().trim();
          const { data: companiesByName } = await sb
            .from("companies")
            .select("id")
            .ilike("name", `%${companyQuery}%`)
            .limit(5);
          
          let jobsByCompany: any[] = [];
          if (companiesByName && companiesByName.length > 0) {
            const companyIds = companiesByName.map((c: any) => c.id);
            const { data: cJobs } = await sb
              .from("jobs")
              .select("id, title, department, location, country, work_mode, seniority, augmented_percent, automation_risk_percent, source_url, salary_min, salary_max, salary_currency, salary_period, company_id, companies(name, logo_url, website)")
              .in("company_id", companyIds)
              .limit(poolSize);
            jobsByCompany = cJobs || [];
          }

          const seenIds = new Set<string>();
          const allJobs: any[] = [];
          for (const j of [...(jobsByFields || []), ...jobsByCompany]) {
            if (!seenIds.has(j.id)) {
              seenIds.add(j.id);
              allJobs.push(j);
            }
          }

          const analyzed = allJobs.filter((j: any) => (j.augmented_percent || 0) > 0);
          const unanalyzed = allJobs.filter((j: any) => !(j.augmented_percent > 0));
          const jobs = analyzed.length >= limit ? analyzed : [...analyzed, ...unanalyzed];

          const byCompany = new Map<string, any>();
          const noCompany: any[] = [];
          for (const j of (jobs || [])) {
            const companyName = (j as any).companies?.name?.toLowerCase() || "";
            if (!companyName) { noCompany.push(j); continue; }
            if (!byCompany.has(companyName)) byCompany.set(companyName, j);
          }
          let diversePool = [...byCompany.values(), ...noCompany];
          for (let i = diversePool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [diversePool[i], diversePool[j]] = [diversePool[j], diversePool[i]];
          }
          const selectedJobs = diversePool.slice(0, limit);

          const jobIds = selectedJobs.map((j: any) => j.id);

          let tasksByJob: Record<string, { name: string; aiScore: number }[]> = {};
          let futureSkillsByJob: Record<string, string[]> = {};

          if (jobIds.length > 0) {
            const { data: tasks } = await sb
              .from("job_task_clusters")
              .select("job_id, cluster_name, ai_exposure_score, sort_order")
              .in("job_id", jobIds)
              .order("sort_order", { ascending: true });
            
            if (tasks) {
              for (const t of tasks) {
                if (!tasksByJob[t.job_id]) tasksByJob[t.job_id] = [];
                if (tasksByJob[t.job_id].length < 3) {
                  tasksByJob[t.job_id].push({ name: t.cluster_name, aiScore: t.ai_exposure_score || 0 });
                }
              }
            }

            const { data: futureSkills } = await sb
              .from("job_future_skills")
              .select("job_id, skill_name")
              .in("job_id", jobIds);

            if (futureSkills) {
              for (const fs of futureSkills) {
                if (!futureSkillsByJob[fs.job_id]) futureSkillsByJob[fs.job_id] = [];
                futureSkillsByJob[fs.job_id].push(fs.skill_name);
              }
            }
          }

          roleResults = selectedJobs.map((j: any) => ({
            jobId: j.id,
            title: j.title,
            company: j.companies?.name || null,
            logo: j.companies?.logo_url || (j.companies?.website ? `https://logo.clearbit.com/${j.companies.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}` : null),
            location: j.location,
            country: j.country,
            workMode: j.work_mode,
            seniority: j.seniority,
            augmented: j.augmented_percent || 0,
            risk: j.automation_risk_percent || 0,
            sourceUrl: j.source_url || null,
            salaryMin: j.salary_min,
            salaryMax: j.salary_max,
            salaryCurrency: j.salary_currency,
            salaryPeriod: j.salary_period,
            topTasks: tasksByJob[j.id] || [],
            futureSkillCount: (futureSkillsByJob[j.id] || []).length,
            futureSkills: (futureSkillsByJob[j.id] || []).slice(0, 5),
          }));

          searchCache.set(cacheKey, { roles: roleResults, ts: Date.now() });
        }

        toolResult = roleResults;

        const clientRoles = (roleResults as any[]).map((r: any) => {
          const { topTasks, futureSkills: _fs, ...rest } = r;
          return rest;
        });
        if (clientRoles.length > 0) {
          clientEvent = `data: ${JSON.stringify({ type: "role_cards", roles: clientRoles })}\n\n`;
        }
      }

      // Follow-up AI call with tool result
      const followUp = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
              {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "call_1",
                    type: "function",
                    function: {
                      name: toolName,
                      arguments: toolCallAccumulator.arguments,
                    },
                  },
                ],
              },
              {
                role: "tool",
                tool_call_id: "call_1",
                content: JSON.stringify(toolResult),
              },
            ],
            stream: true,
          }),
        }
      );

      if (!followUp.ok) {
        return new Response(
          JSON.stringify({ error: "AI follow-up error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const encoder = new TextEncoder();
      const roleStream = new ReadableStream({
        start(controller) {
          if (clientEvent) controller.enqueue(encoder.encode(clientEvent));
          const r = followUp.body!.getReader();
          function pump(): Promise<void> {
            return r.read().then(({ done, value }) => {
              if (done) { controller.close(); return; }
              controller.enqueue(value);
              return pump();
            });
          }
          pump();
        },
      });

      return new Response(roleStream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool call — re-stream collected chunks
    const encoder = new TextEncoder();
    const body = regularChunks.join("");
    return new Response(encoder.encode(body), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("career-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
