"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-12 py-10 text-right">
          {/* Welcome Section */}
          <div className="space-y-4">
             <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">أهلاً بك، <span className="text-gradient">{user?.displayName || "مبدعنا"}</span></h1>
             <p className="text-white/40 text-lg font-medium">مستعد لرحلة إبداعية جديدة في Snakket؟</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10">
             <div className="glass-card p-10 rounded-[48px] border-white/5 bg-gradient-to-br from-primary/10 to-transparent hover:border-primary/20 transition-all group">
                <h3 className="text-2xl font-black text-white mb-2">البطولات النشطة</h3>
                <p className="text-white/40 text-sm mb-8">تابع آخر المواجهات ونافس على القمة في ساحة الأبطال.</p>
                <Link href="/events" className="inline-flex items-center gap-3 bg-primary text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                   انتقل للمواجهات
                </Link>
             </div>

             <div className="glass-card p-10 rounded-[48px] border-white/5 bg-gradient-to-br from-accent/10 to-transparent hover:border-accent/20 transition-all group">
                <h3 className="text-2xl font-black text-white mb-2">قاعة الأساطير</h3>
                <p className="text-white/40 text-sm mb-8">شاهد لوحة الصدارة وأسماء المبدعين الذين حققوا المجد.</p>
                <Link href="/hall-of-fame" className="inline-flex items-center gap-3 bg-white/5 border border-white/10 text-white font-bold py-4 px-10 rounded-2xl hover:bg-white/10 transition-all">
                   لوحة الصدارة
                </Link>
             </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

