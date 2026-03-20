import CrossSchoolSkillsGap from "@/components/admin/CrossSchoolSkillsGap";

export default function SchoolSkillsGapPage() {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold font-[Space_Grotesk] tracking-tight">Skills Gap Analysis</h1>
      <p className="text-sm text-muted-foreground -mt-4">
        Market-demand skills vs aggregate curriculum coverage.
      </p>
      <CrossSchoolSkillsGap />
    </div>
  );
}
