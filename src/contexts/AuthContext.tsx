import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import AuthModal from "@/components/AuthModal";
import { PRO_PRODUCT_IDS, LAUNCHER_PRODUCT_IDS, type PlanTier } from "@/lib/stripe-config";

const SUPERADMIN_IDS = [
  "7be41055-be68-4cab-b63c-f3b0c483e6eb",
  "bb10735b-051e-4bb5-918e-931a9c79d0fd",
];

interface UserProfile {
  displayName: string | null;
  jobTitle: string | null;
  company: string | null;
  onboardingCompleted: boolean;
  linkedinUrl: string | null;
  avatarId: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  isSuperAdmin: boolean;
  plan: PlanTier;
  subscriptionEnd: string | null;
  isPro: boolean;
  isLauncherPro: boolean;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
  openAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  isSuperAdmin: false,
  plan: "free",
  subscriptionEnd: null,
  isPro: false,
  isLauncherPro: false,
  refreshProfile: async () => {},
  refreshSubscription: async () => {},
  signOut: async () => {},
  openAuthModal: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [plan, setPlan] = useState<PlanTier>("free");
  const [isLauncherPro, setIsLauncherPro] = useState(false);

  const isSuperAdmin = !!user && SUPERADMIN_IDS.includes(user.id);
  const isPro = plan === "pro" || isSuperAdmin;

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      const row = data as any;
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const metaName = authUser?.user_metadata?.full_name ?? authUser?.user_metadata?.name ?? null;
      setProfile({
        displayName: row.display_name || metaName || null,
        jobTitle: row.job_title ?? null,
        company: row.company ?? null,
        onboardingCompleted: row.onboarding_completed ?? false,
        linkedinUrl: row.linkedin_url ?? null,
        avatarId: row.avatar_id ?? null,
      });
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setPlan("free");
      setSubscriptionEnd(null);
      return;
    }

    try {
      // Check admin/referral grants
      const { data: grantData } = await supabase.rpc("has_active_grant" as any, { _user_id: user.id });
      if (grantData === true) {
        setPlan("pro");
        // Get end date of latest grant
        const { data: grantRow } = await (supabase.from("user_subscriptions" as any) as any)
          .select("ends_at")
          .eq("user_id", user.id)
          .or("ends_at.is.null,ends_at.gt." + new Date().toISOString())
          .order("ends_at", { ascending: false, nullsFirst: true })
          .limit(1)
          .maybeSingle();
        setSubscriptionEnd(grantRow?.ends_at ?? null);
        return;
      }

      // Check Stripe subscription (B2C)
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data?.subscribed) {
        const allIds: string[] = data.all_product_ids || (data.product_id ? [data.product_id] : []);
        const hasLauncher = allIds.some((id) => (LAUNCHER_PRODUCT_IDS as Set<string>).has(id));
        const hasPro = allIds.some((id) => (PRO_PRODUCT_IDS as Set<string>).has(id));
        setIsLauncherPro(hasLauncher);
        if (hasPro) {
          setPlan("pro");
          setSubscriptionEnd(data.subscription_end ?? null);
          return;
        }
      } else {
        setIsLauncherPro(false);
      }

      setPlan("free");
      setSubscriptionEnd(null);
    } catch {
      setPlan("free");
    }
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const refreshSubscription = useCallback(async () => {
    await checkSubscription();
  }, [checkSubscription]);

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        setAuthModalOpen(false);
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setPlan("free");
        setSubscriptionEnd(null);
        setSchoolName(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => authSub.unsubscribe();
  }, [fetchProfile]);

  // Check subscription when user changes + periodic refresh every 5 min
  useEffect(() => {
    if (!user) return;
    checkSubscription();
    const interval = setInterval(checkSubscription, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);


  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setPlan("free");
    setSubscriptionEnd(null);
    navigate("/", { replace: true });
  };

  const openAuthModal = useCallback(() => {
    setAuthModalOpen(true);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, loading, profile, isSuperAdmin,
      plan, subscriptionEnd, isPro, isLauncherPro,
      refreshProfile, refreshSubscription, signOut, openAuthModal,
    }}>
      {children}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </AuthContext.Provider>
  );
};
