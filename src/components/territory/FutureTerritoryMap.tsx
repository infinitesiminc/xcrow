/**
 * FutureTerritoryMap — Full-screen RPG-style SVG map for the future skills catalogue.
 * 8 island regions with minimap, pan clamping, click-to-zoom, and floating skill launch card.
 * Now includes Role NPCs — real jobs from the DB that appear as interactive characters.
 */

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { type FutureSkill, type FutureSkillCategory } from "@/hooks/use-future-skills";
import {
  buildFutureMapLayout,
  buildFutureConnections,
  FUTURE_MAP_WIDTH,
  FUTURE_MAP_HEIGHT,
} from "@/lib/future-territory-layout";
import FutureIsland from "./FutureIsland";
import type { CanonicalSkillGrowth } from "@/pages/MapPage";
import { getGuardianByCategory, type TerritoryGuardian } from "@/lib/territory-guardians";
import { generateNPCSpawns, generateUserNPCSpawns, type NPCSpawn, type WanderingNPC } from "@/lib/wandering-npcs";
import { getNPCAvatar } from "@/lib/npc-avatar-pool";
import { useAuth } from "@/contexts/AuthContext";

import GuardianEncounter from "./GuardianEncounter";
import GuardianTrial from "./GuardianTrial";
import ConquestCelebration from "./ConquestCelebration";
import NPCEncounter from "./NPCEncounter";
import NPCMechanics from "./NPCMechanics";
import RoleNPCEncounter from "./RoleNPCEncounter";

import { useScoutMission } from "@/hooks/use-scout-mission";
import TerritoryParticles from "./TerritoryParticles";
import HeroScene from "./HeroScene";
import { getTerritoryHeroImage } from "@/lib/territory-hero-images";
import { supabase } from "@/integrations/supabase/client";
import { jobToRoleNPC, THREAT_COLORS, deptToTerritory, type RoleNPC } from "@/lib/role-npcs";
import { ROLE_NPC_AVATARS, getRoleNPCAvatar } from "@/lib/role-npc-avatars";

import guardIronclad from "@/assets/guardian-ironclad.png";
import guardLexicon from "@/assets/guardian-lexicon.png";
import guardSovereign from "@/assets/guardian-sovereign.png";
import guardHerald from "@/assets/guardian-herald.png";
import guardCrownweaver from "@/assets/guardian-crownweaver.png";
import guardPrisma from "@/assets/guardian-prisma.png";
import guardAegis from "@/assets/guardian-aegis.png";
import guardKindred from "@/assets/guardian-kindred.png";

const GUARDIAN_MAP_AVATARS: Record<string, string> = {
  ironclad: guardIronclad, lexicon: guardLexicon, sovereign: guardSovereign,
  herald: guardHerald, crownweaver: guardCrownweaver, prisma: guardPrisma,
  aegis: guardAegis, kindred: guardKindred,
};

import type { SimLaunchRequest, PromptLabRequest } from "./SkillLaunchCard";

interface FutureTerritoryMapProps {
  skills: FutureSkill[];
  focusSkillId?: string | null;
  level2SkillIds?: Set<string>;
  level2CompletedIds?: Set<string>;
  skillGrowthMap?: Map<string, CanonicalSkillGrowth>;
  onSkillSelect?: (skill: FutureSkill) => void;
  onLaunchSim?: (req: SimLaunchRequest) => void;
  onLaunchPromptLab?: (req: PromptLabRequest) => void;
}

const ISLAND_COLORS: Record<string, string> = {
  "AI & Machine Learning": "hsl(var(--neon-blue))",
  "Data & Analytics": "hsl(var(--neon-cyan))",
  "Cloud & Infrastructure": "hsl(var(--neon-purple))",
  "Security & Privacy": "hsl(var(--neon-pink))",
  "Development & Engineering": "hsl(var(--neon-green))",
  "Business & Strategy": "hsl(var(--accent))",
  "Design & Experience": "hsl(var(--neon-orange))",
  "Communication & Collaboration": "hsl(var(--primary))",
};

export default function FutureTerritoryMap({ skills, focusSkillId, level2SkillIds, level2CompletedIds, skillGrowthMap, onSkillSelect, onLaunchSim, onLaunchPromptLab }: FutureTerritoryMapProps) {
  const layout = useMemo(() => buildFutureMapLayout(skills), [skills]);
  const connections = useMemo(() => buildFutureConnections(layout), [layout]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [focusedIsland, setFocusedIsland] = useState<FutureSkillCategory | null>(null);
  const [highlightedSkillId, setHighlightedSkillId] = useState<string | null>(null);
  const [activeGuardian, setActiveGuardian] = useState<TerritoryGuardian | null>(null);
  const [trialGuardian, setTrialGuardian] = useState<TerritoryGuardian | null>(null);
  const [activeNPC, setActiveNPC] = useState<{ npc: WanderingNPC; territory: FutureSkillCategory } | null>(null);
  const [npcMechanics, setNpcMechanics] = useState<{ npc: WanderingNPC; territory: FutureSkillCategory } | null>(null);
  const [activeRoleNPC, setActiveRoleNPC] = useState<{ role: RoleNPC; avatarSrc: string } | null>(null);
  const [conquest, setConquest] = useState<{ guardianName: string; territory: string; hue: number } | null>(null);
  const [roleNPCs, setRoleNPCs] = useState<RoleNPC[]>([]);
  const [companyFilter, setCompanyFilter] = useState<Set<string>>(new Set());
  const mission = useScoutMission();
  const { user } = useAuth();
  const [hoverPreview, setHoverPreview] = useState<{ type: "guardian" | "npc" | "role"; id: string; name: string; title: string; src: string; x: number; y: number; hue: number } | null>(null);
  const npcSpawns = useMemo(
    () => user?.id
      ? generateUserNPCSpawns(user.id, mission.territoriesScouted)
      : generateNPCSpawns(),
    [user?.id, mission.territoriesScouted]
  );
  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);
  const isDragging = useRef(false);

  // Fetch role NPCs from the DB — sample diverse jobs across departments
  useEffect(() => {
    (async () => {
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, department, automation_risk_percent, augmented_percent, slug, companies(name)")
        .not("automation_risk_percent", "is", null)
        .not("department", "is", null)
        .order("imported_at", { ascending: false })
        .limit(400);
      if (!jobs?.length) return;

      // Sample up to 5 per territory, max 2 roles per company, unique titles
      const perTerritory = new Map<string, RoleNPC[]>();
      const companyCount = new Map<string, number>();
      for (const job of jobs) {
        const npc = jobToRoleNPC(job as any);
        const key = npc.territory;
        if (!perTerritory.has(key)) perTerritory.set(key, []);
        const arr = perTerritory.get(key)!;
        const cc = companyCount.get(npc.company) || 0;
        if (arr.length < 5 && !arr.some(r => r.title === npc.title) && cc < 2) {
          arr.push(npc);
          if (npc.company) companyCount.set(npc.company, cc + 1);
        }
      }
      setRoleNPCs(Array.from(perTerritory.values()).flat());
    })();
  }, []);

  // Auto-pan to first Role NPC on initial load (first 30s hook)
  const hasAutoPanned = useRef(false);
  useEffect(() => {
    if (hasAutoPanned.current || roleNPCs.length === 0 || focusSkillId) return;
    hasAutoPanned.current = true;
    const firstRole = roleNPCs[0];
    const island = layout.find(i => i.category === firstRole.territory);
    if (!island) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const svgScale = rect.width / FUTURE_MAP_WIDTH;
    const angle = (Math.PI * 2 * 0) / Math.max(roleNPCs.length, 1) + Math.PI / 4;
    const dist = island.radius * 0.7;
    const rx = island.cx + Math.cos(angle) * dist;
    const ry = island.cy + Math.sin(angle) * dist;
    const zoomLevel = 1.8;
    const targetX = rect.width / 2 - rx * svgScale * zoomLevel;
    const targetY = rect.height / 2 - ry * svgScale * (FUTURE_MAP_WIDTH / FUTURE_MAP_HEIGHT) * (rect.height / rect.width) * zoomLevel;
    setTimeout(() => {
      setTransform({ x: targetX, y: targetY, scale: zoomLevel });
      setFocusedIsland(firstRole.territory);
    }, 800);
  }, [roleNPCs, layout, focusSkillId]);

  const clampTransform = useCallback((x: number, y: number, scale: number) => {
    const container = containerRef.current;
    if (!container) return { x, y };
    const rect = container.getBoundingClientRect();
    const mapW = rect.width * scale;
    const mapH = rect.height * scale;
    const margin = 0.3;
    return {
      x: Math.max(-(mapW - rect.width * margin), Math.min(rect.width * (1 - margin), x)),
      y: Math.max(-(mapH - rect.height * margin), Math.min(rect.height * (1 - margin), y)),
    };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    setTransform(t => {
      const newScale = Math.max(0.5, Math.min(3, t.scale * delta));
      const c = clampTransform(t.x, t.y, newScale);
      return { ...c, scale: newScale };
    });
  }, [clampTransform]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDragging.current = false;
    dragRef.current = { startX: e.clientX, startY: e.clientY, tx: transform.x, ty: transform.y };
  }, [transform]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging.current = true;
    const rawX = dragRef.current.tx + dx;
    const rawY = dragRef.current.ty + dy;
    setTransform(t => {
      const c = clampTransform(rawX, rawY, t.scale);
      return { ...t, ...c };
    });
  }, [clampTransform]);

  const handlePointerUp = useCallback(() => { dragRef.current = null; }, []);

  const handleIslandClick = useCallback((category: FutureSkillCategory, cx: number, cy: number) => {
    if (isDragging.current) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    if (focusedIsland === category) {
      setTransform({ x: 0, y: 0, scale: 1 });
      setFocusedIsland(null);
      return;
    }

    const svgScale = rect.width / FUTURE_MAP_WIDTH;
    const zoomLevel = 2.2;
    const islandScreenX = cx * svgScale;
    const islandScreenY = cy * svgScale * (FUTURE_MAP_WIDTH / FUTURE_MAP_HEIGHT) * (rect.height / rect.width);
    const targetX = rect.width / 2 - islandScreenX * zoomLevel;
    const targetY = rect.height / 2 - islandScreenY * zoomLevel;

    setTransform({ x: targetX, y: targetY, scale: zoomLevel });
    setFocusedIsland(category);
  }, [focusedIsland]);

  const handleSkillClick = useCallback((skill: FutureSkill) => {
    if (isDragging.current) return;
    // Toggle: clicking same skill closes the card
    setHighlightedSkillId(prev => prev === skill.id ? null : skill.id);
    onSkillSelect?.(skill);
  }, [onSkillSelect]);

  const nodePositions = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const island of layout) {
      const activeNodes = focusedIsland === island.category ? island.expandedNodes : island.nodes;
      for (const node of activeNodes) {
        m.set(node.skillId, { x: node.x, y: node.y });
      }
    }
    return m;
  }, [layout, focusedIsland]);

  const skillLookup = useMemo(() => new Map(skills.map(s => [s.id, s])), [skills]);

  // Unique companies from role NPCs for filter pills
  const companyNames = useMemo(() => {
    const names = new Map<string, number>();
    for (const r of roleNPCs) {
      if (r.company) names.set(r.company, (names.get(r.company) || 0) + 1);
    }
    return Array.from(names.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [roleNPCs]);

  const toggleCompanyFilter = useCallback((company: string) => {
    setCompanyFilter(prev => {
      const next = new Set(prev);
      if (next.has(company)) next.delete(company);
      else next.add(company);
      return next;
    });
  }, []);

  const visibleRoleNPCs = useMemo(() => {
    if (companyFilter.size === 0) return roleNPCs;
    return roleNPCs.filter(r => r.company && companyFilter.has(r.company));
  }, [roleNPCs, companyFilter]);

  // External focus: pan to skill and open drawer
  useEffect(() => {
    if (!focusSkillId) return;
    const skill = skillLookup.get(focusSkillId);
    if (!skill) return;

    // Find which island contains this skill and its position
    for (const island of layout) {
      const allNodes = [...island.nodes, ...island.expandedNodes];
      const node = allNodes.find(n => n.skillId === focusSkillId);
      if (node) {
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const svgScale = rect.width / FUTURE_MAP_WIDTH;
          const zoomLevel = 2.5;
          // Offset node slightly left of center to leave room for the launch card on the right
          const targetX = rect.width * 0.35 - node.x * svgScale * zoomLevel;
          const targetY = rect.height / 2 - node.y * svgScale * (FUTURE_MAP_WIDTH / FUTURE_MAP_HEIGHT) * (rect.height / rect.width) * zoomLevel;
          setTransform({ x: targetX, y: targetY, scale: zoomLevel });
          setFocusedIsland(island.category);
        }
        break;
      }
    }

    setHighlightedSkillId(focusSkillId);
  }, [focusSkillId, skillLookup, layout]);

  // Minimap
  const MINIMAP_W = 140;
  const MINIMAP_H = MINIMAP_W * (FUTURE_MAP_HEIGHT / FUTURE_MAP_WIDTH);

  const viewportRect = useMemo(() => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0, w: MINIMAP_W, h: MINIMAP_H };
    const rect = container.getBoundingClientRect();
    const svgScale = rect.width / FUTURE_MAP_WIDTH;
    const vx = -transform.x / (svgScale * transform.scale);
    const vy = -transform.y / (svgScale * transform.scale) * (FUTURE_MAP_WIDTH / FUTURE_MAP_HEIGHT) * (rect.width / rect.height);
    const vw = rect.width / (svgScale * transform.scale);
    const vh = rect.height / (svgScale * transform.scale);
    return {
      x: Math.max(0, Math.min(MINIMAP_W - 4, (vx / FUTURE_MAP_WIDTH) * MINIMAP_W)),
      y: Math.max(0, Math.min(MINIMAP_H - 4, (vy / FUTURE_MAP_HEIGHT) * MINIMAP_H)),
      w: Math.min(MINIMAP_W, (vw / FUTURE_MAP_WIDTH) * MINIMAP_W),
      h: Math.min(MINIMAP_H, (vh / FUTURE_MAP_HEIGHT) * MINIMAP_H),
    };
  }, [transform, MINIMAP_H]);

  const handleMinimapClick = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
    setFocusedIsland(null);
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={containerRef}
        className="h-full w-full relative overflow-hidden select-none"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: dragRef.current ? "grabbing" : "grab", touchAction: "none" }}
      >
        {/* Ambient territory hero background — fades in when a territory is focused */}
        <AnimatePresence mode="wait">
          {focusedIsland && (
            <motion.div
              key={focusedIsland}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 z-0"
            >
              <HeroScene
                imageUrl={getTerritoryHeroImage(focusedIsland)}
                intensity="ambient"
                camera="ken-burns"
                overlay="vignette"
                hue={getGuardianByCategory(focusedIsland)?.hue ?? 220}
                className="h-full w-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ambient particle effects */}
        <TerritoryParticles focusedTerritory={focusedIsland} />

        {/* Cinematic vignette */}
        <div className="absolute inset-0 map-vignette z-[1]" />

        {/* Company filter pills */}
        {companyNames.length > 0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex flex-wrap gap-1.5 max-w-[80%] justify-center">
            {companyNames.slice(0, 12).map(name => {
              const active = companyFilter.has(name);
              return (
                <button
                  key={name}
                  onClick={() => toggleCompanyFilter(name)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md border transition-all duration-200 ${
                    active
                      ? "bg-primary/90 text-primary-foreground border-primary shadow-md shadow-primary/25"
                      : "bg-card/70 text-muted-foreground border-border/50 hover:bg-card hover:text-foreground"
                  }`}
                >
                  {name}
                </button>
              );
            })}
            {companyFilter.size > 0 && (
              <button
                onClick={() => setCompanyFilter(new Set())}
                className="px-2 py-1 rounded-full text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕ Clear
              </button>
            )}
          </div>
        )}
        <svg
          viewBox={`0 0 ${FUTURE_MAP_WIDTH} ${FUTURE_MAP_HEIGHT}`}
          className="w-full h-full relative"
          preserveAspectRatio="xMidYMid meet"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "0 0",
            transition: isDragging.current ? "none" : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <defs>
            <filter id="future-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>




          {connections.map((conn, i) => {
            const from = nodePositions.get(conn.from);
            const to = nodePositions.get(conn.to);
            if (!from || !to) return null;
            return (
              <motion.path key={`c-${i}`} d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
                fill="none" stroke="hsl(var(--border))" strokeWidth={0.8} opacity={0.25}
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.2 }} />
            );
          })}

          {layout.map(island => (
            <FutureIsland key={island.category} island={island} skillLookup={skillLookup}
              level2SkillIds={level2SkillIds} level2CompletedIds={level2CompletedIds} skillGrowthMap={skillGrowthMap}
              isFocused={focusedIsland === island.category} highlightedSkillId={highlightedSkillId}
              onIslandClick={handleIslandClick} onSkillClick={handleSkillClick} />
          ))}

          {/* Territory Guardians — one per island */}
          {layout.map(island => {
            const guardian = getGuardianByCategory(island.category);
            if (!guardian) return null;
            const gx = island.cx + island.radius * 0.55;
            const gy = island.cy - island.radius * 0.45;
            return (
              <g key={`guard-${guardian.id}`} className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); if (!isDragging.current) { setActiveGuardian(guardian); setActiveNPC(null); setHoverPreview(null); } }}
                onMouseEnter={() => setHoverPreview({ type: "guardian", id: guardian.id, name: guardian.name, title: guardian.title, src: GUARDIAN_MAP_AVATARS[guardian.id] || guardIronclad, x: gx, y: gy, hue: guardian.hue })}
                onMouseLeave={() => setHoverPreview(p => p?.id === guardian.id ? null : p)}
              >
                <motion.polygon
                  points={`${gx},${gy - 18} ${gx + 18},${gy} ${gx},${gy + 18} ${gx - 18},${gy}`}
                  fill={`hsl(${guardian.hue} 40% 15%)`}
                  stroke={`hsl(${guardian.hue} 50% 45%)`}
                  strokeWidth={2}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  style={{ transformOrigin: `${gx}px ${gy}px` }}
                />
                <motion.polygon
                  points={`${gx},${gy - 22} ${gx + 22},${gy} ${gx},${gy + 22} ${gx - 22},${gy}`}
                  fill="none" stroke={`hsl(${guardian.hue} 50% 45%)`}
                  strokeWidth={1} opacity={0.4}
                  animate={{ opacity: [0.4, 0.15, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <foreignObject x={gx - 13} y={gy - 13} width={26} height={26} style={{ pointerEvents: "none" }}>
                  <img
                    src={GUARDIAN_MAP_AVATARS[guardian.id] || guardIronclad}
                    alt={guardian.name}
                    style={{ width: 26, height: 26, borderRadius: "2px", objectFit: "cover", clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
                  />
                </foreignObject>
              </g>
            );
          })}

          {/* Wandering NPCs */}
          {npcSpawns.map(spawn => {
            const island = layout.find(i => i.category === spawn.territory);
            if (!island) return null;
            const nx = island.cx + spawn.offsetX;
            const ny = island.cy + spawn.offsetY;
            return (
              <g key={`npc-${spawn.npc.id}`} className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); if (!isDragging.current) { setActiveNPC({ npc: spawn.npc, territory: island.category }); setActiveGuardian(null); setHoverPreview(null); } }}
                onMouseEnter={() => setHoverPreview({ type: "npc", id: spawn.npc.id, name: spawn.npc.name, title: spawn.npc.title, src: getNPCAvatar(spawn.npc.id), x: nx, y: ny, hue: 200 })}
                onMouseLeave={() => setHoverPreview(p => p?.id === spawn.npc.id ? null : p)}
              >
                {(() => {
                  const r = 15;
                  const hexPoints = Array.from({ length: 6 }, (_, i) => {
                    const angle = (Math.PI / 3) * i - Math.PI / 6;
                    return `${nx + r * Math.cos(angle)},${ny + r * Math.sin(angle)}`;
                  }).join(" ");
                  return (
                    <motion.polygon
                      points={hexPoints}
                      fill="hsl(var(--card))" stroke="hsl(var(--border))"
                      strokeWidth={1.5} strokeDasharray="3 2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.2, type: "spring" }}
                      style={{ transformOrigin: `${nx}px ${ny}px` }}
                    />
                  );
                })()}
                <foreignObject x={nx - 11} y={ny - 11} width={22} height={22} style={{ pointerEvents: "none" }}>
                  <img
                    src={getNPCAvatar(spawn.npc.id)}
                    alt={spawn.npc.name}
                    style={{ width: 22, height: 22, objectFit: "cover", clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)" }}
                  />
                </foreignObject>
              </g>
            );
          })}

          {/* Role NPCs — real jobs as characters + quest waypoint beacon on first */}
          {visibleRoleNPCs.map((role, idx) => {
            const island = layout.find(i => i.category === role.territory);
            if (!island) return null;
            const angle = (Math.PI * 2 * idx) / Math.max(roleNPCs.length, 1) + Math.PI / 4;
            const dist = island.radius * 0.7;
            const rx = island.cx + Math.cos(angle) * dist;
            const ry = island.cy + Math.sin(angle) * dist;
            const colors = THREAT_COLORS[role.threatTier];
            const avatarSrc = getRoleNPCAvatar(role.territory, idx);
            return (
              <g key={`role-${role.jobId}`} className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); if (!isDragging.current) { setActiveRoleNPC({ role, avatarSrc }); setActiveGuardian(null); setActiveNPC(null); setHoverPreview(null); } }}
                onMouseEnter={() => setHoverPreview({ type: "role", id: role.jobId, name: role.title, title: role.company || role.department, src: avatarSrc, x: rx, y: ry, hue: 0 })}
                onMouseLeave={() => setHoverPreview(p => p?.id === role.jobId ? null : p)}
              >
                {/* Threat aura ring */}
                <motion.circle
                  cx={rx} cy={ry} r={18}
                  fill="none"
                  stroke={`hsl(${colors.bg})`}
                  strokeWidth={1.5}
                  opacity={0.5}
                  animate={{ r: [18, 22, 18], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.3 }}
                />
                {/* Border circle */}
                <motion.circle
                  cx={rx} cy={ry} r={14}
                  fill={`hsl(${colors.bg} / 0.15)`}
                  stroke={`hsl(${colors.bg} / 0.8)`}
                  strokeWidth={2}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.5 + idx * 0.08, type: "spring" }}
                  style={{ transformOrigin: `${rx}px ${ry}px` }}
                />
                {/* Avatar image */}
                <foreignObject x={rx - 12} y={ry - 12} width={24} height={24} style={{ pointerEvents: "none" }}>
                  <img
                    src={avatarSrc}
                    alt={role.title}
                    style={{ width: 24, height: 24, objectFit: "cover", borderRadius: "50%" }}
                   />
                </foreignObject>
                {/* Quest waypoint beacon on first unspoken NPC */}
                {idx === 0 && !mission.rolesSpokenTo.has(role.jobId) && (
                  <motion.circle
                    cx={rx} cy={ry} r={26}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    opacity={0.8}
                    animate={{ r: [26, 34, 26], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover preview tooltip */}
        <AnimatePresence>
          {hoverPreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute z-20 pointer-events-none"
              style={{
                left: hoverPreview.x * transform.scale + transform.x,
                top: hoverPreview.y * transform.scale + transform.y - 90,
                transform: "translateX(-50%)",
              }}
            >
              <div
                className="rounded-lg overflow-hidden text-center"
                style={{
                  width: 100,
                  background: `linear-gradient(135deg, hsl(${hoverPreview.hue} 30% 10% / 0.95), hsl(${hoverPreview.hue} 20% 14% / 0.95))`,
                  border: `1.5px solid hsl(${hoverPreview.hue} 45% 40%)`,
                  boxShadow: `0 4px 20px hsl(${hoverPreview.hue} 50% 20% / 0.5)`,
                }}
              >
                {hoverPreview.src ? (
                  <img
                    src={hoverPreview.src}
                    alt={hoverPreview.name}
                    className="w-full h-[72px] object-cover"
                  />
                ) : (
                  <div className="w-full h-[48px] flex items-center justify-center text-xl font-black" style={{ fontFamily: "'Cinzel', serif", background: `hsl(${hoverPreview.hue} 30% 12%)`, color: `hsl(${hoverPreview.hue} 45% 60%)` }}>
                    {hoverPreview.name.split(" ").slice(0, 2).map(w => w[0]).join("")}
                  </div>
                )}
                <div className="px-1.5 py-1.5">
                  <p className="text-[9px] font-bold truncate" style={{ fontFamily: "'Cinzel', serif", color: `hsl(${hoverPreview.hue} 45% 72%)` }}>
                    {hoverPreview.name}
                  </p>
                  <p className="text-[7px] text-muted-foreground truncate">{hoverPreview.title}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guardian Encounter Panel */}
        {activeGuardian && !trialGuardian && (
          <GuardianEncounter
            guardian={activeGuardian}
            onClose={() => setActiveGuardian(null)}
            onChallenge={(g) => { setActiveGuardian(null); setTrialGuardian(g); }}
            onConquerTerritory={(category) => {
              mission.scoutRole(`guardian-${activeGuardian.id}`, category, []);
            }}
          />
        )}

        {/* Guardian Trial */}
        {trialGuardian && (
          <GuardianTrial
            guardian={trialGuardian}
            onClose={() => setTrialGuardian(null)}
            onVictory={(guardianId, category) => {
              mission.conquerSkill();
              mission.scoutRole(`guardian-${guardianId}`, category, []);
              setConquest({
                guardianName: trialGuardian.name,
                territory: trialGuardian.category,
                hue: trialGuardian.hue,
              });
              setTrialGuardian(null);
            }}
          />
        )}

        {/* Conquest celebration */}
        {conquest && (
          <ConquestCelebration
            guardianName={conquest.guardianName}
            territoryName={conquest.territory}
            hue={conquest.hue}
            onComplete={() => setConquest(null)}
          />
        )}

        {/* NPC Encounter Panel */}
        {activeNPC && !npcMechanics && (
          <NPCEncounter
            npc={activeNPC.npc}
            territory={activeNPC.territory}
            onClose={() => setActiveNPC(null)}
            onInteract={(n) => {
              setActiveNPC(null);
              setNpcMechanics({ npc: n, territory: activeNPC.territory });
            }}
          />
        )}

        {/* NPC Mechanics Panel */}
        {npcMechanics && (
          <NPCMechanics
            npc={npcMechanics.npc}
            territory={npcMechanics.territory}
            scoutedSkillCount={mission.scoutedSkills.length}
            territoriesScouted={mission.territoriesScouted}
            onClose={() => setNpcMechanics(null)}
            onFocusTerritory={(cat) => {
              setNpcMechanics(null);
              const island = layout.find(i => i.category === cat);
              if (island) handleIslandClick(cat, island.cx, island.cy);
            }}
          />
        )}

        {/* Role NPC Encounter */}
        {activeRoleNPC && (
          <RoleNPCEncounter
            role={activeRoleNPC}
            onClose={() => {
              setActiveRoleNPC(null);
            }}
            onCollectSkills={(ids) => {
              mission.scoutRole(
                activeRoleNPC.jobId,
                activeRoleNPC.territory,
                ids.map(id => ({ id, name: id, category: activeRoleNPC.territory }))
              );
            }}
          />
        )}


        {/* Minimap */}
        <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-border/50 bg-card/90 backdrop-blur-md shadow-lg overflow-hidden"
          style={{ width: MINIMAP_W, height: MINIMAP_H }}>
          <svg viewBox={`0 0 ${FUTURE_MAP_WIDTH} ${FUTURE_MAP_HEIGHT}`} className="w-full h-full cursor-pointer"
            preserveAspectRatio="xMidYMid meet" onClick={handleMinimapClick}>
            {layout.map(island => (
              <circle key={island.category} cx={island.cx} cy={island.cy} r={island.radius * 0.6}
                fill={ISLAND_COLORS[island.category] || "hsl(var(--primary))"} opacity={focusedIsland === island.category ? 0.9 : 0.4} />
            ))}
            <rect
              x={(viewportRect.x / MINIMAP_W) * FUTURE_MAP_WIDTH}
              y={(viewportRect.y / MINIMAP_H) * FUTURE_MAP_HEIGHT}
              width={(viewportRect.w / MINIMAP_W) * FUTURE_MAP_WIDTH}
              height={(viewportRect.h / MINIMAP_H) * FUTURE_MAP_HEIGHT}
              fill="none" stroke="hsl(var(--primary))" strokeWidth={8} opacity={0.8} rx={4} />
          </svg>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
          <button onClick={() => setTransform(t => { const s = Math.min(3, t.scale * 1.25); const c = clampTransform(t.x, t.y, s); return { ...c, scale: s }; })}
            className="w-8 h-8 rounded-md bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm font-bold backdrop-blur-md transition-colors active:scale-[0.95]">+</button>
          <button onClick={() => setTransform(t => { const s = Math.max(0.5, t.scale * 0.8); const c = clampTransform(t.x, t.y, s); return { ...c, scale: s }; })}
            className="w-8 h-8 rounded-md bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm font-bold backdrop-blur-md transition-colors active:scale-[0.95]">−</button>
          <button onClick={() => { setTransform({ x: 0, y: 0, scale: 1 }); setFocusedIsland(null); setHighlightedSkillId(null); }}
            className="w-8 h-8 rounded-md bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-xs font-bold backdrop-blur-md transition-colors active:scale-[0.95]">⟲</button>
        </div>


      </div>



    </TooltipProvider>
  );
}
