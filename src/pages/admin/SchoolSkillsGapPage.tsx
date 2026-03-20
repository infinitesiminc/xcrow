import CrossSchoolSkillsGap from "@/components/admin/CrossSchoolSkillsGap";

export default function SchoolSkillsGapPage() {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold font-[Space_Grotesk] tracking-tight">Aggregate Skills Gap</h1>
      <p className="text-sm text-muted-foreground -mt-4">
        Market-demand skills vs aggregate institutional coverage — no individual schools disclosed.
      </p>
      <CrossSchoolSkillsGap />
    </div>
  );
}
