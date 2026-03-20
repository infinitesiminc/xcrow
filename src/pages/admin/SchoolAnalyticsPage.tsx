import SchoolAnalyticsDashboard from "@/components/admin/SchoolAnalyticsDashboard";
import CrossSchoolSkillsGap from "@/components/admin/CrossSchoolSkillsGap";
import { useNavigate } from "react-router-dom";

export default function SchoolAnalyticsPage() {
  const navigate = useNavigate();

  function handleFilterPipeline(stage: string) {
    navigate(`/admin/schools?pipeline=${stage}`);
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold font-[Space_Grotesk] tracking-tight">School Analytics</h1>
      <SchoolAnalyticsDashboard onFilterPipeline={handleFilterPipeline} />

      <div>
        <h2 className="text-lg font-bold font-[Space_Grotesk] tracking-tight mb-4">Cross-School Skills Gap Analysis</h2>
        <CrossSchoolSkillsGap />
      </div>
    </div>
  );
}
