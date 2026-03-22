import XcrowLoader from "@/components/XcrowLoader";

export default function LoaderDemo() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-16 p-8">
      <h1 className="text-2xl font-bold text-foreground">Loader Preview</h1>
      <div className="flex items-end gap-16">
        <div className="flex flex-col items-center gap-2">
          <XcrowLoader size="sm" title="Small" subtitle="Fetching data…" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <XcrowLoader size="md" title="Loading quest…" subtitle="Analyzing your skills" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <XcrowLoader size="lg" title="Preparing territory" subtitle="Building your skill map" />
        </div>
      </div>
    </div>
  );
}
