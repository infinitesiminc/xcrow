import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Job {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
}

export default function StepATSImport() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("name", "Anthropic")
        .single();
      if (!company) { setLoading(false); return; }

      const { data } = await supabase
        .from("jobs")
        .select("id, title, department, location")
        .eq("company_id", company.id)
        .order("department")
        .limit(500);
      setJobs(data ?? []);
      setLoading(false);
    })();
  }, []);

  const grouped = jobs.reduce<Record<string, Job[]>>((acc, j) => {
    const dept = j.department || "Other";
    (acc[dept] ??= []).push(j);
    return acc;
  }, {});

  const departments = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        The platform connected to Anthropic's Greenhouse ATS and imported{" "}
        <span className="font-semibold text-foreground">{jobs.length} open roles</span>{" "}
        across <span className="font-semibold text-foreground">{departments.length} departments</span> — automatically. 
        No spreadsheets, no manual entry.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3 max-h-[420px] overflow-y-auto pr-1">
          {departments.slice(0, 8).map((dept, i) => (
            <motion.div
              key={dept}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{dept}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {grouped[dept].length} roles
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {grouped[dept].slice(0, 5).map((j) => (
                  <span
                    key={j.id}
                    className="inline-flex items-center gap-1 text-[11px] bg-muted rounded-md px-2 py-0.5 text-muted-foreground"
                  >
                    <Briefcase className="h-2.5 w-2.5" />
                    {j.title}
                  </span>
                ))}
                {grouped[dept].length > 5 && (
                  <span className="text-[11px] text-muted-foreground px-1">
                    +{grouped[dept].length - 5} more
                  </span>
                )}
              </div>
            </motion.div>
          ))}
          {departments.length > 8 && (
            <p className="text-xs text-muted-foreground text-center py-1">
              +{departments.length - 8} more departments
            </p>
          )}
        </div>
      )}
    </div>
  );
}
