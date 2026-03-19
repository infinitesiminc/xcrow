import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SchoolAnalyticsDashboard from "@/components/admin/SchoolAnalyticsDashboard";
import SchoolsDataTable from "@/components/admin/SchoolsDataTable";

export default function SchoolsPage() {
  const [tab, setTab] = useState("analytics");
  const [pipelineFilter, setPipelineFilter] = useState<string | undefined>();

  function handleFilterPipeline(stage: string) {
    setPipelineFilter(stage);
    setTab("schools");
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold font-[Space_Grotesk] tracking-tight">Schools</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="schools">All Schools</TabsTrigger>
        </TabsList>
        <TabsContent value="analytics">
          <SchoolAnalyticsDashboard onFilterPipeline={handleFilterPipeline} />
        </TabsContent>
        <TabsContent value="schools">
          <SchoolsDataTable initialPipelineFilter={pipelineFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
