"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  Trophy, Timer, Crown, Target, 
  Star, Upload, Plus, X, BrainCircuit, 
  CheckCircle2, AlertCircle, Sparkles, Lock,
  ChevronRight, ArrowRight, Activity, Zap
} from "lucide-react";
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, serverTimestamp, setDoc 
} from "firebase/firestore";

interface Match {
  id: string;
  player1: { uid: string; name: string; photoURL: string; score: number; country?: string; gender?: string };
  player2: { uid: string; name: string; photoURL: string; score: number; country?: string; gender?: string };
  round: string;
  status: "pending" | "live" | "finished";
}

interface Tournament {
  id: string;
  title: string;
  description: string;
  prize: string;
  status: "upcoming" | "live" | "completed";
  startDate?: any;
  isActive: boolean;
}

export default function EventsPage() {
  const { user, isAdmin } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminLock, setAdminLock] = useState(true); // Extra security layer for admin panel

  // Fetch Tournaments
  useEffect(() => {
    const q = query(collection(db, "tournaments"), orderBy("isActive", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tournament[];
      if (data.length === 0) {
        // Mock data if empty
        setTournaments([
          { id: "world_cup_2026", title: "كأس العالم للرسم 2026", description: "أكبر تظاهرة فنية في عالم Snakket.", prize: "وسام الأسطورة الذهبي", status: "live", isActive: true },
          { id: "asia_glory", title: "مجد آسيا", description: "البطولة القارية للمبدعين في آسيا.", prize: "عضوية النخبة + وسام الشرف", status: "upcoming", isActive: false },
        ]);
      } else {
        setTournaments(data);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Matches for the live tournament
  useEffect(() => {
    const liveTournament = tournaments.find(t => t.status === "live");
    if (liveTournament) {
      const q = query(collection(db, `tournaments/${liveTournament.id}/matches`));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setActiveMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Match[]);
      });
      return () => unsubscribe();
    }
  }, [tournaments]);

  const updateMatchScore = async (matchId: string, playerKey: "player1" | "player2", newScore: number) => {
    if (!isAdmin) return;
    const liveTournament = tournaments.find(t => t.status === "live");
    if (!liveTournament) return;

    try {
      const matchRef = doc(db, `tournaments/${liveTournament.id}/matches`, matchId);
      await updateDoc(matchRef, {
        [`${playerKey}.score`]: newScore
      });
    } catch (err) {
      console.error("Score Update Failed:", err);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto pb-32 pt-12 px-4 text-right overflow-hidden">
          
          {/* Hero Section */}
          <section className="relative mb-20 text-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] -z-10 animate-pulse" />
            <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-2 rounded-full backdrop-blur-md mb-4">
                 <Zap className="w-4 h-4 text-yellow fill-yellow" />
                 <span className="text-[10px] font-black uppercase tracking-[3px]">Snakket Arena 2.0</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-[900] tracking-tighter text-white leading-tight">
                ساحة <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">الأبطال</span>
              </h1>
              <p className="text-foreground/40 font-bold max-w-2xl mx-auto text-lg">
                بث مباشر للمواجهات الفنية الكبرى. كن مستعداً لرفع رصيدك من النقاط وتحدي الأفضل.
              </p>
            </motion.div>
          </section>

          {/* Live Matchups Section */}
          <section className="mb-24">
            <div className="flex flex-col md:flex-row-reverse justify-between items-center gap-6 mb-12">
               <div className="flex items-center gap-4 flex-row-reverse">
                  <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30">
                     <Activity className="w-6 h-6 text-red-500 animate-pulse" />
                  </div>
                  <div>
                     <h2 className="text-3xl font-black text-white">المواجهات المباشرة</h2>
                     <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">Live Arena Pulse</p>
                  </div>
               </div>
               
               {isAdmin && (
                  <button 
                    onClick={() => setAdminLock(!adminLock)}
                    className={`px-6 py-3 rounded-2xl font-black text-xs transition-all flex items-center gap-3 ${adminLock ? "bg-white/5 border border-white/10 text-white/40" : "bg-primary text-white shadow-xl shadow-primary/20"}`}
                  >
                    {adminLock ? <Lock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {adminLock ? "فتح لوحة التحكيم" : "لوحة التحكيم مفعلة"}
                  </button>
               )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               {activeMatches.length > 0 ? (
                 activeMatches.map((match) => (
                   <motion.div 
                     key={match.id}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="glass-card p-1 rounded-[48px] border-white/5 bg-gradient-to-br from-white/5 to-white/[0.02] shadow-2xl"
                   >
                     <div className="p-8 md:p-10 space-y-10">
                        <div className="flex justify-between items-center flex-row-reverse">
                           <span className="text-[10px] font-black text-primary uppercase tracking-[4px]">{match.round}</span>
                           <div className="bg-red-500/10 text-red-500 text-[9px] font-black px-3 py-1 rounded-full border border-red-500/20 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" /> LIVE
                           </div>
                        </div>

                        {/* Versus Battle UI */}
                        <div className="flex items-center justify-between gap-4 md:gap-10">
                           {/* Player 1 */}
                            <div className="flex-1 flex flex-col items-center gap-4 group">
                               <div className="relative">
                                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-3xl md:rounded-[40px] overflow-hidden border-2 border-white/10 group-hover:border-primary/40 transition-all duration-500 shadow-2xl">
                                     <img src={match.player1.photoURL} className="w-full h-full object-cover" alt="p1" />
                                     {/* Gender Indicator overlay */}
                                     <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] border border-white/20 backdrop-blur-md ${match.player1.gender === "female" ? "bg-pink-500/80" : "bg-blue-500/80"}`}>
                                        {match.player1.gender === "female" ? "👧" : "👦"}
                                     </div>
                                  </div>
                                  <div className="absolute -bottom-2 -left-2 bg-background border border-white/10 text-primary text-[10px] font-black px-3 py-1 rounded-xl shadow-lg">
                                     {match.player1.score}
                                  </div>
                               </div>
                               <div className="text-center">
                                  <h4 className="font-black text-xs md:text-sm text-foreground/80 flex items-center justify-center gap-1">
                                    {match.player1.name} <span className="text-lg">{match.player1.country || "🌍"}</span>
                                  </h4>
                               </div>
                            </div>

                           <div className="shrink-0 flex flex-col items-center">
                              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black italic text-xl md:text-2xl text-white/20 shadow-inner">VS</div>
                           </div>

                           {/* Player 2 */}
                            <div className="flex-1 flex flex-col items-center gap-4 group">
                               <div className="relative">
                                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-3xl md:rounded-[40px] overflow-hidden border-2 border-white/10 group-hover:border-accent/40 transition-all duration-500 shadow-2xl">
                                     <img src={match.player2.photoURL} className="w-full h-full object-cover" alt="p2" />
                                     {/* Gender Indicator overlay */}
                                     <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] border border-white/20 backdrop-blur-md ${match.player2.gender === "female" ? "bg-pink-500/80" : "bg-blue-500/80"}`}>
                                        {match.player2.gender === "female" ? "👧" : "👦"}
                                     </div>
                                  </div>
                                  <div className="absolute -bottom-2 -right-2 bg-background border border-white/10 text-accent text-[10px] font-black px-3 py-1 rounded-xl shadow-lg">
                                     {match.player2.score}
                                  </div>
                               </div>
                               <div className="text-center">
                                  <h4 className="font-black text-xs md:text-sm text-foreground/80 flex items-center justify-center gap-1">
                                    {match.player2.name} <span className="text-lg">{match.player2.country || "🌍"}</span>
                                  </h4>
                               </div>
                            </div>
                        </div>

                        {/* Live Adaptive Progress Bars */}
                        <div className="space-y-4 pt-6">
                           <div className="flex items-center gap-4 flex-row-reverse">
                              <div className="flex-1 h-3 md:h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${match.player1.score}%` }}
                                   className="h-full bg-gradient-to-r from-primary to-accent" 
                                 />
                              </div>
                              <div className="flex-1 h-3 md:h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${match.player2.score}%` }}
                                   className="h-full bg-gradient-to-l from-primary to-accent" 
                                 />
                              </div>
                           </div>
                        </div>

                        {/* Admin Scoring Sliders - Protected */}
                        {isAdmin && !adminLock && (
                          <div className="mt-10 p-6 bg-white/5 rounded-3xl border border-white/5 space-y-6">
                             <div className="flex flex-col gap-4">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest text-right">تحكيم {match.player1.name}</label>
                                <input 
                                  type="range" min="0" max="100" 
                                  value={match.player1.score} 
                                  onChange={(e) => updateMatchScore(match.id, "player1", parseInt(e.target.value))}
                                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                             </div>
                             <div className="flex flex-col gap-4">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest text-right">تحكيم {match.player2.name}</label>
                                <input 
                                  type="range" min="0" max="100" 
                                  value={match.player2.score} 
                                  onChange={(e) => updateMatchScore(match.id, "player2", parseInt(e.target.value))}
                                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                                />
                             </div>
                          </div>
                        )}
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="col-span-full py-24 text-center glass-card rounded-[60px] border-dashed border-white/10 opacity-30 bg-white/5">
                   <Trophy className="w-20 h-20 text-white/20 mx-auto mb-6" />
                   <p className="font-black uppercase tracking-[5px] text-white">لا توجد مواجهات نشطة حالياً</p>
                   <p className="text-xs font-bold mt-2">تأكد من بدء البطولة من لوحة التحكم</p>
                 </div>
               )}
            </div>
          </section>

          {/* Upcoming Tournaments Section */}
          <section className="space-y-12">
            <div className="flex items-center gap-4 flex-row-reverse border-b border-white/5 pb-8">
               <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
                  <Timer className="w-6 h-6 text-primary" />
               </div>
               <div>
                  <h2 className="text-3xl font-black text-white">جدول البطولات القادمة</h2>
                  <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">Tournament Schedule</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {tournaments.map((t) => (
                 <motion.div 
                   key={t.id}
                   whileHover={{ y: -10 }}
                   className={`relative glass-card p-1 rounded-[40px] border-white/5 transition-all overflow-hidden bg-white/5 group ${t.status === "upcoming" ? "opacity-70 cursor-not-allowed" : "shadow-lg"}`}
                 >
                   {/* Background Overlay for Upcoming */}
                   {t.status === "upcoming" && (
                     <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center border border-white/20">
                           <Lock className="w-8 h-8 text-white/40" />
                        </div>
                        <p className="text-sm font-black text-white uppercase tracking-[4px]">Coming Soon</p>
                     </div>
                   )}

                   <div className="p-8 space-y-6">
                      <div className="flex justify-between items-center flex-row-reverse">
                         <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${t.status === "live" ? "bg-red-500/20 text-red-500 border-red-500/20" : "bg-white/5 text-white/40 border-white/5"}`}>
                            {t.status === "live" ? "Live" : "Upcoming"}
                         </div>
                         <Crown className="w-5 h-5 text-white/5 group-hover:text-primary transition-colors" />
                      </div>

                      <div className="space-y-2">
                         <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors">{t.title}</h3>
                         <p className="text-white/40 text-xs font-medium leading-relaxed">{t.description}</p>
                      </div>

                      <div className="flex flex-row-reverse items-center justify-between pt-6 border-t border-white/5">
                          <div className="text-right">
                             <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">المركز الشرفي</p>
                             <p className="font-black text-sm text-yellow">{t.prize}</p>
                          </div>
                         <button className="p-4 bg-white/5 rounded-2xl text-white/20 hover:text-white transition-colors">
                            <ArrowRight className="w-5 h-5 -rotate-45" />
                         </button>
                      </div>
                   </div>
                 </motion.div>
               ))}
            </div>
          </section>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

