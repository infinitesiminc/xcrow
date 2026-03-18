import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BookmarkedRole {
  id: string;
  job_title: string;
  company: string | null;
  augmented_percent: number;
  automation_risk_percent: number;
  new_skills_percent: number;
  bookmarked_at: string;
}

interface SavedRolesTabProps {
  bookmarks: BookmarkedRole[];
}

export default function SavedRolesTab({ bookmarks }: SavedRolesTabProps) {
  const navigate = useNavigate();

  if (bookmarks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Bookmark className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">No saved roles yet</p>
          <Button size="sm" onClick={() => navigate("/")}>Explore Roles</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {bookmarks.map((b, i) => (
        <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
          <Card
            className="cursor-pointer hover:border-primary/20 hover:shadow-md transition-all"
            onClick={() => {
              const params = new URLSearchParams({ title: b.job_title });
              if (b.company) params.set("company", b.company);
              navigate(`/analysis?${params.toString()}`, { state: { from: "dashboard" } });
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{b.job_title}</p>
                  {b.company && <p className="text-xs text-muted-foreground truncate">{b.company}</p>}
                </div>
                <Bookmark className="h-3.5 w-3.5 text-primary fill-primary shrink-0 mt-0.5" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs font-bold text-foreground">{b.augmented_percent}%</div>
                  <div className="text-[9px] text-muted-foreground">AI Tools</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">{b.automation_risk_percent}%</div>
                  <div className="text-[9px] text-muted-foreground">Risk</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">{b.new_skills_percent}%</div>
                  <div className="text-[9px] text-muted-foreground">Upskill</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
