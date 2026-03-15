import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing env vars" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 3 target jobs from different departments
  const TARGET_JOBS = [
    {
      jobId: "34363116-0efc-433c-8bda-8bf5420a6ab1",
      title: "AI Solutions Architect, Communications",
      department: "Communications",
      tasks: [
        "AI-powered content generation",
        "AI-driven audience segmentation", 
        "AI for sentiment analysis",
        "AI-assisted message optimization",
        "Intelligent knowledge management",
        "AI-driven workflow automation",
        "AI-powered trend identification",
        "AI for communication performance analytics",
        "AI infrastructure design",
        "AI model evaluation and selection",
        "AI ethics and compliance",
        "Cross-functional collaboration",
      ],
    },
    {
      jobId: "b94b6c61-dd7c-4e98-9d81-99d89583ff7b",
      title: "Analytics Data Engineer",
      department: "Data",
      tasks: [
        "Data Pipeline Development & Orchestration",
        "Data Modeling & Warehousing",
        "Metric Definition & Standardization",
        "Data Quality & Reliability Engineering",
        "Self-Service Analytics Enablement",
        "Cross-Functional Data Partnership",
        "Cloud Data Infrastructure Management",
        "Data Security & Governance Compliance",
        "Performance Optimization & Scalability",
        "Experimentation & A/B Testing Data Support",
      ],
    },
    {
      jobId: "bf822cbb-6c71-474a-8104-aa79b70f3766",
      title: "Business Systems Analyst",
      department: "Security",
      tasks: [
        "Security Tool Evaluation & Integration",
        "Security Process Automation",
        "Incident Response System Design",
        "Compliance Framework Implementation",
        "Security Data Analytics & Reporting",
        "Vulnerability Management Workflows",
        "Access Control System Design",
        "Security Awareness Training Programs",
        "Threat Intelligence Integration",
        "Business Continuity Planning",
      ],
    },
  ];

  // Demo employees to generate results for (15 per role = 45 total)
  const EMPLOYEES = [
    // Communications team
    { name: "Lena Eriksson", dept: "Communications" },
    { name: "Marco Castillo", dept: "Communications" },
    { name: "Aisha Patel", dept: "Communications" },
    { name: "Felix Andersson", dept: "Communications" },
    { name: "Camila Torres", dept: "Communications" },
    { name: "Ravi Sharma", dept: "Communications" },
    { name: "Nina Volkov", dept: "Communications" },
    { name: "Hugo Fischer", dept: "Communications" },
    { name: "Maya Chen", dept: "Communications" },
    { name: "Soren Lindqvist", dept: "Communications" },
    { name: "Diana Morales", dept: "Communications" },
    { name: "Kai Nakamura", dept: "Communications" },
    { name: "Petra Schmidt", dept: "Communications" },
    { name: "Isaac Rodriguez", dept: "Communications" },
    { name: "Freya Hansen", dept: "Communications" },
    // Data team
    { name: "Lin Zhang", dept: "Data" },
    { name: "Rafael Garcia", dept: "Data" },
    { name: "Hana Suzuki", dept: "Data" },
    { name: "Emil Weber", dept: "Data" },
    { name: "Jade Williams", dept: "Data" },
    { name: "Anton Petrov", dept: "Data" },
    { name: "Sara Kim", dept: "Data" },
    { name: "Leo Müller", dept: "Data" },
    { name: "Mira Gupta", dept: "Data" },
    { name: "Theo Larsson", dept: "Data" },
    { name: "Rosa Martinez", dept: "Data" },
    { name: "Corey O'Brien", dept: "Data" },
    { name: "Bianca Rossi", dept: "Data" },
    { name: "Nate Johnson", dept: "Data" },
    { name: "Uma Agarwal", dept: "Data" },
    // Security team
    { name: "Jordan Lee", dept: "Security" },
    { name: "Dalia Ibrahim", dept: "Security" },
    { name: "Ben Wagner", dept: "Security" },
    { name: "Aria Fernandez", dept: "Security" },
    { name: "Ivan Cho", dept: "Security" },
    { name: "Simone Cruz", dept: "Security" },
    { name: "Ethan Park", dept: "Security" },
    { name: "Noor Shah", dept: "Security" },
    { name: "Luca Schneider", dept: "Security" },
    { name: "Yara Okafor", dept: "Security" },
    { name: "David Tran", dept: "Security" },
    { name: "Clara Reyes", dept: "Security" },
    { name: "Odin Olsen", dept: "Security" },
    { name: "Priya Singh", dept: "Security" },
    { name: "Ryan Hernandez", dept: "Security" },
  ];

  try {
    const allRows: any[] = [];
    let aiCallCount = 0;

    for (const job of TARGET_JOBS) {
      const jobEmployees = EMPLOYEES.filter(e => e.dept === job.department);

      // Call AI once per job to generate realistic score distributions
      const prompt = `You are generating realistic AI-readiness simulation scores for employees being tested on the role "${job.title}" in the ${job.department} department.

The tasks being simulated are:
${job.tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Generate scores for ${jobEmployees.length} employees, each completing 2-4 of these tasks (randomly selected). 
For each completion, provide scores for 4 AI-readiness categories (0-100 each):
- tool_awareness: Understanding of AI tools relevant to this task
- human_value_add: Recognition of irreplaceable human contributions
- adaptive_thinking: Ability to work alongside AI flexibly
- domain_judgment: Sound decision-making about AI vs human judgment

Make scores REALISTIC and VARIED:
- Some employees should score consistently high (75-95) — they "get" AI
- Some should be mixed — strong on some categories, weak on others
- Some should score lower (35-60) — still learning
- Scores should correlate somewhat with task type (e.g., technical tasks might have lower human_value_add scores)
- No employee should have identical scores across all categories

Each result should have: employee_index (0-${jobEmployees.length - 1}), task_index (index into the tasks list), correct_answers (out of total_questions which is always 5), tool_awareness, human_value_add, adaptive_thinking, domain_judgment.

Generate exactly ${jobEmployees.length * 3} results total (roughly 3 per employee, some with 2 and some with 4).

Respond ONLY with a JSON array of objects. No markdown.`;

      console.log(`Calling AI for ${job.title}...`);
      aiCallCount++;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.9,
        }),
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        console.error(`AI error for ${job.title}: ${aiRes.status} ${errText}`);
        throw new Error(`AI error ${aiRes.status}`);
      }

      const aiData = await aiRes.json();
      const raw = aiData.choices[0].message.content;

      let results: any[];
      try {
        const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
        results = JSON.parse(jsonMatch[1].trim());
      } catch {
        console.error("Failed to parse AI response:", raw.slice(0, 500));
        throw new Error("Failed to parse AI scores");
      }

      // Map AI results to database rows
      const baseDate = new Date("2026-03-15T00:00:00Z").getTime();

      for (const r of results) {
        const emp = jobEmployees[r.employee_index % jobEmployees.length];
        const task = job.tasks[r.task_index % job.tasks.length];
        const correct = Math.min(5, Math.max(0, r.correct_answers || Math.round((r.tool_awareness + r.human_value_add + r.adaptive_thinking + r.domain_judgment) / 400 * 5)));
        const daysAgo = Math.floor(Math.random() * 14);
        const hoursOffset = 7 + Math.floor(Math.random() * 11);
        const completedAt = new Date(baseDate - daysAgo * 86400000 + hoursOffset * 3600000).toISOString();

        allRows.push({
          user_id: `demo-seed-${emp.name.toLowerCase().replace(/\s/g, "-")}`,
          job_title: job.title,
          task_name: task,
          correct_answers: correct,
          total_questions: 5,
          completed_at: completedAt,
          department: job.department,
          experience_level: Math.random() > 0.4 ? "upskilling" : "exploring",
          company: "Anthropic",
          rounds_completed: Math.floor(Math.random() * 3) + 2,
          tool_awareness_score: Math.min(100, Math.max(0, r.tool_awareness)),
          human_value_add_score: Math.min(100, Math.max(0, r.human_value_add)),
          adaptive_thinking_score: Math.min(100, Math.max(0, r.adaptive_thinking)),
          domain_judgment_score: Math.min(100, Math.max(0, r.domain_judgment)),
        });
      }

      // Brief delay between AI calls
      if (aiCallCount < TARGET_JOBS.length) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // Insert all rows
    const { error: insertError } = await supabase
      .from("completed_simulations")
      .insert(allRows);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`DB insert failed: ${insertError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      totalRows: allRows.length,
      aiCalls: aiCallCount,
      breakdown: TARGET_JOBS.map(j => ({
        role: j.title,
        dept: j.department,
        results: allRows.filter(r => r.job_title === j.title).length,
      })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("seed error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
