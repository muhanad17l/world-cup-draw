"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, getDoc, updateDoc, writeBatch, serverTimestamp, addDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Trophy, Trash2, X, Upload, Loader2, Power, Crown, CheckCircle2, ChevronRight, Zap, Database, RotateCcw, UserPlus, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminTournamentPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"IDLE" | "LIVE" | "COMPLETED" | "PENDING">("IDLE");
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [editState, setEditState] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState<{p1: boolean, p2: boolean}>({p1: false, p2: false});
  const [isAdvancing, setIsAdvancing] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user || user.email !== "muhanadmahmood2023@gmail.com") return;
    const statusUnsub = onSnapshot(doc(db, "settings", "tournament"), (snapshot) => {
      if (snapshot.exists()) setStatus(snapshot.data().status || "IDLE");
    });
    const matchesUnsub = onSnapshot(collection(db, "matches"), (snapshot) => {
      setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { statusUnsub(); matchesUnsub(); };
  }, [user]);

  // Open Modal & Copy State
  const openEdit = (match: any) => {
    setSelectedMatch(match);
    setEditState({ ...match });
  };

  const handleImage = async (file: File, prefix: "player1" | "player2") => {
    if (!editState || !file) return;
    setIsProcessing(prev => ({ ...prev, [prefix === "player1" ? "p1" : "p2"]: true }));
    const reader = new FileReader();
    reader.onloadend = async () => {
       const base64 = reader.result as string;
       setEditState((prev: any) => ({ ...prev, [`${prefix}Image`]: base64 }));
       setIsProcessing(prev => ({ ...prev, [prefix === "player1" ? "p1" : "p2"]: false }));
    };
    reader.readAsDataURL(file);
  };

  // 🔥 MANUAL SAVE FEATURE (Requested by User)
  const commitChanges = async () => {
    if (!editState) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "matches", editState.id), {
        player1Name: editState.player1Name,
        player1Flag: editState.player1Flag,
        player1Score: editState.player1Score,
        player1Image: editState.player1Image,
        player2Name: editState.player2Name,
        player2Flag: editState.player2Flag,
        player2Score: editState.player2Score,
        player2Image: editState.player2Image,
      });
      setIsSaving(false);
      alert("✅ Matrix Synchronized: Changes saved successfully.");
    } catch (e: any) {
      alert("Sync Failed: " + e.message);
      setIsSaving(false);
    }
  };

  const activateAdvancement = async (match: any, winnerPrefix: "player1" | "player2") => {
    setIsAdvancing(`${match.id}-${winnerPrefix}`);
    try {
      const matchId = match.id.toLowerCase();
      if (matchId === "final") {
        await addDoc(collection(db, "champions"), { 
          name: match[`${winnerPrefix}Name`], 
          flag: match[`${winnerPrefix}Flag`] || "🏳️", 
          image: match[`${winnerPrefix}Image`] || "", 
          score: match[`${winnerPrefix}Score`] || 100,
          timestamp: serverTimestamp() 
        });
        await updateDoc(doc(db, "settings", "tournament"), { status: "COMPLETED" });
        setIsAdvancing(null);
        alert(`🏆 CROWNED: ${match[`${winnerPrefix}Name`]}`);
        return;
      }
      const map: Record<string, string> = { "match_1": "semi_1", "match_2": "semi_1", "match_3": "semi_2", "match_4": "semi_2", "semi_1": "final", "semi_2": "final" };
      const targetId = map[matchId];
      if (!targetId) return setIsAdvancing(null);
      const targetMatch = matches.find(m => m.id.toLowerCase() === targetId);
      if (!targetMatch) return setIsAdvancing(null);
      const targetRef = doc(db, "matches", targetMatch.id);
      const slot = (!targetMatch.player1Name || targetMatch.player1Name === "") ? "player1" : "player2";
      await updateDoc(targetRef, { [`${slot}Name`]: match[`${winnerPrefix}Name`], [`${slot}Flag`]: match[`${winnerPrefix}Flag`] || "🏳️", [`${slot}Image`]: match[`${winnerPrefix}Image`] || "", [`${slot}Score`]: 0 });
      setIsAdvancing(null);
      alert(`✅ PROMOTED: ${match[`${winnerPrefix}Name`]} -> ${targetId.toUpperCase()}`);
    } catch (e: any) { alert(e.message); setIsAdvancing(null); }
  };

  if (!user || user.email !== "muhanadmahmood2023@gmail.com") return <div className="h-screen bg-black flex items-center justify-center">Unauthorized</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
       <div className="max-w-7xl mx-auto space-y-10">
          
          <header className="flex flex-col lg:flex-row justify-between items-center bg-zinc-950 p-10 rounded-[50px] border border-white/5 shadow-3xl">
             <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center text-black shadow-3xl"><Zap className="w-10 h-10" /></div>
                <div>
                   <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Command Center</h1>
                   <span className="text-[10px] font-black text-white/20 tracking-[8px] uppercase mt-4 block">Arbiter Terminal • Matrix Live</span>
                </div>
             </div>
             <div className="flex gap-4 mt-8 lg:mt-0">
                <button onClick={() => updateDoc(doc(db, "settings", "tournament"), { status: "IDLE" })} className="p-5 bg-white/5 border border-white/10 rounded-[25px] font-black uppercase text-[10px] tracking-[5px]">Idle</button>
                <button onClick={() => updateDoc(doc(db, "settings", "tournament"), { status: "LIVE" })} className="p-5 bg-emerald-600 rounded-[25px] font-black uppercase text-[10px] tracking-[5px] shadow-2xl">Go Live</button>
             </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
             <div className="lg:col-span-4 space-y-4 max-h-[75vh] overflow-y-auto pr-4 custom-scrollbar">
                {matches.sort((a,b) => a.id.localeCompare(b.id)).map(m => (
                  <div key={m.id} onClick={() => openEdit(m)} className={`p-8 rounded-[40px] border cursor-pointer transition-all ${editState?.id === m.id ? "bg-amber-500 text-black border-amber-500 shadow-3xl" : "bg-zinc-950 border-white/5"}`}>
                     <span className={`text-[10px] font-black uppercase opacity-40 mb-3 block tracking-[5px] ${editState?.id === m.id ? 'text-black/60' : ''}`}>{m.id}</span>
                     <p className={`text-sm font-black uppercase italic ${editState?.id === m.id ? 'text-black' : ''}`}>{m.player1Name || "EMPTY"} VS {m.player2Name || "EMPTY"}</p>
                  </div>
                ))}
             </div>

             <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                   {editState ? (
                     <motion.div key={editState.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-zinc-950 border border-white/10 p-12 rounded-[60px] space-y-16 shadow-3xl relative">
                        <div className="flex justify-between items-center">
                           <h2 className="text-3xl font-black uppercase italic tracking-tighter">Edit Node: {editState.id}</h2>
                           <div className="flex gap-4">
                              {/* 🔥 MANUAL SAVE BUTTON */}
                              <button onClick={commitChanges} className="flex items-center gap-3 px-8 p-4 bg-amber-500 text-black rounded-[25px] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                 {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                 Save Changes
                              </button>
                              <button onClick={() => { setSelectedMatch(null); setEditState(null); }} className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-all"><X /></button>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           {[1, 2].map(num => {
                             const px = `player${num}`;
                             const proc = isProcessing[`p${num}` as keyof typeof isProcessing];
                             return (
                               <div key={px} className="space-y-8 bg-black/40 p-8 rounded-[40px] border border-white/5">
                                  <div className="flex justify-between items-center">
                                     <span className="text-[10px] font-black uppercase opacity-20 tracking-widest">Participant {num}</span>
                                     <button onClick={() => activateAdvancement(editState, px as any)} disabled={!!isAdvancing} className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all">{isAdvancing === `${editState.id}-${px}` ? <Loader2 className="animate-spin" /> : <ChevronRight className="w-5 h-5" />}</button>
                                  </div>
                                  <div className="w-full h-52 bg-zinc-900 rounded-[35px] border border-white/5 relative overflow-hidden flex items-center justify-center shadow-inner group">
                                     <input type="file" onChange={(e) => e.target.files && handleImage(e.target.files[0], px as any)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                     {proc ? <Loader2 className="animate-spin text-amber-500" /> : editState[`${px}Image`] ? <img src={editState[`${px}Image`]} className="w-full h-full object-contain" /> : <Upload className="opacity-10" />}
                                  </div>
                                  <div className="space-y-3">
                                     <label className="text-[9px] font-black uppercase text-white/20 tracking-widest px-2">Winner Name</label>
                                     <input type="text" value={editState[`${px}Name`]} onChange={(e) => setEditState({...editState, [`${px}Name`]: e.target.value})} placeholder="NAME..." className="w-full bg-white/5 border border-white/10 p-5 rounded-[20px] outline-none text-center font-black uppercase text-sm tracking-widest" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-6">
                                     <div className="space-y-3">
                                        <label className="text-[9px] font-black uppercase text-white/20 tracking-widest px-2">Flag</label>
                                        <input type="text" value={editState[`${px}Flag`]} onChange={(e) => setEditState({...editState, [`${px}Flag`]: e.target.value})} placeholder="🇮🇶" className="w-full bg-white/5 border border-white/10 p-5 rounded-[20px] text-center text-xl" />
                                     </div>
                                     <div className="space-y-3">
                                        <label className="text-[9px] font-black uppercase text-white/20 tracking-widest px-2">Score</label>
                                        <input type="number" value={editState[`${px}Score`]} onChange={(e) => setEditState({...editState, [`${px}Score`]: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 p-5 rounded-[20px] text-center text-amber-500 font-black text-2xl" />
                                     </div>
                                  </div>
                                </div>
                             )
                           })}
                        </div>
                     </motion.div>
                   ) : (
                     <div className="h-[75vh] flex flex-col items-center justify-center opacity-5 select-none"><Trophy className="w-32 h-32 mb-8" /><span className="text-xl font-black italic tracking-[40px] uppercase">Nexus Commander Idle</span></div>
                   )}
                </AnimatePresence>
             </div>
          </div>
       </div>
    </div>
  );
}