"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { 
  Trophy, Calendar, User, 
  MapPin, X, Star, Crown, 
  Sparkles, Award, Search,
  ArrowUpRight
} from "lucide-react";

interface HallOfFameEntry {
  id: string;
  winnerName: string;
  country: string;
  drawingUrl: string;
  year: number;
  tournamentTitle: string;
  description?: string;
}

export default function HallOfFamePage() {
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<HallOfFameEntry | null>(null);

  useEffect(() => {
    const q = query(collection(db, "hall_of_fame"), orderBy("year", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HallOfFameEntry[];
      
      if (data.length === 0) {
        // Mock data to showcase the design if DB is empty
        setEntries([
          { 
            id: "1", 
            winnerName: "أحمد العراقي", 
            country: "العراق", 
            year: 2026, 
            tournamentTitle: "كأس العالم للرسم", 
            drawingUrl: "https://images.unsplash.com/photo-1544465544-1b71aee9dfa3?q=80&w=2070&auto=format&fit=crop",
            description: "رسمة تخيلية للمستقبل العربي بتقنيات السايبربانك، حازت على الدرجة الكاملة من لجنة التحكيم."
          },
          { 
            id: "2", 
            winnerName: "مريم علي", 
            country: "السعودية", 
            year: 2025, 
            tournamentTitle: "درع الخليج", 
            drawingUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1945&auto=format&fit=crop",
            description: "تجسيد رائع للخيول العربية الأصيلة باستخدام الألوان المائية الرقمية."
          },
          { 
            id: "3", 
            winnerName: "سامي يوسف", 
            country: "مصر", 
            year: 2024, 
            tournamentTitle: "أبطال النيل", 
            drawingUrl: "https://images.unsplash.com/photo-1541462608141-ad6d4162f279?q=80&w=2070&auto=format&fit=crop",
            description: "بورتريه واقعي يدمج بين الفن الكلاسيكي واللمسات العصرية."
          }
        ]);
      } else {
        setEntries(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredEntries = entries.filter(entry => 
    entry.winnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.tournamentTitle && entry.tournamentTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto pb-32 pt-12 px-4 text-right">
          
          {/* Hero Header */}
          <section className="relative text-center mb-24">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow/10 blur-[150px] -z-10 animate-pulse" />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="space-y-6"
            >
               <div className="bg-yellow/10 border border-yellow/20 w-24 h-24 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-yellow/20">
                  <Crown className="w-12 h-12 text-yellow" />
               </div>
               <h1 className="text-6xl md:text-8xl font-[900] italic text-white tracking-tight">
                 قاعة <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow via-yellow/50 to-yellow animate-gradient">الأساطير</span>
               </h1>
               <div className="flex items-center justify-center gap-4 text-white/30 font-black uppercase tracking-[5px] text-[10px] md:text-sm">
                  <Star className="w-4 h-4 fill-yellow/20" />
                  Hall Of Fame : The Golden Chapter
                  <Star className="w-4 h-4 fill-yellow/20" />
               </div>
            </motion.div>
          </section>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-20">
             <div className="relative group">
                <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-yellow transition-colors" />
                <input 
                  type="text" 
                  placeholder="ابحث عن اسم بطل أو لقب بطولة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-[32px] py-6 pr-16 pl-8 text-lg font-black outline-none focus:border-yellow/30 focus:ring-4 focus:ring-yellow/5 transition-all text-white placeholder:text-white/10"
                />
             </div>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {loading ? (
               Array(6).fill(0).map((_, i) => (
                 <div key={i} className="h-96 rounded-[48px] bg-white/5 animate-pulse border border-white/10" />
               ))
            ) : filteredEntries.map((entry, idx) => (
               <motion.div 
                 key={entry.id}
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 onClick={() => setSelectedEntry(entry)}
                 className="relative group cursor-pointer"
               >
                  {/* Card Container */}
                  <div className="relative h-[500px] rounded-[56px] overflow-hidden border border-white/10 bg-[#0d0d0d] transition-all duration-700 group-hover:border-yellow/30 group-hover:-translate-y-4 shadow-2xl">
                     
                     {/* Background Art */}
                     <div className="absolute inset-0 grayscale group-hover:grayscale-0 transition-all duration-1000">
                        <img src={entry.drawingUrl} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000" alt="p" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                     </div>

                     {/* Content Overlay */}
                     <div className="absolute inset-x-8 bottom-8 z-20 space-y-4">
                        <div className="flex justify-between items-center flex-row-reverse">
                           <div className="flex items-center gap-2 bg-yellow/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-yellow/20">
                              <Star className="w-3 h-3 text-yellow fill-yellow" />
                              <span className="text-yellow text-[10px] font-black uppercase tracking-widest">{entry.year}</span>
                           </div>
                           <p className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">{entry.country}</p>
                        </div>
                        
                        <div className="space-y-1">
                           <h3 className="text-3xl font-black text-white group-hover:text-yellow transition-colors">{entry.winnerName}</h3>
                           <p className="text-sm font-bold text-white/40">{entry.tournamentTitle}</p>
                        </div>

                        <div className="pt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500">
                           <div className="flex items-center gap-2 text-[10px] font-black text-yellow uppercase border-b border-yellow/20 pb-1">
                              View Art Story <ArrowUpRight className="w-4 h-4" />
                           </div>
                        </div>
                     </div>

                     {/* Decoration */}
                     <div className="absolute top-8 right-8 w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700">
                        <Award className="w-6 h-6 text-yellow" />
                     </div>
                  </div>

                  {/* Reflection Light Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-yellow/30 to-transparent blur-3xl opacity-0 group-hover:opacity-20 transition-opacity -z-10" />
               </motion.div>
            ))}
          </div>

          {!loading && filteredEntries.length === 0 && (
            <div className="py-40 text-center opacity-20">
               <Trophy className="w-20 h-20 mx-auto mb-6" />
               <p className="text-2xl font-black uppercase tracking-[10px]">No Legends Found</p>
            </div>
          )}
        </div>

        {/* Detailed Master Modal */}
        <AnimatePresence>
           {selectedEntry && (
             <>
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setSelectedEntry(null)}
                 className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100]"
               />
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 50 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 50 }}
                 className="fixed inset-x-4 inset-y-10 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-5xl z-[110] glass-card rounded-[56px] border border-white/5 overflow-hidden flex flex-col md:flex-row-reverse"
               >
                  <button 
                    onClick={() => setSelectedEntry(null)}
                    className="absolute top-8 left-8 w-14 h-14 bg-black/40 hover:bg-red-500 transition-colors rounded-2xl flex items-center justify-center z-50 text-white border border-white/10"
                  >
                     <X className="w-6 h-6" />
                  </button>

                  {/* Left: Art Preview (Mobile: Top) */}
                  <div className="w-full md:w-3/5 h-[40vh] md:h-full relative overflow-hidden bg-black/20">
                     <img src={selectedEntry.drawingUrl} className="w-full h-full object-contain md:object-cover" alt="art" />
                     <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />
                  </div>

                  {/* Right: Info (Mobile: Bottom) */}
                  <div className="w-full md:w-2/5 p-8 md:p-16 flex flex-col justify-center space-y-10 text-right overflow-y-auto">
                     <div className="space-y-4">
                        <div className="flex items-center justify-end gap-3 text-yellow font-black">
                           <Award className="w-6 h-6" />
                           <span className="uppercase tracking-[4px] text-xs">Royal Certificate</span>
                        </div>
                        <h2 className="text-5xl font-black text-white leading-tight">{selectedEntry.winnerName}</h2>
                        <div className="flex flex-wrap flex-row-reverse gap-4">
                           <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-yellow" />
                              <span className="text-xs font-bold text-white/60">{selectedEntry.year}</span>
                           </div>
                           <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="text-xs font-bold text-white/60">{selectedEntry.country}</span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="p-6 bg-yellow/5 border-r-4 border-yellow rounded-2xl">
                           <h4 className="text-yellow font-black text-sm mb-3 uppercase tracking-widest flex items-center justify-end gap-2">
                              {selectedEntry.tournamentTitle} <Trophy className="w-4 h-4" />
                           </h4>
                           <p className="text-white/60 leading-relaxed font-bold text-lg">
                              {selectedEntry.description || "هذا العمل الفني يمثل قمة الإبداع والشغف، حيث تفوق الفنان على جميع أقرانه في منافسة شريفة ومبدعة."}
                           </p>
                        </div>
                     </div>

                     <div className="pt-8 flex flex-col gap-4">
                        <button className="w-full py-5 rounded-3xl bg-yellow text-black font-black text-lg shadow-xl shadow-yellow/20 hover:scale-[1.02] active:scale-95 transition-all">
                           زيارة ملف الرسام
                        </button>
                        <p className="text-[10px] font-black text-white/10 uppercase tracking-[4px] text-center">Snakket Academy • Certified Living Legend</p>
                     </div>
                  </div>
               </motion.div>
             </>
           )}
        </AnimatePresence>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
