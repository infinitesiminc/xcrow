/**
 * FutureSkillsTable — Skill Forge catalog with Dark Fantasy RPG styling.
 * Stone surfaces, Cinzel headers, territory-colored domain badges.
 */
import { useState, useMemo } from "react";
import { type FutureSkill, type FutureSkillCategory } from "@/hooks/use-future-skills";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Search } from "lucide-react";
import { getTerritory } from "@/lib/territory-colors";

type SortKey = "name" | "category" | "demandCount" | "jobCount";

export default function FutureSkillsTable({ skills, onSkillClick }: { skills: FutureSkill[]; onSkillClick?: (skill: FutureSkill) => void }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("demandCount");
  const [sortAsc, setSortAsc] = useState(false);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(prev => !prev);
    else { setSortKey(key); setSortAsc(false); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = q
      ? skills.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
      : [...skills];

    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

    return list;
  }, [skills, search, sortKey, sortAsc]);

  const colBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => toggleSort(key)}
      className={`flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] transition-colors ${
        sortKey === key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
      style={{ fontFamily: "'Cinzel', serif", fontWeight: 600 }}
    >
      {label}
      <ArrowUpDown className="h-2.5 w-2.5" />
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Search + Count */}
      <div className="px-3 py-2.5 shrink-0 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search future skills…"
            className="h-8 pl-8 text-xs border-border/50"
            style={{ background: "hsl(var(--surface-stone))" }}
          />
        </div>
        <span
          className="text-[10px] font-mono whitespace-nowrap"
          style={{ color: "hsl(var(--filigree))" }}
        >
          {filtered.length}{search ? ` / ${skills.length}` : ""} skills
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <table className="w-full text-xs">
          <thead
            className="sticky top-0 z-10 backdrop-blur-sm"
            style={{ background: "hsl(var(--surface-stone) / 0.95)" }}
          >
            <tr style={{ borderBottom: "1px solid hsl(var(--filigree) / 0.15)" }}>
              <th className="text-left py-2 pr-2">{colBtn("name", "Skill")}</th>
              <th className="text-left py-2 pr-2">{colBtn("category", "Domain")}</th>
              <th className="text-right py-2 pr-2">{colBtn("demandCount", "Demand")}</th>
              <th className="text-right py-2">{colBtn("jobCount", "Roles")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(skill => {
              const territory = getTerritory(skill.category as FutureSkillCategory);
              return (
                <tr
                  key={skill.id}
                  onClick={() => onSkillClick?.(skill)}
                  className={`transition-colors hover:bg-muted/20 ${onSkillClick ? "cursor-pointer" : ""}`}
                  style={{ borderBottom: "1px solid hsl(var(--border) / 0.3)" }}
                >
                  <td className="py-1.5 pr-2">
                    <div className="flex items-center gap-1.5">
                      {skill.iconEmoji && <span className="text-sm">{skill.iconEmoji}</span>}
                      <span className="font-medium text-foreground truncate max-w-[160px]">{skill.name}</span>
                    </div>
                  </td>
                  <td className="py-1.5 pr-2">
                    <span
                      className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                      style={{
                        background: `${territory.hsl}15`,
                        color: territory.hsl,
                        border: `1px solid ${territory.hsl}25`,
                      }}
                    >
                      {skill.category}
                    </span>
                  </td>
                  <td className="py-1.5 pr-2 text-right font-mono text-muted-foreground">{skill.demandCount}</td>
                  <td className="py-1.5 text-right font-mono text-muted-foreground">{skill.jobCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-xs py-6">No skills match "{search}"</p>
        )}
      </div>
    </div>
  );
}
