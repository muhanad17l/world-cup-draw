"use client";

import { Trophy, PenTool } from "lucide-react";
import { motion } from "framer-motion";
import MatchCard from "./MatchCard";

export default function BracketView({ matches, mode }: { matches: any[], mode: "graphite" | "ink" }) {
  const getMatch = (round: string, index: number) => {
    return matches.find(m => (m.round === round && m.index === index) || m.id === 'final') || null; 
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black flex flex-row items-center justify-between px-10 md:px-20 z-0">
      
      {/* 1. Left Wing Container */}
      <div className="w-[30%] h-full flex flex-row items-center justify-start gap-12">
          <div className="h-[80%] flex flex-col justify-around">
             <MatchCard match={getMatch("qf", 0)} />
             <MatchCard match={getMatch("qf", 1)} />
          </div>
          <div className="h-full flex items-center">
             <div className="relative group">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black italic uppercase tracking-[4px] text-primary/30">Semi Final A</div>
                <MatchCard match={getMatch("sf", 0)} />
             </div>
          </div>
      </div>

      {/* 2. Absolute Center: Optimized Hub (Mathematical Centering) */}
      <div className="w-[35%] h-full flex flex-col items-center justify-center gap-12 relative">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full -z-10" />
         
         <div className="flex flex-col items-center gap-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.1, rotate: -2 }}
              className="relative p-7 bg-neutral-900 border-2 border-primary/20 rounded-[50px] shadow-[0_0_80px_rgba(var(--primary-rgb),0.2)] flex flex-col items-center justify-center backdrop-blur-3xl group"
            >
              <div className="relative">
                 <div className="absolute inset-0 bg-primary/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                 {mode === "graphite" ? (
                   <PenTool className="w-14 h-14 text-primary drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.6)]" />
                 ) : (
                   <Trophy className="w-14 h-14 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                 )}
              </div>
              <div className="absolute -top-3 bg-white text-black px-3 py-1 rounded-lg font-black italic text-[8px] uppercase tracking-[3px] shadow-2xl">Arbiter Choice</div>
            </motion.div>

            {/* GOLD LEGEND Label */}
            <div className="text-center space-y-1">
               <motion.span 
                 animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                 className="block text-amber-500 font-serif tracking-[15px] text-xl md:text-2xl uppercase italic drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]"
               >
                 LEGEND
               </motion.span>
               <span className="block text-white/5 text-[7px] font-black uppercase tracking-[8px]">Global World Final Match</span>
            </div>
         </div>

         {/* Final Match Slot (Clean Symmetrical Layout) */}
         <div className="w-full max-w-[400px] z-50 transition-all duration-700 mt-8 flex justify-center">
            <MatchCard match={getMatch("final", 0)} />
         </div>
      </div>

      {/* 3. Right Wing Container */}
      <div className="w-[30%] h-full flex flex-row-reverse items-center justify-start gap-12">
          <div className="h-[80%] flex flex-col justify-around">
             <MatchCard match={getMatch("qf", 2)} />
             <MatchCard match={getMatch("qf", 3)} />
          </div>
          <div className="h-full flex items-center">
             <div className="relative group">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black italic uppercase tracking-[4px] text-primary/30">Semi Final B</div>
                <MatchCard match={getMatch("sf", 1)} />
             </div>
          </div>
      </div>
      
    </div>
  );
}
