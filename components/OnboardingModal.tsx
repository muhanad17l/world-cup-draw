"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Globe, User, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

const countries = [
  { name: "العراق", flag: "🇮🇶" },
  { name: "السعودية", flag: "🇸🇦" },
  { name: "مصر", flag: "🇪🇬" },
  { name: "الإمارات", flag: "🇦🇪" },
  { name: "الكويت", flag: "🇰🇼" },
  { name: "الأردن", flag: "🇯🇴" },
  { name: "فلسطين", flag: "🇵🇸" },
  { name: "سوريا", flag: "🇸🇾" },
  { name: "لبنان", flag: "🇱🇧" },
  { name: "قطر", flag: "🇶🇦" },
  { name: "البحرين", flag: "🇧🇭" },
  { name: "عمان", flag: "🇴🇲" },
  { name: "المغرب", flag: "🇲🇦" },
  { name: "تونس", flag: "🇹🇳" },
  { name: "الجزائر", flag: "🇩🇿" },
  { name: "ليبيا", flag: "🇱🇾" },
  { name: "اليمن", flag: "🇾🇪" },
  { name: "السودان", flag: "🇸🇩" },
];

export default function OnboardingModal() {
  const { user, profile, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // If profile already has country and gender, don't show
  if (!user || (profile?.country && profile?.gender)) return null;

  const handleComplete = async () => {
    if (!selectedCountry || !selectedGender) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        country: selectedCountry.flag,
        countryName: selectedCountry.name,
        gender: selectedGender,
        onboarded: true
      });
      await refreshUser();
    } catch (error) {
      console.error("Onboarding failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-xl glass-card rounded-[48px] border-white/10 overflow-hidden shadow-2xl flex flex-col"
          style={{ maxHeight: "90vh" }}
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5">
             <motion.div 
               className="h-full bg-gradient-to-r from-primary to-accent"
               animate={{ width: step === 1 ? "50%" : "100%" }}
             />
          </div>

          <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
            {step === 1 ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8 text-right"
              >
                <div className="space-y-2">
                   <div className="w-16 h-16 bg-primary/20 rounded-3xl flex items-center justify-center mb-6 border border-primary/20">
                      <Globe className="w-8 h-8 text-primary" />
                   </div>
                   <h2 className="text-3xl font-black text-white">اختر بلدك</h2>
                   <p className="text-white/40 font-medium">سيظهر علم بلدك بجانب اسمك في ساحة التحدي.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                   {countries.map((c) => (
                     <button
                       key={c.name}
                       onClick={() => setSelectedCountry(c)}
                       className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedCountry?.name === c.name ? "bg-primary border-primary shadow-xl shadow-primary/20" : "bg-white/5 border-white/5 hover:border-white/20"}`}
                     >
                        <span className="text-2xl">{c.flag}</span>
                        <span className={`font-bold text-sm ${selectedCountry?.name === c.name ? "text-white" : "text-white/60"}`}>{c.name}</span>
                     </button>
                   ))}
                </div>

                <button
                  disabled={!selectedCountry}
                  onClick={() => setStep(2)}
                  className="w-full flex items-center justify-center gap-3 bg-white text-black font-black py-5 rounded-[24px] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                >
                  الخطوة التالية <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-10 text-right"
              >
                <div className="space-y-2">
                   <div className="w-16 h-16 bg-accent/20 rounded-3xl flex items-center justify-center mb-6 border border-accent/20">
                      <User className="w-8 h-8 text-accent" />
                   </div>
                   <h2 className="text-3xl font-black text-white">الجنس</h2>
                   <p className="text-white/40 font-medium">نحتاج لهذه المعلومة لتنظيم المواجهات بشكل أفضل.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <button
                     onClick={() => setSelectedGender("male")}
                     className={`flex flex-col items-center gap-4 p-10 rounded-[40px] border transition-all ${selectedGender === "male" ? "bg-blue-500 border-blue-400 shadow-xl shadow-blue-500/20" : "bg-white/5 border-white/5 hover:border-blue-500/30"}`}
                   >
                      <div className="text-5xl">👦</div>
                      <span className="font-black text-lg">ذكر</span>
                   </button>
                   <button
                     onClick={() => setSelectedGender("female")}
                     className={`flex flex-col items-center gap-4 p-10 rounded-[40px] border transition-all ${selectedGender === "female" ? "bg-pink-500 border-pink-400 shadow-xl shadow-pink-500/20" : "bg-white/5 border-white/5 hover:border-pink-500/30"}`}
                   >
                      <div className="text-5xl">👧</div>
                      <span className="font-black text-lg">أنثى</span>
                   </button>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    disabled={!selectedGender || loading}
                    onClick={handleComplete}
                    className="w-full flex items-center justify-center gap-3 bg-primary text-white font-black py-5 rounded-[24px] shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? "جاري الحفظ..." : <>ابدأ رحلتك الآن <Sparkles className="w-5 h-5" /></>}
                  </button>
                  <button 
                    onClick={() => setStep(1)}
                    className="text-white/20 font-bold text-sm hover:text-white transition-colors"
                  >
                    رجوع للبلد
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
