import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import AuthModal from "@/components/AuthModal";
import OnboardingModal from "@/components/OnboardingModal";

interface UserProfile {
  displayName: string | null;
  jobTitle: string | null;
  company: string | null;
  onboardingCompleted: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  openAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  refreshProfile: async () => {},
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
  const [showOnboarding, setShowOnboarding] = useState(false);

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
        setShowOnboarding(true);
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        setAuthModalOpen(false);
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
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

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const openAuthModal = useCallback(() => {
    setAuthModalOpen(true);
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

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, refreshProfile, signOut, openAuthModal }}>
      {children}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
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
