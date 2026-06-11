"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Trophy, Lock, Mail, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin/tournament");
    } catch (err: any) {
      setError("بيانات الدخول غير صحيحة. هذا المسار مخصص للمشرفين فقط.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-10">
          <div className="bg-primary/20 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/20">
             <Trophy className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter mb-2">Tournament Admin</h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-[5px]">Restricted Domain</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[48px] backdrop-blur-xl shadow-2xl text-right" dir="rtl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">البريد الإلكتروني للإدارة</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary transition-all text-sm text-left"
                  placeholder="admin@drawingcup.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">مفتاح الدخول</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary transition-all text-sm text-left"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs font-bold text-center bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-black font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transform transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? "جاري التحقق..." : (
                <>
                  <span>تسجيل الدخول</span>
                  <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <button 
          onClick={() => router.push("/")}
          className="mt-8 text-white/20 hover:text-white/60 text-xs font-bold uppercase tracking-widest transition-colors block mx-auto"
        >
          العودة للواجهة العامة
        </button>
      </motion.div>
    </div>
  );
}
