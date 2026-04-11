import { createContext, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getTenant, TENANTS, type TenantConfig } from "@/config/tenants";

interface TenantContextValue {
  tenant: TenantConfig;
  tenantSlug: string;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug || "cliq";
  
  const value = useMemo<TenantContextValue>(() => {
    const tenant = getTenant(slug) || TENANTS.cliq;
    return { tenant, tenantSlug: tenant.slug };
  }, [slug]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    return { tenant: TENANTS.cliq, tenantSlug: "cliq" };
  }
  return ctx;
}
