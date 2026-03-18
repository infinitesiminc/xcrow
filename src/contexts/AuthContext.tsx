import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import AuthModal from "@/components/AuthModal";

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
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  openAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  isSuperAdmin: false,
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

  const isSuperAdmin = !!user && SUPERADMIN_IDS.includes(user.id);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      const row = data as any;
      // Fall back to Google OAuth metadata name if profile display_name is empty
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const metaName = authUser?.user_metadata?.full_name ?? authUser?.user_metadata?.name ?? null;
      setProfile({
        displayName: row.display_name || metaName || null,
        jobTitle: row.job_title ?? null,
        company: row.company ?? null,
        onboardingCompleted: row.onboarding_completed ?? false,
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

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

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const openAuthModal = useCallback(() => {
    setAuthModalOpen(true);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, loading, profile, isSuperAdmin,
      refreshProfile, signOut, openAuthModal,
    }}>
      {children}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </AuthContext.Provider>
  );
};
