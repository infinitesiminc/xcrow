import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Lien {
  id: string;
  user_id: string;
  taxpayer_name: string;
  taxpayer_address: string | null;
  taxpayer_city: string | null;
  taxpayer_state: string | null;
  taxpayer_zip: string | null;
  taxpayer_ssn_or_ein: string | null;
  serial_number: string | null;
  lien_unit: string | null;
  kind_of_tax: string | null;
  unpaid_balance: number | null;
  total_amount_due: number | null;
  tax_period_ending: string | null;
  date_of_assessment: string | null;
  filing_date: string | null;
  last_day_for_refiling: string | null;
  release_date: string | null;
  identifying_number: string | null;
  county: string | null;
  state_filed: string | null;
  place_of_filing: string | null;
  revenue_officer_name: string | null;
  revenue_officer_title: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type LienInsert = Omit<Lien, "id" | "user_id" | "created_at" | "updated_at">;
export type LienUpdate = Partial<LienInsert>;

export function useLiens() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["liens", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase.from("federal_tax_liens") as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lien[];
    },
  });
}

export function useCreateLien() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (lien: LienInsert) => {
      const { data, error } = await (supabase.from("federal_tax_liens") as any)
        .insert({ ...lien, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["liens"] }),
  });
}

export function useUpdateLien() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: LienUpdate & { id: string }) => {
      const { data, error } = await (supabase.from("federal_tax_liens") as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["liens"] }),
  });
}

export function useDeleteLien() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("federal_tax_liens") as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["liens"] }),
  });
}
