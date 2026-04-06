
CREATE TABLE public.federal_tax_liens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  taxpayer_name TEXT NOT NULL,
  taxpayer_address TEXT,
  taxpayer_city TEXT,
  taxpayer_state TEXT,
  taxpayer_zip TEXT,
  taxpayer_ssn_or_ein TEXT,
  serial_number TEXT,
  lien_unit TEXT,
  kind_of_tax TEXT,
  unpaid_balance NUMERIC,
  total_amount_due NUMERIC,
  tax_period_ending TEXT,
  date_of_assessment TEXT,
  filing_date TEXT,
  last_day_for_refiling TEXT,
  release_date TEXT,
  identifying_number TEXT,
  county TEXT,
  state_filed TEXT,
  place_of_filing TEXT,
  revenue_officer_name TEXT,
  revenue_officer_title TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.federal_tax_liens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own liens"
  ON public.federal_tax_liens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own liens"
  ON public.federal_tax_liens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own liens"
  ON public.federal_tax_liens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own liens"
  ON public.federal_tax_liens FOR DELETE
  USING (auth.uid() = user_id);
