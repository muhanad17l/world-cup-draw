"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Trophy, Crown, Star, Medal, ChevronRight, User } from "lucide-react";

interface HallOfFameEntry {
  id: string;
  winnerName: string;
  drawingUrl: string;
  year: number;
  tournamentId: string;
  points?: number;
  country?: string;
  gender?: string;
}

export default function HallOfFame() {
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "hall_of_fame"), orderBy("year", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HallOfFameEntry[];
      setEntries(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return (
     <div className="w-full flex items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
     </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto py-20 px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-20 space-y-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-gradient-to-br from-yellow to-orange-500 w-24 h-24 rounded-[40px] flex items-center justify-center shadow-2xl shadow-yellow/20 mb-4"
        >
          <Trophy className="w-12 h-12 text-white" />
        </motion.div>
        <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white">لوحة الشرف الذهبية</h2>
        <p className="text-white/40 font-bold uppercase tracking-[10px] text-xs">The Hall of Legends · Top 1000+</p>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-card rounded-[48px] border-white/5 bg-white/[0.02] overflow-hidden shadow-2xl">
         <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
               <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                     <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-[3px]">الترتيب</th>
                     <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-[3px]">المبدع</th>
                     <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-[3px] hidden md:table-cell">العمل الفائز</th>
                     <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-[3px]">السنة / البطولة</th>
                     <th className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-[3px]">النقاط</th>
                  </tr>
               </thead>
               <tbody>
                  {entries.map((entry, index) => (
                    <motion.tr 
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group"
                    >
                       {/* Rank */}
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                             {index === 0 && <Crown className="w-5 h-5 text-yellow animate-bounce" />}
                             {index === 1 && <Medal className="w-5 h-5 text-slate-400" />}
                             {index === 2 && <Medal className="w-5 h-5 text-amber-700" />}
                             <span className={`text-xl font-black ${index < 3 ? "text-white" : "text-white/20"}`}>
                                #{index + 1}
                             </span>
                          </div>
                       </td>

                       {/* User Info */}
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-primary/40 transition-all">
                                <img src={entry.drawingUrl} className="w-full h-full object-cover" alt="p" />
                             </div>
                             <div>
                                <div className="flex items-center gap-2">
                                   <span className="text-lg font-black text-white group-hover:text-primary transition-colors">{entry.winnerName}</span>
                                   <span className="text-xl">{entry.country || "🌍"}</span>
                                </div>
                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{entry.gender === "female" ? "أنثى" : "ذكر"}</span>
                             </div>
                          </div>
                       </td>

                       {/* Drawing Preview */}
                       <td className="px-8 py-6 hidden md:table-cell">
                          <div className="w-24 h-16 rounded-xl bg-black/40 overflow-hidden border border-white/5 relative group/img">
                             <img src={entry.drawingUrl} className="w-full h-full object-cover opacity-60 group-hover/img:scale-110 group-hover/img:opacity-100 transition-all duration-500" alt="work" />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                <Star className="w-6 h-6 text-yellow fill-yellow" />
                             </div>
                          </div>
                       </td>

                       {/* Tournament Info */}
                       <td className="px-8 py-6">
                          <div className="flex flex-col">
                             <span className="text-sm font-black text-white/80">{entry.year}</span>
                             <span className="text-[10px] font-bold text-primary uppercase tracking-[2px]">{entry.tournamentId}</span>
                          </div>
                       </td>

                       {/* Points */}
                       <td className="px-8 py-6">
                          <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl inline-flex items-center gap-2">
                             <span className="text-sm font-black text-primary">{entry.points || 1000 + (entries.length - index) * 50}</span>
                             <Star className="w-3 h-3 text-primary fill-primary" />
                          </div>
                       </td>
                    </motion.tr>
                  ))}
               </tbody>
            </table>
         </div>

         {entries.length === 0 && (
            <div className="py-32 text-center opacity-20">
               <Trophy className="w-16 h-16 mx-auto mb-4" />
               <p className="font-black uppercase tracking-[5px]">Leaderboard Empty</p>
            </div>
         )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
         <div className="glass-card p-8 rounded-[32px] border-white/5 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-white/20 uppercase tracking-[2px]">إجمالي المبدعين</p>
               <h4 className="text-3xl font-black text-white">1,240</h4>
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
               <User className="w-6 h-6 text-white/20" />
            </div>
         </div>
         <div className="glass-card p-8 rounded-[32px] border-white/5 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-white/20 uppercase tracking-[2px]">البطولات المنفذة</p>
               <h4 className="text-3xl font-black text-white">42</h4>
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
               <Trophy className="w-6 h-6 text-white/20" />
            </div>
         </div>
         <div className="glass-card p-8 rounded-[32px] border-white/5 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-white/20 uppercase tracking-[2px]">إجمالي النقاط الموزعة</p>
               <h4 className="text-3xl font-black text-white">850K</h4>
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
               <Star className="w-6 h-6 text-white/20" />
            </div>
         </div>
      </div>
    </div>
  );
}
