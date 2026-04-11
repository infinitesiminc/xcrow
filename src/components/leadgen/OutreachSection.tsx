import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail } from "lucide-react";
import type { OutreachEntry } from "./useLeadsCRUD";

interface OutreachSectionProps {
  outreach: OutreachEntry[];
}

export default function OutreachSection({ outreach }: OutreachSectionProps) {
  if (outreach.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 pt-16">
        <Mail className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground font-mono">No outreach yet. Draft emails from the Leads section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold">Outreach Log</h3>
        <Badge variant="secondary" className="text-[10px]">{outreach.length}</Badge>
      </div>

      <div className="rounded-lg border border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs">Lead</TableHead>
              <TableHead className="text-xs">Subject</TableHead>
              <TableHead className="text-xs">Channel</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {outreach.map(o => (
              <TableRow key={o.id}>
                <TableCell className="text-sm">{o.lead_name || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{o.subject || "—"}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{o.channel}</Badge></TableCell>
                <TableCell><Badge variant="secondary" className="text-[10px]">{o.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(o.sent_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
