import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Mail, Sparkles } from "lucide-react";

export interface Lead {
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  phone_source?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
  address?: string;
  source?: string;
  email_confidence?: number;
  summary?: string;
  reason?: string;
  photo_url?: string;
  niche_tag?: string;
}

function getLeadPhotoUrl(lead: Lead): string | null {
  if (lead.photo_url) return lead.photo_url;
  if (lead.email) return `https://www.gravatar.com/avatar/${lead.email.trim().toLowerCase()}?d=404&s=80`;
  return null;
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function LeadAvatar({ lead }: { lead: Lead }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = getLeadPhotoUrl(lead);
  if (photoUrl && !imgError) {
    return <img src={photoUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 bg-muted" onError={() => setImgError(true)} />;
  }
  return (
    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
      {getInitials(lead.name)}
    </div>
  );
}

interface LeadCardProps {
  lead: Lead;
  index: number;
  onDraftEmail: (lead: Lead) => void;
}

export function LeadCard({ lead, index, onDraftEmail }: LeadCardProps) {
  return (
    <Card className="bg-card/60 border-border/40 hover:border-primary/30 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <div className="relative">
              <LeadAvatar lead={lead} />
              <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {index + 1}
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{lead.name}</p>
              {(lead.title || lead.company) && (
                <p className="text-xs text-muted-foreground">
                  {lead.title}{lead.title && lead.company ? " @ " : ""}{lead.company}
                </p>
              )}
            </div>
          </div>
          {lead.linkedin && (
            <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {lead.reason && (
          <p className="text-xs text-primary/80 mt-1.5 font-medium">💡 {lead.reason}</p>
        )}

        <div className="flex gap-3 mt-1.5 flex-wrap">
          {lead.email && (
            <span className="text-xs text-muted-foreground">
              📧 {lead.email}
              {lead.email_confidence && <span className="text-[9px] ml-1 text-primary/60">({lead.email_confidence}%)</span>}
            </span>
          )}
          {lead.phone && (
            <span className="text-xs text-muted-foreground">
              📱 {lead.phone}
              {lead.phone_source === "google_maps" && <span className="text-[9px] ml-1 text-primary/60">(Maps ✓)</span>}
            </span>
          )}
          {lead.address && <span className="text-xs text-muted-foreground">📍 {lead.address}</span>}
          {lead.website && (
            <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary">
              🌐 {lead.website.replace(/^https?:\/\//, "").slice(0, 30)}
            </a>
          )}
        </div>

        {lead.source && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 mt-1 border-muted-foreground/30 text-muted-foreground">
            {lead.source}
          </Badge>
        )}

        {lead.email && (
          <Button variant="outline" size="sm" className="gap-1.5 mt-2 text-xs w-full" onClick={() => onDraftEmail(lead)}>
            <Mail className="w-3 h-3" />
            <Sparkles className="w-3 h-3" />
            Draft Email
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
