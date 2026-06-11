"use client";

import { motion } from "framer-motion";

export function GoldLogo() {
  return (
    <motion.div 
      className="flex items-center gap-3 group cursor-pointer"
      whileHover={{ scale: 1.05 }}
    >
      <div className="relative">
         <div className="w-10 h-10 bg-gradient-to-br from-[#ffd700] via-[#fff5b7] to-[#b8860b] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.3)] group-hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all duration-500">
            <span className="text-black font-black text-xl italic tracking-tighter">S</span>
         </div>
         {/* Orbiting Ring */}
         <motion.div 
           animate={{ rotate: 360 }}
           transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
           className="absolute -inset-2 border border-[#ffd700]/20 rounded-2xl pointer-events-none"
         />
      </div>
      <div>
         <h2 className="text-xl font-black italic tracking-tighter leading-none text-white group-hover:text-[#ffd700] transition-colors">SNAKKET</h2>
         <p className="text-[7px] font-black uppercase tracking-[3px] text-[#ffd700] opacity-50 group-hover:opacity-100 transition-opacity">World Cup</p>
      </div>
    </motion.div>
  );
}
