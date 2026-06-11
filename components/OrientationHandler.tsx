"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, RefreshCcw } from "lucide-react";

export default function OrientationHandler() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      const mobile = window.innerWidth <= 1024; // Common threshold for mobile/tablet
      setIsPortrait(portrait);
      setIsMobile(mobile);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  return (
    <AnimatePresence>
      {(isMobile && isPortrait) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] bg-black backdrop-blur-3xl flex flex-col items-center justify-center p-10 text-center"
        >
          <motion.div
            animate={{ rotate: [0, 90, 90, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mb-10 text-primary"
          >
            <RefreshCcw className="w-24 h-24" />
          </motion.div>
          
          <Trophy className="w-16 h-16 text-primary/20 mb-6" />
          
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-4 leading-tight">
            يرجى تدوير الشاشة بالعرض<br />لمتابعة البطولة لايف
          </h2>
          
          <p className="text-white/20 text-[10px] font-black uppercase tracking-[5px] leading-loose">
            Experience the Tournament in its full cinematic glory
          </p>

          <div className="mt-12 w-20 h-1 bg-primary/20 rounded-full overflow-hidden">
             <motion.div 
               animate={{ x: [-80, 80] }}
               transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
               className="w-full h-full bg-primary"
             />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
