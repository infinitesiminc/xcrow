ALTER TABLE public.flash_accounts ADD COLUMN tenant_slug TEXT NOT NULL DEFAULT 'flash';
CREATE INDEX idx_flash_accounts_tenant_slug ON public.flash_accounts (tenant_slug);