import { useSearchParams } from "react-router-dom";
import SchoolsDataTable from "@/components/admin/SchoolsDataTable";

export default function SchoolsPage() {
  const [searchParams] = useSearchParams();
  const pipelineFilter = searchParams.get("pipeline") || undefined;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold font-[Space_Grotesk] tracking-tight">All Schools</h1>
      <SchoolsDataTable initialPipelineFilter={pipelineFilter} />
    </div>
  );
}
