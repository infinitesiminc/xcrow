import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, MailX } from "lucide-react";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "valid" | "used" | "invalid" | "done" | "error">("loading");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    (async () => {
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await resp.json();
        if (!resp.ok) { setStatus("invalid"); return; }
        if (data.valid === false && data.reason === "already_unsubscribed") { setStatus("used"); return; }
        setStatus("valid");
      } catch { setStatus("error"); }
    })();
  }, [token]);

  const handleUnsubscribe = async () => {
    setStatus("loading");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      setStatus(data?.success ? "done" : "error");
    } catch { setStatus("error"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          {status === "loading" && <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />}
          {status === "valid" && (
            <>
              <MailX className="w-12 h-12 text-muted-foreground mx-auto" />
              <h1 className="text-xl font-semibold text-foreground">Unsubscribe</h1>
              <p className="text-sm text-muted-foreground">Click below to stop receiving emails from us.</p>
              <Button onClick={handleUnsubscribe} className="w-full">Confirm Unsubscribe</Button>
            </>
          )}
          {status === "done" && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h1 className="text-xl font-semibold text-foreground">Unsubscribed</h1>
              <p className="text-sm text-muted-foreground">You won't receive any more emails from us.</p>
            </>
          )}
          {status === "used" && (
            <>
              <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto" />
              <h1 className="text-xl font-semibold text-foreground">Already Unsubscribed</h1>
              <p className="text-sm text-muted-foreground">You've already unsubscribed from our emails.</p>
            </>
          )}
          {(status === "invalid" || status === "error") && (
            <>
              <XCircle className="w-12 h-12 text-destructive mx-auto" />
              <h1 className="text-xl font-semibold text-foreground">Invalid Link</h1>
              <p className="text-sm text-muted-foreground">This unsubscribe link is invalid or expired.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
