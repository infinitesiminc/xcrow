import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateLien, useUpdateLien, type Lien, type LienInsert } from "@/hooks/useLiens";
import { toast } from "sonner";
import { X } from "lucide-react";

interface LienFormProps {
  editingLien?: Lien | null;
  onClose: () => void;
}

export function LienForm({ editingLien, onClose }: LienFormProps) {
  const createLien = useCreateLien();
  const updateLien = useUpdateLien();
  const isEditing = !!editingLien;

  const [form, setForm] = useState<Record<string, string>>({
    taxpayer_name: editingLien?.taxpayer_name ?? "",
    taxpayer_address: editingLien?.taxpayer_address ?? "",
    taxpayer_city: editingLien?.taxpayer_city ?? "Austin",
    taxpayer_state: editingLien?.taxpayer_state ?? "TX",
    taxpayer_zip: editingLien?.taxpayer_zip ?? "",
    taxpayer_ssn_or_ein: editingLien?.taxpayer_ssn_or_ein ?? "",
    serial_number: editingLien?.serial_number ?? "",
    lien_unit: editingLien?.lien_unit ?? "",
    kind_of_tax: editingLien?.kind_of_tax ?? "",
    unpaid_balance: editingLien?.unpaid_balance?.toString() ?? "",
    total_amount_due: editingLien?.total_amount_due?.toString() ?? "",
    tax_period_ending: editingLien?.tax_period_ending ?? "",
    date_of_assessment: editingLien?.date_of_assessment ?? "",
    filing_date: editingLien?.filing_date ?? "",
    last_day_for_refiling: editingLien?.last_day_for_refiling ?? "",
    release_date: editingLien?.release_date ?? "",
    identifying_number: editingLien?.identifying_number ?? "",
    county: editingLien?.county ?? "Travis",
    state_filed: editingLien?.state_filed ?? "Texas",
    place_of_filing: editingLien?.place_of_filing ?? "Travis County, Austin, TX",
    revenue_officer_name: editingLien?.revenue_officer_name ?? "",
    revenue_officer_title: editingLien?.revenue_officer_title ?? "",
    status: editingLien?.status ?? "active",
    notes: editingLien?.notes ?? "",
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.taxpayer_name.trim()) {
      toast.error("Taxpayer name is required");
      return;
    }

    const payload: LienInsert = {
      taxpayer_name: form.taxpayer_name,
      taxpayer_address: form.taxpayer_address || null,
      taxpayer_city: form.taxpayer_city || null,
      taxpayer_state: form.taxpayer_state || null,
      taxpayer_zip: form.taxpayer_zip || null,
      taxpayer_ssn_or_ein: form.taxpayer_ssn_or_ein || null,
      serial_number: form.serial_number || null,
      lien_unit: form.lien_unit || null,
      kind_of_tax: form.kind_of_tax || null,
      unpaid_balance: form.unpaid_balance ? parseFloat(form.unpaid_balance) : null,
      total_amount_due: form.total_amount_due ? parseFloat(form.total_amount_due) : null,
      tax_period_ending: form.tax_period_ending || null,
      date_of_assessment: form.date_of_assessment || null,
      filing_date: form.filing_date || null,
      last_day_for_refiling: form.last_day_for_refiling || null,
      release_date: form.release_date || null,
      identifying_number: form.identifying_number || null,
      county: form.county || null,
      state_filed: form.state_filed || null,
      place_of_filing: form.place_of_filing || null,
      revenue_officer_name: form.revenue_officer_name || null,
      revenue_officer_title: form.revenue_officer_title || null,
      status: form.status || "active",
      notes: form.notes || null,
    };

    try {
      if (isEditing) {
        await updateLien.mutateAsync({ id: editingLien.id, ...payload });
        toast.success("Lien updated successfully");
      } else {
        await createLien.mutateAsync(payload);
        toast.success("Lien created successfully");
      }
      onClose();
    } catch {
      toast.error("Failed to save lien");
    }
  };

  const isPending = createLien.isPending || updateLien.isPending;

  return (
    <Card className="animate-fade-in border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">
          {isEditing ? "Edit Tax Lien" : "New Tax Lien — Form 668(Y)(C)"}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Taxpayer Information</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="taxpayer_name">Taxpayer Name *</Label>
                <Input id="taxpayer_name" value={form.taxpayer_name} onChange={(e) => set("taxpayer_name", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxpayer_ssn_or_ein">SSN / EIN</Label>
                <Input id="taxpayer_ssn_or_ein" value={form.taxpayer_ssn_or_ein} onChange={(e) => set("taxpayer_ssn_or_ein", e.target.value)} placeholder="XXX-XX-XXXX or XX-XXXXXXX" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="taxpayer_address">Address</Label>
                <Input id="taxpayer_address" value={form.taxpayer_address} onChange={(e) => set("taxpayer_address", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxpayer_city">City</Label>
                <Input id="taxpayer_city" value={form.taxpayer_city} onChange={(e) => set("taxpayer_city", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="taxpayer_state">State</Label>
                  <Input id="taxpayer_state" value={form.taxpayer_state} onChange={(e) => set("taxpayer_state", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taxpayer_zip">ZIP</Label>
                  <Input id="taxpayer_zip" value={form.taxpayer_zip} onChange={(e) => set("taxpayer_zip", e.target.value)} />
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Lien Details</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input id="serial_number" value={form.serial_number} onChange={(e) => set("serial_number", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lien_unit">Lien Unit</Label>
                <Input id="lien_unit" value={form.lien_unit} onChange={(e) => set("lien_unit", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="identifying_number">Identifying Number</Label>
                <Input id="identifying_number" value={form.identifying_number} onChange={(e) => set("identifying_number", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kind_of_tax">Kind of Tax</Label>
                <Input id="kind_of_tax" value={form.kind_of_tax} onChange={(e) => set("kind_of_tax", e.target.value)} placeholder="e.g. 1040, 941" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unpaid_balance">Unpaid Balance ($)</Label>
                <Input id="unpaid_balance" type="number" step="0.01" value={form.unpaid_balance} onChange={(e) => set("unpaid_balance", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="total_amount_due">Total Amount Due ($)</Label>
                <Input id="total_amount_due" type="number" step="0.01" value={form.total_amount_due} onChange={(e) => set("total_amount_due", e.target.value)} />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dates</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tax_period_ending">Tax Period Ending</Label>
                <Input id="tax_period_ending" type="date" value={form.tax_period_ending} onChange={(e) => set("tax_period_ending", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date_of_assessment">Date of Assessment</Label>
                <Input id="date_of_assessment" type="date" value={form.date_of_assessment} onChange={(e) => set("date_of_assessment", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="filing_date">Filing Date</Label>
                <Input id="filing_date" type="date" value={form.filing_date} onChange={(e) => set("filing_date", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_day_for_refiling">Last Day for Refiling</Label>
                <Input id="last_day_for_refiling" type="date" value={form.last_day_for_refiling} onChange={(e) => set("last_day_for_refiling", e.target.value)} />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Filing Information</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="county">County</Label>
                <Input id="county" value={form.county} onChange={(e) => set("county", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state_filed">State</Label>
                <Input id="state_filed" value={form.state_filed} onChange={(e) => set("state_filed", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="place_of_filing">Place of Filing</Label>
                <Input id="place_of_filing" value={form.place_of_filing} onChange={(e) => set("place_of_filing", e.target.value)} />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Revenue Officer & Status</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="revenue_officer_name">Officer Name</Label>
                <Input id="revenue_officer_name" value={form.revenue_officer_name} onChange={(e) => set("revenue_officer_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="revenue_officer_title">Officer Title</Label>
                <Input id="revenue_officer_title" value={form.revenue_officer_title} onChange={(e) => set("revenue_officer_title", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="released">Released</SelectItem>
                    <SelectItem value="refiled">Refiled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.status === "released" && (
              <div className="max-w-xs space-y-1.5">
                <Label htmlFor="release_date">Release Date</Label>
                <Input id="release_date" type="date" value={form.release_date} onChange={(e) => set("release_date", e.target.value)} />
              </div>
            )}
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Update Lien" : "Create Lien"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
