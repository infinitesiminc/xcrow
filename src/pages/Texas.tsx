import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLiens, type Lien } from "@/hooks/useLiens";
import { LienForm } from "@/components/texas/LienForm";
import { LienTable } from "@/components/texas/LienTable";
import { Plus, Search, FileText, Loader2, Upload, MapPin } from "lucide-react";
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
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data, error: fnError } = await supabase.functions.invoke("extract-lien-pdf", {
        body: formData,
      });
      if (fnError) throw fnError;
      if (data?.success) {
        toast.success(`Extracted ${data.entries_found} entries for ${data.taxpayer_name}, inserted ${data.entries_inserted} new records`);
        refetch();
      } else {
        toast.error(data?.error || "Extraction failed");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to extract lien from PDF");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleAddressSearch = async () => {
    if (!addressSearch.trim()) {
      toast.error("Enter a property address to search");
      return;
    }
    setIsSearching(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("search-liens", {
        body: { address: addressSearch, county: "Travis" },
      });
      if (fnError) throw fnError;
      if (data?.success) {
        if (data.liens_found === 0) {
          toast.info("No liens found for this address");
        } else {
          toast.success(`Found ${data.liens_found} liens, inserted ${data.liens_inserted} new records`);
          refetch();
        }
      } else {
        toast.error(data?.error || "Search failed");
      }
    } catch (err: any) {
      console.error("Search error:", err);
      toast.error(err.message || "Failed to search liens");
    } finally {
      setIsSearching(false);
    }
  };

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
              <label className="cursor-pointer">
                <input type="file" accept=".pdf,image/*" onChange={handlePdfUpload} className="hidden" disabled={isUploading} />
                <Button variant="outline" asChild disabled={isUploading} className="gap-2">
                  <span>
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span className="hidden sm:inline">{isUploading ? "Extracting..." : "Upload PDF"}</span>
                  </span>
                </Button>
              </label>
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

          {/* Address Search */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Search Liens by Property Address
            </h2>
            <div className="flex gap-2">
              <Input
                placeholder="Enter full property address (e.g. 123 Main St, Austin, TX 78701)"
                value={addressSearch}
                onChange={(e) => setAddressSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddressSearch()}
                className="flex-1"
              />
              <Button onClick={handleAddressSearch} disabled={isSearching} className="gap-2">
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Searches public lien records for the property address via RealEstateAPI
            </p>
          </div>

          {/* Filter existing records */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by name, serial #, SSN/EIN, or status..."
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
