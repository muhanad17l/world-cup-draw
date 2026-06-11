"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Trophy, Star, X, Trash2, Calendar, MapPin } from "lucide-react";

export default function ChampionsSidebar() {
  const [winners, setWinners] = useState<any[]>([]);
  const { user } = useAuth();
  const isAdmin = user?.email === "muhanadmahmood2023@gmail.com";

  useEffect(() => {
    // 3. Implementing CRUD for the Elite Archive (Listening to 'champions' collection)
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
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-3xl">
      {/* Header Panel */}
      <div className="p-8 border-b border-white/5 flex items-center gap-4">
         <div className="p-3 bg-primary/20 rounded-2xl border border-primary/20">
            <Trophy className="w-6 h-6 text-primary" />
         </div>
         <div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter">The Elite Archive</h2>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[4px]">Historical Champions</p>
         </div>
      </div>

      {/* 4. Rebuild the Elite Archive Cards (image_8013a0.png fix) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-24">
        {winners.map((winner, index) => (
          <motion.div
            key={winner.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative flex flex-col gap-4 p-4 mb-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl hover:border-primary/40 transition-all shadow-2xl"
          >
            {/* Admin Action: Restricted Delete */}
            {isAdmin && (
              <button 
                onClick={() => deleteChampion(winner.id)}
                className="absolute top-4 right-4 z-20 p-2 bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Winner Artwork (Top) */}
            <div className="aspect-[4/3] w-full bg-black rounded-xl overflow-hidden relative border border-white/5">
               <img src={winner.drawingUrl} className="w-full h-full object-contain p-2" alt="winner" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Metadata (Below) using bright, readable typography */}
            <div className="flex flex-col gap-3 px-1">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black italic uppercase tracking-tight text-white group-hover:text-primary transition-colors">{winner.winnerName}</h3>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                     <img src={`https://flagcdn.com/w40/${winner.country}.png`} className="w-5 h-3 object-cover rounded-sm" alt="F" />
                     <span className="text-[10px] font-black text-white/60">{winner.country?.toUpperCase()}</span>
                  </div>
               </div>

               <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="flex items-center gap-2 text-primary">
                     <Calendar className="w-3 h-3" />
                     <span className="text-[9px] font-black uppercase tracking-[3px] italic">{winner.year} Victory</span>
                  </div>
                  <div className="flex items-center gap-1">
                     <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                     <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{winner.type || "Graphite"}</span>
                  </div>
               </div>
            </div>
          </motion.div>
        ))}

        {winners.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-center opacity-10">
             <Trophy className="w-16 h-16 mb-4" />
             <p className="font-italic uppercase tracking-[5px] text-xs">Archive Empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
