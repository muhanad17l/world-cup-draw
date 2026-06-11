// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { GoldLogo } from "@/components/GoldLogo";
import { Trophy, X, Settings, Star, PenTool, Loader2, ChevronRight, UserCircle, Zap, ShieldCheck, Globe, Smartphone, RotateCw, Crown } from "lucide-react";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────
const PREMIUM_GOLD = "#c8a84b";

interface Match {
  id: string;
  player1Name: string;
  player2Name: string;
  player1Flag: string;
  player2Flag: string;
  player1Image: string;
  player2Image: string;
  player1Score: number;
  player2Score: number;
  status: string;
}

export default function Home() {
  const [status, setStatus] = useState<"IDLE" | "LIVE" | "COMPLETED" | "PENDING">("IDLE");
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLandscapeLocked, setIsLandscapeLocked] = useState(false);
  const [scale, setScale] = useState(1);
  const { isAdmin } = useAuth();

  // 1. FINAL CALIBRATION: Match Image 2 zoom level perfectly
  useEffect(() => {
    const handleSizing = () => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
      const height = typeof window !== 'undefined' ? window.innerHeight : 1080;
      
      // Increased baseWidth to 1850 to match the spaciousness of Image 2
      const baseWidth = 1900; 
      const calculatedScale = Math.min(1, width / baseWidth);
      
      // Multiplier set to 0.86 for that premium wide-angle aesthetic
      setScale(calculatedScale * 0.86); 

      const isMobile = width < 1024;
      const isPortrait = height > width;
      setIsLandscapeLocked(isMobile && isPortrait);
    };
    handleSizing();
    window.addEventListener("resize", handleSizing);
    return () => window.removeEventListener("resize", handleSizing);
  }, []);

  // 2. Data Synchronization
  useEffect(() => {
    setLoading(true);
    const statusUnsub = onSnapshot(doc(db, "settings", "tournament"), (snapshot) => {
       if (snapshot.exists()) setStatus(snapshot.data().status || "IDLE");
    });
    
    const matchesUnsub = onSnapshot(collection(db, "matches"), (snapshot) => {
      const fetched = snapshot.docs.map((doc) => {
        const d = doc.data() as any;
        return {
          id: doc.id,
          player1Name: d.player1Name || "",
          player2Name: d.player2Name || "",
          player1Flag: d.player1Flag || "🏳️",
          player2Flag: d.player2Flag || "🏳️",
          player1Image: d.player1Image || "",
          player2Image: d.player2Image || "",
          player1Score: Number(d.player1Score ?? 0),
          player2Score: Number(d.player2Score ?? 0),
          status: d.status || "pending"
        } as Match;
      });
      setMatches(fetched);
      setLoading(false);
    });

    return () => { statusUnsub(); matchesUnsub(); };
  }, []);

  const getMatch = (id: string): Match => {
    const match = matches.find(m => m.id.toLowerCase() === id.toLowerCase());
    return match || {
      id, player1Name: "", player2Name: "", player1Flag: "🏳️", player2Flag: "🏳️",
      player1Image: "", player2Image: "", player1Score: 0, player2Score: 0, status: "pending"
    };
  };

  return (
    <main className="w-full h-screen bg-[#050505] text-white flex flex-col items-center overflow-hidden font-sans relative selection:bg-amber-500 selection:text-black">
      
      {/* ─── ORIENTATION OVERLAY ─── */}
      <AnimatePresence>
        {isLandscapeLocked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center p-12 text-center">
             <motion.div animate={{ rotate: [0, 90, 90, 0] }} transition={{ duration: 2, repeat: Infinity }} className="mb-10"><Smartphone className="w-24 h-24 text-amber-500" /></motion.div>
             <h2 className="text-3xl font-black text-[#c8a84b] uppercase mb-6 italic tracking-widest leading-none">Rotate Device</h2>
             <p className="text-white/40 text-sm max-w-xs leading-relaxed">لضمان رؤية البطولة بأبعاد الكمبيوتر المتناسقة، يرجى تدوير جوالك.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── SCENIC BACKGROUND ─── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url('/shemagh_pattern.png')`, backgroundSize: '120px' }} />
        <div className="absolute top-1/3 left-0 w-[80vw] h-[80vw] bg-amber-500/5 blur-[250px] rounded-full translate-x-[-40%]" />
        <div className="absolute bottom-1/3 right-0 w-[80vw] h-[80vw] bg-red-600/5 blur-[250px] rounded-full translate-x-[40%]" />
      </div>

      {/* ─── HEADER ─── */}
      <header className="relative z-[100] w-full pt-10 px-12 flex items-center justify-between">
         <div className="flex flex-col group">
            <h1 className="text-2xl md:text-3xl font-black text-[#c8a84b] uppercase italic leading-none drop-shadow-[0_0_20px_rgba(200,168,75,0.4)]">البطولة العالمية للرسم</h1>
            <span className="text-[10px] font-black text-white/10 tracking-[10px] uppercase mt-2">NEXUS • WC</span>
         </div>
         <div className="flex items-center gap-6">
            <Link href="/archive" className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 px-8 py-3.5 rounded-2xl font-black italic text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all">
               <Star className="w-4 h-4" /> ARCHIVE
            </Link>
            <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-white/10 backdrop-blur-3xl rounded-2xl text-amber-500 border border-white/10 shadow-3xl hover:scale-110 transition-all">
              <Settings className="w-7 h-7" />
            </button>
         </div>
      </header>

      {/* ─── BRACKET NEXUS (CALIBRATED ZOOM) ─── */}
      <div className="w-full flex-1 flex items-center justify-center p-4 relative z-10 overflow-hidden">
        <div 
          className="flex items-center justify-center transition-all duration-1000 ease-in-out will-change-transform"
          style={{ transform: `scale(${scale})` }}
        >
          <div className="flex items-center min-w-[1700px] justify-center px-10">
              {/* Wing: West */}
              <div className="flex items-center gap-14">
                  <div className="flex flex-col gap-44">
                      <MatchNode id="match_1" label="Quarter Final I" side="left" onClick={setSelectedMatch} matches={matches} />
                      <MatchNode id="match_2" label="Quarter Final II" side="left" onClick={setSelectedMatch} matches={matches} />
                  </div>
                  <NexusLink height={320} side="left" />
                  <MatchNode id="semi_1" label="Semi Final I" side="left" onClick={setSelectedMatch} matches={matches} variant="gold" />
                  <div className="w-14 h-[2px] bg-gradient-to-r from-white/10 to-transparent" />
              </div>

              {/* CENTER ARENA */}
              <div className="px-20 flex flex-col items-center justify-center relative translate-y-[-10px]">
                  <div className="h-44" />
                  <div onClick={() => setSelectedMatch(getMatch("final"))} className="relative group">
                      <div className="absolute inset-[-6px] bg-amber-500/20 blur-[30px] rounded-[45px] animate-pulse" />
                      <div className="relative w-80 md:w-96 bg-[#c8a84b] border-[3px] border-white/20 rounded-[45px] p-10 flex flex-col gap-8 shadow-[0_60px_180px_rgba(0,0,0,1)] cursor-pointer group-hover:scale-105 transition-all">
                          <div className="flex items-center justify-center gap-5">
                             <Crown className="w-8 h-8 text-black" />
                             <span className="font-black text-2xl tracking-[12px] uppercase italic text-black leading-none">The Final</span>
                             <Crown className="w-8 h-8 text-black" />
                          </div>
                          <div className="space-y-4">
                             <div className="h-14 bg-black/10 rounded-[20px] flex items-center px-8 text-black font-black text-sm truncate uppercase">{getMatch("final").player1Name || "—"}</div>
                             <div className="h-14 bg-black/10 rounded-[20px] flex items-center px-8 text-black font-black text-sm truncate uppercase">{getMatch("final").player2Name || "—"}</div>
                          </div>
                      </div>
                  </div>
                  <div className="mt-12 flex items-center gap-4">
                      <div className="px-16 h-16 bg-white/5 border border-white/10 rounded-[30px] flex items-center justify-center text-amber-500 font-black text-xs tracking-[8px] relative overflow-hidden group shadow-2xl">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                          {status === "COMPLETED" ? "LEGENDS CROWNED" : "AWAITING GLORY"}
                      </div>
                  </div>
              </div>

              {/* Wing: East */}
              <div className="flex items-center gap-14">
                  <div className="w-14 h-[2px] bg-gradient-to-l from-white/10 to-transparent" />
                  <MatchNode id="semi_2" label="Semi Final II" side="right" onClick={setSelectedMatch} matches={matches} variant="gold" />
                  <NexusLink height={320} side="right" />
                  <div className="flex flex-col gap-44">
                      <MatchNode id="match_3" label="Quarter Final III" side="right" onClick={setSelectedMatch} matches={matches} />
                      <MatchNode id="match_4" label="Quarter Final IV" side="right" onClick={setSelectedMatch} matches={matches} />
                  </div>
              </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMatch && (
           <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6 md:p-12 overflow-hidden">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 50 }} className="relative w-full max-w-6xl bg-neutral-900 border border-white/5 rounded-[60px] p-10 md:p-16 flex flex-col shadow-[0_0_200px_rgba(0,0,0,1)] overflow-y-auto max-h-[94vh]">
                 <button onClick={() => setSelectedMatch(null)} className="absolute top-10 right-10 z-[6000] p-6 bg-white/5 rounded-full hover:bg-amber-500 hover:text-black transition-all hover:rotate-90"><X className="w-10 h-10" /></button>
                 <div className="flex items-center gap-6 mb-16 opacity-30 select-none"><div className="w-1.5 h-16 bg-amber-500 rounded-full" /><span className="text-[12px] font-black italic tracking-[20px] uppercase">Nexus Node Analyst</span></div>
                 <div className="flex flex-col lg:flex-row gap-16 items-stretch">
                    {[1, 2].map(num => {
                       const p = `player${num}`;
                       return (
                          <div key={num} className="flex-1 flex flex-col items-center text-center group">
                             <div className="w-full h-[40vh] bg-neutral-950 rounded-[50px] p-4 border border-white/5 flex items-center justify-center mb-10 overflow-hidden group-hover:border-amber-500/50 transition-all transition-transform duration-1000 shadow-3xl">{selectedMatch[`${p}Image`] ? <motion.img initial={{ scale: 1.15 }} animate={{ scale: 1 }} src={selectedMatch[`${p}Image`]} className="w-full h-full object-contain" /> : <UserCircle className="w-24 h-24 opacity-5" />}</div>
                             <div className="flex items-center gap-6 mb-4"><span className="text-5xl drop-shadow-2xl">{selectedMatch[`${p}Flag`]}</span><h3 className="text-3xl font-black text-amber-500 uppercase italic truncate max-w-[250px]">{selectedMatch[`${p}Name`] || "—"}</h3></div>
                             <div className="text-8xl font-black text-white/30">{selectedMatch[`${p}Score`]}</div>
                          </div>
                       )
                    })}
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Sidebar Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[8000] flex items-center justify-end">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-2xl" />
             <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 35 }} className="relative w-full max-w-md h-full bg-[#0a0a0a] border-l border-white/10 p-16 flex flex-col shadow-3xl">
                <div className="flex justify-between items-center mb-20 text-2xl font-black uppercase text-amber-500 italic tracking-[5px]">Nexus System<button onClick={() => setIsMenuOpen(false)}><X className="w-10 h-10 text-white/10 hover:text-white" /></button></div>
                <div className="space-y-8">
                   <Link href="/archive" onClick={() => setIsMenuOpen(false)} className="w-full flex items-center gap-8 p-10 bg-white/5 hover:bg-white/10 rounded-[40px] border border-white/5 transition-all group">
                      <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center"><Star className="text-amber-500 w-8 h-8" /></div>
                      <span className="text-xl font-black uppercase tracking-widest text-white/80">Elite Archive</span>
                   </Link>
                   {isAdmin && (
                      <Link href="/admin/tournament" onClick={() => setIsMenuOpen(false)} className="w-full flex items-center gap-8 p-10 bg-amber-500 hover:bg-amber-400 text-black rounded-[40px] font-black uppercase tracking-widest transition-all group">
                         <div className="w-16 h-16 bg-black/10 rounded-2xl flex items-center justify-center"><Zap className="w-8 h-8" /></div>
                         <span className="text-xl font-black uppercase tracking-widest">Command Center</span>
                      </Link>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}

// ─── PRIMITIVES ───

function MatchNode({ id, label, side, onClick, matches, variant = "default" }: any) {
  const match = matches.find((m: any) => m.id.toLowerCase() === id.toLowerCase()) || { player1Name: "", player2Name: "", player1Score: 0, player1Flag: "🏳️", player2Flag: "🏳️" };
  const getIsWinner = (num: number) => num === 1 ? match.player1Score > match.player2Score : match.player2Score > match.player1Score;

  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.03 }}
      onClick={() => onClick(match)}
      className={`flex flex-col gap-4 w-72 group cursor-pointer ${side === "left" ? "items-start" : "items-end"}`}
    >
      <div className={`flex items-center gap-4 mb-2 opacity-20 group-hover:opacity-60 transition-opacity ${side === "left" ? "flex-row" : "flex-row-reverse"}`}>
         <div className={`w-2 h-2 rounded-full ${match.status === 'live' ? 'bg-red-600 animate-pulse' : 'bg-white/20'}`} />
         <span className="text-[11px] font-black uppercase text-white tracking-[12px] italic">{label}</span>
      </div>
      {[1, 2].map(num => {
        const name = match[`player${num}Name`];
        const score = match[`player${num}Score`];
        const flag = match[`player${num}Flag`];
        const win = getIsWinner(num);
        const isEmpty = !name;
        return (
          <div key={num} className={`w-full h-12 relative rounded-[18px] border transition-all duration-500 flex items-center px-6 overflow-hidden ${variant === 'gold' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/[0.04] border-white/5'} group-hover:border-amber-500/50 shadow-2xl`}>
            {win && <div className="absolute inset-y-0 left-0 w-2 bg-amber-500" />}
            <span className="text-2xl mr-6 shrink-0 transition-transform group-hover:scale-125 duration-500">{flag}</span>
            <span className={`text-[12px] font-black uppercase tracking-widest flex-1 truncate ${isEmpty ? 'text-white/5 italic' : win ? 'text-amber-500' : 'text-white/70'}`}>{isEmpty ? "empty" : name}</span>
            {!isEmpty && <span className="text-[18px] font-black text-white italic ml-4">{score}</span>}
          </div>
        )
      })}
    </motion.div>
  );
}

function NexusLink({ height, side }: { height: number; side: "left" | "right" }) {
  return (
    <div className="relative shrink-0" style={{ width: 50, height }}>
      <svg width="50" height={height} className="opacity-20 absolute top-0">
        {side === "left" ? (
          <path d={`M0 ${height * 0.15} L30 ${height * 0.15} L30 ${height * 0.85} L0 ${height * 0.85} M30 ${height/2} L50 ${height/2}`} fill="none" stroke="white" strokeWidth="2.5" />
        ) : (
          <path d={`M50 ${height * 0.15} L20 ${height * 0.15} L20 ${height * 0.85} L50 ${height * 0.85} M20 ${height/2} L0 ${height/2}`} fill="none" stroke="white" strokeWidth="2.5" />
        )}
      </svg>
      <motion.div animate={{ y: [height*0.15, height*0.85, height*0.15] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} className={`absolute ${side === 'left' ? 'left-[28.5px]' : 'left-[18.5px]'} w-[3px] h-8 bg-amber-500/60 blur-[4px] rounded-full`} />
    </div>
  );
}
