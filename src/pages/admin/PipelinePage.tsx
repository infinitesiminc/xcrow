import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, RefreshCw, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import CompaniesPage from "./CompaniesPage";
import ATSSync from "../hr/ATSSync";
import SimulationBuilder from "../products/SimulationBuilder";

const tabs = [
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "import", label: "Import Roles", icon: RefreshCw },
  { id: "roles", label: "Role Explorer", icon: Search },
] as const;

export default function PipelinePage() {
  const [params, setParams] = useSearchParams();
  const active = params.get("tab") || "companies";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage companies, import ATS roles, and explore role data
        </p>
      </div>

      <Tabs
        value={active}
        onValueChange={(v) => setParams({ tab: v }, { replace: true })}
      >
        <TabsList className="h-10">
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="gap-1.5 text-sm">
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="companies" className="mt-4">
          <CompaniesPage />
        </TabsContent>
        <TabsContent value="import" className="mt-4">
          <ATSSync />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <SimulationBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
