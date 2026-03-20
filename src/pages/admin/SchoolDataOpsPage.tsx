import SchoolAnalyticsDashboard from "@/components/admin/SchoolAnalyticsDashboard";
import { useNavigate } from "react-router-dom";

export default function SchoolDataOpsPage() {
  const navigate = useNavigate();

  function handleFilterPipeline(stage: string) {
    navigate(`/admin/schools?pipeline=${stage}`);
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold font-[Space_Grotesk] tracking-tight">Data Operations</h1>
      <SchoolAnalyticsDashboard onFilterPipeline={handleFilterPipeline} />
    </div>
  );
}
