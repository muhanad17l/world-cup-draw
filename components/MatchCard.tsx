"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { UserCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import MatchModal from "./MatchModal";

interface MatchProps {
  match: {
    id: string;
    round: string;
    player1Name: string;
    player1Country: string;
    player1Score: number;
    player1Image: string;
    player2Name: string;
    player2Country: string;
    player2Score: number;
    player2Image: string;
  } | null;
}

export default function MatchCard({ match }: MatchProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAdmin } = useAuth();

  const syncScore = async (path: string, val: number) => {
    if (!match) return;
    try {
      const matchRef = doc(db, "matches", match.id);
      await updateDoc(matchRef, { [path]: val });
    } catch (e) { console.error(e); }
  };

  const renderContender = (num: number) => {
    const name = match ? (match[`player${num}` as keyof typeof match] as string) : "";
    const country = match ? (match[`player${num}Country` as keyof typeof match] as string) : "iq";
    const score = match ? (match[`player${num}Score` as keyof typeof match] as number) : 0;
    
    const isEmpty = !name || name.trim() === "" || name === "TBD" || name === "بانتظار المتأهل";

    return (
      <div className={`flex items-center justify-between p-3.5 ${num === 1 ? "border-b border-neutral-800" : ""} group-hover:bg-primary/5 transition-all duration-500`}>
        <div className="flex items-center gap-3 overflow-hidden">
           {isEmpty ? (
             <div className="w-5 h-3 bg-white/5 rounded-sm flex items-center justify-center border border-white/5 shadow-inner shrink-0">
                <UserCircle className="w-2.5 h-2.5 text-white/10" />
             </div>
           ) : (
             <img src={`https://flagcdn.com/w40/${country}.png`} className="w-5 h-3 object-cover rounded-xs shadow-lg border border-neutral-800 shrink-0 transition-transform duration-500 group-hover:scale-110" alt="Flag" onError={(e) => { (e.target as any).src = "https://flagcdn.com/w40/un.png" }} />
           )}
           <span className={`font-black italic text-[9px] truncate tracking-tighter uppercase transition-colors duration-500 ${isEmpty ? "text-white/10" : "text-white/90 group-hover:text-white"}`}>
             {isEmpty ? "بانتظار المتأهل" : name}
           </span>
        </div>
        <div className={`px-2 py-0.5 rounded-lg transition-all duration-500 ${isEmpty ? "bg-white/[0.02] text-white/5" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black"}`}>
           <span className="font-black text-[9px]">{isEmpty ? "00" : (score ?? 0)}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <motion.div 
        whileHover={match ? { scale: 1.05, y: -2 } : {}}
        whileTap={match ? { scale: 0.98 } : {}}
        onClick={() => match && setIsModalOpen(true)}
        className={`${match ? "cursor-pointer" : "cursor-default"} group relative transition-all duration-500 w-full max-w-[240px] shadow-2xl`}
      >
        <div className="absolute inset-0 bg-primary/20 blur-[20px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-3xl group-hover:border-primary/50 transition-all duration-500 relative z-10 p-0.5">
          {renderContender(1)}
          {renderContender(2)}
          {match && <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-1000 ease-in-out" />}
        </div>
      </motion.div>

      {match && (
        <MatchModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          match={match} 
          isAdmin={isAdmin}
          onUpdateScore={syncScore}
        />
      )}
    </>
  );
}
