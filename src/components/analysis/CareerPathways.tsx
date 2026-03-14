import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fetchCareerPathways, type EscoMatchResult } from "@/lib/esco-api";

interface CareerPathwaysProps {
  jobTitle: string;
}

export function CareerPathways({ jobTitle }: CareerPathwaysProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<EscoMatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!jobTitle) return;
    setLoading(true);
    setError(false);
    fetchCareerPathways(jobTitle)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [jobTitle]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
        <Loader2 className="h-4 w-4 animate-spin" />
        Finding career pathways...
      </div>
    );
  }

  if (error || !data || data.pathways.length === 0) {
    return null;
  }

  const topPathways = data.pathways.slice(0, 4);

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-4">
        Based on your current skill set as a <span className="font-medium text-foreground">{data.primary.title}</span>, your skills already transfer to these roles.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {topPathways.map((pathway, i) => (
          <motion.div
            key={pathway.uri}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="h-full border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="text-sm font-display font-bold text-foreground leading-tight">{pathway.title}</h4>
                  <span className="text-lg font-display font-bold text-primary shrink-0">{pathway.skillOverlap}%</span>
                </div>

                <Progress value={pathway.skillOverlap} className="h-1.5 mb-3" />

                {/* Shared skills */}
                {pathway.sharedSkills.length > 0 && (
                  <div className="mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Shared</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pathway.sharedSkills.map((s, si) => (
                        <Badge key={si} variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* New skills needed */}
                {pathway.newSkillsNeeded.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">New skills needed</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pathway.newSkillsNeeded.map((s, si) => (
                        <Badge key={si} variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-primary hover:bg-primary/10 w-full"
                  onClick={() => navigate(`/analysis?title=${encodeURIComponent(pathway.title)}`)}
                >
                  Analyze this role <ArrowRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
