import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { OutreachEntry } from "./useLeadsCRUD";

interface ActivityLogProps {
  entries: OutreachEntry[];
}

export function ActivityLog({ entries }: ActivityLogProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Clock className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No outreach activity yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Emails you send to leads will appear here.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-card/40">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {entry.lead_name || "Unknown"}
                </p>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                  {entry.status}
                </Badge>
              </div>
              {entry.subject && <p className="text-xs text-muted-foreground mt-0.5 truncate">📧 {entry.subject}</p>}
              {entry.lead_email && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{entry.lead_email}</p>}
              <p className="text-[10px] text-muted-foreground/40 mt-1">
                {format(new Date(entry.sent_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
