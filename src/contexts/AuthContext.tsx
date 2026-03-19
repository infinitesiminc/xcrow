import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import AuthModal from "@/components/AuthModal";
import { PRO_PRODUCT_IDS, type PlanTier } from "@/lib/stripe-config";

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
  schoolName: string | null;
  careerStage: string | null;
  cvUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  isSuperAdmin: boolean;
  plan: PlanTier;
  subscriptionEnd: string | null;
  schoolName: string | null;
  schoolId: string | null;
  isSchoolAdmin: boolean;
  isPro: boolean;
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
  schoolName: null,
  schoolId: null,
  isSchoolAdmin: false,
  isPro: false,
  refreshProfile: async () => {},
  refreshSubscription: async () => {},
  signOut: async () => {},
  openAuthModal: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [plan, setPlan] = useState<PlanTier>("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);

  const isSuperAdmin = !!user && SUPERADMIN_IDS.includes(user.id);
  const isPro = plan === "pro" || plan === "school" || isSuperAdmin;

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
        schoolName: row.school_name ?? null,
        careerStage: row.career_stage ?? 'professional',
        cvUrl: row.cv_url ?? null,
      });
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setPlan("free");
      setSubscriptionEnd(null);
      setSchoolName(null);
      return;
    }

    try {
      // Check school seat first (B2B)
      const { data: seatData } = await supabase.rpc("has_school_seat" as any, { _user_id: user.id });
      if (seatData === true) {
        // Get school name
        const { data: seatRow } = await (supabase.from("school_seats" as any) as any)
          .select("school_id, school_accounts(name, expires_at)")
          .eq("user_id", user.id)
          .eq("status", "active")
          .limit(1)
          .single();
        setPlan("school");
        setSchoolName(seatRow?.school_accounts?.name ?? "School");
        setSubscriptionEnd(seatRow?.school_accounts?.expires_at ?? null);
        return;
      }

      // Check Stripe subscription (B2C)
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data?.subscribed && data?.product_id) {
        if (PRO_PRODUCT_IDS.has(data.product_id)) {
          setPlan("pro");
          setSubscriptionEnd(data.subscription_end ?? null);
          return;
        }
      }

      setPlan("free");
      setSubscriptionEnd(null);
      setSchoolName(null);
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

  // Check subscription when user changes
  useEffect(() => {
    if (user) checkSubscription();
  }, [user, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setPlan("free");
    setSubscriptionEnd(null);
    setSchoolName(null);
  };

  const openAuthModal = useCallback(() => {
    setAuthModalOpen(true);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, loading, profile, isSuperAdmin,
      plan, subscriptionEnd, schoolName, isPro,
      refreshProfile, refreshSubscription, signOut, openAuthModal,
    }}>
      {children}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </AuthContext.Provider>
  );
};
