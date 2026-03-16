import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import AuthModal from "@/components/AuthModal";
import OnboardingModal from "@/components/OnboardingModal";
import UpgradeModal from "@/components/UpgradeModal";
import { STRIPE_PRODUCTS } from "@/lib/stripe-config";

interface UserProfile {
  displayName: string | null;
  jobTitle: string | null;
  company: string | null;
  onboardingCompleted: boolean;
}

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  priceId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
}

interface UsageState {
  analysesUsed: number;
  simulationsUsed: number;
  analysisLimit: number;
  simulationLimit: number;
  loading: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  subscription: SubscriptionState;
  usage: UsageState;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  signOut: () => Promise<void>;
  openAuthModal: () => void;
  openUpgradeModal: (type: "analysis" | "simulation") => void;
  canAnalyze: boolean;
  canSimulate: boolean;
  isPro: boolean;
}

const defaultSubscription: SubscriptionState = {
  subscribed: false,
  productId: null,
  priceId: null,
  subscriptionEnd: null,
  loading: true,
};

const defaultUsage: UsageState = {
  analysesUsed: 0,
  simulationsUsed: 0,
  analysisLimit: 1,
  simulationLimit: 1,
  loading: true,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  subscription: defaultSubscription,
  usage: defaultUsage,
  refreshProfile: async () => {},
  refreshSubscription: async () => {},
  refreshUsage: async () => {},
  signOut: async () => {},
  openAuthModal: () => {},
  openUpgradeModal: () => {},
  canAnalyze: true,
  canSimulate: true,
  isPro: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);
  const [usage, setUsage] = useState<UsageState>(defaultUsage);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalType, setUpgradeModalType] = useState<"analysis" | "simulation">("analysis");

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      const row = data as any;
      const p: UserProfile = {
        displayName: row.display_name ?? null,
        jobTitle: row.job_title ?? null,
        company: row.company ?? null,
        onboardingCompleted: row.onboarding_completed ?? false,
      };
      setProfile(p);
      if (!p.onboardingCompleted) {
        // Auto-mark onboarding as completed, skip the modal
        await supabase.from("profiles").update({ onboarding_completed: true } as any).eq("id", userId);
        setProfile(prev => prev ? { ...prev, onboardingCompleted: true } : prev);
      }
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscription({
        subscribed: data.subscribed ?? false,
        productId: data.product_id ?? null,
        priceId: data.price_id ?? null,
        subscriptionEnd: data.subscription_end ?? null,
        loading: false,
      });
    } catch (err) {
      console.error("Failed to check subscription:", err);
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    try {
      const period = new Date();
      period.setDate(1);
      period.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("user_usage")
        .select("analyses_used, simulations_used")
        .gte("period_start", period.toISOString())
        .maybeSingle();

      setUsage({
        analysesUsed: data?.analyses_used ?? 0,
        simulationsUsed: data?.simulations_used ?? 0,
        analysisLimit: 1,
        simulationLimit: 1,
        loading: false,
      });
    } catch {
      setUsage(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const refreshSubscription = useCallback(async () => {
    if (user) await checkSubscription();
  }, [user, checkSubscription]);

  const refreshUsage = useCallback(async () => {
    if (user) await fetchUsage();
  }, [user, fetchUsage]);

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        setAuthModalOpen(false);
        fetchProfile(session.user.id);
        checkSubscription();
        fetchUsage();
      } else {
        setProfile(null);
        setSubscription({ ...defaultSubscription, loading: false });
        setUsage({ ...defaultUsage, loading: false });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchProfile(session.user.id);
        checkSubscription();
        fetchUsage();
      } else {
        setSubscription({ ...defaultSubscription, loading: false });
        setUsage({ ...defaultUsage, loading: false });
      }
    });

    return () => authSub.unsubscribe();
  }, [fetchProfile, checkSubscription, fetchUsage]);

  // Refresh subscription every 60s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSubscription({ ...defaultSubscription, loading: false });
    setUsage({ ...defaultUsage, loading: false });
  };

  const openAuthModal = useCallback(() => {
    setAuthModalOpen(true);
  }, []);

  const openUpgradeModal = useCallback((type: "analysis" | "simulation") => {
    setUpgradeModalType(type);
    setUpgradeModalOpen(true);
  }, []);

  const handleOnboardingComplete = (jobTitle: string, company: string) => {
    setShowOnboarding(false);
    setProfile(prev => prev ? {
      ...prev,
      jobTitle: jobTitle || null,
      company: company || null,
      onboardingCompleted: true,
    } : null);
  };

  const isPro = subscription.subscribed && (
    subscription.productId === STRIPE_PRODUCTS.PRO_MONTHLY ||
    subscription.productId === STRIPE_PRODUCTS.PRO_ANNUAL
  );

  const canAnalyze = isPro || usage.analysesUsed < usage.analysisLimit;
  const canSimulate = isPro || usage.simulationsUsed < usage.simulationLimit;

  return (
    <AuthContext.Provider value={{
      user, session, loading, profile, subscription, usage,
      refreshProfile, refreshSubscription, refreshUsage,
      signOut, openAuthModal, openUpgradeModal,
      canAnalyze, canSimulate, isPro,
    }}>
      {children}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} type={upgradeModalType} />
      {user && showOnboarding && (
        <OnboardingModal
          open={showOnboarding}
          onComplete={handleOnboardingComplete}
          userId={user.id}
        />
      )}
    </AuthContext.Provider>
  );
};
