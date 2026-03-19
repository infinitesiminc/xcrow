import SkillsGapMatrix from "@/components/admin/SkillsGapMatrix";

export default function SchoolSkillsGap({ schoolId, schoolName }: { schoolId: string; schoolName: string }) {
  return (
    <div className="mt-4">
      <SkillsGapMatrix schoolId={schoolId} schoolName={schoolName} />
    </div>
  );
}
