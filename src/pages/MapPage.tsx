/**
 * MapPage — Dedicated Skill Map page at /map.
 * Contains the full-screen Future Territory Map, Skill Forge, Kingdoms panel, HUD, and minimap.
 */
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { X, Swords, ScrollText, Shield } from "lucide-react";

import { useFutureSkills } from "@/hooks/use-future-skills";
import FutureTerritoryMap from "@/components/territory/FutureTerritoryMap";
import FutureSkillsTable from "@/components/territory/FutureSkillsTable";
import MapIntroGuide from "@/components/territory/MapIntroGuide";
import { getLevel, levelProgress } from "@/lib/skill-map";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useChatContext, useChatViewContext } from "@/contexts/ChatContext";
import type { ViewContext } from "@/contexts/ChatContext";
import RolePreviewPanel from "@/components/RolePreviewPanel";
import type { RoleResult } from "@/components/InlineRoleCarousel";
import type { EdgeContext } from "@/components/HumanEdgesCard";

import CompactHUD from "@/components/territory/CompactHUD";
import HQPanel from "@/components/territory/HQPanel";
import MyRolesPanel from "@/components/territory/MyRolesPanel";
import { useSkills } from "@/hooks/use-skills";
import {
  SKILL_TAXONOMY,
  aggregateSkillXP,
  type SkillCategory,
  type SkillXP,
  type SimRecord,
  type TaxonomySkill,
} from "@/lib/skill-map";

/* ── helpers ── */

function skillMeta(id: string, xp: number) {
  const tax = SKILL_TAXONOMY.find(s => s.id === id);
  const lvl = getLevel(xp);
  return {
    level: lvl.name,
    levelIndex: lvl.index,
    progress: levelProgress(xp),
    aiExposure: tax?.aiExposure ?? 50,
    humanEdge: tax?.humanEdge,
    taskCount: Math.ceil(xp / 100),
  };
}

function buildEmptySkills(taxonomy: TaxonomySkill[]): SkillXP[] {
  return taxonomy.map(t => ({
    id: t.id,
    name: t.name,
    category: t.category,
    xp: 0,
    level: "Novice" as const,
    levelIndex: 0,
    progress: 0,
    aiExposure: t.aiExposure,
    humanEdge: t.humanEdge,
    taskCount: 0,
  }));
}

const MapPage = () => {
  const { profile, user } = useAuth();
  const { skills: dbSkills } = useSkills();
  const { futureSkills } = useFutureSkills();

  const taxonomy: TaxonomySkill[] = useMemo(() =>
    dbSkills.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      keywords: s.keywords,
      aiExposure: s.aiExposure,
      humanEdge: s.humanEdge,
    })),
    [dbSkills]
  );

  const [selectedRole, setSelectedRole] = useState<RoleResult | null>(null);
  const [activeEdge, setActiveEdge] = useState<EdgeContext | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<"hq" | "table" | "roles">("hq");
  const [chatOpen, setChatOpen] = useState(!!user);
  const [mapFocusSkillId, setMapFocusSkillId] = useState<string | null>(null);
  const [myRolesTab, setMyRolesTab] = useState<"saved" | "practiced">("saved");


  const [realSkills, setRealSkills] = useState<SkillXP[]>([]);
  const [targetSkillIds, setTargetSkillIds] = useState<Set<string>>(new Set());
  const [level2SkillIds, setLevel2SkillIds] = useState<Set<string>>(new Set());

  const displaySkills = useMemo(
    () => (realSkills.length > 0 ? realSkills : buildEmptySkills(taxonomy)),
    [realSkills, taxonomy]
  );

  const isSignedIn = !!user;
  const userName = profile?.displayName?.split(" ")[0];

  const { onRolesFoundRef, onRoleSelectRef, sendMessage: chatSendMessage, setIsOpen: setChatDockOpen } = useChatContext();

  // Wire up role select callback so chat card buttons work
  useEffect(() => {
    onRoleSelectRef.current = (role: RoleResult) => {
      setSelectedRole(role);
    };
    return () => { onRoleSelectRef.current = null; };
  }, [onRoleSelectRef]);
  // Load real skills + target roles
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [simsRes, profileRes] = await Promise.all([
        supabase
          .from("completed_simulations")
          .select("task_name, job_title, skills_earned, tool_awareness_score, human_value_add_score, adaptive_thinking_score, domain_judgment_score")
          .eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("target_roles")
          .eq("id", user.id)
          .single(),
      ]);

      const sims = (simsRes.data || []) as SimRecord[];
      setRealSkills(aggregateSkillXP(sims, taxonomy));

      const targetRoles = ((profileRes.data as any)?.target_roles || []) as { job_id: string }[];
      if (targetRoles.length > 0) {
        const jobIds = targetRoles.map(r => r.job_id);
        const { data: clusters } = await supabase
          .from("job_task_clusters")
          .select("skill_names")
          .in("job_id", jobIds);
        const names = new Set<string>();
        for (const c of clusters || []) {
          for (const s of c.skill_names || []) names.add(s.toLowerCase());
        }
        const ids = new Set<string>();
        for (const skill of taxonomy) {
          if (names.has(skill.name.toLowerCase())) ids.add(skill.id);
          for (const kw of skill.keywords) {
            if (names.has(kw)) ids.add(skill.id);
          }
        }
        setTargetSkillIds(ids);
      }
    })();
  }, [user, taxonomy]);

  // View context for chat
  const chatViewCtx = useMemo(() => ({
    page: "map" as const,
    activePanel: rightPanelTab === "roles" ? "roles" : "territory",
    selectedRole: selectedRole ? { title: selectedRole.title, company: selectedRole.company, jobId: selectedRole.jobId } : null,
    selectedTab: rightPanelTab === "roles" ? myRolesTab : undefined,
  }), [selectedRole, rightPanelTab, myRolesTab]);
  useChatViewContext(chatViewCtx as any, [chatViewCtx]);

  return (
    <div className="h-[calc(100vh-3.5rem)] relative overflow-hidden">
      {/* Full-screen Territory Map */}
      <div className="absolute inset-0 z-0">
        <FutureTerritoryMap skills={futureSkills} focusSkillId={mapFocusSkillId} />
      </div>

      {!isSignedIn && <MapIntroGuide />}

      {/* HUD */}
      {displaySkills.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
          <div className="pointer-events-auto">
            <CompactHUD
              skills={displaySkills}
              targetSkillIds={targetSkillIds}
              userName={userName}
            />
          </div>
        </div>
      )}

      {/* Floating tab bar — Dark Fantasy stone style */}
      <div
        className="absolute top-14 left-4 z-20 flex items-center gap-1 backdrop-blur-md rounded-lg p-1"
        style={{
          background: "hsl(var(--surface-stone) / 0.92)",
          border: "1px solid hsl(var(--filigree) / 0.25)",
          boxShadow: "0 4px 20px hsl(var(--emboss-shadow)), inset 0 1px 0 hsl(var(--emboss-light))",
        }}
      >
        {isSignedIn && (
          <button
            onClick={() => {
              if (rightPanelTab === "hq" && chatOpen) { setChatOpen(false); }
              else { setRightPanelTab("hq"); setChatOpen(true); }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              fontFamily: "'Cinzel', serif",
              letterSpacing: "0.05em",
              ...(rightPanelTab === "hq" && chatOpen
                ? { color: "hsl(var(--filigree-glow))", background: "hsl(var(--filigree) / 0.12)", textShadow: "0 0 8px hsl(var(--filigree-glow) / 0.5)" }
                : { color: "hsl(var(--muted-foreground))" }),
            }}
          >
            <Shield className="h-3 w-3" />
            HQ
          </button>
        )}
        <button
          onClick={() => {
            if (rightPanelTab === "table" && chatOpen) { setChatOpen(false); }
            else { setRightPanelTab("table"); setChatOpen(true); }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
          style={{
            fontFamily: "'Cinzel', serif",
            letterSpacing: "0.05em",
            ...(rightPanelTab === "table" && chatOpen
              ? { color: "hsl(var(--filigree-glow))", background: "hsl(var(--filigree) / 0.12)", textShadow: "0 0 8px hsl(var(--filigree-glow) / 0.5)" }
              : { color: "hsl(var(--muted-foreground))" }),
          }}
        >
          <ScrollText className="h-3 w-3" />
          Skill Forge
        </button>
        {isSignedIn && (
          <button
            onClick={() => {
              if (rightPanelTab === "roles" && chatOpen) { setChatOpen(false); }
              else { setRightPanelTab("roles"); setChatOpen(true); }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              fontFamily: "'Cinzel', serif",
              letterSpacing: "0.05em",
              ...(rightPanelTab === "roles" && chatOpen
                ? { color: "hsl(var(--filigree-glow))", background: "hsl(var(--filigree) / 0.12)", textShadow: "0 0 8px hsl(var(--filigree-glow) / 0.5)" }
                : { color: "hsl(var(--muted-foreground))" }),
            }}
          >
            <Swords className="h-3 w-3" />
            Kingdoms
          </button>
        )}
      </div>

      {/* Side panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            key="side-panel"
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="absolute top-24 left-4 bottom-20 w-[420px] z-20 flex flex-col backdrop-blur-xl rounded-xl overflow-hidden"
            style={{
              background: "hsl(var(--surface-stone) / 0.92)",
              border: "1px solid hsl(var(--filigree) / 0.2)",
              boxShadow: "0 8px 40px hsl(var(--emboss-shadow)), inset 0 1px 0 hsl(var(--emboss-light))",
            }}
          >
            {rightPanelTab === "hq" && isSignedIn ? (
              <div className="flex-1 overflow-hidden">
                <HQPanel onSelectRole={(role) => setSelectedRole(role)} />
              </div>
            ) : rightPanelTab === "table" ? (
              <div className="flex-1 overflow-hidden">
                <FutureSkillsTable
                  skills={futureSkills}
                  onSkillClick={(skill) => {
                    setMapFocusSkillId(skill.id);
                    setTimeout(() => setMapFocusSkillId(null), 100);
                  }}
                />
              </div>
            ) : isSignedIn ? (
              <div className="flex-1 overflow-hidden">
                <MyRolesPanel
                  onSelectRole={(role) => {
                    setSelectedRole(role);
                    setRightPanelTab("table");
                  }}
                  onAskChat={(prompt) => {
                    setChatDockOpen(true);
                    chatSendMessage(prompt);
                  }}
                  onTabChange={setMyRolesTab}
                />
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role preview overlay */}
      <AnimatePresence>
        {selectedRole && (
          <motion.div
            key="role-preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div
              className="flex items-center justify-between px-5 py-3 backdrop-blur-sm"
              style={{
                background: "hsl(var(--surface-stone) / 0.9)",
                borderBottom: "1px solid hsl(var(--filigree) / 0.2)",
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: `hsl(${(selectedRole.title.length * 47) % 360}, 55%, 45%)` }}
                >
                  {(selectedRole.company || selectedRole.title)[0]?.toUpperCase()}
                </div>
                <div>
                  <h2
                    className="text-sm font-semibold text-foreground leading-tight"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {selectedRole.title}
                  </h2>
                  {selectedRole.company && (
                    <p className="text-xs text-muted-foreground">{selectedRole.company}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-all active:scale-[0.97]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <X className="h-3.5 w-3.5" />
                Close
              </button>
            </div>
            <div className="h-[calc(100%-3.25rem)] overflow-hidden">
              <RolePreviewPanel
                role={selectedRole}
                onClose={() => setSelectedRole(null)}
                edgeContext={activeEdge}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MapPage;
