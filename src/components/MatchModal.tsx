"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, UserCircle } from "lucide-react";

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any;
  isAdmin?: boolean;
  onUpdateScore?: (path: string, val: number) => void;
}

export default function MatchModal({ isOpen, onClose, match, isAdmin, onUpdateScore }: MatchModalProps) {
  if (!match) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          {/* Subtle Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-[-1]"
          />

          {/* Fixed Frame: Resolved Clipping UI - Requirement 2 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl h-auto max-h-[95vh] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col overflow-y-auto p-6 md:p-10 shadow-[0_0_100px_rgba(0,0,0,1)] transition-all"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-primary" />
                  <span className="text-[10px] font-black italic tracking-[8px] uppercase text-zinc-500">Arena Transmission</span>
               </div>
               <button onClick={onClose} className="p-3 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
            </div>

            {/* Symmetrical Split Layout */}
            <div className="flex flex-col md:flex-row justify-between items-stretch gap-8 w-full flex-1">
               {[1, 2].map(num => {
                 const px = `player${num}`;
                 const name = match[`${px}Name`];
                 const country = match[`${px}Country`] || match[`${px}Flag`];
                 const score = match[`${px}Score`] || 0;
                 const image = match[`${px}Image`];
                 const isEmpty = !name || name.trim() === "" || name === "بانتظار المتأهل";

                 return (
                   <div key={num} className="flex-1 flex flex-col items-center justify-between bg-zinc-900/20 p-6 rounded-2xl border border-zinc-800/50">
                      
                      {/* Artwork Containment */}
                      <div className="w-full h-[30vh] md:h-[35vh] flex items-center justify-center relative bg-black/40 rounded-xl border border-zinc-800/80 p-2 overflow-hidden mb-6">
                         {isEmpty ? (
                           <div className="flex flex-col items-center gap-4 opacity-5">
                              <UserCircle className="w-16 h-16" />
                              <span className="text-[8px] font-black tracking-[10px] uppercase text-center">Transmission Standby</span>
                           </div>
                         ) : (
                           <img src={image || "https://placehold.co/600x800/050505/222?text=Processing"} className="w-full h-full object-contain drop-shadow-2xl" alt="Match Artwork" />
                         )}
                      </div>

                      {/* Participant Hub */}
                      <div className="w-full space-y-4">
                         <div className="flex items-center justify-between gap-4">
                            <h3 className={`text-xl lg:text-2xl font-black italic uppercase truncate ${isEmpty ? "text-white/5" : "text-white"}`}>
                               {isEmpty ? "بانتظار المتأهل" : name}
                            </h3>
                            {!isEmpty && <img src={`https://flagcdn.com/w40/${country}.png`} className="w-6 h-4 object-cover rounded shadow-md border border-white/5 shrink-0" alt="Country Flag" />}
                         </div>

                         {/* Power Status & Progress */}
                         <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-black italic uppercase">
                               <span className="text-zinc-600 tracking-widest italic">Power Level</span>
                               <span className="text-primary italic">{score} Points</span>
                            </div>

                            {/* Dynamic Score Progress Bar */}
                            <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-zinc-900 p-0.5">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${Math.min(score, 100)}%` }}
                                 transition={{ duration: 1.5, ease: "circOut" }}
                                 className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                               />
                            </div>
                         </div>

                         {/* Admin Power Controls */}
                         {isAdmin && !isEmpty && (
                           <div className="pt-4 border-t border-zinc-800 mt-4 flex items-center justify-center gap-4">
                              <input 
                                type="number" 
                                value={score} 
                                onChange={(e) => onUpdateScore && onUpdateScore(`${px}Score`, parseInt(e.target.value) || 0)}
                                className="w-16 bg-black border border-zinc-800 rounded-xl p-2 text-center text-primary font-black text-lg outline-none focus:border-primary shadow-inner"
                              />
                              <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Score Mod</span>
                           </div>
                         )}
                      </div>
                   </div>
                 );
               })}
            </div>

            {/* Modal Persistence Branding */}
            <div className="mt-10 text-center opacity-10">
               <span className="text-[8px] font-black italic tracking-[15px] uppercase">Arbiter Competition Protocol v2.5</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
