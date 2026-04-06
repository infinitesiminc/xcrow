import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import type { Lien } from "@/hooks/useLiens";
import { useDeleteLien } from "@/hooks/useLiens";
import { toast } from "sonner";

interface LienTableProps {
  liens: Lien[];
  onEdit: (lien: Lien) => void;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  released: "secondary",
  refiled: "outline",
  expired: "destructive",
};

const formatCurrency = (val: number | null) =>
  val != null ? `$${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—";

const formatDate = (val: string | null) => {
  if (!val) return "—";
  return new Date(val + "T00:00:00").toLocaleDateString("en-US");
};

export function LienTable({ liens, onEdit }: LienTableProps) {
  const deleteLien = useDeleteLien();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete lien for "${name}"?`)) return;
    try {
      await deleteLien.mutateAsync(id);
      toast.success("Lien deleted");
    } catch {
      toast.error("Failed to delete lien");
    }
  };

  if (liens.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No tax liens found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Taxpayer</TableHead>
              <TableHead className="font-semibold">SSN/EIN</TableHead>
              <TableHead className="font-semibold">Serial #</TableHead>
              <TableHead className="font-semibold">Kind of Tax</TableHead>
              <TableHead className="font-semibold text-right">Unpaid Balance</TableHead>
              <TableHead className="font-semibold">Filing Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {liens.map((lien) => (
              <TableRow key={lien.id}>
                <TableCell className="font-medium">{lien.taxpayer_name}</TableCell>
                <TableCell className="font-mono text-sm">{lien.taxpayer_ssn_or_ein || "—"}</TableCell>
                <TableCell>{lien.serial_number || "—"}</TableCell>
                <TableCell>{lien.kind_of_tax || "—"}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(lien.unpaid_balance)}</TableCell>
                <TableCell>{formatDate(lien.filing_date)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[lien.status ?? "active"] ?? "default"}>
                    {lien.status ?? "active"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(lien)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(lien.id, lien.taxpayer_name)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
