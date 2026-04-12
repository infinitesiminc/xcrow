import { useState, useCallback, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Copy, Check, RefreshCw, Loader2, Mail, User, Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SavedLead } from "./useLeadsCRUD";

type Tone = "intro" | "value" | "direct";

const TONES: { value: Tone; label: string; desc: string }[] = [
  { value: "intro", label: "Intro", desc: "First touch, build curiosity" },
  { value: "value", label: "Value-add", desc: "Share a relevant insight" },
  { value: "direct", label: "Direct ask", desc: "Meeting request" },
];

interface DraftEmailModalProps {
  lead: SavedLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  workspaceKey?: string;
}

export function DraftEmailModal({ lead, open, onOpenChange, userId, workspaceKey }: DraftEmailModalProps) {
  const [tone, setTone] = useState<Tone>("intro");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Load existing draft for current tone when modal opens or tone changes
  useEffect(() => {
    if (!open || !lead?.id || !userId) {
      if (!open) { setSubject(""); setBody(""); setHasGenerated(false); }
      return;
    }
    (async () => {
      const { data } = await (supabase
        .from("draft_emails")
        .select("subject, body")
        .eq("lead_id", lead.id)
        .eq("user_id", userId) as any)
        .eq("tone", tone)
        .maybeSingle();
      if (data) {
        setSubject(data.subject || "");
        setBody(data.body || "");
        setHasGenerated(true);
      } else {
        setSubject("");
        setBody("");
        setHasGenerated(false);
      }
    })();
  }, [open, lead?.id, userId, tone]);

  const handleGenerate = useCallback(async () => {
    if (!lead) return;
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const toneInstruction = tone === "value"
        ? "Focus on sharing a relevant industry insight or observation that would be valuable to the recipient."
        : tone === "direct"
        ? "Be direct — clearly state you want a meeting. Keep it brief and confident."
        : "Make this a warm introductory email. Build curiosity about how you can help.";

      const resp = await fetch(`${supabaseUrl}/functions/v1/draft-outreach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({
          lead: {
            ...lead,
            reason: `${lead.reason || lead.summary || ""}\n\nTONE INSTRUCTION: ${toneInstruction}`,
          },
          senderInfo: {},
          personaTag: lead.persona_tag,
        }),
      });

      if (!resp.ok) throw new Error("Failed to generate");
      const { draft } = await resp.json();
      setSubject(draft.subject || "");
      setBody(draft.body || "");
      setHasGenerated(true);

      // Persist draft
      if (userId && workspaceKey) {
        await (supabase.from("draft_emails") as any).upsert({
          user_id: userId,
          lead_id: lead.id,
          recipient_email: lead.email || "",
          subject: draft.subject || "",
          body: draft.body || "",
          workspace_key: workspaceKey,
          tone,
        }, { onConflict: "user_id,lead_id,tone" });
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate draft");
    } finally {
      setGenerating(false);
    }
  }, [lead, tone, userId, workspaceKey]);

  const handleCopy = useCallback(async (field: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }, []);

  // Save edits on blur
  const handleSave = useCallback(async () => {
    if (!lead?.id || !userId || !workspaceKey) return;
    await (supabase.from("draft_emails") as any).upsert({
      user_id: userId,
      lead_id: lead.id,
      recipient_email: lead.email || "",
      subject,
      body,
      workspace_key: workspaceKey,
      tone,
    }, { onConflict: "user_id,lead_id,tone" });
  }, [lead?.id, userId, workspaceKey, subject, body, tone]);

  if (!lead) return null;

  const initials = lead.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] p-0 gap-0 overflow-hidden">
        {/* Header with lead context */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-primary">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base">{lead.name}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lead.title}{lead.title && lead.company ? " @ " : ""}{lead.company}
              </p>
            </div>
            {lead.email && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
                onClick={() => handleCopy("email", lead.email!)}
              >
                {copiedField === "email" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedField === "email" ? "Copied" : lead.email}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Tone selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Tone
            </label>
            <div className="flex gap-2">
              {TONES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-left transition-all",
                    tone === t.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/40 hover:border-border"
                  )}
                >
                  <span className="text-xs font-medium">{t.label}</span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full gap-2"
            variant={hasGenerated ? "outline" : "default"}
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : hasGenerated ? (
              <><RefreshCw className="w-4 h-4" /> Regenerate</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Draft</>
            )}
          </Button>

          {/* Subject field */}
          {hasGenerated && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Subject</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1 px-2"
                    onClick={() => handleCopy("subject", subject)}
                  >
                    {copiedField === "subject" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedField === "subject" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  onBlur={handleSave}
                  className="text-sm"
                  placeholder="Email subject..."
                />
              </div>

              {/* Body field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Body</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1 px-2"
                    onClick={() => handleCopy("body", body)}
                  >
                    {copiedField === "body" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedField === "body" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  onBlur={handleSave}
                  className="text-sm min-h-[200px] leading-relaxed"
                  placeholder="Email body..."
                />
              </div>

              {/* Copy All */}
              <Button
                variant="outline"
                className="w-full gap-2 text-sm"
                onClick={() => handleCopy("all", `Subject: ${subject}\n\n${body}`)}
              >
                {copiedField === "all" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedField === "all" ? "Copied to clipboard" : "Copy entire email"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
