import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLiens, type Lien } from "@/hooks/useLiens";
import { LienForm } from "@/components/texas/LienForm";
import { LienTable } from "@/components/texas/LienTable";
import { Plus, Search, FileText, Download, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Texas = () => {
  const { data: liens, isLoading, error, refetch } = useLiens();
  const [showForm, setShowForm] = useState(false);
  const [editingLien, setEditingLien] = useState<Lien | null>(null);
  const [search, setSearch] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  const filteredLiens = (liens ?? []).filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.taxpayer_name.toLowerCase().includes(q) ||
      l.serial_number?.toLowerCase().includes(q) ||
      l.taxpayer_ssn_or_ein?.toLowerCase().includes(q) ||
      l.status?.toLowerCase().includes(q)
    );
  });

  const handleEdit = (lien: Lien) => {
    setEditingLien(lien);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingLien(null);
  };

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("scrape-tax-liens", {
        body: { county: "Travis", scrape_url: "https://countyclerk.traviscountytx.gov/departments/recording/search-copies-of-records/" },
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`Found ${data.liens_parsed} liens, inserted ${data.liens_inserted} new records`);
        refetch();
      } else {
        toast.error(data?.error || "Scraping failed");
      }
    } catch (err: any) {
      console.error("Scrape error:", err);
      toast.error(err.message || "Failed to scrape liens");
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <>
      <SEOHead title="Texas Lien Tracker" description="Track and manage federal tax liens filed in Texas counties." path="/texas" />
      <Navbar />
      <div className="min-h-screen bg-background pt-14">
        <header className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">
                  Form 668(Y)(C)
                </h1>
                <p className="text-xs text-muted-foreground">
                  Notice of Federal Tax Lien — Travis County, Austin, TX
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleScrape} disabled={isScraping} className="gap-2">
                {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span className="hidden sm:inline">{isScraping ? "Scraping..." : "Scrape Recent"}</span>
              </Button>
              <Button onClick={() => { setEditingLien(null); setShowForm(true); }} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Lien</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {showForm && (
            <LienForm editingLien={editingLien} onClose={handleClose} />
          )}

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, serial #, SSN/EIN, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading liens...</div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              Failed to load liens. Make sure you're logged in.
            </div>
          ) : (
            <LienTable liens={filteredLiens} onEdit={handleEdit} />
          )}
        </main>
      </div>
      <Footer />
    </>
  );
};

export default Texas;
