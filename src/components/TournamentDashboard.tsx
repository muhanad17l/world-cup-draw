"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { GoldLogo } from "./GoldLogo";
import BracketView from "./BracketView";
import ChampionsSidebar from "./ChampionsSidebar";
import OrientationHandler from "./OrientationHandler";
import { Trophy, Layers, Palette, Moon, Sun, Monitor, Menu, X, Settings, LogIn, ChevronRight, Star, ExternalLink, Zap } from "lucide-react";

export default function TournamentDashboard() {
  const [mode, setMode] = useState<"graphite" | "ink">("graphite");
  const [status, setStatus] = useState<"IDLE" | "LIVE">("IDLE");
  const [theme, setTheme] = useState<"bw" | "pink-yellow" | "navy-yellow">("bw");
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChampionsOpen, setIsChampionsOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    document.documentElement.className = `theme-${theme}`;
  }, [theme]);

  useEffect(() => {
    setLoading(true);
    
    // Status Listener
    const statusUnsub = onSnapshot(doc(db, "settings", "tournament"), (doc) => {
       if (doc.exists()) setStatus(doc.data().status || "IDLE");
    });

    // Match Listener
    const q = query(collection(db, "matches"), where("type", "==", mode));
    const matchesUnsub = onSnapshot(q, (snapshot) => {
      setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      statusUnsub();
      matchesUnsub();
    };
  }, [mode]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-700 font-sans selection:bg-primary">
      <OrientationHandler />
      
      {/* Premium Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] h-20 bg-background/80 backdrop-blur-3xl border-b border-glass-border">
         <div className="mx-auto max-w-[1440px] h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <GoldLogo />
               {status === "LIVE" && (
                 <motion.div 
                   initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                   className="hidden md:flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full"
                 >
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--primary)]" />
                    <span className="text-[10px] font-black italic tracking-widest uppercase text-primary">Live Event</span>
                 </motion.div>
               )}
            </div>

            <div className="flex items-center gap-4">
               <motion.button 
                 whileHover={{ scale: 1.05 }} onClick={() => setIsChampionsOpen(true)}
                 className="flex items-center gap-3 bg-glass border border-glass-border px-6 py-3 rounded-2xl font-black italic text-[10px] uppercase tracking-widest hover:border-primary/40"
               >
                  <Star className="w-4 h-4 text-primary" /> Elite Archive
               </motion.button>

               <div className="hidden md:flex bg-glass p-1 rounded-2xl border border-glass-border">
                  {["bw", "pink-yellow", "navy-yellow"].map((t) => (
                    <button key={t} onClick={() => setTheme(t as any)} className={`p-3 rounded-xl transition-all ${theme === t ? "bg-primary text-background" : "text-foreground/30 hover:text-foreground"}`}>
                      {t === "bw" ? <Monitor className="w-4 h-4" /> : t === "pink-yellow" ? <Palette className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                  ))}
               </div>
               
               <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-glass border border-glass-border rounded-xl text-primary"><Menu className="w-6 h-6" /></button>
            </div>
         </div>
      </header>

      {/* Champions Drawer */}
      <AnimatePresence>
        {isChampionsOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsChampionsOpen(false)} className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 35 }} className="fixed top-0 right-0 z-[501] w-full max-w-md h-full bg-background border-l border-glass-border flex flex-col shadow-2xl">
               <div className="flex items-center justify-between p-10 border-b border-glass-border">
                  <div className="flex items-center gap-4"><Star className="w-6 h-6 text-primary" /><h3 className="text-2xl font-black italic uppercase tracking-tighter">Elite Archive</h3></div>
                  <button onClick={() => setIsChampionsOpen(false)} className="p-4 bg-glass rounded-2xl text-primary"><X className="w-6 h-6" /></button>
               </div>
               <div className="flex-1 overflow-y-auto"><ChampionsSidebar /></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed top-0 right-0 z-[501] w-full max-w-sm h-full bg-background border-l border-glass-border p-10 flex flex-col">
               <div className="flex items-center justify-between mb-12"><h3 className="text-2xl font-black italic uppercase">Menu</h3><button onClick={() => setIsMenuOpen(false)} className="p-3 bg-glass rounded-xl text-primary"><X className="w-6 h-6" /></button></div>
               <div className="space-y-6 flex-1">
                  <MenuLink onClick={() => { setMode("graphite"); setIsMenuOpen(false); }} active={mode === "graphite"} label="Graphite Division" icon={<Palette className="w-5 h-5" />} />
                  <MenuLink onClick={() => { setMode("ink"); setIsMenuOpen(false); }} active={mode === "ink"} label="Ink Division" icon={<Layers className="w-5 h-5" />} />
                  {isAdmin && (
                    <div className="pt-6 border-t border-glass-border">
                       <a href="/admin/tournament" className="flex items-center justify-between p-5 bg-primary text-background rounded-2xl font-black italic shadow-2xl"><span className="flex items-center gap-3"><Settings className="w-5 h-5" /> Admin Console</span><ChevronRight className="w-5 h-5" /></a>
                    </div>
                  )}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-[1440px] flex flex-col items-center min-h-screen pt-32 pb-20">
         <AnimatePresence mode="wait">
            {status === "LIVE" ? (
              <motion.div key="live" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full">
                 <div className="flex flex-col items-center gap-16">
                    <div className="bg-glass p-2 rounded-full border border-glass-border flex gap-4 backdrop-blur-3xl shadow-2xl">
                       {["graphite", "ink"].map((m) => (
                         <button key={m} onClick={() => setMode(m as any)} className={`px-12 py-4 rounded-full font-black italic text-sm uppercase transition-all ${mode === m ? "bg-primary text-background scale-105 shadow-[0_0_40px_rgba(var(--primary-rgb),0.5)]" : "text-foreground/30 hover:text-foreground"}`}>
                           {m}
                         </button>
                       ))}
                    </div>
                    {loading ? <LoadingSkeleton theme={theme} /> : <BracketView matches={matches} mode={mode} />}
                 </div>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-40 text-center max-w-xl">
                 <Trophy className="w-24 h-24 text-primary/10 mb-10" />
                 <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-6 leading-none">Arena Awaiting<br /><span className="text-primary italic opacity-20">Master Commands</span></h2>
                 <p className="text-foreground/40 text-sm leading-relaxed mb-12">The Grand Tournament is currently in deployment. Contenders are being verified by the Arbiter. Return shortly for the live matchups.</p>
                 <div className="flex gap-4">
                    <div className="p-1 px-4 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-[3px] text-white/20">Status: Secure</div>
                    <div className="p-1 px-4 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-[3px] text-white/20">Latency: Optimised</div>
                 </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
}

function MenuLink({ active, label, icon, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all ${active ? "bg-primary/10 border border-primary text-primary" : "bg-glass border border-glass-border text-foreground/40 hover:text-foreground"}`}>
       <span className="flex items-center gap-4 font-black italic uppercase">{icon} {label}</span>
       {active && <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />}
    </button>
  );
}

function LoadingSkeleton({ theme }: { theme: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-20">
       <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
       <p className="text-[10px] font-black italic uppercase tracking-[10px] text-primary animate-pulse">Syncing Arena...</p>
    </div>
  );
}
