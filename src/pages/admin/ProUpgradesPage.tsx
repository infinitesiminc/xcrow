/**
 * Pro Upgrades — Admin page for generating magic upgrade links
 * and managing Champion Pass grants.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Copy, Check, Link2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_PRICES } from "@/lib/stripe-config";

export default function ProUpgradesPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setGeneratedLink(null);

    try {
      // Create a pre-filled checkout link for the Champion plan
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId: STRIPE_PRICES.CHAMPION_MONTHLY,
          prefillEmail: email.trim(),
        },
      });
      if (error) throw error;
      if (data?.url) {
        setGeneratedLink(data.url);
        toast({ title: "Link generated", description: `Checkout link ready for ${email}` });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast({ title: "Copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Crown className="h-6 w-6" style={{ color: "hsl(var(--territory-strategic))" }} />
          Pro Upgrade Links
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate Stripe checkout links to send to users for Champion Pass upgrades.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Generate Checkout Link</CardTitle>
          <CardDescription>
            Enter the user's email to create a pre-filled Champion Pass checkout link ($12/mo).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generateLink()}
              className="flex-1"
            />
            <Button onClick={generateLink} disabled={loading || !email.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Link2 className="h-4 w-4 mr-1" />}
              Generate
            </Button>
          </div>

          {generatedLink && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                <code className="flex-1 text-xs break-all text-muted-foreground">
                  {generatedLink}
                </code>
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Send this link to the user. They'll be taken to Stripe Checkout with their email pre-filled.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Champion Pass Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Price</span>
              <Badge variant="secondary">$12/month</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Price ID</span>
              <code className="text-xs font-mono text-muted-foreground">{STRIPE_PRICES.CHAMPION_MONTHLY}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Includes</span>
              <span className="text-xs">Unlimited quests, boss battles, career scout</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
