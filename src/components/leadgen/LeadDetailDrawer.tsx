import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Mail, Phone, Linkedin, Globe, MapPin, ExternalLink,
  Sparkles, Send, StickyNote, Clock, ChevronDown, Plus, Trash2, Loader2,
  Building2, User, Star, Users, Crown,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SavedLead, LeadStatus, OutreachEntry } from "./useLeadsCRUD";

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "contacted", label: "Contacted", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "replied", label: "Replied", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "won", label: "Won", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "lost", label: "Lost", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

interface LeadNote {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface LeadDetailDrawerProps {
  lead: SavedLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outreach: OutreachEntry[];
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onDraftEmail: (lead: SavedLead) => void;
  onDelete?: (id: string) => void;
  onFindLookalikes?: (lead: SavedLead) => void;
  userId?: string;
}

export function LeadDetailDrawer({
  lead, open, onOpenChange, outreach, onUpdateStatus, onDraftEmail, onDelete, onFindLookalikes, userId,
}: LeadDetailDrawerProps) {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!lead?.id || !userId) return;
    setLoadingNotes(true);
    const { data } = await supabase
      .from("lead_notes")
      .select("id, content, created_at, updated_at")
      .eq("lead_id", lead.id)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setNotes(data);
    setLoadingNotes(false);
  }, [lead?.id, userId]);

  useEffect(() => {
    if (open && lead) fetchNotes();
    if (!open) { setNotes([]); setNewNote(""); }
  }, [open, lead, fetchNotes]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !lead?.id || !userId) return;
    setSavingNote(true);
    const { error } = await supabase.from("lead_notes").insert({
      lead_id: lead.id,
      user_id: userId,
      content: newNote.trim(),
    });
    if (error) { toast.error("Failed to save note"); }
    else { setNewNote(""); await fetchNotes(); }
    setSavingNote(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    await supabase.from("lead_notes").delete().eq("id", noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  if (!lead) return null;

  const leadOutreach = outreach.filter(o => o.lead_id === lead.id);
  const currentStatus = STATUS_OPTIONS.find(s => s.value === lead.status) || STATUS_OPTIONS[0];
  const photoUrl = lead.photo_url || (lead.email ? `https://www.gravatar.com/avatar/${lead.email.trim().toLowerCase()}?d=404&s=120` : null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col gap-0">
        <SheetHeader className="px-5 pt-5 pb-0 shrink-0">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
              ) : null}
              <span className={`text-lg font-semibold text-primary ${photoUrl ? 'hidden' : ''}`}>
                {lead.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg text-left">{lead.name}</SheetTitle>
              {(lead.title || lead.company) && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {lead.title}{lead.title && lead.company ? " @ " : ""}{lead.company}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-6 text-xs gap-1 px-2 border", currentStatus.color)}>
                      {currentStatus.label}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {STATUS_OPTIONS.map(s => (
                      <DropdownMenuItem key={s.value} onClick={() => onUpdateStatus(lead.id, s.value)}>
                        <span className={cn("w-2 h-2 rounded-full mr-2", s.color.split(" ")[0])} />
                        {s.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {lead.niche_tag && (
                  <Badge variant="secondary" className="text-xs">{lead.niche_tag}</Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-5">
          <div className="py-4 space-y-5">
            {/* Decision-Making Role */}
            {lead.decision_role && (
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 flex items-start gap-2.5">
                <Crown className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-0.5">Decision-Maker Role</p>
                  <p className="text-sm text-foreground">{lead.decision_role}</p>
                </div>
              </div>
            )}

            {/* Reason / Summary */}
            {(lead.reason || lead.summary) && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                {lead.reason && <p className="text-sm text-primary font-medium">💡 {lead.reason}</p>}
                {lead.summary && <p className="text-xs text-muted-foreground mt-1">{lead.summary}</p>}
              </div>
            )}

            {/* Contact Info */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contact</h4>
              <div className="space-y-1.5">
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors group">
                    <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    <span>{lead.email}</span>
                    {lead.email_confidence && (
                      <Badge variant="outline" className="text-xs ml-auto">{lead.email_confidence}%</Badge>
                    )}
                  </a>
                )}
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors group">
                    <Phone className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    <span>{lead.phone}</span>
                  </a>
                )}
                {lead.linkedin && (
                  <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors group">
                    <Linkedin className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    <span className="truncate">{lead.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "").replace(/\/$/, "")}</span>
                    <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                  </a>
                )}
                {lead.website && (
                  <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors group">
                    <Globe className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    <span className="truncate">{lead.website.replace(/^https?:\/\//, "").slice(0, 40)}</span>
                    <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                  </a>
                )}
                {lead.address && (
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{lead.address}</span>
                  </div>
                )}
                {lead.company && (
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>{lead.company}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {lead.email && (
                <Button variant="default" size="sm" className="gap-1.5 text-xs flex-1" onClick={() => onDraftEmail(lead)}>
                  <Sparkles className="w-3.5 h-3.5" />
                  Draft Email
                </Button>
              )}
              {onFindLookalikes && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1" onClick={() => { onFindLookalikes(lead); onOpenChange(false); }}>
                  <Users className="w-3.5 h-3.5" />
                  Find Lookalikes
                </Button>
              )}
              {lead.linkedin && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                  <a href={lead.linkedin} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="w-3.5 h-3.5" />
                    Profile
                  </a>
                </Button>
              )}
            </div>

            <Separator />

            {/* Outreach History */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Outreach ({leadOutreach.length})
              </h4>
              {leadOutreach.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic">No outreach yet</p>
              ) : (
                <div className="space-y-2">
                  {leadOutreach.map(o => (
                    <div key={o.id} className="bg-muted/30 border border-border/30 rounded-lg p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{o.channel}</Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(o.sent_at).toLocaleDateString()}
                        </span>
                      </div>
                      {o.subject && <p className="text-xs font-medium text-foreground">{o.subject}</p>}
                      {o.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{o.body}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Notes */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" />
                Notes ({notes.length})
              </h4>

              {/* Add note */}
              {userId && (
                <div className="flex gap-2 mb-3">
                  <Textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="text-xs min-h-[60px] bg-muted/20 border-border/40"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-[60px] w-10 shrink-0"
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || savingNote}
                  >
                    {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              )}

              {loadingNotes ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                </div>
              ) : notes.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic">No notes yet</p>
              ) : (
                <div className="space-y-2">
                  {notes.map(note => (
                    <div key={note.id} className="bg-muted/30 border border-border/30 rounded-lg p-2.5 group relative">
                      <p className="text-xs text-foreground whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(note.created_at).toLocaleDateString()} {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Meta & Delete */}
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-muted-foreground/50 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Added {new Date(lead.created_at).toLocaleDateString()}
                </span>
                {lead.updated_at !== lead.created_at && (
                  <span>Updated {new Date(lead.updated_at).toLocaleDateString()}</span>
                )}
              </div>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                  onClick={() => {
                    onDelete(lead.id);
                    onOpenChange(false);
                    toast.success(`${lead.name} deleted`);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
