import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Zap, Target, Play, ArrowUpDown, Crown, Medal, Award,
  UserPlus, Share2, Search, GraduationCap, Users, MessageCircle,
  Gamepad2, Clock, Flame, Eye, TrendingUp, Briefcase, Send, X,
  UserCheck, CheckCircle2, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

type SortKey = "total_xp" | "skills_unlocked" | "tasks_completed";
type TabKey = "global" | "school" | "friends";

interface LeaderboardEntry {
  id: string;
  display_name: string;
  school: string;
  program: string | null;
  total_xp: number;
  skills_unlocked: number;
  tasks_completed: number;
  isFriend?: boolean;
  isMe?: boolean;
  currentActivity?: {
    type: "practicing" | "exploring" | "completed";
    skill: string;
    task: string;
    minutesAgo: number;
  } | null;
}

const SCHOOLS = [
  "UCLA", "USC", "MIT", "Stanford", "Georgia Tech", "UC Berkeley",
  "Carnegie Mellon", "UT Austin", "U Michigan", "Howard University",
  "Spelman College", "NYU", "Columbia", "Purdue", "Virginia Tech",
];

const PROGRAMS = [
  "Computer Science", "Data Science", "Mechanical Engineering", "Electrical Engineering",
  "Business Analytics", "Information Systems", "Industrial Engineering",
  "Bioengineering", "Finance", "Marketing", "Aerospace Engineering",
  "Civil Engineering", "Economics", "Statistics", "Psychology",
];

const FIRST_NAMES = [
  "Aisha", "Carlos", "Priya", "Marcus", "Sofia", "Wei", "Jordan", "Fatima",
  "Liam", "Yuki", "Olivia", "Darnell", "Mei", "Ahmed", "Isabella",
  "Jayden", "Nia", "Ethan", "Zara", "Kenji", "Aaliyah", "Diego",
  "Sana", "Tyler", "Amara", "Ryan", "Chloe", "Tariq", "Hana", "Kai",
  "Maya", "Andre", "Leila", "Omar", "Jasmine", "Aiden", "Nadia",
  "Xavier", "Riya", "Dante", "Luna", "Malik", "Elena", "Javier",
];

const LAST_NAMES = [
  "Chen", "Patel", "Kim", "Johnson", "Garcia", "Williams", "Nguyen", "Brown",
  "Lee", "Martinez", "Thompson", "Davis", "Rodriguez", "Wilson", "Anderson",
  "Yamamoto", "Jackson", "White", "Harris", "Robinson", "Okafor", "Singh",
  "Wright", "Lopez", "Clark", "Hernandez", "Adams", "Baker", "Rivera", "Diaz",
];

const ACTIVITY_SKILLS = [
  "Prompt Engineering", "AI-Assisted Analysis", "Human Oversight",
  "Workflow Automation", "Data Interpretation", "Stakeholder Communication",
  "Ethical Judgment", "Tool Selection", "Adaptive Problem-Solving",
  "Cross-Functional Collaboration", "Strategic Thinking", "AI Output Validation",
];

const ACTIVITY_TASKS = [
  "Drafting marketing copy with AI", "Reviewing automated financial reports",
  "Building a data pipeline", "Evaluating vendor proposals",
  "Designing onboarding workflows", "Analyzing customer sentiment",
  "Triaging support tickets", "Creating project roadmaps",
  "Auditing AI-generated content", "Synthesizing research findings",
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateMockData(): LeaderboardEntry[] {
  const rng = seededRandom(42);
  const entries: LeaderboardEntry[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < 80; i++) {
    let name: string;
    do {
      const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
      const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
      name = `${first} ${last}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const xpBase = Math.floor(rng() * 8000) + 200;
    const skillsBase = Math.min(26, Math.floor(xpBase / 300) + Math.floor(rng() * 4));
    const tasksBase = Math.floor(xpBase / 100) + Math.floor(rng() * 5);
    const isFriend = rng() > 0.85;

    const activityTypes: ("practicing" | "exploring" | "completed")[] = ["practicing", "exploring", "completed"];
    const hasActivity = isFriend && rng() > 0.3;

    entries.push({
      id: `mock-${i}`,
      display_name: name,
      school: SCHOOLS[Math.floor(rng() * SCHOOLS.length)],
      program: rng() > 0.15 ? PROGRAMS[Math.floor(rng() * PROGRAMS.length)] : null,
      total_xp: xpBase,
      skills_unlocked: skillsBase,
      tasks_completed: tasksBase,
      isFriend,
      currentActivity: hasActivity ? {
        type: activityTypes[Math.floor(rng() * activityTypes.length)],
        skill: ACTIVITY_SKILLS[Math.floor(rng() * ACTIVITY_SKILLS.length)],
        task: ACTIVITY_TASKS[Math.floor(rng() * ACTIVITY_TASKS.length)],
        minutesAgo: Math.floor(rng() * 120),
      } : null,
    });
  }

  entries.sort((a, b) => b.total_xp - a.total_xp);
  const meIdx = 12;
  entries[meIdx] = {
    ...entries[meIdx],
    id: "me",
    display_name: "You",
    school: "UCLA",
    program: "Computer Science",
    isMe: true,
    isFriend: false,
    currentActivity: null,
    total_xp: entries[meIdx].total_xp,
    skills_unlocked: entries[meIdx].skills_unlocked,
    tasks_completed: entries[meIdx].tasks_completed,
  };

  return entries;
}

const MOCK_DATA = generateMockData();

const RANK_ICONS = [
  <Crown key="1" className="h-5 w-5 text-yellow-400" />,
  <Medal key="2" className="h-5 w-5 text-gray-300" />,
  <Award key="3" className="h-5 w-5 text-amber-600" />,
];

const SCHOOL_COLORS: Record<string, string> = {
  UCLA: "bg-[hsl(var(--neon-blue))]/15 text-[hsl(var(--neon-blue))]",
  USC: "bg-red-500/15 text-red-400",
  MIT: "bg-red-600/15 text-red-500",
  Stanford: "bg-red-500/15 text-red-400",
  "Georgia Tech": "bg-yellow-500/15 text-yellow-400",
  "UC Berkeley": "bg-[hsl(var(--neon-blue))]/15 text-[hsl(var(--neon-blue))]",
  "Carnegie Mellon": "bg-red-500/15 text-red-400",
  "UT Austin": "bg-orange-500/15 text-orange-400",
  "U Michigan": "bg-[hsl(var(--neon-blue))]/15 text-[hsl(var(--neon-blue))]",
  "Howard University": "bg-[hsl(var(--neon-blue))]/15 text-[hsl(var(--neon-blue))]",
  "Spelman College": "bg-[hsl(var(--neon-blue))]/15 text-[hsl(var(--neon-blue))]",
  NYU: "bg-[hsl(var(--neon-purple))]/15 text-[hsl(var(--neon-purple))]",
  Columbia: "bg-[hsl(var(--neon-blue))]/15 text-[hsl(var(--neon-blue))]",
  Purdue: "bg-yellow-600/15 text-yellow-500",
  "Virginia Tech": "bg-orange-600/15 text-orange-400",
};

function timeAgo(mins: number) {
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

const ACTIVITY_COLORS = {
  practicing: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", icon: Gamepad2 },
  exploring: { bg: "bg-[hsl(var(--neon-blue))]/10", text: "text-[hsl(var(--neon-blue))]", dot: "bg-[hsl(var(--neon-blue))]", icon: Eye },
  completed: { bg: "bg-[hsl(var(--neon-purple))]/10", text: "text-[hsl(var(--neon-purple))]", dot: "bg-[hsl(var(--neon-purple))]", icon: Flame },
};

function ActivityFeed({ entries }: { entries: LeaderboardEntry[] }) {
  const active = entries
    .filter(e => e.currentActivity && !e.isMe)
    .sort((a, b) => (a.currentActivity!.minutesAgo) - (b.currentActivity!.minutesAgo));

  if (active.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <Gamepad2 className="h-4 w-4 text-emerald-400" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Friends Activity</h2>
        <span className="text-[10px] text-muted-foreground">
          {active.filter(a => a.currentActivity!.minutesAgo < 15).length} active now
        </span>
      </div>

      <div className="space-y-1.5">
        {active.map((entry, i) => {
          const act = entry.currentActivity!;
          const style = ACTIVITY_COLORS[act.type];
          const Icon = style.icon;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/50 px-3 py-2.5 hover:bg-card/80 transition-colors"
            >
              <div className="relative shrink-0">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {entry.display_name.split(" ").map(n => n[0]).join("")}
                </div>
                {act.minutesAgo < 15 && (
                  <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${style.dot} ring-2 ring-background`} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground truncate">{entry.display_name}</span>
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border-0 ${style.bg} ${style.text} shrink-0`}>
                    <Icon className="h-2.5 w-2.5 mr-0.5" />
                    {act.type === "practicing" ? "Practicing" : act.type === "exploring" ? "Exploring" : "Just finished"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  <span className="font-medium text-foreground/70">{act.skill}</span>
                  <span className="mx-1">·</span>
                  {act.task}
                </p>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                <Clock className="h-2.5 w-2.5" />
                {timeAgo(act.minutesAgo)}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

const TRENDING_JOBS = [
  { title: "Product Manager", company: "Tech", practitioners: 847, trend: "+23%", emoji: "📊" },
  { title: "Data Analyst", company: "Finance", practitioners: 712, trend: "+31%", emoji: "📈" },
  { title: "UX Designer", company: "Design", practitioners: 634, trend: "+18%", emoji: "🎨" },
  { title: "Software Engineer", company: "Tech", practitioners: 1243, trend: "+12%", emoji: "💻" },
  { title: "Marketing Analyst", company: "Marketing", practitioners: 489, trend: "+27%", emoji: "📣" },
  { title: "Financial Analyst", company: "Finance", practitioners: 398, trend: "+34%", emoji: "💰" },
  { title: "Operations Manager", company: "Operations", practitioners: 356, trend: "+15%", emoji: "⚙️" },
  { title: "Content Strategist", company: "Media", practitioners: 287, trend: "+41%", emoji: "✍️" },
];

function TrendingJobs() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Trending Jobs</h2>
        <span className="text-[10px] text-muted-foreground">most explored this week</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {TRENDING_JOBS.map((job, i) => (
          <motion.div
            key={job.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="shrink-0 w-40 rounded-xl border border-border/40 bg-card/60 p-3 hover:bg-card hover:border-primary/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{job.emoji}</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-0 bg-emerald-500/10 text-emerald-400">
                {job.trend}
              </Badge>
            </div>
            <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {job.title}
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              <Briefcase className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{job.practitioners.toLocaleString()} practicing</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<SortKey>("total_xp");
  const [tab, setTab] = useState<TabKey>("global");
  const [search, setSearch] = useState("");
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<LeaderboardEntry | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, { from: "me" | "them"; text: string }[]>>({});
  const [chatInput, setChatInput] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Simulate incoming messages from friends
  useEffect(() => {
    const friendsList = MOCK_DATA.filter(e => e.isFriend);
    if (friendsList.length === 0) return;

    const incomingMessages = [
      "Just hit 5,000 XP! 🎉",
      "Have you tried the new Product Manager sim?",
      "Yo, I beat your score on Prompt Engineering 😏",
      "Let's grind some sims tonight?",
      "Check out Data Analyst — it's trending!",
      "I got into the top 10 at my school 🔥",
      "This AI Oversight simulation is wild",
      "Can you help me with Stakeholder Communication?",
    ];

    const timers: NodeJS.Timeout[] = [];
    // Send 2-3 simulated messages at staggered intervals
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const delay = 3000 + i * 5000 + Math.random() * 4000;
      timers.push(setTimeout(() => {
        const friend = friendsList[Math.floor(Math.random() * friendsList.length)];
        const msg = incomingMessages[Math.floor(Math.random() * incomingMessages.length)];
        setChatMessages(prev => ({
          ...prev,
          [friend.id]: [...(prev[friend.id] || []), { from: "them", text: msg }],
        }));
        // Only add unread if chat isn't open for this friend
        setChatTarget(current => {
          if (!current || current.id !== friend.id || !chatOpen) {
            setUnreadCounts(prev => ({ ...prev, [friend.id]: (prev[friend.id] || 0) + 1 }));
          }
          return current;
        });
      }, delay));
    }
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatOpen, chatMessages, chatTarget]);

  const filtered = useMemo(() => {
    let data = [...MOCK_DATA];
    if (tab === "school") data = data.filter(e => e.school === "UCLA");
    if (tab === "friends") data = data.filter(e => e.isFriend || e.isMe);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(e =>
        e.display_name.toLowerCase().includes(q) ||
        e.school.toLowerCase().includes(q) ||
        (e.program?.toLowerCase().includes(q))
      );
    }
    return data.sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));
  }, [sortBy, tab, search]);

  const myEntry = MOCK_DATA.find(e => e.isMe);
  const myRank = useMemo(() => {
    const allSorted = [...MOCK_DATA].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));
    return allSorted.findIndex(e => e.isMe) + 1;
  }, [sortBy]);

  const schoolCount = useMemo(() => new Set(MOCK_DATA.map(e => e.school)).size, []);
  const friendCount = MOCK_DATA.filter(e => e.isFriend).length;
  const friendEntries = useMemo(() => MOCK_DATA.filter(e => e.isFriend), []);
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const columns: { key: SortKey; label: string; icon: typeof Zap }[] = [
    { key: "total_xp", label: "XP", icon: Zap },
    { key: "skills_unlocked", label: "Skills", icon: Target },
    { key: "tasks_completed", label: "Tasks", icon: Play },
  ];

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center px-4">
            <Trophy className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Sign in to view the Leaderboard</h2>
            <p className="text-sm text-muted-foreground mb-4">Compete with students across {schoolCount} universities</p>
            <Button onClick={openAuthModal}>Sign In</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  function handleAddFriend(entry: LeaderboardEntry) {
    setPendingRequests(prev => new Set([...prev, entry.id]));
    toast({ title: "Friend request sent", description: `Invited ${entry.display_name} to connect` });
  }

  function handleOpenChat(entry: LeaderboardEntry) {
    setChatTarget(entry);
    setChatOpen(true);
    // Clear unread for this friend
    setUnreadCounts(prev => { const n = { ...prev }; delete n[entry.id]; return n; });
    // Seed a welcome message if no history
    if (!chatMessages[entry.id]) {
      setChatMessages(prev => ({
        ...prev,
        [entry.id]: [{ from: "them", text: `Hey! I'm working on ${entry.currentActivity?.skill || "some simulations"}. What are you practicing?` }],
      }));
    }
  }

  function handleSendChat() {
    if (!chatInput.trim() || !chatTarget) return;
    const id = chatTarget.id;
    setChatMessages(prev => ({
      ...prev,
      [id]: [...(prev[id] || []), { from: "me", text: chatInput.trim() }],
    }));
    setChatInput("");
    // Simulate reply
    setTimeout(() => {
      const replies = [
        "Nice! I just finished a simulation on that 🔥",
        "We should practice together sometime!",
        "That's a tough one — I scored 72% last time",
        "Have you tried the Adaptive Thinking challenges?",
        "Cool! I'm grinding Prompt Engineering rn 💪",
      ];
      setChatMessages(prev => ({
        ...prev,
        [id]: [...(prev[id] || []), { from: "them", text: replies[Math.floor(Math.random() * replies.length)] }],
      }));
    }, 1200 + Math.random() * 1500);
  }

  async function handleInvite() {
    const shareUrl = `${window.location.origin}/leaderboard`;
    const shareText = "I'm practicing AI-era skills on Crowy 🦅 See where you rank against students from 15+ universities!";

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Crowy — The AI Career Scout",
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch { /* user cancelled */ }
    }

    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    toast({ title: "Link copied!", description: "Paste it anywhere to share with friends" });
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground font-[Space_Grotesk]">Leaderboard</h1>
                <p className="text-xs text-muted-foreground">
                  {MOCK_DATA.length} students · {schoolCount} universities
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {totalUnread > 0 && (
                <Button size="sm" variant="ghost" className="relative gap-1.5 text-muted-foreground" onClick={() => {
                  const friendWithUnread = friendEntries.find(f => unreadCounts[f.id]);
                  if (friendWithUnread) handleOpenChat(friendWithUnread);
                }}>
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-in zoom-in-50">
                    {totalUnread}
                  </span>
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleInvite} className="gap-1.5 shrink-0">
                <Share2 className="h-3.5 w-3.5" /> Invite Friends
              </Button>
            </div>
          </div>

          {/* My rank banner */}
          {myEntry && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  #{myRank}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Your rank</p>
                  <p className="text-xs text-muted-foreground">
                    {myEntry.total_xp.toLocaleString()} XP · {myEntry.school} · {myEntry.program}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="text-center">
                  <p className="font-bold text-foreground text-base">{myEntry.skills_unlocked}</p>
                  <p>Skills</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-foreground text-base">{myEntry.tasks_completed}</p>
                  <p>Tasks</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Friends Activity Feed */}
          <ActivityFeed entries={friendEntries} />

          {/* Trending Jobs */}
          <TrendingJobs />

          {/* Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <Tabs value={tab} onValueChange={v => setTab(v as TabKey)}>
              <TabsList className="h-9">
                <TabsTrigger value="global" className="text-xs gap-1.5 px-3">
                  <Trophy className="h-3 w-3" /> Global
                </TabsTrigger>
                <TabsTrigger value="school" className="text-xs gap-1.5 px-3">
                  <GraduationCap className="h-3 w-3" /> My School
                </TabsTrigger>
                <TabsTrigger value="friends" className="text-xs gap-1.5 px-3">
                  <Users className="h-3 w-3" /> Friends
                  {friendCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                      {friendCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search name or school…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 pl-8 text-xs"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sort:</span>
            {columns.map(col => (
              <Button
                key={col.key}
                variant={sortBy === col.key ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSortBy(col.key)}
                className="text-xs gap-1 h-7"
              >
                <col.icon className="h-3 w-3" />
                {col.label}
              </Button>
            ))}
          </div>

          {/* Friends tab empty state */}
          {tab === "friends" && filtered.length <= 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-dashed border-border/50 bg-card/50 p-6 text-center mb-4"
            >
              <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">Build your crew</p>
              <p className="text-xs text-muted-foreground mb-3">
                Add friends from the leaderboard or invite classmates to compete together
              </p>
              <Button size="sm" variant="outline" onClick={handleInvite} className="gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Share Invite Link
              </Button>
            </motion.div>
          )}

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No results found</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-[2.5rem_1fr_4.5rem_3.5rem_3.5rem_3.5rem] sm:grid-cols-[3rem_1fr_6rem_5rem_5rem_4.5rem] gap-1 px-3 sm:px-4 py-2.5 bg-muted/30 border-b border-border text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>#</span>
                <span>Student</span>
                <span className="text-right">XP</span>
                <span className="text-right">Skills</span>
                <span className="text-right">Tasks</span>
                <span />
              </div>

              {filtered.map((entry, i) => {
                const rank = filtered.indexOf(entry) + 1;
                const schoolColor = SCHOOL_COLORS[entry.school] || "bg-muted text-muted-foreground";
                const act = entry.currentActivity;
                const actStyle = act ? ACTIVITY_COLORS[act.type] : null;
                const isPending = pendingRequests.has(entry.id);
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.015, 0.5) }}
                    className={`grid grid-cols-[2.5rem_1fr_4.5rem_3.5rem_3.5rem_3.5rem] sm:grid-cols-[3rem_1fr_6rem_5rem_5rem_4.5rem] gap-1 px-3 sm:px-4 py-3 items-center border-b border-border/30 last:border-b-0 transition-colors ${
                      entry.isMe ? "bg-primary/5" : "hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      {rank <= 3 ? RANK_ICONS[rank - 1] : (
                        <span className="text-sm font-medium text-muted-foreground">{rank}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-medium truncate ${entry.isMe ? "text-primary" : "text-foreground"}`}>
                          {entry.display_name}
                          {entry.isMe && <span className="ml-1 text-[10px] text-primary/70">(you)</span>}
                          {entry.isFriend && <span className="ml-1 text-[10px] text-[hsl(var(--neon-cyan))]">★</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border-0 ${schoolColor}`}>
                          {entry.school}
                        </Badge>
                        {act && actStyle ? (
                          <span className={`text-[9px] ${actStyle.text} flex items-center gap-0.5`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${actStyle.dot} ${act.minutesAgo < 15 ? "animate-pulse" : ""}`} />
                            {act.skill}
                          </span>
                        ) : entry.program ? (
                          <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                            {entry.program}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-semibold tabular-nums ${sortBy === "total_xp" ? "text-primary" : "text-foreground"}`}>
                        {entry.total_xp.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold tabular-nums ${sortBy === "skills_unlocked" ? "text-primary" : "text-foreground"}`}>
                        {entry.skills_unlocked}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold tabular-nums ${sortBy === "tasks_completed" ? "text-primary" : "text-foreground"}`}>
                        {entry.tasks_completed}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-0.5">
                      {!entry.isMe && entry.isFriend && (
                        <button
                          onClick={() => handleOpenChat(entry)}
                          className="relative p-1 rounded-md hover:bg-[hsl(var(--neon-cyan))]/10 text-muted-foreground hover:text-[hsl(var(--neon-cyan))] transition-colors"
                          title="Chat"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          {unreadCounts[entry.id] && (
                            <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center animate-in zoom-in-50">
                              {unreadCounts[entry.id]}
                            </span>
                          )}
                        </button>
                      )}
                      {!entry.isMe && !entry.isFriend && !isPending && (
                        <button
                          onClick={() => handleAddFriend(entry)}
                          className="p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Add friend"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {!entry.isMe && !entry.isFriend && isPending && (
                        <span className="p-1 text-muted-foreground/50" title="Request sent">
                          <UserCheck className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {schoolCount} schools</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {MOCK_DATA.length} students</span>
            <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {MOCK_DATA.reduce((a, b) => a + b.total_xp, 0).toLocaleString()} total XP</span>
          </div>
        </div>
      </main>

      {/* Chat Sheet */}
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent className="w-full sm:w-96 flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {chatTarget?.display_name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-sm font-semibold text-foreground">{chatTarget?.display_name}</SheetTitle>
                <p className="text-[10px] text-muted-foreground">
                  {chatTarget?.school} · {chatTarget?.total_xp.toLocaleString()} XP
                </p>
              </div>
              {chatTarget?.currentActivity && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-0 bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Gamepad2 className="h-2.5 w-2.5 mr-0.5" />
                  {chatTarget.currentActivity.skill}
                </Badge>
              )}
            </div>
          </SheetHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
            {chatTarget && (chatMessages[chatTarget.id] || []).map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${
                    msg.from === "me"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <form
              onSubmit={e => { e.preventDefault(); handleSendChat(); }}
              className="flex items-center gap-2"
            >
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type a message…"
                className="h-9 text-xs flex-1"
                autoFocus
              />
              <Button type="submit" size="sm" className="h-9 w-9 p-0 shrink-0" disabled={!chatInput.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <Footer />
    </>
  );
}
