
ALTER TABLE public.flash_accounts
  ADD COLUMN ownership_type text,
  ADD COLUMN contract_model text;

COMMENT ON COLUMN public.flash_accounts.ownership_type IS 'public, pe-backed, family, vc-backed, or corporate-subsidiary';
COMMENT ON COLUMN public.flash_accounts.contract_model IS 'managed, leased, mixed, or technology-platform';
