import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lessonType, lessonContent, userResponse, companyContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // ─── EXPLORER STEP MODE ───────────────────────────
    if (lessonType === "explorer_step") {
      const { stepId, stepLabel } = lessonContent;
      const company = companyContext;

      const stepPrompts: Record<string, { system: string; user: string }> = {
        "company-dna": {
          system: "You are a GTM analyst. Analyze this company and extract key signals. Return structured analysis.",
          user: `Analyze this company:\nName: ${company.name}\nWebsite: ${company.website}\nDescription: ${company.description}\nIndustry: ${company.industry}\nEmployees: ${company.employee_range || company.estimated_employees || "Unknown"}\nFunding: ${company.funding_stage || "Unknown"}\nHQ: ${company.headquarters || "Unknown"}\nARR: ${company.estimated_arr || "Unknown"}\n\nExtract:\n1. What they actually do (one sentence)\n2. Who their customers are\n3. Their business model (SaaS, marketplace, etc.)\n4. Buying signals (are they growing? hiring? expanding?)\n5. Tech maturity level\n\nBe specific and factual. Use the data provided.`
        },
        "product-map": {
          system: "You are a product analyst. Map this company's product lines from their description and website.",
          user: `Company: ${company.name}\nDescription: ${company.description}\nWebsite: ${company.website}\nIndustry: ${company.industry}\n\nMap their product portfolio:\n- Product Line name\n- Target user (who uses it)\n- Pricing model (per-seat, usage, enterprise, freemium)\n- Key competitors for THIS specific product line\n\nList each product line as a separate item. If you can only identify one product, that's fine — be accurate over comprehensive.`
        },
        "pmf-matrix": {
          system: "You are a GTM strategist building a Product-Market Fit matrix.",
          user: `Company: ${company.name}\nDescription: ${company.description}\nIndustry: ${company.industry}\n\nFor each product line you can identify:\n- What PAIN does it solve?\n- WHO feels this pain? (job title + company type)\n- Where does the BUDGET come from? (IT, marketing, ops, C-suite)\n- What's the ENTRY POINT? (how would a seller get in the door?)\n\nFormat as a clear matrix. Be specific about pain points — not generic.`
        },
        "icp-tree": {
          system: "You are an ICP mapping specialist. Build a 3-layer niche tree.",
          user: `Company: ${company.name}\nDescription: ${company.description}\nIndustry: ${company.industry}\nEmployees: ${company.employee_range || "Unknown"}\n\nBuild a 3-layer ICP tree showing WHO would buy from this company:\n\nLevel 1 — Verticals (industries): 3-4 verticals\nLevel 2 — Segments (company types within each vertical): 2-3 per vertical\nLevel 3 — Personas (job titles): 2-3 per segment\n\nFormat as a tree. For each persona, note if they're a Decision Maker (DM), Champion, or Influencer.`
        },
        "buyer-id": {
          system: "You are a sales intelligence analyst identifying decision makers.",
          user: `Company: ${company.name}\nDescription: ${company.description}\nIndustry: ${company.industry}\n\nBased on the ICP analysis, identify the TOP 5 buyer personas who would purchase from ${company.name}:\n\n1. Job title + seniority\n2. Why THEY would buy (what pain do they feel?)\n3. Their role in the buying committee (DM / Champion / Influencer / Blocker)\n4. Best channel to reach them (LinkedIn / Email / Event / Referral)\n5. What would make them reply to cold outreach?\n\nBe specific — not "VP of Engineering" but "VP of Engineering at Series B fintech with 50-200 employees who is scaling their data team".`
        },
        "linkedin-reveal": {
          system: "You are a sales intelligence researcher. Based on the company analysis, describe the exact LinkedIn search criteria and expected profile types that would yield qualified leads. Note: you cannot access live LinkedIn data, so provide the search strategy and example profile patterns.",
          user: `Company: ${company.name}\nIndustry: ${company.industry}\nDescription: ${company.description}\n\nBased on the full analysis, provide:\n\n1. EXACT LinkedIn Sales Navigator search filters:\n   - Job titles to search\n   - Company size range\n   - Industry filters\n   - Geography (if relevant)\n   - Keywords\n\n2. For each of the top 3 personas, describe:\n   - What their LinkedIn headline typically looks like\n   - What to look for in their profile (posts, activity, job changes)\n   - The opening line you'd use in a connection request\n\n3. OUTREACH TEMPLATE for the #1 persona:\n   - Subject line\n   - 3-sentence email\n   - LinkedIn connection note (300 chars max)\n\nMake this actionable — someone should be able to copy these filters into Sales Navigator right now.`
        },
      };

      const prompt = stepPrompts[stepId];
      if (!prompt) {
        return new Response(JSON.stringify({ content: "Unknown step.", reasoning: "" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tools = [{
        type: "function",
        function: {
          name: "submit_analysis",
          description: "Submit the analysis result for this GTM step",
          parameters: {
            type: "object",
            properties: {
              reasoning: { type: "string", description: "Brief explanation of the analytical approach (1-2 sentences)" },
              content: { type: "string", description: "The full analysis output, formatted with markdown" },
            },
            required: ["reasoning", "content"],
            additionalProperties: false,
          },
        },
      }];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user },
          ],
          tools,
          tool_choice: { type: "function", function: { name: "submit_analysis" } },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited — please try again." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI request failed: ${status}`);
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No analysis returned");

      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ORIGINAL GRADING MODE ────────────────────────
    let systemPrompt = "";
    let userPrompt = "";

    if (lessonType === "concept") {
      systemPrompt = `You are a GTM Academy instructor grading a student's understanding of a concept.\nReturn a JSON object with tool calling.`;
      userPrompt = `Concept taught: "${lessonContent.think}"\n\nStudent's answer to comprehension check: "${userResponse}"\n\nGrade on:\n- judgment_score (0-100)\n- speed_score: 75\n- override_score: 75\n- tool_score: 75\n- overall_score (0-100)\n- feedback: 2-3 sentences\n- passed: true if overall >= 70`;
    } else if (lessonType === "prompt_lab") {
      systemPrompt = `You are a GTM Academy instructor evaluating a student's prompt engineering and strategic thinking.`;
      userPrompt = `Exercise: "${lessonContent.prompt}"\nContext: "${lessonContent.think}"\nValidation: "${lessonContent.validate}"\n\nStudent's response:\n"${userResponse}"\n\n${companyContext ? `Company context: ${JSON.stringify(companyContext)}` : ""}\n\nGrade on:\n- judgment_score (0-100)\n- speed_score (0-100)\n- override_score (0-100)\n- tool_score (0-100)\n- overall_score (0-100): (judgment*0.4 + speed*0.2 + override*0.25 + tool*0.15)\n- feedback: 2-3 sentences\n- passed: true if overall >= 70`;
    } else if (lessonType === "challenge") {
      systemPrompt = `You are a GTM Academy Live Lab grader. Be rigorous but fair.`;
      userPrompt = `Challenge: "${lessonContent.prompt}"\nThink: "${lessonContent.think}"\nScoring: "${lessonContent.validate}"\n\n${companyContext ? `Company data:\n${JSON.stringify(companyContext, null, 2)}` : ""}\n\nStudent's submission:\n"${userResponse}"\n\nGrade on:\n- judgment_score (0-100) (40%)\n- speed_score (0-100) (20%)\n- override_score (0-100) (25%)\n- tool_score (0-100) (15%)\n- overall_score weighted\n- feedback: 3-4 sentences\n- highlights: 1-3 items\n- improvements: 1-3 items\n- passed: true if overall >= 70`;
    } else {
      systemPrompt = `You are a GTM Academy instructor evaluating tool usage proficiency.`;
      userPrompt = `Exercise: "${lessonContent.prompt}"\nContext: "${lessonContent.think}"\n\nStudent's response:\n"${userResponse}"\n\nGrade on:\n- judgment_score (0-100)\n- speed_score (0-100)\n- override_score (0-100)\n- tool_score (0-100)\n- overall_score: (judgment*0.4 + speed*0.2 + override*0.25 + tool*0.15)\n- feedback: 2-3 sentences\n- passed: true if overall >= 70`;
    }

    const tools = [{
      type: "function",
      function: {
        name: "submit_grade",
        description: "Submit the grading result for a student lesson",
        parameters: {
          type: "object",
          properties: {
            judgment_score: { type: "number", minimum: 0, maximum: 100 },
            speed_score: { type: "number", minimum: 0, maximum: 100 },
            override_score: { type: "number", minimum: 0, maximum: 100 },
            tool_score: { type: "number", minimum: 0, maximum: 100 },
            overall_score: { type: "number", minimum: 0, maximum: 100 },
            feedback: { type: "string" },
            highlights: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            passed: { type: "boolean" },
          },
          required: ["judgment_score", "speed_score", "override_score", "tool_score", "overall_score", "feedback", "passed"],
          additionalProperties: false,
        },
      },
    }];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "submit_grade" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      throw new Error("AI grading failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No grade returned");

    const grade = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(grade), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("grade-lesson error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
