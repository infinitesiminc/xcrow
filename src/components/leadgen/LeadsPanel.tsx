import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Search, Users, Download } from "lucide-react";
import { LeadCard, type Lead } from "./LeadCard";

interface LeadsPanelProps {
  leads: Lead[];
  onDraftEmail: (lead: Lead) => void;
  onScale: () => void;
  onWhatsApp: (leads: Lead[]) => void;
}

export function LeadsPanel({ leads, onDraftEmail, onScale, onWhatsApp }: LeadsPanelProps) {
  const withEmail = useMemo(() => leads.filter(l => l.email), [leads]);
  const withPhone = useMemo(() => leads.filter(l => l.phone), [leads]);

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No leads yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Chat with the AI to discover prospects — they'll appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Leads</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{leads.length}</Badge>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {withEmail.length > 0 && <span>📧 {withEmail.length}</span>}
          {withPhone.length > 0 && <span>📱 {withPhone.length}</span>}
        </div>
      </div>

      {/* Lead list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {leads.map((lead, i) => (
            <LeadCard key={`${lead.name}-${lead.email}-${i}`} lead={lead} index={i} onDraftEmail={onDraftEmail} />
          ))}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="px-3 py-2.5 border-t border-border/40 flex flex-wrap gap-2 shrink-0">
        <Button variant="default" size="sm" className="gap-1.5 text-xs flex-1" onClick={onScale}>
          <Search className="w-3.5 h-3.5" /> Scale
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1" onClick={() => onWhatsApp(leads)}>
          <Send className="w-3.5 h-3.5" /> WhatsApp
        </Button>
      </div>
    </div>
  );
}
