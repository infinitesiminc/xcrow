import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { EscoMatchResult } from "@/lib/esco-api";

interface CareerPathwaysProps {
  data: EscoMatchResult | null;
  loading: boolean;
  error: boolean;
}

export function CareerPathways({ data, loading, error }: CareerPathwaysProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-lg" />)}
      </div>
    );
  }

  if (error || !data || data.pathways.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Career pathway data is temporarily unavailable. Try refreshing the page.</p>
        </CardContent>
      </Card>
    );
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
                  <h4 className="text-sm font-sans font-bold text-foreground leading-tight">{pathway.title}</h4>
                  <span className="text-lg font-sans font-bold text-primary shrink-0">{pathway.skillOverlap}%</span>
                </div>

                <Progress value={pathway.skillOverlap} className="h-1.5 mb-3" />

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
