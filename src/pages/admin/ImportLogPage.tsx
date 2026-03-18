import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle, CheckCircle2, Clock, Flag, X, ChevronDown, ChevronRight,
  RefreshCw, Filter, Eye, EyeOff, TriangleAlert
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ImportLog = {
  id: string;
  created_at: string;
  source: string;
  action: string;
  target_company_name: string | null;
  ats_platform: string | null;
  result_status: string;
  items_processed: number;
  items_created: number;
  items_updated: number;
  items_skipped: number;
  flags_raised: number;
  duration_ms: number | null;
  error_message: string | null;
  metadata: Record<string, any> | null;
};

type ImportFlag = {
  id: string;
  created_at: string;
  import_log_id: string | null;
  flag_type: string;
  severity: string;
  status: string;
  company_name: string | null;
  company_id: string | null;
  details: Record<string, any>;
  suggested_action: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
};

const FLAG_TYPE_LABELS: Record<string, string> = {
  name_collision: "Name Collision",
  slug_probe_failed: "Slug Probe Failed",
  ats_mismatch: "ATS Mismatch",
  zero_jobs: "Zero Jobs",
  data_quality: "Data Quality",
  merge_conflict: "Merge Conflict",
};

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  warn: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  action_required: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_ICON: Record<string, typeof CheckCircle2> = {
  success: CheckCircle2,
  partial: AlertTriangle,
  error: X,
  in_progress: Clock,
};

export default function ImportLogPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [flags, setFlags] = useState<ImportFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [flagFilter, setFlagFilter] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [logsRes, flagsRes] = await Promise.all([
      supabase.from("import_log" as any).select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("import_flags" as any).select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setLogs((logsRes.data as any[]) || []);
    setFlags((flagsRes.data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openFlags = useMemo(() => flags.filter(f => f.status === "open"), [flags]);
  const filteredFlags = useMemo(() => {
    let list = showResolved ? flags : openFlags;
    if (flagFilter) list = list.filter(f => f.flag_type === flagFilter);
    return list;
  }, [flags, openFlags, showResolved, flagFilter]);

  const flagTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    openFlags.forEach(f => { counts[f.flag_type] = (counts[f.flag_type] || 0) + 1; });
    return counts;
  }, [openFlags]);

  const resolveFlag = async (flagId: string, action: "resolved" | "dismissed") => {
    const { error } = await supabase.from("import_flags" as any).update({
      status: action,
      resolved_at: new Date().toISOString(),
    } as any).eq("id", flagId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setFlags(prev => prev.map(f => f.id === flagId ? { ...f, status: action, resolved_at: new Date().toISOString() } : f));
      toast({ title: action === "resolved" ? "Resolved" : "Dismissed" });
    }
  };

  const logFlagsMap = useMemo(() => {
    const map = new Map<string, ImportFlag[]>();
    flags.forEach(f => {
      if (f.import_log_id) {
        if (!map.has(f.import_log_id)) map.set(f.import_log_id, []);
        map.get(f.import_log_id)!.push(f);
      }
    });
    return map;
  }, [flags]);

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Import Log</h1>
          <p className="text-xs text-muted-foreground">
            {openFlags.length} open flag{openFlags.length !== 1 ? "s" : ""} · {logs.length} recent imports
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-5 gap-4 min-h-0">
        {/* ── Flags panel (left 2 cols) ── */}
        <div className="col-span-2 flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5 text-primary" /> Flags
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1"
                onClick={() => setShowResolved(!showResolved)}>
                {showResolved ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showResolved ? "Hide resolved" : "Show resolved"}
              </Button>
            </div>
          </div>

          {/* Flag type filter pills */}
          <div className="flex flex-wrap gap-1">
            {Object.entries(flagTypeCounts).map(([type, count]) => (
              <button key={type}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  flagFilter === type ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                }`}
                onClick={() => setFlagFilter(flagFilter === type ? null : type)}
              >
                {FLAG_TYPE_LABELS[type] || type} ({count})
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-1.5 pr-2">
              {filteredFlags.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  {openFlags.length === 0 ? "No open flags — all clear ✓" : "No flags match filter"}
                </div>
              )}
              {filteredFlags.map(flag => (
                <div key={flag.id}
                  className={`p-2.5 rounded-lg border ${flag.status === "open" ? SEVERITY_STYLES[flag.severity] || "bg-secondary" : "bg-muted/30 border-border opacity-60"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TriangleAlert className="h-3 w-3 shrink-0" />
                        <span className="text-[11px] font-medium truncate">
                          {FLAG_TYPE_LABELS[flag.flag_type] || flag.flag_type}
                        </span>
                        {flag.company_name && (
                          <span className="text-[10px] opacity-70 truncate">· {flag.company_name}</span>
                        )}
                      </div>
                      {flag.suggested_action && (
                        <p className="text-[10px] opacity-80 leading-relaxed">{flag.suggested_action}</p>
                      )}
                      {flag.details && Object.keys(flag.details).length > 0 && (
                        <div className="mt-1.5 text-[9px] opacity-60 font-mono">
                          {Object.entries(flag.details).slice(0, 3).map(([k, v]) => (
                            <div key={k} className="truncate">{k}: {typeof v === "string" ? v : JSON.stringify(v)}</div>
                          ))}
                        </div>
                      )}
                      <div className="text-[9px] opacity-50 mt-1">
                        {formatDistanceToNow(new Date(flag.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    {flag.status === "open" && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                          onClick={() => resolveFlag(flag.id, "resolved")} title="Resolve">
                          <CheckCircle2 className="h-3 w-3 text-green-400" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                          onClick={() => resolveFlag(flag.id, "dismissed")} title="Dismiss">
                          <X className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                    {flag.status !== "open" && (
                      <Badge variant="outline" className="text-[9px] h-4 shrink-0">
                        {flag.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* ── Import history (right 3 cols) ── */}
        <div className="col-span-3 flex flex-col gap-2 min-h-0">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" /> Recent Imports
          </h2>
          <ScrollArea className="flex-1">
            <div className="space-y-1 pr-2">
              {logs.map(log => {
                const StatusIcon = STATUS_ICON[log.result_status] || Clock;
                const isExpanded = expandedLog === log.id;
                const logFlags = logFlagsMap.get(log.id) || [];
                return (
                  <div key={log.id} className="border border-border rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center gap-2.5 p-2 text-left hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    >
                      <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${
                        log.result_status === "success" ? "text-green-400" :
                        log.result_status === "error" ? "text-red-400" :
                        log.result_status === "partial" ? "text-yellow-400" : "text-muted-foreground"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium truncate">
                            {log.target_company_name || log.action}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{log.source}</span>
                          {log.ats_platform && (
                            <span className="text-[9px] uppercase text-muted-foreground">{log.ats_platform}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{log.items_created > 0 ? `+${log.items_created}` : ""}{log.items_updated > 0 ? ` ↻${log.items_updated}` : ""}{log.items_skipped > 0 ? ` ⊘${log.items_skipped}` : ""}</span>
                          {log.duration_ms && <span>{log.duration_ms < 1000 ? `${log.duration_ms}ms` : `${(log.duration_ms / 1000).toFixed(1)}s`}</span>}
                          <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                      {logFlags.length > 0 && (
                        <Badge variant="outline" className="text-[9px] h-4 gap-0.5 border-yellow-500/30 text-yellow-400">
                          <Flag className="h-2.5 w-2.5" /> {logFlags.length}
                        </Badge>
                      )}
                      {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                    </button>
                    {isExpanded && (
                      <div className="border-t border-border p-2.5 bg-muted/20 text-[10px] space-y-2">
                        <div className="grid grid-cols-4 gap-2">
                          <div><span className="text-muted-foreground">Processed:</span> {log.items_processed}</div>
                          <div><span className="text-muted-foreground">Created:</span> {log.items_created}</div>
                          <div><span className="text-muted-foreground">Updated:</span> {log.items_updated}</div>
                          <div><span className="text-muted-foreground">Skipped:</span> {log.items_skipped}</div>
                        </div>
                        {log.error_message && (
                          <div className="text-red-400 font-mono text-[9px] bg-red-500/10 p-1.5 rounded">{log.error_message}</div>
                        )}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <pre className="font-mono text-[9px] text-muted-foreground bg-background/50 p-1.5 rounded overflow-auto max-h-24">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        )}
                        {logFlags.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-muted-foreground font-medium">Flags:</span>
                            {logFlags.map(f => (
                              <div key={f.id} className={`p-1.5 rounded border text-[9px] ${SEVERITY_STYLES[f.severity]}`}>
                                <span className="font-medium">{FLAG_TYPE_LABELS[f.flag_type]}</span>
                                {f.company_name && <span className="opacity-70"> · {f.company_name}</span>}
                                {f.suggested_action && <p className="opacity-80 mt-0.5">{f.suggested_action}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
