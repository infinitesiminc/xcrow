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
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
              Curated Human Skills
            </span>
            <span className="ml-auto text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full font-medium">
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
                variant={i === 0 ? "default" : "secondary"}
                className={`text-xs ${i === 0 ? "" : "bg-secondary text-secondary-foreground"}`}
              >
                <Award className="h-3 w-3 mr-1" />
                {skill.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
