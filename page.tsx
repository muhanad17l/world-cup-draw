"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Trophy, Star, X, Trash2, Calendar, MapPin, ChevronLeft, Award } from "lucide-react";
import { GoldLogo } from "@/components/GoldLogo";

export default function ArchivePage() {
  const [winners, setWinners] = useState<any[]>([]);
  const { user } = useAuth();
  const isAdmin = user?.email === "muhanadmahmood2023@gmail.com";

  useEffect(() => {
    const q = query(collection(db, "champions"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWinners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const deleteChampion = async (id: string) => {
    if (confirm("Execute permanent deletion from The Elite Archive?")) {
      await deleteDoc(doc(db, "champions", id));
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans selection:bg-amber-500 selection:text-black">
      {/* Cinematic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-0 left-1/4 w-[500px] height-[500px] bg-amber-500/10 blur-[150px] rounded-full" />
         <div className="absolute bottom-0 right-1/4 w-[500px] height-[500px] bg-red-600/5 blur-[150px] rounded-full" />
         <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url('/shemagh_pattern.png')`, backgroundSize: '150px' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 p-8 md:p-12 flex items-center justify-between">
         <div className="flex items-center gap-6">
            <a href="/" className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-amber-500 hover:text-black transition-all">
               <ChevronLeft className="w-6 h-6" />
            </a>
            <div className="flex flex-col">
               <h1 className="text-3xl font-black italic uppercase tracking-tighter text-amber-500 drop-shadow-xl">The Elite Archive</h1>
               <span className="text-[10px] font-bold text-white/20 tracking-[10px] uppercase italic">Sanctuary of Champions</span>
            </div>
         </div>
         <div className="hidden md:block scale-110">
   <GoldLogo />
</div>
      </header>

      {/* Content Grid */}
      <div className="relative z-10 max-w-7xl mx-auto p-8 md:p-12">
         {winners.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {winners.map((winner, index) => (
                <motion.div
                  key={winner.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-neutral-900/40 backdrop-blur-3xl border border-white/5 rounded-[40px] overflow-hidden hover:border-amber-500/40 transition-all shadow-2xl"
                >
                   {/* Artwork Container */}
                   <div className="aspect-[4/5] w-full bg-black relative overflow-hidden flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent z-10" />
                      <img src={winner.image || winner.drawingUrl} className="w-full h-full object-contain relative z-20 group-hover:scale-105 transition-transform duration-700" alt="Victory Art" />
                      
                      <div className="absolute top-6 left-6 z-30 px-4 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
                         <span className="text-sm">{winner.flag || "🏳️"}</span>
                         <span className="text-[9px] font-black uppercase text-white/60 tracking-widest">{winner.country?.toUpperCase() || "Global"}</span>
                      </div>

                      {isAdmin && (
                        <button 
                          onClick={() => deleteChampion(winner.id)}
                          className="absolute top-6 right-6 z-30 p-3 bg-red-600 border border-red-500 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                   </div>

                   {/* Info Panel */}
                   <div className="p-8 space-y-6">
                      <div className="flex justify-between items-start">
                         <div>
                            <h3 className="text-2xl font-black italic uppercase text-white group-hover:text-amber-500 transition-colors leading-none">{winner.name || winner.winnerName}</h3>
                            <div className="flex items-center gap-2 mt-2 opacity-40">
                               <MapPin className="w-3 h-3" />
                               <span className="text-[10px] font-bold uppercase tracking-widest">Regional Champion</span>
                            </div>
                         </div>
                         <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <span className="text-amber-500 font-black italic">{winner.score || 100}%</span>
                         </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-white/5">
                         <div className="flex items-center gap-2 text-amber-500">
                            <Award className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[4px]">Crown Earned</span>
                         </div>
                         <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">{new Date(winner.timestamp?.seconds * 1000).getFullYear() || winner.year || "2026"}</span>
                      </div>
                   </div>
                </motion.div>
              ))}
           </div>
         ) : (
           <div className="h-[60vh] flex flex-col items-center justify-center text-center opacity-20">
              <Trophy className="w-32 h-32 mb-8" />
              <h2 className="text-4xl font-black italic uppercase tracking-[20px]">Archive Empty</h2>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest">Waiting for the first legend to be crowned</p>
           </div>
         )}
      </div>

      <footer className="relative z-10 p-20 text-center opacity-5">
         <span className="text-[10px] font-black uppercase tracking-[30px] italic">Nexus Archive Systems Protocol v8.4</span>
      </footer>
    </main>
  );
}
