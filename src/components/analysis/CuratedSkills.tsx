import { motion } from "framer-motion";
import { Award, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CuratedSkill } from "@/types/analysis";

interface Props {
  curatedSkills: CuratedSkill[];
}

export function CuratedSkillsBadge({ curatedSkills }: Props) {
  if (curatedSkills.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <Card className="border-border/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-human shrink-0" />
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
              Curated Human Skills
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
              From our database
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Priority-ranked skills identified by industry experts for this role:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {curatedSkills.map((skill, i) => (
              <Badge
                key={skill.name}
                variant="outline"
                className="text-xs text-foreground/70 border-border/40"
              >
                {i === 0 && <span className="w-1.5 h-1.5 rounded-full bg-dot-teal mr-1.5 shrink-0" />}
                {skill.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
