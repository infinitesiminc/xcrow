import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, DollarSign, Users, Gift, Zap, CreditCard, TrendingUp } from "lucide-react";
import { STRIPE_PRICES, STRIPE_PRODUCTS, FREE_LIMITS } from "@/lib/stripe-config";

interface UsageRow {
  user_id: string;
  display_name: string | null;
  simulations_used: number;
  analyses_used: number;
  period_start: string;
}

interface ReferralStat {
  referrer_id: string;
  display_name: string | null;
  referral_count: number;
}

export default function PricingUsagePage() {
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageRow[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStat[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalSims, setTotalSims] = useState(0);
  const [schoolSeats, setSchoolSeats] = useState({ total: 0, active: 0 });
  const [totalReferrals, setTotalReferrals] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const currentPeriod = new Date();
    currentPeriod.setDate(1);
    currentPeriod.setHours(0, 0, 0, 0);

    const [usageRes, profilesRes, simsRes, seatsRes, referralsRes] = await Promise.all([
      // Current month usage with profile join
      supabase
        .from("user_usage")
        .select("user_id, simulations_used, analyses_used, period_start")
        .gte("period_start", currentPeriod.toISOString())
        .order("simulations_used", { ascending: false })
        .limit(50),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("completed_simulations").select("id", { count: "exact", head: true }),
      supabase.from("school_seats" as any).select("id, status"),
      supabase.from("referrals").select("referrer_id, credited"),
    ]);

    // Get profile names for usage rows
    const userIds = (usageRes.data || []).map((r: any) => r.user_id);
    let profileMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);
      (profiles || []).forEach((p: any) => {
        profileMap[p.id] = p.display_name || "Anonymous";
      });
    }

    const usage = (usageRes.data || []).map((r: any) => ({
      ...r,
      display_name: profileMap[r.user_id] || "Anonymous",
    }));

    // Aggregate referral stats
    const referralMap: Record<string, number> = {};
    ((referralsRes.data as any[]) || []).forEach((r: any) => {
      if (r.credited) {
        referralMap[r.referrer_id] = (referralMap[r.referrer_id] || 0) + 1;
      }
    });

    // Get referrer names
    const referrerIds = Object.keys(referralMap);
    let referrerNames: Record<string, string> = {};
    if (referrerIds.length > 0) {
      const { data: rProfiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", referrerIds);
      (rProfiles || []).forEach((p: any) => {
        referrerNames[p.id] = p.display_name || "Anonymous";
      });
    }

    const refStats = Object.entries(referralMap)
      .map(([id, count]) => ({
        referrer_id: id,
        display_name: referrerNames[id] || "Anonymous",
        referral_count: count,
      }))
      .sort((a, b) => b.referral_count - a.referral_count);

    const seats = (seatsRes.data as any[]) || [];
    setUsageData(usage);
    setReferralStats(refStats);
    setTotalUsers(profilesRes.count || 0);
    setTotalSims(simsRes.count || 0);
    setSchoolSeats({
      total: seats.length,
      active: seats.filter((s: any) => s.status === "active").length,
    });
    setTotalReferrals((referralsRes.data as any[])?.length || 0);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pricingTiers = [
    {
      name: "Free",
      price: "$0",
      limits: `${FREE_LIMITS.simulations_per_month} sims/mo • Unlimited analyses`,
      badge: "default" as const,
    },
    {
      name: "Student Pro",
      price: "$7/mo",
      productId: STRIPE_PRODUCTS.STUDENT_PRO,
      priceId: STRIPE_PRICES.STUDENT_PRO_MONTHLY,
      limits: "Unlimited sims & analyses",
      badge: "secondary" as const,
    },
    {
      name: "School (B2B)",
      price: "$7/seat/mo",
      limits: "Unlimited via seat license",
      badge: "outline" as const,
    },
  ];

  const activeUsersThisMonth = usageData.filter(u => u.simulations_used > 0 || u.analyses_used > 0).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Pricing & Usage Controls</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of all pricing tiers, usage limits, referrals, and user activity.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalUsers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalSims.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Simulations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gift className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalReferrals}</p>
              <p className="text-xs text-muted-foreground">Total Referrals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold">{schoolSeats.active}/{schoolSeats.total}</p>
              <p className="text-xs text-muted-foreground">School Seats (active/total)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Tiers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Pricing Tiers
          </CardTitle>
          <CardDescription>Current product & price configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Product ID</TableHead>
                <TableHead>Price ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricingTiers.map(t => (
                <TableRow key={t.name}>
                  <TableCell>
                    <Badge variant={t.badge}>{t.name}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{t.price}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.limits}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {(t as any).productId || "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {(t as any).priceId || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Usage Limits Config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" /> Free Tier Limits
          </CardTitle>
          <CardDescription>Defined in code — edit stripe-config.ts to change</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Simulations / month</p>
              <p className="text-2xl font-bold">{FREE_LIMITS.simulations_per_month}</p>
              <p className="text-xs text-muted-foreground mt-1">+ 2 per referral (uncapped)</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Analyses / month</p>
              <p className="text-2xl font-bold">∞</p>
              <p className="text-xs text-muted-foreground mt-1">Unlimited for all users</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Leaderboard */}
      {referralStats.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="h-4 w-4" /> Top Referrers
            </CardTitle>
            <CardDescription>Users who've earned the most referral bonus credits</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Referrals</TableHead>
                  <TableHead className="text-right">Bonus Sims</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralStats.slice(0, 15).map(r => (
                  <TableRow key={r.referrer_id}>
                    <TableCell className="text-sm">{r.display_name}</TableCell>
                    <TableCell className="text-right font-medium">{r.referral_count}</TableCell>
                    <TableCell className="text-right text-muted-foreground">+{r.referral_count * 2}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Monthly Usage Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> This Month's Usage
          </CardTitle>
          <CardDescription>
            {activeUsersThisMonth} active user{activeUsersThisMonth !== 1 ? "s" : ""} this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usageData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No usage data this month yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Sims Used</TableHead>
                  <TableHead className="text-right">Analyses Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageData.map(u => (
                  <TableRow key={u.user_id}>
                    <TableCell className="text-sm">{u.display_name}</TableCell>
                    <TableCell className="text-right font-medium">{u.simulations_used}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{u.analyses_used}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
